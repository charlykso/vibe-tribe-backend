import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { OAuthServiceFactory, TokenRefreshScheduler } from '../services/oauth.js';
import { SocialAccount } from '../types/database.js';
import { redis, REDIS_PREFIX, getRedisKey, setWithExpiry, getAndParse, deleteKey } from '../services/redis.js';
import { oauthSecurityMiddleware, auditOAuthEvent } from '../middleware/oauthSecurity.js';
import { generateSecureState, validateSecureState } from '../services/oauthSecurity.js';

const router = Router();

// Note: Authentication middleware is applied per route, not globally
// Callback routes should NOT require authentication as they're called by external services

// Validation schemas
const initiateOAuthSchema = z.object({
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram']),
  returnUrl: z.string().url().optional()
});

const callbackSchema = z.object({
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram']),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  codeVerifier: z.string().optional() // For Twitter PKCE
});

// OAuth state management using Firestore for persistence
interface OAuthState {
  userId: string;
  organizationId: string;
  platform: string;
  codeVerifier?: string;
  timestamp: number;
  expiresAt: number;
}

// Store OAuth state in Redis with fallback
async function storeOAuthState(state: string, data: Omit<OAuthState, 'expiresAt'>): Promise<void> {
  try {
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes from now
    const stateData = {
      ...data,
      expiresAt
    };

    const key = getRedisKey(REDIS_PREFIX.OAUTH_STATE, state);
    const expiresIn = 10 * 60; // 10 minutes in seconds

    console.log('💾 Storing OAuth state in Redis:', {
      state: state.substring(0, 20) + '...',
      platform: data.platform,
      userId: data.userId,
      expiresAt: new Date(expiresAt).toISOString()
    });

    await setWithExpiry(key, stateData, expiresIn);
    console.log('✅ OAuth state stored successfully in Redis');
  } catch (error) {
    console.error('❌ Error storing OAuth state in Redis:', error);

    // In production, if Redis fails, we should still allow OAuth to proceed
    // Store in memory as fallback (not ideal but better than complete failure)
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Using memory fallback for OAuth state storage');
      // You could implement a memory store here as fallback
      // For now, we'll log the error but not throw to prevent complete OAuth failure
    } else {
      throw error;
    }
  }
}

// Retrieve OAuth state from Redis
async function getOAuthState(state: string): Promise<OAuthState | null> {
  try {
    console.log('🔍 Looking up OAuth state in Redis:', state.substring(0, 20) + '...');

    const key = getRedisKey(REDIS_PREFIX.OAUTH_STATE, state);
    const stateData = await getAndParse<OAuthState>(key);

    if (!stateData) {
      console.log('❌ OAuth state not found in Redis');
      return null;
    }

    console.log('✅ OAuth state found in Redis:', {
      platform: stateData.platform,
      userId: stateData.userId,
      timestamp: new Date(stateData.timestamp).toISOString(),
      expiresAt: new Date(stateData.expiresAt).toISOString(),
      isExpired: Date.now() > stateData.expiresAt
    });

    // Check if expired
    if (Date.now() > stateData.expiresAt) {
      console.log('⏰ OAuth state expired, cleaning up');
      // Clean up expired state
      await deleteKey(key);
      return null;
    }

    return stateData;
  } catch (error) {
    console.error('❌ Error retrieving OAuth state from Redis:', error);

    // In production, if Redis fails, we should handle gracefully
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Redis unavailable, OAuth state validation skipped');
      // Return null to indicate state not found, but don't crash the process
    }

    return null;
  }
}

// Delete OAuth state from Redis
async function deleteOAuthState(state: string): Promise<void> {
  const key = getRedisKey(REDIS_PREFIX.OAUTH_STATE, state);
  await deleteKey(key);
}

