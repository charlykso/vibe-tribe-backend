import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { OAuthServiceFactory } from '../services/oauth.js';
import { SocialAccount } from '../types/database.js';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

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

// Store OAuth state in Firestore
async function storeOAuthState(state: string, data: Omit<OAuthState, 'expiresAt'>): Promise<void> {
  const firestore = getFirestoreClient();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes from now

  await firestore.collection('oauth_states').doc(state).set({
    ...data,
    expiresAt
  });
}

// Retrieve OAuth state from Firestore
async function getOAuthState(state: string): Promise<OAuthState | null> {
  const firestore = getFirestoreClient();
  const doc = await firestore.collection('oauth_states').doc(state).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as OAuthState;

  // Check if expired
  if (Date.now() > data.expiresAt) {
    // Clean up expired state
    await firestore.collection('oauth_states').doc(state).delete();
    return null;
  }

  return data;
}

// Delete OAuth state from Firestore
async function deleteOAuthState(state: string): Promise<void> {
  const firestore = getFirestoreClient();
  await firestore.collection('oauth_states').doc(state).delete();
}

// Clean up expired states (runs every 5 minutes)
setInterval(async () => {
  try {
    const firestore = getFirestoreClient();
    const now = Date.now();

    const expiredStates = await firestore
      .collection('oauth_states')
      .where('expiresAt', '<', now)
      .get();

    const batch = firestore.batch();
    expiredStates.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (!expiredStates.empty) {
      await batch.commit();
      console.log(`🧹 Cleaned up ${expiredStates.size} expired OAuth states`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up OAuth states:', error);
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// POST /api/v1/oauth/initiate
// Initiate OAuth flow for a platform
router.post('/initiate', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = initiateOAuthSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const { platform, returnUrl } = validation.data;
  const user = req.user!;

  if (!user.organization_id) {
    throw new UnauthorizedError('User must belong to an organization');
  }

  try {
    // Generate unique state parameter
    const state = `${user.id}_${user.organization_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get OAuth service for platform
    const oauthService = OAuthServiceFactory.getService(platform);
    
    let authUrl: string;
    let codeVerifier: string | undefined;

    if (platform === 'twitter') {
      const result = await (oauthService as any).generateAuthUrl(state);
      authUrl = result.url;
      codeVerifier = result.codeVerifier;
    } else {
      authUrl = (oauthService as any).generateAuthUrl(state);
    }

    // Store state information in Firestore
    await storeOAuthState(state, {
      userId: user.id,
      organizationId: user.organization_id,
      platform,
      codeVerifier,
      timestamp: Date.now()
    });

    res.json({
      authUrl,
      state,
      platform,
      message: `Redirect user to this URL to authorize ${platform} access`
    });

  } catch (error) {
    console.error(`❌ Error initiating ${platform} OAuth:`, error);
    throw new ValidationError(`Failed to initiate ${platform} OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}));

// POST /api/v1/oauth/callback
// Handle OAuth callback and save account
router.post('/callback', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = callbackSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError('Validation failed', validation.error.errors);
  }

  const { platform, code, state, codeVerifier } = validation.data;

  // Verify state parameter
  const stateData = await getOAuthState(state);
  if (!stateData) {
    throw new UnauthorizedError('Invalid or expired OAuth state');
  }

  // Verify the state belongs to the current user
  if (stateData.userId !== req.user!.id || stateData.platform !== platform) {
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
      throw new ValidationError(`OAuth failed: ${result.error || 'Unknown error'}`);
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

    if (!existingAccountQuery.empty) {
      // Update existing account
      const existingDoc = existingAccountQuery.docs[0];
      await firestore.collection('social_accounts').doc(existingDoc.id).update({
        access_token: result.account.access_token,
        refresh_token: result.account.refresh_token,
        username: result.account.username,
        display_name: result.account.display_name,
        avatar_url: result.account.avatar_url,
        permissions: result.account.permissions,
        metadata: result.account.metadata,
        is_active: true,
        last_sync_at: getServerTimestamp(),
        updated_at: getServerTimestamp()
      });

      const updatedAccount = {
        id: existingDoc.id,
        ...existingDoc.data(),
        ...result.account
      };

      res.json({
        message: `${platform} account updated successfully`,
        account: {
          id: updatedAccount.id,
          platform: updatedAccount.platform,
          username: updatedAccount.username,
          display_name: updatedAccount.display_name,
          avatar_url: updatedAccount.avatar_url,
          is_active: updatedAccount.is_active
        }
      });
    } else {
      // Create new account
      const accountRef = firestore.collection('social_accounts').doc();
      const newAccount = {
        user_id: stateData.userId,
        organization_id: stateData.organizationId,
        platform: result.account.platform,
        platform_user_id: result.account.platform_user_id,
        username: result.account.username,
        display_name: result.account.display_name,
        avatar_url: result.account.avatar_url,
        access_token: result.account.access_token,
        refresh_token: result.account.refresh_token,
        permissions: result.account.permissions || [],
        metadata: result.account.metadata || {},
        is_active: true,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        last_sync_at: getServerTimestamp()
      };

      await accountRef.set(newAccount);

      res.status(201).json({
        message: `${platform} account connected successfully`,
        account: {
          id: accountRef.id,
          platform: newAccount.platform,
          username: newAccount.username,
          display_name: newAccount.display_name,
          avatar_url: newAccount.avatar_url,
          is_active: newAccount.is_active
        }
      });
    }

  } catch (error) {
    console.error(`❌ Error handling ${platform} OAuth callback:`, error);
    throw new ValidationError(`Failed to connect ${platform} account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}));

// GET /api/v1/oauth/status/:platform
// Check OAuth status for a platform
router.get('/status/:platform', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const platform = req.params.platform;
  const user = req.user!;

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
// Disconnect a social media account
router.delete('/disconnect/:accountId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const accountId = req.params.accountId;
  const user = req.user!;

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
    state: state ? state : 'missing',
    error: error || 'none',
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

      // Check if we have any states in the database
      const firestore = getFirestoreClient();
      const allStates = await firestore.collection('oauth_states').get();
      console.log('📊 Available OAuth states in database:', allStates.size);

      return res.json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
        message: 'Invalid or expired OAuth state',
        details: {
          state,
          message: 'State not found in database or expired',
          availableStates: allStates.size,
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
      return res.json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
        message: 'Twitter OAuth failed',
        details: { error: result.error, result }
      });
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
    const successUrl = `${process.env.FRONTEND_URL}/dashboard/community/platforms?success=twitter_connected&account=${accountData.username}`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('❌ Twitter OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=callback_failed`);
  }
}));

// GET /api/v1/oauth/facebook/callback
// Facebook OAuth callback endpoint (no auth required - called by Facebook)
router.get('/facebook/callback', asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  console.log('📘 Facebook OAuth callback received:', {
    code: code ? 'present' : 'missing',
    state: state ? state : 'missing',
    error: error || 'none',
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
    state: state ? state : 'missing',
    error: error || 'none',
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
    state: state ? state : 'missing',
    error: error || 'none',
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

export default router;
