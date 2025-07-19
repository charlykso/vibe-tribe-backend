import { Router } from 'express';
import { GoogleOAuthService } from '../services/oauth.js';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { generateToken } from '../utils/jwt.js';
import { generateSecureState } from '../utils/security.js';
import { storeOAuthState, getOAuthState, deleteOAuthState } from '../services/redis.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

// Google OAuth initiation for authentication (sign-in/sign-up)
router.get('/initiate', async (req, res) => {
  try {
    console.log('🚀 Initiating Google OAuth for authentication...');

    // Generate secure state for CSRF protection
    const state = generateSecureState('google_auth', 'public');
    
    // Get Google OAuth service
    const googleService = new GoogleOAuthService();
    
    // Generate auth URL
    const authUrl = googleService.generateAuthUrl(state);
    
    console.log('🔗 Generated Google auth URL');

    // Store state information in Redis
    await storeOAuthState(state, {
      type: 'google_auth',
      timestamp: Date.now(),
      purpose: 'authentication'
    });

    // Return the auth URL for frontend to redirect to
    res.json({
      success: true,
      authUrl,
      state
    });

  } catch (error) {
    console.error('❌ Error initiating Google OAuth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Google OAuth',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Google OAuth callback for authentication
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    console.log('📥 Google OAuth callback received');

    if (oauthError) {
      console.error('❌ Google OAuth error:', oauthError);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error&message=${encodeURIComponent(oauthError as string)}`);
    }

    if (!code || !state) {
      console.error('❌ Missing code or state in Google OAuth callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_parameters`);
    }

    // Verify state to prevent CSRF attacks
    const stateData = await getOAuthState(state as string);
    if (!stateData || stateData.type !== 'google_auth') {
      console.error('❌ Invalid or expired state in Google OAuth callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // Clean up state
    await deleteOAuthState(state as string);

    // Handle Google OAuth callback
    const googleService = new GoogleOAuthService();
    const result = await googleService.handleCallback(code as string);

    if (!result.success || !result.userData) {
      console.error('❌ Google OAuth callback failed:', result.error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed&message=${encodeURIComponent(result.error || 'Unknown error')}`);
    }

    const { userData } = result;
    const firestore = getFirestoreClient();

    // Check if user already exists
    const existingUserQuery = await firestore
      .collection('users')
      .where('email', '==', userData.email)
      .limit(1)
      .get();

    let user;
    let isNewUser = false;

    if (!existingUserQuery.empty) {
      // User exists - sign them in
      const userDoc = existingUserQuery.docs[0];
      user = { id: userDoc.id, ...userDoc.data() };
      
      // Update last login
      await firestore
        .collection('users')
        .doc(user.id)
        .update({
          last_login: getServerTimestamp(),
          updated_at: getServerTimestamp(),
          // Update profile picture if it's from Google
          ...(userData.picture && { avatar_url: userData.picture })
        });

      console.log('✅ Existing user signed in via Google:', user.email);
    } else {
      // New user - create account
      isNewUser = true;
      
      // Create organization for new user
      const organizationData = {
        name: `${userData.name}'s Organization`,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        settings: {
          timezone: 'UTC',
          date_format: 'YYYY-MM-DD',
          currency: 'USD'
        }
      };

      const organizationRef = await firestore.collection('organizations').add(organizationData);
      const organizationId = organizationRef.id;

      // Create user account
      const newUserData = {
        email: userData.email,
        name: userData.name,
        role: 'admin' as const,
        organization_id: organizationId,
        email_verified: userData.verified_email || true, // Google emails are typically verified
        avatar_url: userData.picture || null,
        google_id: userData.id,
        auth_provider: 'google',
        is_active: true,
        created_at: getServerTimestamp(),
        updated_at: getServerTimestamp(),
        last_login: getServerTimestamp()
      };

      const userRef = await firestore.collection('users').add(newUserData);
      user = { id: userRef.id, ...newUserData };

      console.log('✅ New user created via Google OAuth:', user.email);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Redirect to frontend with success
    const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id,
      email_verified: user.email_verified,
      avatar_url: user.avatar_url
    }));
    redirectUrl.searchParams.set('isNewUser', isNewUser.toString());

    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('❌ Error in Google OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
  }
});

export default router;