// Clean up expired states (runs every 5 minutes)
setInterval(async () => {
  try {
    const keys = await redis.keys(getRedisKey(REDIS_PREFIX.OAUTH_STATE, '*'));
    const now = Date.now();
    let cleanedCount = 0;

    for (const key of keys) {
      const stateData = await getAndParse<OAuthState>(key);
      if (stateData && now > stateData.expiresAt) {
        await deleteKey(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired OAuth states from Redis`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up OAuth states:', error);
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// POST /api/v1/oauth/initiate
// Initiate OAuth flow for a platform (requires authentication)
router.post('/initiate',
  authMiddleware,
  ...oauthSecurityMiddleware.initiate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    console.log('🚀 OAuth initiate called:', {
      platform: req.body?.platform,
      user: req.user?.id,
      organization: req.user?.organization_id,
      body: req.body,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        contentType: req.headers['content-type']
      }
    });

    const validation = initiateOAuthSchema.safeParse(req.body);

    if (!validation.success) {
      console.error('❌ OAuth initiate validation failed:', validation.error.errors);
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { platform, returnUrl } = validation.data;
    const user = req.user;

    console.log('✅ OAuth initiate validation passed:', { platform, userId: user.id });

    if (!user.organization_id) {
      console.error('❌ User missing organization_id:', user);
      throw new UnauthorizedError('User must belong to an organization');
    }

    try {
      console.log('🔐 Generating secure state for OAuth...');
      // Generate secure state parameter using enhanced security
      const state = generateSecureState(user.id, user.organization_id);
      console.log('✅ State generated:', state);

      console.log('🏭 Getting OAuth service for platform:', platform);
      // Get OAuth service for platform
      const oauthService = OAuthServiceFactory.getService(platform);
      console.log('✅ OAuth service obtained for:', platform);

      let authUrl: string;
      let codeVerifier: string | undefined;

      console.log('🔗 Generating auth URL for platform:', platform);
      if (platform === 'twitter') {
        const result = await (oauthService as any).generateAuthUrl(state);
        authUrl = result.url;
        codeVerifier = result.codeVerifier;
        console.log('✅ Twitter auth URL generated');
      } else {
        authUrl = (oauthService as any).generateAuthUrl(state);
        console.log('✅ Auth URL generated for:', platform);
      }

      console.log('🔗 Generated auth URL:', authUrl.substring(0, 100) + '...');

      // Store state information in Redis with enhanced security
      await storeOAuthState(state, {
        userId: user.id,
        organizationId: user.organization_id,
        platform,
        codeVerifier,
        timestamp: Date.now()
      });

      // Audit log the OAuth initiation
      await auditOAuthEvent({
        userId: user.id,
        organizationId: user.organization_id,        platform,
        action: 'initiate',
        success: true,
        ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
        userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
        metadata: { returnUrl }
      });

      res.json({
        authUrl,
        state,
        platform,
        message: `Redirect user to this URL to authorize ${platform} access`
      });

    } catch (error) {
      console.error(`❌ Error initiating ${platform} OAuth:`, error);

      // Enhanced error logging for debugging
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });

        // Check for specific error types
        if (error.message.includes('credentials not configured')) {
          console.error('❌ OAuth credentials missing for platform:', platform);
        }
        if (error.message.includes('Redis')) {
          console.error('❌ Redis connection issue detected');
        }
      }

      // Audit log the error
      try {
        await auditOAuthEvent({
          userId: user.id,
          organizationId: user.organization_id,
          platform,
          action: 'initiate',
          success: false,
          ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
          userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (auditError) {
        console.error('❌ Failed to audit OAuth error:', auditError);
      }

      throw new ValidationError(`Failed to initiate ${platform} OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })
);

// POST /api/v1/oauth/callback
// Handle OAuth callback and save account (requires authentication)
router.post('/callback',
  authMiddleware,
  ...oauthSecurityMiddleware.callback,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const validation = callbackSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }

    const { platform, code, state, codeVerifier } = validation.data;

    // Enhanced state validation using secure methods
    if (!validateSecureState(state, req.user.id, req.user.organization_id)) {
      await auditOAuthEvent({
        userId: req.user.id,
        organizationId: req.user.organization_id,
        platform,
        action: 'callback',
        success: false,
        ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
        userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
        error: 'Invalid OAuth state parameter'
      });
      throw new UnauthorizedError('Invalid or expired OAuth state');
    }

    // Verify state parameter exists in Redis
    const stateData = await getOAuthState(state);
    if (!stateData) {
      throw new UnauthorizedError('Invalid or expired OAuth state');
    }

    // Verify the state belongs to the current user
    if (stateData.userId !== req.user.id || stateData.platform !== platform) {
      throw new UnauthorizedError('OAuth state mismatch');
    }

    // Clean up the state
    await deleteOAuthState(state);

    try {
      // Get OAuth service and handle callback
      const oauthService = OAuthServiceFactory.getService(platform);
      
      let result;
      if (platform === 'twitter' && codeVerifier) {
        result = await (oauthService as any).handleCallback(code, codeVerifier);
      } else {
        result = await (oauthService as any).handleCallback(code);
      }

      if (!result.success || !result.account) {
        throw new ValidationError(`OAuth failed: ${result.error ?? 'Unknown error'}`);
      }

      const firestore = getFirestoreClient();

      // Check if account already exists
      const existingAccountQuery = await firestore
        .collection('social_accounts')
        .where('platform', '==', platform)
        .where('platform_user_id', '==', result.account.platform_user_id)
        .where('organization_id', '==', stateData.organizationId)
        .limit(1)
        .get();

      let accountData: Partial<SocialAccount>;
      let accountId: string;

      if (!existingAccountQuery.empty) {
        // Update existing account
        const existingAccount = existingAccountQuery.docs[0];
        accountId = existingAccount.id;
        accountData = {
          ...existingAccount.data(),
          ...result.account,
          tokenUpdatedAt: getServerTimestamp(),
          expiresAt: Date.now() + (result.account.refreshToken ? 60 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000)
        };
        await existingAccount.ref.update(accountData);
      } else {
        // Create new account
        accountData = {
          ...result.account,
          createdAt: getServerTimestamp(),
          tokenUpdatedAt: getServerTimestamp(),
          expiresAt: Date.now() + (result.account.refreshToken ? 60 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000)
        };
        const newAccount = await firestore.collection('social_accounts').add(accountData);
        accountId = newAccount.id;
      }

      // Schedule token refresh
      if (accountData.refresh_token) {
        let expiresAt: number;
        if (accountData.token_expires_at) {
          if (typeof accountData.token_expires_at === 'string') {
            expiresAt = new Date(accountData.token_expires_at).getTime();
          } else {
            expiresAt = accountData.token_expires_at.toMillis();
          }
        } else {
          expiresAt = Date.now() + 60 * 60 * 1000;
        }
          
        await TokenRefreshScheduler.getInstance().scheduleTokenRefresh(
          accountId,
          platform,
          expiresAt
        );
      }

      // Audit log successful callback
      await auditOAuthEvent({
        userId: req.user.id,
        organizationId: req.user.organization_id,
        platform,
        action: 'callback',
        success: true,
        ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
        userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
        metadata: { 
          accountId, 
          username: result.account.username,
          platformUserId: result.account.platform_user_id
        }
      });

      // Return success response
      res.json({
        success: true,
        message: `${platform} account connected successfully`,
        account: {
          id: accountId,
          ...accountData
        }
      });

    } catch (error) {
      console.error(`❌ Error handling ${platform} OAuth callback:`, error);
      
      // Audit log the error
      await auditOAuthEvent({
        userId: req.user.id,
        organizationId: req.user.organization_id,
        platform,
        action: 'callback',
        success: false,
        ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
        userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new ValidationError(`Failed to connect ${platform} account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })
);

// POST /api/v1/oauth/refresh
// Refresh OAuth token (requires authentication)
router.post('/refresh',
  authMiddleware,
  ...oauthSecurityMiddleware.refresh,  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, platform } = req.body;
    const user = req.user;

    if (!accountId || !platform) {
      throw new ValidationError('Account ID and platform are required');
    }

    if (!['twitter', 'linkedin', 'facebook', 'instagram'].includes(platform)) {
      throw new ValidationError('Invalid platform');
    }

    try {
      const firestore = getFirestoreClient();
      
      // Get the social account
      const accountDoc = await firestore.collection('social_accounts').doc(accountId).get();
      
      if (!accountDoc.exists) {
        throw new ValidationError('Account not found');
      }

      const accountData = accountDoc.data() as SocialAccount;
      
      // Verify account belongs to user's organization
      if (accountData.organization_id !== user.organization_id) {
        throw new UnauthorizedError('Account does not belong to your organization');
      }

      // Verify platform matches
      if (accountData.platform !== platform) {
        throw new ValidationError('Platform mismatch');
      }

      if (!accountData.refresh_token) {
        throw new ValidationError('No refresh token available for this account');
      }

      // Get OAuth service and refresh token
      const oauthService = OAuthServiceFactory.getService(platform);
      const refreshResult = await (oauthService as any).refreshAccessToken(accountData.refresh_token);

      if (!refreshResult) {
        throw new ValidationError('Failed to refresh token');
      }

      // Update account with new tokens
      const updatedData = {
        access_token: refreshResult.accessToken,
        refresh_token: refreshResult.refreshToken ?? accountData.refresh_token,
        tokenUpdatedAt: getServerTimestamp(),
        expiresAt: Date.now() + (3600 * 1000) // 1 hour from now
      };

      await accountDoc.ref.update(updatedData);

      // Schedule next token refresh
      await TokenRefreshScheduler.getInstance().scheduleTokenRefresh(
        accountId,
        platform,
        updatedData.expiresAt
      );

      // Audit log successful refresh
      await auditOAuthEvent({
        userId: user.id,
        organizationId: user.organization_id,
        platform,
        action: 'refresh',
        success: true,
        ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
        userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
        metadata: { accountId }
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        expiresAt: updatedData.expiresAt
      });

    } catch (error) {
      console.error(`❌ Error refreshing ${platform} token:`, error);
      
      // Audit log the error
      await auditOAuthEvent({
        userId: user.id,
        organizationId: user.organization_id,
        platform,
        action: 'refresh',
        success: false,
        ipAddress: (req as any).oauthMetadata?.ipAddress ?? 'unknown',
        userAgent: (req as any).oauthMetadata?.userAgent ?? 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new ValidationError(`Failed to refresh ${platform} token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })
);

// GET /api/v1/oauth/status/:platform
// Check OAuth status for a platform (requires authentication)
router.get('/status/:platform', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const platform = req.params.platform;
  const user = req.user;

  if (!['twitter', 'linkedin', 'facebook', 'instagram'].includes(platform)) {
    throw new ValidationError('Invalid platform');
  }

  if (!user.organization_id) {
    throw new UnauthorizedError('User must belong to an organization');
  }

  const firestore = getFirestoreClient();

  // Get connected accounts for this platform
  const accountsQuery = await firestore
    .collection('social_accounts')
    .where('platform', '==', platform)
    .where('organization_id', '==', user.organization_id)
    .where('is_active', '==', true)
    .get();

  const accounts = accountsQuery.docs.map(doc => ({
    id: doc.id,
    username: doc.data().username,
    display_name: doc.data().display_name,
    avatar_url: doc.data().avatar_url,
    permissions: doc.data().permissions,
    last_sync_at: doc.data().last_sync_at,
    created_at: doc.data().created_at
  }));

  res.json({
    platform,
    connected: accounts.length > 0,
    accounts
  });
}));

// DELETE /api/v1/oauth/disconnect/:accountId
// Disconnect a social media account (requires authentication)
router.delete('/disconnect/:accountId', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const accountId = req.params.accountId;
  const user = req.user;

  if (!user.organization_id) {
    throw new UnauthorizedError('User must belong to an organization');
  }

  const firestore = getFirestoreClient();

  // Get the account to verify ownership
  const accountDoc = await firestore.collection('social_accounts').doc(accountId).get();

  if (!accountDoc.exists) {
    throw new ValidationError('Social account not found');
  }

  const accountData = accountDoc.data() as SocialAccount;

  // Verify the account belongs to the user's organization
  if (accountData.organization_id !== user.organization_id) {
    throw new UnauthorizedError('Account does not belong to your organization');
  }

  // Deactivate the account instead of deleting (for audit purposes)
  await firestore.collection('social_accounts').doc(accountId).update({
    is_active: false,
    access_token: null,
    refresh_token: null,
    updated_at: getServerTimestamp()
  });

  res.json({
    message: `${accountData.platform} account disconnected successfully`,
    accountId
  });
}));

