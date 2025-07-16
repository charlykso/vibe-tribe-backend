import { TwitterApi } from 'twitter-api-v2';
import { getFirestoreClient, getServerTimestamp } from './database.js';
import Redis from 'ioredis';
import fetch from 'node-fetch';
import { validateEnvironment, encryptTokenData, decryptTokenData, auditLog } from './oauthSecurity.js';
// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// Redis key prefixes
const REDIS_PREFIX = {
    OAUTH_STATE: 'oauth:state:',
    OAUTH_TOKENS: 'oauth:tokens:',
    RATE_LIMIT: 'rate:limit:'
};
// Load OAuth credentials from Base64 or individual environment variables
function loadOAuthCredentials() {
    // First, try individual environment variables
    const individualCredentials = {
        TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID || '',
        TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET || '',
        TWITTER_REDIRECT_URI: process.env.TWITTER_REDIRECT_URI || '',
        LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
        LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || '',
        LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || '',
        FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
        FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',
        FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI || '',
        INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID || '',
        INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET || '',
        INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI || ''
    };
    // Check if all required individual credentials are available
    const requiredKeys = [
        'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'TWITTER_REDIRECT_URI',
        'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URI',
        'FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_REDIRECT_URI',
        'INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET', 'INSTAGRAM_REDIRECT_URI'
    ];
    const missingKeys = requiredKeys.filter(key => !individualCredentials[key]);
    // If individual credentials are complete, use them
    if (missingKeys.length === 0) {
        console.log('✅ Using individual OAuth environment variables');
        return individualCredentials;
    }
    // If some individual credentials are missing, try Base64 encoded credentials
    console.log(`⚠️ Missing individual OAuth credentials: ${missingKeys.join(', ')}`);
    console.log('🔄 Attempting to load Base64 encoded OAuth credentials...');
    const oauthBase64 = process.env.OAUTH_CREDENTIALS_BASE64;
    if (oauthBase64) {
        try {
            console.log('🔐 Found Base64 OAuth credentials, decoding...');
            const credentialsJson = Buffer.from(oauthBase64, 'base64').toString('utf8');
            const base64Credentials = JSON.parse(credentialsJson);
            console.log('✅ Successfully decoded Base64 OAuth credentials:', {
                twitter: {
                    clientId: base64Credentials.TWITTER_CLIENT_ID ? `${base64Credentials.TWITTER_CLIENT_ID.substring(0, 10)}...` : 'missing',
                    clientSecret: base64Credentials.TWITTER_CLIENT_SECRET ? 'present' : 'missing',
                    redirectUri: base64Credentials.TWITTER_REDIRECT_URI || 'missing'
                }
            });
            // Merge Base64 credentials with any available individual credentials
            // Individual credentials take precedence over Base64 ones
            const mergedCredentials = { ...base64Credentials };
            Object.keys(individualCredentials).forEach(key => {
                if (individualCredentials[key]) {
                    mergedCredentials[key] = individualCredentials[key];
                }
            });
            return mergedCredentials;
        }
        catch (error) {
            console.error('❌ Failed to parse Base64 OAuth credentials:', error instanceof Error ? error.message : 'Unknown error');
            console.error('❌ Base64 content preview:', oauthBase64.substring(0, 50) + '...');
        }
    }
    else {
        console.log('❌ No OAUTH_CREDENTIALS_BASE64 environment variable found');
    }
    // If both methods fail, return individual credentials (even if incomplete)
    console.warn('⚠️ Using incomplete individual OAuth credentials as fallback');
    return individualCredentials;
}
// Load credentials once at module level
const oauthCredentials = loadOAuthCredentials();
// Validate environment configuration
validateEnvironment();
// Debug: Log loaded credentials (without secrets)
console.log('🔐 OAuth Credentials Status:', {
    twitter: {
        clientId: oauthCredentials.TWITTER_CLIENT_ID ? `${oauthCredentials.TWITTER_CLIENT_ID.substring(0, 10)}...` : 'missing',
        clientSecret: oauthCredentials.TWITTER_CLIENT_SECRET ? 'present' : 'missing',
        redirectUri: oauthCredentials.TWITTER_REDIRECT_URI || 'missing'
    },
    linkedin: {
        clientId: oauthCredentials.LINKEDIN_CLIENT_ID ? `${oauthCredentials.LINKEDIN_CLIENT_ID.substring(0, 10)}...` : 'missing',
        clientSecret: oauthCredentials.LINKEDIN_CLIENT_SECRET ? 'present' : 'missing',
        redirectUri: oauthCredentials.LINKEDIN_REDIRECT_URI || 'missing'
    },
    facebook: {
        appId: oauthCredentials.FACEBOOK_APP_ID ? `${oauthCredentials.FACEBOOK_APP_ID.substring(0, 10)}...` : 'missing',
        appSecret: oauthCredentials.FACEBOOK_APP_SECRET ? 'present' : 'missing',
        redirectUri: oauthCredentials.FACEBOOK_REDIRECT_URI || 'missing'
    },
    instagram: {
        clientId: oauthCredentials.INSTAGRAM_CLIENT_ID ? `${oauthCredentials.INSTAGRAM_CLIENT_ID.substring(0, 10)}...` : 'missing',
        clientSecret: oauthCredentials.INSTAGRAM_CLIENT_SECRET ? 'present' : 'missing',
        redirectUri: oauthCredentials.INSTAGRAM_REDIRECT_URI || 'missing'
    }
});
// Twitter OAuth Service
export class TwitterOAuthService {
    config;
    client;
    db = getFirestoreClient();
    constructor() {
        // Load raw credentials
        const rawClientId = oauthCredentials.TWITTER_CLIENT_ID || '';
        const rawClientSecret = oauthCredentials.TWITTER_CLIENT_SECRET || '';
        // Check if credentials are Base64 encoded and decode them
        let clientId = rawClientId;
        let clientSecret = rawClientSecret;
        // Detect and decode Base64 credentials
        if (this.isBase64(rawClientId)) {
            try {
                const decoded = Buffer.from(rawClientId, 'base64').toString('utf8');
                console.log('🔓 Decoded Base64 Twitter Client ID:', decoded);
                clientId = decoded;
            }
            catch (error) {
                console.error('❌ Failed to decode Base64 Client ID:', error);
            }
        }
        if (this.isBase64(rawClientSecret)) {
            try {
                const decoded = Buffer.from(rawClientSecret, 'base64').toString('utf8');
                console.log('🔓 Decoded Base64 Twitter Client Secret (first 20 chars):', decoded.substring(0, 20) + '...');
                clientSecret = decoded;
            }
            catch (error) {
                console.error('❌ Failed to decode Base64 Client Secret:', error);
            }
        }
        this.config = {
            clientId,
            clientSecret,
            redirectUri: oauthCredentials.TWITTER_REDIRECT_URI || ''
        };
        if (!this.config.clientId || !this.config.clientSecret) {
            console.warn('⚠️ Twitter OAuth credentials not configured');
        }
        // Initialize Twitter API client
        try {
            this.client = new TwitterApi({
                clientId: this.config.clientId,
                clientSecret: this.config.clientSecret,
            });
            console.log('✅ Twitter API client initialized with credentials:', {
                clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'missing',
                clientSecret: this.config.clientSecret ? 'present' : 'missing',
                redirectUri: this.config.redirectUri,
                wasBase64Decoded: {
                    clientId: this.isBase64(rawClientId),
                    clientSecret: this.isBase64(rawClientSecret)
                }
            });
        }
        catch (error) {
            console.error('❌ Failed to initialize Twitter API client:', error);
            throw error;
        }
    }
    isBase64(str) {
        try {
            // Check if string is valid Base64
            const base64Regex = /^[A-Za-z0-9+/=]+$/;
            if (!base64Regex.test(str))
                return false;
            // Try to decode and re-encode to verify
            const decoded = Buffer.from(str, 'base64').toString('utf8');
            const reEncoded = Buffer.from(decoded).toString('base64');
            return reEncoded === str;
        }
        catch (err) {
            return false;
        }
    }
    validateState(state, returnedState) {
        if (!state || !returnedState) {
            console.warn('❌ State validation failed: Missing state or returned state');
            return false;
        }
        const isValid = state === returnedState;
        if (!isValid) {
            console.warn('❌ State validation failed: State mismatch', {
                provided: state.substring(0, 10) + '...',
                returned: returnedState.substring(0, 10) + '...'
            });
        }
        return isValid;
    }
    async encryptTokens(tokens) {
        try {
            const secureTokenData = {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                metadata: {
                    platform: 'unknown', // This should be set by the calling service
                    userId: 'unknown',
                    scopes: [],
                    issuedAt: Date.now(),
                    expiresAt: tokens.expiresAt,
                    lastUsed: Date.now(),
                    usageCount: 0
                }
            };
            return encryptTokenData(secureTokenData);
        }
        catch (error) {
            console.error('❌ Failed to encrypt tokens:', error);
            await auditLog('error', '', '', {
                error: error instanceof Error ? error.message : 'Unknown error',
                action: 'token_encryption_failed'
            });
            throw new Error('Token encryption failed');
        }
    }
    async decryptTokens(encryptedData) {
        try {
            const secureTokenData = decryptTokenData(encryptedData);
            return {
                accessToken: secureTokenData.accessToken,
                refreshToken: secureTokenData.refreshToken || '',
                expiresAt: secureTokenData.metadata.expiresAt
            };
        }
        catch (error) {
            console.error('❌ Failed to decrypt tokens:', error);
            await auditLog('error', '', '', {
                error: error instanceof Error ? error.message : 'Unknown error',
                action: 'token_decryption_failed'
            });
            throw new Error('Token decryption failed');
        }
    }
    async storeOAuthState(state, data) {
        try {
            const key = `${REDIS_PREFIX.OAUTH_STATE}${state}`;
            const expiresIn = 10 * 60; // 10 minutes
            await redis.setex(key, expiresIn, JSON.stringify(data));
            console.log('✅ OAuth state stored in Redis:', {
                state: state.substring(0, 10) + '...',
                expiresIn
            });
        }
        catch (error) {
            console.error('❌ Failed to store OAuth state in Redis:', error);
            throw error;
        }
    }
    async getOAuthState(state) {
        try {
            const key = `${REDIS_PREFIX.OAUTH_STATE}${state}`;
            const data = await redis.get(key);
            if (!data) {
                console.log('❌ OAuth state not found in Redis:', state.substring(0, 10) + '...');
                return null;
            }
            console.log('✅ OAuth state retrieved from Redis:', state.substring(0, 10) + '...');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('❌ Failed to get OAuth state from Redis:', error);
            return null;
        }
    }
    async deleteOAuthState(state) {
        try {
            const key = `${REDIS_PREFIX.OAUTH_STATE}${state}`;
            await redis.del(key);
            console.log('✅ OAuth state deleted from Redis:', state.substring(0, 10) + '...');
        }
        catch (error) {
            console.error('❌ Failed to delete OAuth state from Redis:', error);
        }
    }
    async storeTokens(userId, tokens) {
        try {
            const key = `${REDIS_PREFIX.OAUTH_TOKENS}${userId}`;
            const encryptedTokens = await this.encryptTokens(tokens);
            // Store in Redis with expiration
            const expiresIn = Math.floor((tokens.expiresAt - Date.now()) / 1000);
            await redis.setex(key, expiresIn, encryptedTokens);
            // Also store in Firestore for persistence
            await this.db.collection('users').doc(userId).update({
                oauthTokens: encryptedTokens,
                updatedAt: getServerTimestamp()
            });
            console.log('✅ Tokens stored in Redis and Firestore for user:', userId.substring(0, 10) + '...');
        }
        catch (error) {
            console.error('❌ Failed to store tokens:', error);
            throw error;
        }
    }
    async getStoredTokens(userId) {
        try {
            const key = `${REDIS_PREFIX.OAUTH_TOKENS}${userId}`;
            // Try Redis first
            let encryptedTokens = await redis.get(key);
            // If not in Redis, try Firestore
            if (!encryptedTokens) {
                const doc = await this.db.collection('users').doc(userId).get();
                const data = doc.data();
                encryptedTokens = data?.oauthTokens;
                // If found in Firestore, store in Redis
                if (encryptedTokens) {
                    const tokens = await this.decryptTokens(encryptedTokens);
                    await this.storeTokens(userId, tokens);
                }
            }
            if (!encryptedTokens) {
                return null;
            }
            return await this.decryptTokens(encryptedTokens);
        }
        catch (error) {
            console.error('❌ Failed to retrieve tokens:', error);
            return null;
        }
    }
    // Generate OAuth URL for Twitter
    async generateAuthUrl(state) {
        try {
            console.log('🐦 Generating Twitter OAuth URL with config:', {
                clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'missing',
                redirectUri: this.config.redirectUri,
                state: state.substring(0, 20) + '...'
            });
            // If using demo credentials, redirect to demo OAuth page
            if (this.config.clientId === 'demo_twitter_client_id') {
                const params = new URLSearchParams({
                    platform: 'twitter',
                    state,
                    redirect_uri: this.config.redirectUri
                });
                return {
                    url: `http://localhost:8081/oauth/demo?${params.toString()}`,
                    codeVerifier: 'demo_code_verifier'
                };
            }
            // Validate credentials before generating URL
            if (!this.config.clientId || !this.config.clientSecret) {
                throw new Error('Twitter OAuth credentials not configured');
            }
            const { url, codeVerifier, state: returnedState } = this.client.generateOAuth2AuthLink(this.config.redirectUri, {
                scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
                state
            });
            // Validate state
            if (!this.validateState(state, returnedState)) {
                throw new Error('State validation failed');
            }
            console.log('✅ Twitter OAuth URL generated successfully:', {
                url: url.substring(0, 100) + '...',
                codeVerifier: codeVerifier ? 'generated' : 'missing',
                returnedState: returnedState === state ? 'matches' : 'mismatch'
            });
            return { url, codeVerifier };
        }
        catch (error) {
            console.error('❌ Error generating Twitter auth URL:', error);
            console.error('❌ Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw new Error(`Failed to generate Twitter authorization URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Handle OAuth callback and get user info
    async handleCallback(code, codeVerifier) {
        try {
            console.log('🐦 Twitter OAuth handleCallback called with:', {
                code: code ? `${code.substring(0, 10)}...` : 'missing',
                codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'missing',
                redirectUri: this.config.redirectUri,
                clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'missing',
                clientSecret: this.config.clientSecret ? 'present' : 'missing'
            });
            // Handle demo OAuth codes
            if (code.startsWith('demo_code_twitter_')) {
                const account = {
                    platform: 'twitter',
                    platform_user_id: 'demo_twitter_user_789',
                    username: '@demo_user',
                    display_name: 'Demo User',
                    avatar_url: '/api/placeholder/40/40',
                    access_token: `demo_twitter_token_${Date.now()}`,
                    refresh_token: `demo_twitter_refresh_${Date.now()}`,
                    permissions: ['tweet.read', 'tweet.write', 'users.read'],
                    metadata: {
                        followers_count: 1850,
                        following_count: 420,
                        tweet_count: 156
                    }
                };
                return { success: true, account };
            }
            // Validate required parameters
            if (!code) {
                return { success: false, error: 'Authorization code is required' };
            }
            if (!codeVerifier) {
                return { success: false, error: 'Code verifier is required for Twitter OAuth' };
            }
            if (!this.config.clientId || !this.config.clientSecret) {
                return { success: false, error: 'Twitter OAuth credentials not configured' };
            }
            console.log('🐦 Attempting Twitter token exchange with details:', {
                code: code ? `${code.substring(0, 20)}...` : 'missing',
                codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 20)}...` : 'missing',
                redirectUri: this.config.redirectUri,
                clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'missing',
                clientSecret: this.config.clientSecret ? 'present' : 'missing'
            });
            // Exchange code for tokens using manual implementation
            let loggedClient, accessToken, refreshToken;
            try {
                console.log('🐦 Attempting manual token exchange...');
                // Manual token exchange to bypass library issues
                const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
                const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
                const base64Credentials = Buffer.from(credentials).toString('base64');
                const tokenBody = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: this.config.redirectUri,
                    code_verifier: codeVerifier
                });
                console.log('🐦 Making manual token request:', {
                    url: tokenUrl,
                    authHeader: `Basic ${base64Credentials.substring(0, 20)}...`,
                    body: tokenBody.toString()
                });
                const tokenResponse = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${base64Credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: tokenBody.toString()
                });
                const tokenData = await tokenResponse.json();
                if (!tokenResponse.ok) {
                    console.error('🐦 Manual token exchange failed:', {
                        status: tokenResponse.status,
                        statusText: tokenResponse.statusText,
                        data: tokenData
                    });
                    return {
                        success: false,
                        error: `Request failed with code ${tokenResponse.status}`,
                        details: {
                            message: tokenData.error_description || tokenData.error,
                            status: tokenResponse.status,
                            data: tokenData
                        }
                    };
                }
                accessToken = tokenData.access_token;
                refreshToken = tokenData.refresh_token;
                console.log('🐦 Manual token exchange successful:', {
                    accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'missing',
                    refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'missing'
                });
                // Create authenticated client with the tokens
                loggedClient = new TwitterApi(accessToken);
            }
            catch (tokenError) {
                console.error('🐦 Manual token exchange failed:', {
                    error: tokenError.message,
                    stack: tokenError.stack
                });
                return {
                    success: false,
                    error: `Request failed with code ${tokenError.status || tokenError.code || 'unknown'}`,
                    details: {
                        message: tokenError.message,
                        status: tokenError.status,
                        code: tokenError.code
                    }
                };
            }
            console.log('🐦 Twitter token exchange successful:', {
                accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'missing',
                refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'missing'
            });
            console.log('🐦 Getting user info...');
            // Get user information
            const { data: userObject } = await loggedClient.v2.me({
                'user.fields': ['id', 'name', 'username', 'profile_image_url', 'public_metrics']
            });
            if (!userObject) {
                return { success: false, error: 'Failed to get user information from Twitter' };
            }
            console.log('🐦 Twitter user info retrieved:', {
                id: userObject.id,
                username: userObject.username,
                name: userObject.name
            });
            // Store tokens securely
            const tokens = {
                accessToken,
                refreshToken,
                expiresAt: Date.now() + (3600 * 1000) // 1 hour from now
            };
            await this.storeTokens(userObject.id, tokens);
            const account = {
                platform: 'twitter',
                platform_user_id: userObject.id,
                username: userObject.username,
                display_name: userObject.name,
                avatar_url: userObject.profile_image_url,
                access_token: accessToken,
                refresh_token: refreshToken,
                permissions: ['tweet.read', 'tweet.write', 'users.read'],
                metadata: {
                    followers_count: userObject.public_metrics?.followers_count || 0,
                    following_count: userObject.public_metrics?.following_count || 0,
                    tweet_count: userObject.public_metrics?.tweet_count || 0
                }
            };
            return { success: true, account };
        }
        catch (error) {
            console.error('❌ Error handling Twitter OAuth callback:', error);
            // Log detailed error information
            if (error instanceof Error) {
                console.error('❌ Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
                // Check for specific Twitter API errors
                if (error.message.includes('401')) {
                    console.error('❌ Twitter 401 Unauthorized - possible causes:');
                    console.error('  - Invalid client credentials');
                    console.error('  - Expired or invalid authorization code');
                    console.error('  - Incorrect redirect URI');
                    console.error('  - Code verifier mismatch');
                }
                // Log any additional error data
                if ('data' in error) {
                    console.error('❌ Twitter API error data:', error.data);
                }
                if ('response' in error) {
                    console.error('❌ Twitter API response:', error.response);
                }
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Twitter OAuth failed'
            };
        }
    }
    // Refresh access token
    async refreshAccessToken(refreshToken) {
        try {
            console.log('🔄 Attempting to refresh Twitter access token...');
            const { client, accessToken, refreshToken: newRefreshToken } = await this.client.refreshOAuth2Token(refreshToken);
            console.log('✅ Successfully refreshed Twitter access token');
            return {
                accessToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            console.error('❌ Failed to refresh token:', error);
            return null;
        }
    }
}
// LinkedIn OAuth Service
export class LinkedInOAuthService {
    config;
    constructor() {
        this.config = {
            clientId: oauthCredentials.LINKEDIN_CLIENT_ID || '',
            clientSecret: oauthCredentials.LINKEDIN_CLIENT_SECRET || '',
            redirectUri: oauthCredentials.LINKEDIN_REDIRECT_URI || ''
        };
        if (!this.config.clientId || !this.config.clientSecret) {
            console.warn('⚠️ LinkedIn OAuth credentials not configured');
        }
    }
    // Generate OAuth URL for LinkedIn
    generateAuthUrl(state) {
        console.log('🔗 Generating LinkedIn OAuth URL with real credentials...');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            state,
            scope: 'r_liteprofile r_emailaddress w_member_social'
        });
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
        console.log('🔗 LinkedIn OAuth URL generated:', authUrl);
        return authUrl;
    }
    // Handle OAuth callback
    async handleCallback(code) {
        try {
            console.log('🔗 LinkedIn OAuth handleCallback called with:', {
                code: code ? `${code.substring(0, 10)}...` : 'missing',
                redirectUri: this.config.redirectUri,
                clientId: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'missing',
                clientSecret: this.config.clientSecret ? 'present' : 'missing'
            });
            console.log('🔗 Processing real LinkedIn OAuth (no demo mode)...');
            // Exchange code for tokens using manual implementation
            let accessToken;
            try {
                console.log('🔗 Attempting manual LinkedIn token exchange...');
                // Manual token exchange for LinkedIn
                const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
                const tokenBody = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: this.config.redirectUri,
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                });
                console.log('🔗 Making manual LinkedIn token request:', {
                    url: tokenUrl,
                    body: tokenBody.toString()
                });
                const tokenResponse = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: tokenBody.toString()
                });
                const tokenData = await tokenResponse.json();
                if (!tokenResponse.ok) {
                    console.error('🔗 Manual LinkedIn token exchange failed:', {
                        status: tokenResponse.status,
                        statusText: tokenResponse.statusText,
                        data: tokenData
                    });
                    return {
                        success: false,
                        error: `Request failed with code ${tokenResponse.status}`,
                        details: {
                            message: tokenData.error_description || tokenData.error,
                            status: tokenResponse.status,
                            data: tokenData
                        }
                    };
                }
                accessToken = tokenData.access_token;
                console.log('🔗 Manual LinkedIn token exchange successful:', {
                    accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'missing'
                });
            }
            catch (tokenError) {
                console.error('🔗 Manual LinkedIn token exchange failed:', {
                    error: tokenError.message,
                    stack: tokenError.stack
                });
                return {
                    success: false,
                    error: `Request failed with code ${tokenError.status || tokenError.code || 'unknown'}`,
                    details: {
                        message: tokenError.message,
                        status: tokenError.status,
                        code: tokenError.code
                    }
                };
            }
            // Get user profile using LinkedIn v2 API
            console.log('🔗 Fetching LinkedIn user profile...');
            const profileResponse = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                console.error('🔗 Failed to get LinkedIn user profile:', {
                    status: profileResponse.status,
                    error: errorData
                });
                return {
                    success: false,
                    error: `Failed to get user profile: ${profileResponse.status}`,
                    details: errorData
                };
            }
            const profileData = await profileResponse.json();
            console.log('🔗 LinkedIn profile data received:', {
                id: profileData.id,
                firstName: profileData.localizedFirstName,
                lastName: profileData.localizedLastName
            });
            // Extract avatar URL if available
            let avatarUrl = '/api/placeholder/40/40';
            if (profileData.profilePicture && profileData.profilePicture.displayImage) {
                const images = profileData.profilePicture.displayImage.elements;
                if (images && images.length > 0) {
                    avatarUrl = images[0].identifiers[0].identifier;
                }
            }
            const account = {
                platform: 'linkedin',
                platform_user_id: profileData.id,
                username: `${profileData.localizedFirstName}-${profileData.localizedLastName}`.toLowerCase().replace(/\s+/g, '-'),
                display_name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
                avatar_url: avatarUrl,
                access_token: accessToken,
                permissions: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
                metadata: {
                    ...profileData,
                    followers_count: 0 // LinkedIn doesn't provide follower count in basic profile
                }
            };
            console.log('🔗 LinkedIn account created successfully:', {
                platform_user_id: account.platform_user_id,
                username: account.username,
                display_name: account.display_name
            });
            return { success: true, account };
        }
        catch (error) {
            console.error('❌ Error handling LinkedIn OAuth callback:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'LinkedIn OAuth failed'
            };
        }
    }
    // Exchange authorization code for access token
    async exchangeCodeForToken(code) {
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.config.redirectUri,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
            }),
        });
        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for access token');
        }
        return await tokenResponse.json();
    }
    // Get user profile from LinkedIn
    async getUserProfile(accessToken) {
        const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            },
        });
        if (!profileResponse.ok) {
            throw new Error('Failed to get user profile from LinkedIn');
        }
        return await profileResponse.json();
    }
    async refreshAccessToken(refreshToken) {
        try {
            const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                }),
            });
            if (!response.ok) {
                console.error('LinkedIn token refresh failed:', await response.text());
                return null;
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            };
        }
        catch (error) {
            console.error('LinkedIn token refresh error:', error);
            return null;
        }
    }
}
// Facebook OAuth Service
export class FacebookOAuthService {
    config;
    constructor() {
        this.config = {
            clientId: oauthCredentials.FACEBOOK_APP_ID || '',
            clientSecret: oauthCredentials.FACEBOOK_APP_SECRET || '',
            redirectUri: oauthCredentials.FACEBOOK_REDIRECT_URI || ''
        };
        if (!this.config.clientId || !this.config.clientSecret) {
            console.warn('⚠️ Facebook OAuth credentials not configured');
        }
    }
    // Generate OAuth URL for Facebook
    generateAuthUrl(state) {
        // If using demo credentials, redirect to demo OAuth page
        if (this.config.clientId === 'demo_facebook_app_id') {
            const params = new URLSearchParams({
                platform: 'facebook',
                state,
                redirect_uri: this.config.redirectUri
            });
            return `http://localhost:8081/oauth/demo?${params.toString()}`;
        }
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            state,
            scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,publish_to_groups',
            response_type: 'code'
        });
        return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    }
    // Handle OAuth callback
    async handleCallback(code) {
        try {
            // Handle demo OAuth codes
            if (code.startsWith('demo_code_facebook_')) {
                const account = {
                    platform: 'facebook',
                    platform_user_id: 'demo_facebook_user_123',
                    username: 'demo.user',
                    display_name: 'Demo User',
                    avatar_url: '/api/placeholder/40/40',
                    access_token: `demo_facebook_token_${Date.now()}`,
                    permissions: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
                    metadata: {
                        id: 'demo_facebook_user_123',
                        name: 'Demo User',
                        followers_count: 1250
                    }
                };
                return { success: true, account };
            }
            // Exchange code for access token
            const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
                `client_id=${this.config.clientId}&` +
                `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
                `client_secret=${this.config.clientSecret}&` +
                `code=${code}`);
            if (!tokenResponse.ok) {
                throw new Error('Failed to exchange code for access token');
            }
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            // Get user profile
            const profileResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`);
            if (!profileResponse.ok) {
                throw new Error('Failed to get user profile from Facebook');
            }
            const profileData = await profileResponse.json();
            const account = {
                platform: 'facebook',
                platform_user_id: profileData.id,
                username: profileData.name,
                display_name: profileData.name,
                avatar_url: profileData.picture?.data?.url,
                access_token: accessToken,
                permissions: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
                metadata: profileData
            };
            return { success: true, account };
        }
        catch (error) {
            console.error('❌ Error handling Facebook OAuth callback:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Facebook OAuth failed'
            };
        }
    }
    async refreshAccessToken(refreshToken) {
        try {
            const params = new URLSearchParams({
                grant_type: 'fb_exchange_token',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                fb_exchange_token: refreshToken,
            });
            const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                console.error('Facebook token refresh failed:', await response.text());
                return null;
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            };
        }
        catch (error) {
            console.error('Facebook token refresh error:', error);
            return null;
        }
    }
}
// Instagram OAuth Service
export class InstagramOAuthService {
    config;
    constructor() {
        this.config = {
            clientId: oauthCredentials.INSTAGRAM_CLIENT_ID || '',
            clientSecret: oauthCredentials.INSTAGRAM_CLIENT_SECRET || '',
            redirectUri: oauthCredentials.INSTAGRAM_REDIRECT_URI || ''
        };
        if (!this.config.clientId || !this.config.clientSecret) {
            console.warn('⚠️ Instagram OAuth credentials not configured');
        }
    }
    // Generate OAuth URL for Instagram
    generateAuthUrl(state) {
        // If using demo credentials, redirect to demo OAuth page
        if (this.config.clientId === 'demo_instagram_client_id') {
            const params = new URLSearchParams({
                platform: 'instagram',
                state,
                redirect_uri: this.config.redirectUri
            });
            return `http://localhost:8081/oauth/demo?${params.toString()}`;
        }
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: 'user_profile,user_media',
            response_type: 'code',
            state
        });
        return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    }
    // Handle OAuth callback
    async handleCallback(code) {
        try {
            // Handle demo OAuth codes
            if (code.startsWith('demo_code_instagram_')) {
                const account = {
                    platform: 'instagram',
                    platform_user_id: 'demo_instagram_user_456',
                    username: '@demo_user',
                    display_name: 'Demo User',
                    avatar_url: '/api/placeholder/40/40',
                    access_token: `demo_instagram_token_${Date.now()}`,
                    permissions: ['user_profile', 'user_media'],
                    metadata: {
                        id: 'demo_instagram_user_456',
                        username: '@demo_user',
                        followers_count: 2500
                    }
                };
                return { success: true, account };
            }
            // Exchange code for access token
            const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: this.config.redirectUri,
                    code
                }),
            });
            if (!tokenResponse.ok) {
                throw new Error('Failed to exchange code for access token');
            }
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            const userId = tokenData.user_id;
            // Get user profile
            const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
            if (!profileResponse.ok) {
                throw new Error('Failed to get user profile from Instagram');
            }
            const profileData = await profileResponse.json();
            const account = {
                platform: 'instagram',
                platform_user_id: userId.toString(),
                username: profileData.username,
                display_name: profileData.username,
                access_token: accessToken,
                permissions: ['user_profile', 'user_media'],
                metadata: profileData
            };
            return { success: true, account };
        }
        catch (error) {
            console.error('❌ Error handling Instagram OAuth callback:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Instagram OAuth failed'
            };
        }
    }
    async refreshAccessToken(refreshToken) {
        try {
            const params = new URLSearchParams({
                grant_type: 'ig_refresh_token',
                access_token: refreshToken,
            });
            const response = await fetch(`https://graph.instagram.com/refresh_access_token?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                console.error('Instagram token refresh failed:', await response.text());
                return null;
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            };
        }
        catch (error) {
            console.error('Instagram token refresh error:', error);
            return null;
        }
    }
}
// OAuth Service Factory
export class OAuthServiceFactory {
    static getService(platform) {
        switch (platform) {
            case 'twitter':
                return new TwitterOAuthService();
            case 'linkedin':
                return new LinkedInOAuthService();
            case 'facebook':
                return new FacebookOAuthService();
            case 'instagram':
                return new InstagramOAuthService();
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }
    static getLinkedInService() {
        return new LinkedInOAuthService();
    }
    static getTwitterService() {
        return new TwitterOAuthService();
    }
    static getFacebookService() {
        return new FacebookOAuthService();
    }
    static getInstagramService() {
        return new InstagramOAuthService();
    }
}
// Token Refresh Scheduler
export class TokenRefreshScheduler {
    static instance;
    refreshIntervals = new Map();
    db = getFirestoreClient();
    constructor() { }
    static getInstance() {
        if (!TokenRefreshScheduler.instance) {
            TokenRefreshScheduler.instance = new TokenRefreshScheduler();
        }
        return TokenRefreshScheduler.instance;
    }
    async scheduleTokenRefresh(accountId, platform, expiresAt) {
        // Clear any existing refresh interval
        this.clearRefreshInterval(accountId);
        // Calculate time until refresh (5 minutes before expiration)
        const refreshTime = expiresAt - 5 * 60 * 1000;
        const now = Date.now();
        const delay = Math.max(0, refreshTime - now);
        // Schedule the refresh
        const interval = setTimeout(async () => {
            try {
                await this.refreshToken(accountId, platform);
            }
            catch (error) {
                console.error(`Failed to refresh token for ${platform} account ${accountId}:`, error);
            }
        }, delay);
        this.refreshIntervals.set(accountId, interval);
    }
    clearRefreshInterval(accountId) {
        const interval = this.refreshIntervals.get(accountId);
        if (interval) {
            clearTimeout(interval);
            this.refreshIntervals.delete(accountId);
        }
    }
    async refreshToken(accountId, platform) {
        const accountRef = this.db.collection('social_accounts').doc(accountId);
        const account = await accountRef.get();
        if (!account.exists) {
            console.error(`Account ${accountId} not found`);
            return;
        }
        const accountData = account.data();
        if (!accountData?.refreshToken) {
            console.error(`No refresh token found for account ${accountId}`);
            return;
        }
        const oauthService = OAuthServiceFactory.getService(platform);
        const result = await oauthService.refreshAccessToken(accountData.refreshToken);
        if (!result) {
            console.error(`Failed to refresh token for ${platform} account ${accountId}`);
            return;
        }
        // Update account with new tokens
        await accountRef.update({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken || accountData.refreshToken,
            tokenUpdatedAt: getServerTimestamp(),
            expiresAt: Date.now() + (result.refreshToken ? 60 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000) // 60 days or 1 hour
        });
        // Schedule next refresh
        await this.scheduleTokenRefresh(accountId, platform, Date.now() + (result.refreshToken ? 60 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
    }
    stopAllRefreshes() {
        for (const [accountId] of this.refreshIntervals) {
            this.clearRefreshInterval(accountId);
        }
    }
}
//# sourceMappingURL=oauth.js.map