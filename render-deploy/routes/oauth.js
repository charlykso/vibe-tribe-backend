import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler, ValidationError, UnauthorizedError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { OAuthServiceFactory } from '../services/oauth.js';
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
// Store OAuth states temporarily (in production, use Redis)
const oauthStates = new Map();
// Clean up expired states (older than 10 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [state, data] of oauthStates.entries()) {
        if (now - data.timestamp > 10 * 60 * 1000) {
            oauthStates.delete(state);
        }
    }
}, 5 * 60 * 1000); // Clean every 5 minutes
// POST /api/v1/oauth/initiate
// Initiate OAuth flow for a platform
router.post('/initiate', asyncHandler(async (req, res) => {
    const validation = initiateOAuthSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { platform, returnUrl } = validation.data;
    const user = req.user;
    if (!user.organization_id) {
        throw new UnauthorizedError('User must belong to an organization');
    }
    try {
        // Generate unique state parameter
        const state = `${user.id}_${user.organization_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Get OAuth service for platform
        const oauthService = OAuthServiceFactory.getService(platform);
        let authUrl;
        let codeVerifier;
        if (platform === 'twitter') {
            const result = await oauthService.generateAuthUrl(state);
            authUrl = result.url;
            codeVerifier = result.codeVerifier;
        }
        else {
            authUrl = oauthService.generateAuthUrl(state);
        }
        // Store state information
        oauthStates.set(state, {
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
    }
    catch (error) {
        console.error(`❌ Error initiating ${platform} OAuth:`, error);
        throw new ValidationError(`Failed to initiate ${platform} OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}));
// POST /api/v1/oauth/callback
// Handle OAuth callback and save account
router.post('/callback', asyncHandler(async (req, res) => {
    const validation = callbackSchema.safeParse(req.body);
    if (!validation.success) {
        throw new ValidationError('Validation failed', validation.error.errors);
    }
    const { platform, code, state, codeVerifier } = validation.data;
    // Verify state parameter
    const stateData = oauthStates.get(state);
    if (!stateData) {
        throw new UnauthorizedError('Invalid or expired OAuth state');
    }
    // Verify the state belongs to the current user
    if (stateData.userId !== req.user.id || stateData.platform !== platform) {
        throw new UnauthorizedError('OAuth state mismatch');
    }
    // Clean up the state
    oauthStates.delete(state);
    try {
        // Get OAuth service and handle callback
        const oauthService = OAuthServiceFactory.getService(platform);
        let result;
        if (platform === 'twitter' && codeVerifier) {
            result = await oauthService.handleCallback(code, codeVerifier);
        }
        else {
            result = await oauthService.handleCallback(code);
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
        }
        else {
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
    }
    catch (error) {
        console.error(`❌ Error handling ${platform} OAuth callback:`, error);
        throw new ValidationError(`Failed to connect ${platform} account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}));
// GET /api/v1/oauth/status/:platform
// Check OAuth status for a platform
router.get('/status/:platform', asyncHandler(async (req, res) => {
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
// Disconnect a social media account
router.delete('/disconnect/:accountId', asyncHandler(async (req, res) => {
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
    const accountData = accountDoc.data();
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
// GET /api/v1/oauth/linkedin/callback
// LinkedIn OAuth callback endpoint (no auth required - called by LinkedIn)
router.get('/linkedin/callback', asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
        console.error('LinkedIn OAuth error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
    }
    if (!code || !state) {
        console.error('Missing code or state in LinkedIn callback');
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=missing_params`);
    }
    try {
        const linkedinService = OAuthServiceFactory.getLinkedInService();
        // Exchange code for access token
        const tokenData = await linkedinService.exchangeCodeForToken(code);
        // Get user profile
        const profile = await linkedinService.getUserProfile(tokenData.access_token);
        // Store the social account
        const firestore = getFirestoreClient();
        // Parse state to get user info
        // State format: userId_organizationId_timestamp_random
        const stateParts = state.split('_');
        if (stateParts.length < 4) {
            throw new Error('Invalid state format');
        }
        const userId = stateParts[0];
        const organizationId = stateParts[1];
        const socialAccount = {
            platform: 'linkedin',
            platform_user_id: profile.id,
            username: profile.localizedFirstName + ' ' + profile.localizedLastName,
            display_name: profile.localizedFirstName + ' ' + profile.localizedLastName,
            profile_image_url: profile.profilePicture?.displayImage || '',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || '',
            token_expires_at: tokenData.expires_in ?
                new Date(Date.now() + tokenData.expires_in * 1000) : null,
            user_id: userId,
            organization_id: organizationId,
            is_active: true,
            created_at: getServerTimestamp(),
            updated_at: getServerTimestamp()
        };
        await firestore.collection('social_accounts').add(socialAccount);
        // Redirect back to frontend with success
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?success=linkedin_connected`);
    }
    catch (error) {
        console.error('LinkedIn OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/community/platforms?error=oauth_failed`);
    }
}));
export default router;
//# sourceMappingURL=oauth.js.map