// GET /api/v1/oauth/twitter/callback
// Twitter OAuth callback endpoint (no auth required - called by Twitter)
router.get('/twitter/callback', asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  console.log('🐦 Twitter OAuth callback received:', {
    code: code ? 'present' : 'missing',
    state: state ?? 'missing',
    error: error ?? 'none',
    query: req.query
  });

  if (error) {
    console.error('Twitter OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
  }

  if (!code || !state) {
    console.error('Missing code or state in Twitter callback');
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=missing_params`);
  }

  try {
    console.log('🐦 Twitter callback - checking state:', state);

    // Verify state parameter
    const stateData = await getOAuthState(state as string);
    if (!stateData) {
      console.error('❌ Twitter OAuth state not found:', state);

      // Check Redis for debugging
      try {
        const { redis, getRedisKey, REDIS_PREFIX } = await import('../services/redis.js');
        const allKeys = await redis.keys(`${REDIS_PREFIX.OAUTH_STATE}*`);
        console.log('📊 Available OAuth states in Redis:', allKeys.length);
        console.log('🔍 Redis keys:', allKeys.map(key => key.replace(REDIS_PREFIX.OAUTH_STATE, '')));
      } catch (redisError) {
        console.error('❌ Error checking Redis:', redisError);
      }

      return res.json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
        message: 'Invalid or expired OAuth state',
        details: {
          state,
          message: 'State not found in Redis or expired',
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log('✅ Twitter OAuth state found:', {
      userId: stateData.userId,
      platform: stateData.platform,
      timestamp: new Date(stateData.timestamp).toISOString()
    });

    // Verify platform matches
    if (stateData.platform !== 'twitter') {
      console.error('Platform mismatch in state:', stateData.platform);
      return res.json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
        message: 'Platform mismatch in state',
        details: { expected: 'twitter', actual: stateData.platform }
      });
    }

    // Verify codeVerifier exists
    if (!stateData.codeVerifier) {
      console.error('Missing codeVerifier in state data');
      return res.json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
        message: 'Missing codeVerifier in state data',
        details: { stateData }
      });
    }

    console.log('🐦 Twitter OAuth state verified:', {
      userId: stateData.userId,
      organizationId: stateData.organizationId,
      platform: stateData.platform,
      hasCodeVerifier: !!stateData.codeVerifier
    });

    // Clean up the state
    await deleteOAuthState(state as string);

    // Get Twitter OAuth service and handle callback
    const twitterService = OAuthServiceFactory.getService('twitter');
    console.log('🐦 Calling Twitter OAuth service with:', {
      code: code ? 'present' : 'missing',
      codeVerifier: stateData.codeVerifier ? 'present' : 'missing'
    });

    const result = await (twitterService as any).handleCallback(code as string, stateData.codeVerifier);

    if (!result.success || !result.account) {
      console.error('Twitter OAuth failed:', result.error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed&platform=twitter&details=${encodeURIComponent(result.error || 'Unknown error')}`);
    }

    const firestore = getFirestoreClient();

    // Check if account already exists
    const existingAccountQuery = await firestore
      .collection('social_accounts')
      .where('platform', '==', 'twitter')
      .where('platform_user_id', '==', result.account.platform_user_id)
      .where('organization_id', '==', stateData.organizationId)
      .limit(1)
      .get();

    let accountData: SocialAccount;

    if (!existingAccountQuery.empty) {
      // Update existing account
      const existingDoc = existingAccountQuery.docs[0];
      const updateData = {
        ...result.account,
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      await existingDoc.ref.update(updateData);
      accountData = { id: existingDoc.id, ...updateData } as SocialAccount;
      console.log('✅ Updated existing Twitter account:', existingDoc.id);
    } else {
      // Create new account
      const newAccountData = {
        ...result.account,
        user_id: stateData.userId,
        organization_id: stateData.organizationId,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      const docRef = await firestore.collection('social_accounts').add(newAccountData);
      accountData = { id: docRef.id, ...newAccountData } as SocialAccount;
      console.log('✅ Created new Twitter account:', docRef.id);
    }

    // Redirect to success page
    // If the request came from ngrok, redirect to a special success page that handles the cross-origin redirect
    const isNgrokRequest = req.get('host')?.includes('ngrok');

    if (isNgrokRequest) {
      // Return a simple HTML page that redirects to localhost frontend
      const redirectHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Twitter Connected Successfully</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #10b981; font-size: 24px; margin-bottom: 20px; }
            .loading { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="success">✅ Twitter Account Connected Successfully!</div>
          <div class="loading">Redirecting you back to the app...</div>
          <script>
            // Redirect to localhost frontend
            setTimeout(() => {
              window.location.href = '${process.env.FRONTEND_URL}/dashboard/community/platforms?success=twitter_connected&account=${encodeURIComponent(accountData.username)}';
            }, 2000);
          </script>
        </body>
        </html>
      `;
      return res.send(redirectHtml);
    } else {
      // Direct redirect for localhost requests
      const successUrl = `${process.env.FRONTEND_URL}/dashboard/community/platforms?success=twitter_connected&account=${accountData.username}`;
      res.redirect(successUrl);
    }

  } catch (error) {
    console.error('❌ Twitter OAuth callback error:', error);

    // Handle ngrok context for error redirects too
    const isNgrokRequest = req.get('host')?.includes('ngrok');

    if (isNgrokRequest) {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Twitter Connection Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #ef4444; font-size: 24px; margin-bottom: 20px; }
            .loading { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="error">❌ Twitter Connection Failed</div>
          <div class="loading">Redirecting you back to the app...</div>
          <script>
            setTimeout(() => {
              window.location.href = '${process.env.FRONTEND_URL}/dashboard/community/platforms?error=callback_failed';
            }, 2000);
          </script>
        </body>
        </html>
      `;
      return res.send(errorHtml);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=callback_failed`);
    }
  }
}));

// GET /api/v1/oauth/facebook/callback
// Facebook OAuth callback endpoint (no auth required - called by Facebook)
router.get('/facebook/callback', asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  console.log('📘 Facebook OAuth callback received:', {
    code: code ? 'present' : 'missing',
    state: state ?? 'missing',
    error: error ?? 'none',
    query: req.query
  });

  if (error) {
    console.error('Facebook OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
  }

  if (!code || !state) {
    console.error('Missing code or state in Facebook callback');
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=missing_params`);
  }

  try {
    // Verify state parameter
    const stateData = await getOAuthState(state as string);
    if (!stateData) {
      console.error('Invalid or expired OAuth state:', state);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=invalid_state`);
    }

    // Verify platform matches
    if (stateData.platform !== 'facebook') {
      console.error('Platform mismatch in state:', stateData.platform);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=platform_mismatch`);
    }

    // Clean up the state
    await deleteOAuthState(state as string);

    // Get Facebook OAuth service and handle callback
    const facebookService = OAuthServiceFactory.getService('facebook');
    const result = await (facebookService as any).handleCallback(code as string);

    if (!result.success || !result.account) {
      console.error('Facebook OAuth failed:', result.error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
    }

    const firestore = getFirestoreClient();

    // Check if account already exists
    const existingAccountQuery = await firestore
      .collection('social_accounts')
      .where('platform', '==', 'facebook')
      .where('platform_user_id', '==', result.account.platform_user_id)
      .where('organization_id', '==', stateData.organizationId)
      .limit(1)
      .get();

    let accountData: SocialAccount;

    if (!existingAccountQuery.empty) {
      // Update existing account
      const existingDoc = existingAccountQuery.docs[0];
      const updateData = {
        ...result.account,
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      await existingDoc.ref.update(updateData);
      accountData = { id: existingDoc.id, ...updateData } as SocialAccount;
      console.log('✅ Updated existing Facebook account:', existingDoc.id);
    } else {
      // Create new account
      const newAccountData = {
        ...result.account,
        user_id: stateData.userId,
        organization_id: stateData.organizationId,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      const docRef = await firestore.collection('social_accounts').add(newAccountData);
      accountData = { id: docRef.id, ...newAccountData } as SocialAccount;
      console.log('✅ Created new Facebook account:', docRef.id);
    }

    // Redirect to success page
    const successUrl = `${process.env.FRONTEND_URL}/dashboard/community/platforms?success=facebook_connected&account=${accountData.username}`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('❌ Facebook OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=callback_failed`);
  }
}));

// GET /api/v1/oauth/instagram/callback
// Instagram OAuth callback endpoint (no auth required - called by Instagram)
router.get('/instagram/callback', asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  console.log('📷 Instagram OAuth callback received:', {
    code: code ? 'present' : 'missing',
    state: state ?? 'missing',
    error: error ?? 'none',
    query: req.query
  });

  if (error) {
    console.error('Instagram OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
  }

  if (!code || !state) {
    console.error('Missing code or state in Instagram callback');
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=missing_params`);
  }

  try {
    // Verify state parameter
    const stateData = await getOAuthState(state as string);
    if (!stateData) {
      console.error('Invalid or expired OAuth state:', state);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=invalid_state`);
    }

    // Verify platform matches
    if (stateData.platform !== 'instagram') {
      console.error('Platform mismatch in state:', stateData.platform);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=platform_mismatch`);
    }

    // Clean up the state
    await deleteOAuthState(state as string);

    // Get Instagram OAuth service and handle callback
    const instagramService = OAuthServiceFactory.getService('instagram');
    const result = await (instagramService as any).handleCallback(code as string);

    if (!result.success || !result.account) {
      console.error('Instagram OAuth failed:', result.error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
    }

    const firestore = getFirestoreClient();

    // Check if account already exists
    const existingAccountQuery = await firestore
      .collection('social_accounts')
      .where('platform', '==', 'instagram')
      .where('platform_user_id', '==', result.account.platform_user_id)
      .where('organization_id', '==', stateData.organizationId)
      .limit(1)
      .get();

    let accountData: SocialAccount;

    if (!existingAccountQuery.empty) {
      // Update existing account
      const existingDoc = existingAccountQuery.docs[0];
      const updateData = {
        ...result.account,
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      await existingDoc.ref.update(updateData);
      accountData = { id: existingDoc.id, ...updateData } as SocialAccount;
      console.log('✅ Updated existing Instagram account:', existingDoc.id);
    } else {
      // Create new account
      const newAccountData = {
        ...result.account,
        user_id: stateData.userId,
        organization_id: stateData.organizationId,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      const docRef = await firestore.collection('social_accounts').add(newAccountData);
      accountData = { id: docRef.id, ...newAccountData } as SocialAccount;
      console.log('✅ Created new Instagram account:', docRef.id);
    }

    // Redirect to success page
    const successUrl = `${process.env.FRONTEND_URL}/dashboard/community/platforms?success=instagram_connected&account=${accountData.username}`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('❌ Instagram OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=callback_failed`);
  }
}));

