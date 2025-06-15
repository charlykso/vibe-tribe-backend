import { apiClient } from '../api';

export interface SocialAccount {
  id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  username: string;
  display_name: string;
  avatar_url?: string;
  permissions: string[];
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  features: string[];
}

export interface OAuthInitiateResponse {
  authUrl: string;
  state: string;
  platform: string;
  message: string;
}

export interface OAuthCallbackData {
  platform: string;
  code: string;
  state: string;
  codeVerifier?: string;
}

export interface ConnectAccountResponse {
  message: string;
  account: {
    id: string;
    platform: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_active: boolean;
  };
}

export interface PlatformStatus {
  platform: string;
  connected: boolean;
  accounts: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    permissions: string[];
    last_sync_at?: string;
    created_at: string;
  }>;
}

export class SocialAccountsService {
  // Get all connected social accounts
  static async getConnectedAccounts(): Promise<SocialAccount[]> {
    try {
      const response = await apiClient.get('/social-accounts');
      return response.data.accounts || [];
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      throw error;
    }
  }

  // Get supported platforms
  static async getSupportedPlatforms(): Promise<Platform[]> {
    try {
      const response = await apiClient.get('/social-accounts/platforms/supported');
      return response.data.platforms || [];
    } catch (error) {
      console.error('Error fetching supported platforms:', error);
      throw error;
    }
  }

  // Initiate OAuth flow for a platform
  static async initiateOAuth(platform: string, returnUrl?: string): Promise<OAuthInitiateResponse> {
    try {
      const response = await apiClient.post('/oauth/initiate', {
        platform,
        returnUrl
      });
      return response.data;
    } catch (error) {
      console.error(`Error initiating ${platform} OAuth:`, error);
      throw error;
    }
  }

  // Handle OAuth callback
  static async handleOAuthCallback(callbackData: OAuthCallbackData): Promise<ConnectAccountResponse> {
    try {
      const response = await apiClient.post('/oauth/callback', callbackData);
      return response.data;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  // Get OAuth status for a platform
  static async getOAuthStatus(platform: string): Promise<PlatformStatus> {
    try {
      const response = await apiClient.get(`/oauth/status/${platform}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting ${platform} OAuth status:`, error);
      throw error;
    }
  }

  // Disconnect a social account
  static async disconnectAccount(accountId: string): Promise<{ message: string; accountId: string }> {
    try {
      const response = await apiClient.delete(`/oauth/disconnect/${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  }

  // Connect account with manual credentials (fallback)
  static async connectAccountManually(accountData: {
    platform: string;
    access_token: string;
    refresh_token?: string;
    platform_user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    permissions: string[];
  }): Promise<ConnectAccountResponse> {
    try {
      const response = await apiClient.post('/social-accounts', accountData);
      return response.data;
    } catch (error) {
      console.error('Error connecting account manually:', error);
      throw error;
    }
  }

  // Update account settings
  static async updateAccount(accountId: string, updates: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    permissions?: string[];
    is_active?: boolean;
  }): Promise<SocialAccount> {
    try {
      const response = await apiClient.put(`/social-accounts/${accountId}`, updates);
      return response.data.account;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  // Refresh account tokens
  static async refreshAccountTokens(accountId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`/social-accounts/${accountId}/refresh`);
      return response.data;
    } catch (error) {
      console.error('Error refreshing account tokens:', error);
      throw error;
    }
  }

  // Test account connection
  static async testConnection(accountId: string): Promise<{ 
    success: boolean; 
    message: string; 
    details?: any 
  }> {
    try {
      const response = await apiClient.post(`/social-accounts/${accountId}/test`);
      return response.data;
    } catch (error) {
      console.error('Error testing connection:', error);
      throw error;
    }
  }

  // Helper method to open OAuth popup
  static openOAuthPopup(authUrl: string, platform: string): Promise<{ code: string; state: string }> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl,
        `${platform}_oauth`,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Failed to open OAuth popup. Please allow popups for this site.'));
        return;
      }

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'OAUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve({
            code: event.data.code,
            state: event.data.state
          });
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error || 'OAuth authentication failed'));
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('OAuth authentication was cancelled'));
        }
      }, 1000);
    });
  }

  // Helper method to handle OAuth flow
  static async connectPlatform(platform: string): Promise<ConnectAccountResponse> {
    try {
      // Step 1: Initiate OAuth
      const oauthData = await this.initiateOAuth(platform);
      
      // Step 2: Open OAuth popup
      const { code, state } = await this.openOAuthPopup(oauthData.authUrl, platform);
      
      // Step 3: Handle callback
      const result = await this.handleOAuthCallback({
        platform,
        code,
        state
      });
      
      return result;
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error);
      throw error;
    }
  }

  // Get platform display info
  static getPlatformInfo(platform: string): { name: string; icon: string; color: string } {
    const platformMap: Record<string, { name: string; icon: string; color: string }> = {
      twitter: { name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
      linkedin: { name: 'LinkedIn', icon: '💼', color: '#0077B5' },
      facebook: { name: 'Facebook', icon: '👥', color: '#1877F2' },
      instagram: { name: 'Instagram', icon: '📸', color: '#E4405F' }
    };

    return platformMap[platform] || { name: platform, icon: '🔗', color: '#6B7280' };
  }
}
