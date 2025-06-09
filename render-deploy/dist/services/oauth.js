import { TwitterApi } from 'twitter-api-v2';
import { getFirestoreClient, getServerTimestamp } from './database.js';
import { SocialAccount } from '../types/database.js';

// OAuth Configuration
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface OAuthResult {
  success: boolean;
  account?: Partial<SocialAccount>;
  error?: string;
}

// Load OAuth credentials from Base64 or individual environment variables
function loadOAuthCredentials() {
  // Try Base64 encoded credentials first
  const oauthBase64 = process.env.OAUTH_CREDENTIALS_BASE64;
  if (oauthBase64) {
    try {
      const credentialsJson = Buffer.from(oauthBase64, 'base64').toString('utf8');
      const credentials = JSON.parse(credentialsJson);
      console.log('✅ Using Base64 encoded OAuth credentials');
      return credentials;
    } catch (error) {
      console.warn('Failed to parse Base64 OAuth credentials, falling back to individual variables');
    }
  }

  // Fallback to individual environment variables
  return {
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
}

// Load credentials once at module level
const oauthCredentials = loadOAuthCredentials();

// Twitter OAuth Service
export class TwitterOAuthService {
  private config: OAuthConfig;
  private client: TwitterApi;

  constructor() {
    this.config = {
      clientId: oauthCredentials.TWITTER_CLIENT_ID || '',
      clientSecret: oauthCredentials.TWITTER_CLIENT_SECRET || '',
      redirectUri: oauthCredentials.TWITTER_REDIRECT_URI || ''
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      console.warn('⚠️ Twitter OAuth credentials not configured');
    }

    this.client = new TwitterApi({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
    });
  }

  // Generate OAuth URL for Twitter
  async generateAuthUrl(state: string): Promise<{ url: string; codeVerifier: string }> {
    try {
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

      const { url, codeVerifier, state: returnedState } = this.client.generateOAuth2AuthLink(
        this.config.redirectUri,
        {
          scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
          state
        }
      );

      return { url, codeVerifier };
    } catch (error) {
      console.error('❌ Error generating Twitter auth URL:', error);
      throw new Error('Failed to generate Twitter authorization URL');
    }
  }

  // Handle OAuth callback and get user info
  async handleCallback(code: string, codeVerifier: string): Promise<OAuthResult> {
    try {
      // Handle demo OAuth codes
      if (code.startsWith('demo_code_twitter_')) {
        const account: Partial<SocialAccount> = {
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

      // Exchange code for tokens
      const { client: loggedClient, accessToken, refreshToken } = await this.client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: this.config.redirectUri,
      });

      // Get user information
      const { data: userObject } = await loggedClient.v2.me({
        'user.fields': ['id', 'name', 'username', 'profile_image_url', 'public_metrics']
      });

      if (!userObject) {
        return { success: false, error: 'Failed to get user information from Twitter' };
      }

      const account: Partial<SocialAccount> = {
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
    } catch (error) {
      console.error('❌ Error handling Twitter OAuth callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twitter OAuth failed'
      };
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
    try {
      const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } =
        await this.client.refreshOAuth2Token(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken || refreshToken
      };
    } catch (error) {
      console.error('❌ Error refreshing Twitter token:', error);
      return null;
    }
  }
}

// LinkedIn OAuth Service
export class LinkedInOAuthService {
  private config: OAuthConfig;

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
  generateAuthUrl(state: string): string {
    // If using demo credentials, redirect to demo OAuth page
    if (this.config.clientId === 'demo_linkedin_client_id') {
      const params = new URLSearchParams({
        platform: 'linkedin',
        state,
        redirect_uri: this.config.redirectUri
      });
      return `http://localhost:8081/oauth/demo?${params.toString()}`;
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      scope: 'r_liteprofile'
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(code: string): Promise<OAuthResult> {
    try {
      // Handle demo OAuth codes
      if (code.startsWith('demo_code_linkedin_')) {
        const account: Partial<SocialAccount> = {
          platform: 'linkedin',
          platform_user_id: 'demo_linkedin_user_101',
          username: 'demo-user',
          display_name: 'Demo User',
          avatar_url: '/api/placeholder/40/40',
          access_token: `demo_linkedin_token_${Date.now()}`,
          permissions: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
          metadata: {
            id: 'demo_linkedin_user_101',
            localizedFirstName: 'Demo',
            localizedLastName: 'User',
            followers_count: 850
          }
        };
        return { success: true, account };
      }

      // Exchange code for access token
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

      const tokenData = await tokenResponse.json();
      const accessToken = (tokenData as any).access_token;

      // Get user profile
      const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile from LinkedIn');
      }

      const profileData = await profileResponse.json();

      const account: Partial<SocialAccount> = {
        platform: 'linkedin',
        platform_user_id: (profileData as any).id,
        username: `${(profileData as any).localizedFirstName} ${(profileData as any).localizedLastName}`,
        display_name: `${(profileData as any).localizedFirstName} ${(profileData as any).localizedLastName}`,
        access_token: accessToken,
        permissions: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
        metadata: profileData
      };

      return { success: true, account };
    } catch (error) {
      console.error('❌ Error handling LinkedIn OAuth callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LinkedIn OAuth failed'
      };
    }
  }
}

// Facebook OAuth Service
export class FacebookOAuthService {
  private config: OAuthConfig;

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
  generateAuthUrl(state: string): string {
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
  async handleCallback(code: string): Promise<OAuthResult> {
    try {
      // Handle demo OAuth codes
      if (code.startsWith('demo_code_facebook_')) {
        const account: Partial<SocialAccount> = {
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
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${this.config.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
        `client_secret=${this.config.clientSecret}&` +
        `code=${code}`
      );

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = (tokenData as any).access_token;

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`
      );

      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile from Facebook');
      }

      const profileData = await profileResponse.json();

      const account: Partial<SocialAccount> = {
        platform: 'facebook',
        platform_user_id: (profileData as any).id,
        username: (profileData as any).name,
        display_name: (profileData as any).name,
        avatar_url: (profileData as any).picture?.data?.url,
        access_token: accessToken,
        permissions: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
        metadata: profileData
      };

      return { success: true, account };
    } catch (error) {
      console.error('❌ Error handling Facebook OAuth callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Facebook OAuth failed'
      };
    }
  }
}

// Instagram OAuth Service
export class InstagramOAuthService {
  private config: OAuthConfig;

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
  generateAuthUrl(state: string): string {
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
  async handleCallback(code: string): Promise<OAuthResult> {
    try {
      // Handle demo OAuth codes
      if (code.startsWith('demo_code_instagram_')) {
        const account: Partial<SocialAccount> = {
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
      const accessToken = (tokenData as any).access_token;
      const userId = (tokenData as any).user_id;

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
      );

      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile from Instagram');
      }

      const profileData = await profileResponse.json();

      const account: Partial<SocialAccount> = {
        platform: 'instagram',
        platform_user_id: userId.toString(),
        username: (profileData as any).username,
        display_name: (profileData as any).username,
        access_token: accessToken,
        permissions: ['user_profile', 'user_media'],
        metadata: profileData
      };

      return { success: true, account };
    } catch (error) {
      console.error('❌ Error handling Instagram OAuth callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Instagram OAuth failed'
      };
    }
  }
}

// OAuth Service Factory
export class OAuthServiceFactory {
  static getService(platform: string) {
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
}