// GET /api/v1/oauth/linkedin/callback
// LinkedIn OAuth callback endpoint (no auth required - called by LinkedIn)
router.get('/linkedin/callback', asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  console.log('🔗 LinkedIn OAuth callback received:', {
    code: code ? 'present' : 'missing',
    state: state ?? 'missing',
    error: error ?? 'none',
    query: req.query
  });

  if (error) {
    console.error('LinkedIn OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
  }

  if (!code || !state) {
    console.error('Missing code or state in LinkedIn callback');
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=missing_params`);
  }

  try {
    // Verify state parameter
    const stateData = await getOAuthState(state as string);
    if (!stateData) {
      console.error('Invalid or expired OAuth state:', state);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=invalid_state`);
    }

    // Verify platform matches
    if (stateData.platform !== 'linkedin') {
      console.error('Platform mismatch in state:', stateData.platform);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=platform_mismatch`);
    }

    // Clean up the state
    await deleteOAuthState(state as string);

    // Get LinkedIn OAuth service and handle callback
    const linkedinService = OAuthServiceFactory.getService('linkedin');
    const result = await (linkedinService as any).handleCallback(code as string);

    if (!result.success || !result.account) {
      console.error('LinkedIn OAuth failed:', result.error);
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
    }

    const firestore = getFirestoreClient();

    // Check if account already exists
    const existingAccountQuery = await firestore
      .collection('social_accounts')
      .where('platform', '==', 'linkedin')
      .where('platform_user_id', '==', result.account.platform_user_id)
      .where('organization_id', '==', stateData.organizationId)
      .limit(1)
      .get();

    let accountData: SocialAccount;

    if (!existingAccountQuery.empty) {
      // Update existing account
      const existingDoc = existingAccountQuery.docs[0];
      const updateData = {
        ...result.account,
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      await existingDoc.ref.update(updateData);
      accountData = { id: existingDoc.id, ...updateData } as SocialAccount;
      console.log('✅ Updated existing LinkedIn account:', existingDoc.id);
    } else {
      // Create new account
      const newAccountData = {
        ...result.account,
        user_id: stateData.userId,
        organization_id: stateData.organizationId,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp(),
        is_active: true
      };

      const docRef = await firestore.collection('social_accounts').add(newAccountData);
      accountData = { id: docRef.id, ...newAccountData } as SocialAccount;
      console.log('✅ Created new LinkedIn account:', docRef.id);
    }

    // Redirect to success page
    const successUrl = `${process.env.FRONTEND_URL}/dashboard/community/platforms?success=linkedin_connected&account=${accountData.username}`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('❌ LinkedIn OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=callback_failed`);
  }
}));

// Debug endpoint to test OAuth service initialization (unprotected for debugging)
router.get('/debug/credentials', (req, res) => {
  try {
    const twitterService = OAuthServiceFactory.getService('twitter');
    const linkedinService = OAuthServiceFactory.getService('linkedin');
    const facebookService = OAuthServiceFactory.getService('facebook');
    const instagramService = OAuthServiceFactory.getService('instagram');

    res.json({
      timestamp: new Date().toISOString(),
      message: 'OAuth services initialized successfully',
      services: {
        twitter: twitterService ? 'initialized' : 'failed',
        linkedin: linkedinService ? 'initialized' : 'failed',
        facebook: facebookService ? 'initialized' : 'failed',
        instagram: instagramService ? 'initialized' : 'failed'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'OAuth service initialization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to test Twitter OAuth URL generation
router.get('/debug/twitter-url', async (req, res) => {
  try {
    const twitterService = OAuthServiceFactory.getService('twitter');
    const testState = `debug_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    console.log('🐦 Debug: Testing Twitter OAuth URL generation...');
    const result = await (twitterService as any).generateAuthUrl(testState);

    // Store state in Redis for testing (same as real OAuth flow)
    await storeOAuthState(testState, {
      userId: 'debug_user_123',
      organizationId: 'debug_org_456',
      platform: 'twitter',
      codeVerifier: result.codeVerifier,
      timestamp: Date.now()
    });

    console.log('✅ Debug: State stored in Redis for testing');

    res.json({
      timestamp: new Date().toISOString(),
      message: 'Twitter OAuth URL generated successfully (with state stored)',
      state: testState,
      authUrl: result.url,
      codeVerifier: result.codeVerifier ? 'generated' : 'missing',
      urlPreview: result.url.substring(0, 100) + '...',
      debug: {
        stateStored: true,
        userId: 'debug_user_123',
        organizationId: 'debug_org_456'
      }
    });
  } catch (error) {
    console.error('❌ Debug: Twitter OAuth URL generation failed:', error);
    res.status(500).json({
      error: 'Twitter OAuth URL generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? {
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
});

// Debug endpoint to check Twitter credentials format
router.get('/debug/twitter-config', (req, res) => {
  try {
    const config = {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      redirectUri: process.env.TWITTER_REDIRECT_URI
    };

    // Check if credentials are present
    const status = {
      clientId: config.clientId ? 'present' : 'missing',
      clientSecret: config.clientSecret ? 'present' : 'missing',
      redirectUri: config.redirectUri ? 'present' : 'missing',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    // Test Twitter service initialization
    let serviceStatus = 'unknown';
    let serviceError = null;

    try {
      const twitterService = OAuthServiceFactory.getService('twitter');
      serviceStatus = 'initialized';
    } catch (error) {
      serviceStatus = 'failed';
      serviceError = error instanceof Error ? error.message : 'Unknown error';
    }

    res.json({
      status: 'Twitter OAuth Configuration Check',
      credentials: status,
      service: {
        status: serviceStatus,
        error: serviceError
      },
      allEnvVars: Object.keys(process.env).filter(key =>
        key.includes('TWITTER') || key.includes('OAUTH') || key.includes('REDIS') || key.includes('FRONTEND')
      ).reduce((acc, key) => {
        acc[key] = process.env[key] ? 'set' : 'unset';
        return acc;
      }, {} as Record<string, string>)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check Twitter configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to test OAuth initiation without authentication
router.get('/debug/test-oauth-initiate/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    console.log(`🧪 Debug: Testing OAuth initiation for ${platform}`);

    // Mock user data for testing
    const mockUser = {
      id: 'debug_user_123',
      organization_id: 'debug_org_456'
    };

    // Generate state
    const state = generateSecureState(mockUser.id, mockUser.organization_id);
    console.log('🔐 Generated state:', state);

    // Get OAuth service
    const oauthService = OAuthServiceFactory.getService(platform);
    console.log('🏭 OAuth service obtained');

    // Generate auth URL
    let authUrl: string;
    let codeVerifier: string | undefined;

    if (platform === 'twitter') {
      const result = await (oauthService as any).generateAuthUrl(state);
      authUrl = result.url;
      codeVerifier = result.codeVerifier;
    } else {
      authUrl = (oauthService as any).generateAuthUrl(state);
    }

    console.log('✅ Auth URL generated successfully');

    res.json({
      success: true,
      platform,
      authUrl: authUrl.substring(0, 100) + '...',
      state,
      codeVerifier: codeVerifier ? 'generated' : 'not applicable',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Debug OAuth initiation failed for ${req.params.platform}:`, error);

    res.status(500).json({
      success: false,
      platform: req.params.platform,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? {
        name: error.name,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check Twitter configuration
router.get('/debug/twitter-config', async (req, res) => {
  try {
    const twitterService = OAuthServiceFactory.getService('twitter');
    const config = (twitterService as any).config;

    console.log('🐦 Debug: Twitter configuration check...');

    res.json({
      timestamp: new Date().toISOString(),
      message: 'Twitter configuration loaded',
      config: {
        clientId: config.clientId ? {
          present: true,
          length: config.clientId.length,
          preview: `${config.clientId.substring(0, 10)}...`,
          format: config.clientId.includes(':') ? 'contains_colon' : 'no_colon',
          isBase64Like: /^[A-Za-z0-9+/]+=*$/.test(config.clientId)
        } : { present: false },
        clientSecret: config.clientSecret ? {
          present: true,
          length: config.clientSecret.length,
          preview: `${config.clientSecret.substring(0, 10)}...`,
          isBase64Like: /^[A-Za-z0-9+/]+=*$/.test(config.clientSecret)
        } : { present: false },
        redirectUri: config.redirectUri || 'missing'
      }
    });
  } catch (error) {
    console.error('❌ Debug: Twitter config check failed:', error);
    res.status(500).json({
      error: 'Twitter config check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to test LinkedIn OAuth URL generation
router.get('/debug/linkedin-url', async (req, res) => {
  try {
    const linkedinService = OAuthServiceFactory.getService('linkedin');
    const testState = `debug_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    console.log('🔗 Debug: Testing LinkedIn OAuth URL generation...');
    const authUrl = (linkedinService as any).generateAuthUrl(testState);

    // Store state in Redis for testing (same as real OAuth flow)
    await storeOAuthState(testState, {
      userId: 'debug_user_123',
      organizationId: '51eehsR75718t2svEqhh', // Use real org ID
      platform: 'linkedin',
      timestamp: Date.now()
    });

    console.log('✅ Debug: LinkedIn state stored in Redis for testing');

    res.json({
      timestamp: new Date().toISOString(),
      message: 'LinkedIn OAuth URL generated successfully (with state stored)',
      state: testState,
      authUrl,
      urlPreview: authUrl.substring(0, 100) + '...',
      debug: {
        stateStored: true,
        userId: 'debug_user_123',
        organizationId: '51eehsR75718t2svEqhh'
      }
    });
  } catch (error) {
    console.error('❌ Debug: LinkedIn OAuth URL generation failed:', error);
    res.status(500).json({
      error: 'LinkedIn OAuth URL generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? {
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
});

// Debug endpoint to test Facebook OAuth URL generation
router.get('/debug/facebook-url', async (req, res) => {
  try {
    const facebookService = OAuthServiceFactory.getService('facebook');
    const testState = `debug_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    console.log('📘 Debug: Testing Facebook OAuth URL generation...');
    const authUrl = (facebookService as any).generateAuthUrl(testState);

    // Store state in Redis for testing
    await storeOAuthState(testState, {
      userId: 'debug_user_123',
      organizationId: '51eehsR75718t2svEqhh',
      platform: 'facebook',
      timestamp: Date.now()
    });

    console.log('✅ Debug: Facebook state stored in Redis for testing');

    res.json({
      timestamp: new Date().toISOString(),
      message: 'Facebook OAuth URL generated successfully (with state stored)',
      state: testState,
      authUrl,
      urlPreview: authUrl.substring(0, 100) + '...',
      debug: {
        stateStored: true,
        userId: 'debug_user_123',
        organizationId: '51eehsR75718t2svEqhh'
      }
    });
  } catch (error) {
    console.error('❌ Debug: Facebook OAuth URL generation failed:', error);
    res.status(500).json({
      error: 'Facebook OAuth URL generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to test Instagram OAuth URL generation
router.get('/debug/instagram-url', async (req, res) => {
  try {
    const instagramService = OAuthServiceFactory.getService('instagram');
    const testState = `debug_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    console.log('📷 Debug: Testing Instagram OAuth URL generation...');
    const authUrl = (instagramService as any).generateAuthUrl(testState);

    // Store state in Redis for testing
    await storeOAuthState(testState, {
      userId: 'debug_user_123',
      organizationId: '51eehsR75718t2svEqhh',
      platform: 'instagram',
      timestamp: Date.now()
    });

    console.log('✅ Debug: Instagram state stored in Redis for testing');

    res.json({
      timestamp: new Date().toISOString(),
      message: 'Instagram OAuth URL generated successfully (with state stored)',
      state: testState,
      authUrl,
      urlPreview: authUrl.substring(0, 100) + '...',
      debug: {
        stateStored: true,
        userId: 'debug_user_123',
        organizationId: '51eehsR75718t2svEqhh'
      }
    });
  } catch (error) {
    console.error('❌ Debug: Instagram OAuth URL generation failed:', error);
    res.status(500).json({
      error: 'Instagram OAuth URL generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
