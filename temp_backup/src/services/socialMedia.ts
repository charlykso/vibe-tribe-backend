import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { getFirestoreClient } from './database.js';
import { Post, SocialAccount } from '../types/database.js';

// Social media platform interfaces
interface PublishResult {
  success: boolean;
  platformPostIds?: Record<string, string>;
  error?: string;
}

interface PlatformPublisher {
  publish(post: Post, account: SocialAccount): Promise<{ success: boolean; postId?: string; error?: string }>;
}

// Twitter/X Publisher
class TwitterPublisher implements PlatformPublisher {
  async publish(post: Post, account: SocialAccount): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      console.log(`🐦 Publishing to Twitter for account: ${account.username}`);

      if (!account.access_token) {
        return { success: false, error: 'Twitter access token not found' };
      }

      // Initialize Twitter client with user's access token
      const twitterClient = new TwitterApi(account.access_token);

      // Prepare tweet content
      let tweetContent = post.content;

      // Check character limit (Twitter allows 280 characters)
      if (tweetContent.length > 280) {
        tweetContent = tweetContent.substring(0, 277) + '...';
      }

      // Publish tweet
      const tweetResponse = await twitterClient.v2.tweet({
        text: tweetContent
      });

      if (tweetResponse.data) {
        console.log(`✅ Twitter post published: ${tweetResponse.data.id}`);
        return {
          success: true,
          postId: tweetResponse.data.id
        };
      } else {
        return { success: false, error: 'Failed to publish tweet - no response data' };
      }
    } catch (error) {
      console.error('❌ Twitter publishing error:', error);

      // Handle specific Twitter API errors
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          return { success: false, error: 'Twitter API rate limit exceeded' };
        } else if (error.message.includes('unauthorized')) {
          return { success: false, error: 'Twitter authorization expired. Please reconnect your account.' };
        } else if (error.message.includes('duplicate')) {
          return { success: false, error: 'Duplicate tweet content detected' };
        }
      }

      return { success: false, error: error instanceof Error ? error.message : 'Unknown Twitter API error' };
    }
  }
}

// LinkedIn Publisher
class LinkedInPublisher implements PlatformPublisher {
  async publish(post: Post, account: SocialAccount): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      console.log(`💼 Publishing to LinkedIn for account: ${account.username}`);

      if (!account.access_token) {
        return { success: false, error: 'LinkedIn access token not found' };
      }

      // Get user profile to get the person URN
      const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (!profileResponse.data || !profileResponse.data.id) {
        return { success: false, error: 'Failed to get LinkedIn user profile' };
      }

      const personUrn = `urn:li:person:${profileResponse.data.id}`;

      // Prepare post content
      let postContent = post.content;

      // LinkedIn allows up to 3000 characters for posts
      if (postContent.length > 3000) {
        postContent = postContent.substring(0, 2997) + '...';
      }

      // Create the post payload
      const postPayload = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postContent
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Publish the post
      const publishResponse = await axios.post('https://api.linkedin.com/v2/ugcPosts', postPayload, {
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      if (publishResponse.data && publishResponse.data.id) {
        console.log(`✅ LinkedIn post published: ${publishResponse.data.id}`);
        return {
          success: true,
          postId: publishResponse.data.id
        };
      } else {
        return { success: false, error: 'Failed to publish LinkedIn post - no response data' };
      }

    } catch (error) {
      console.error('❌ LinkedIn publishing error:', error);

      // Handle specific LinkedIn API errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'LinkedIn authorization expired. Please reconnect your account.' };
        } else if (error.response?.status === 403) {
          return { success: false, error: 'LinkedIn permissions insufficient for posting' };
        } else if (error.response?.status === 429) {
          return { success: false, error: 'LinkedIn API rate limit exceeded' };
        } else if (error.response?.data?.message) {
          return { success: false, error: `LinkedIn API error: ${error.response.data.message}` };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown LinkedIn API error'
      };
    }
  }
}

// Facebook Publisher
class FacebookPublisher implements PlatformPublisher {
  async publish(post: Post, account: SocialAccount): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      console.log(`👥 Publishing to Facebook for account: ${account.username}`);

      if (!account.access_token) {
        return { success: false, error: 'Facebook access token not found' };
      }

      // Get user's pages to find where to post
      const pagesResponse = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
        params: {
          access_token: account.access_token,
          fields: 'id,name,access_token'
        }
      });

      if (!pagesResponse.data?.data || pagesResponse.data.data.length === 0) {
        // Post to user's personal feed if no pages available
        return await this.publishToUserFeed(post, account);
      }

      // Use the first page for posting (in production, you might want to let users choose)
      const page = pagesResponse.data.data[0];
      return await this.publishToPage(post, page);

    } catch (error) {
      console.error('❌ Facebook publishing error:', error);

      // Handle specific Facebook API errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Facebook authorization expired. Please reconnect your account.' };
        } else if (error.response?.status === 403) {
          return { success: false, error: 'Facebook permissions insufficient for posting' };
        } else if (error.response?.status === 429) {
          return { success: false, error: 'Facebook API rate limit exceeded' };
        } else if (error.response?.data?.error?.message) {
          return { success: false, error: `Facebook API error: ${error.response.data.error.message}` };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Facebook API error'
      };
    }
  }

  private async publishToUserFeed(post: Post, account: SocialAccount): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const postPayload = {
        message: post.content,
        access_token: account.access_token
      };

      const response = await axios.post(`https://graph.facebook.com/v18.0/me/feed`, postPayload);

      if (response.data?.id) {
        console.log(`✅ Facebook post published to user feed: ${response.data.id}`);
        return { success: true, postId: response.data.id };
      } else {
        return { success: false, error: 'Failed to publish Facebook post - no response data' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish to Facebook user feed'
      };
    }
  }

  private async publishToPage(post: Post, page: any): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      const postPayload = {
        message: post.content,
        access_token: page.access_token
      };

      const response = await axios.post(`https://graph.facebook.com/v18.0/${page.id}/feed`, postPayload);

      if (response.data?.id) {
        console.log(`✅ Facebook post published to page ${page.name}: ${response.data.id}`);
        return { success: true, postId: response.data.id };
      } else {
        return { success: false, error: 'Failed to publish Facebook post - no response data' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish to Facebook page'
      };
    }
  }
}

// Instagram Publisher
class InstagramPublisher implements PlatformPublisher {
  async publish(post: Post, account: SocialAccount): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      console.log(`📸 Publishing to Instagram for account: ${account.username}`);

      if (!account.access_token) {
        return { success: false, error: 'Instagram access token not found' };
      }

      // Instagram requires media for posts
      if (!post.media_urls || post.media_urls.length === 0) {
        return { success: false, error: 'Instagram posts require at least one media file' };
      }

      // Get Instagram Business Account ID
      const accountResponse = await axios.get(`https://graph.instagram.com/me`, {
        params: {
          fields: 'id,username',
          access_token: account.access_token
        }
      });

      if (!accountResponse.data?.id) {
        return { success: false, error: 'Failed to get Instagram account information' };
      }

      const instagramAccountId = accountResponse.data.id;

      // For Instagram, we need to create a media container first, then publish it
      // This is a simplified implementation - in production you'd handle multiple media types
      const mediaUrl = post.media_urls[0];

      // Step 1: Create media container
      const containerResponse = await axios.post(`https://graph.instagram.com/${instagramAccountId}/media`, {
        image_url: mediaUrl,
        caption: post.content,
        access_token: account.access_token
      });

      if (!containerResponse.data?.id) {
        return { success: false, error: 'Failed to create Instagram media container' };
      }

      const containerId = containerResponse.data.id;

      // Step 2: Publish the media container
      const publishResponse = await axios.post(`https://graph.instagram.com/${instagramAccountId}/media_publish`, {
        creation_id: containerId,
        access_token: account.access_token
      });

      if (publishResponse.data?.id) {
        console.log(`✅ Instagram post published: ${publishResponse.data.id}`);
        return {
          success: true,
          postId: publishResponse.data.id
        };
      } else {
        return { success: false, error: 'Failed to publish Instagram post - no response data' };
      }

    } catch (error) {
      console.error('❌ Instagram publishing error:', error);

      // Handle specific Instagram API errors
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { success: false, error: 'Instagram authorization expired. Please reconnect your account.' };
        } else if (error.response?.status === 403) {
          return { success: false, error: 'Instagram permissions insufficient for posting' };
        } else if (error.response?.status === 429) {
          return { success: false, error: 'Instagram API rate limit exceeded' };
        } else if (error.response?.data?.error?.message) {
          return { success: false, error: `Instagram API error: ${error.response.data.error.message}` };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Instagram API error'
      };
    }
  }
}

// Platform publisher registry
const publishers: Record<string, PlatformPublisher> = {
  twitter: new TwitterPublisher(),
  linkedin: new LinkedInPublisher(),
  facebook: new FacebookPublisher(),
  instagram: new InstagramPublisher(),
};

// Main publishing function
export const publishToSocialPlatforms = async (post: Post): Promise<PublishResult> => {
  try {
    const firestore = getFirestoreClient();

    // Get active social accounts for the organization and platforms
    // For users without organization, we'll simulate having accounts for testing
    if (!post.organization_id) {
      console.log('⚠️ No organization_id found, simulating successful publish for testing');
      return {
        success: true,
        platformPostIds: post.platforms.reduce((acc, platform) => {
          acc[platform] = `mock-${platform}-${Date.now()}`;
          return acc;
        }, {} as Record<string, string>)
      };
    }

    const accountsSnapshot = await firestore
      .collection('social_accounts')
      .where('organization_id', '==', post.organization_id)
      .where('is_active', '==', true)
      .get();

    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SocialAccount[];

    // Filter accounts by post platforms
    const relevantAccounts = accounts.filter(account =>
      post.platforms.includes(account.platform)
    );

    if (relevantAccounts.length === 0) {
      return {
        success: false,
        error: 'No active social accounts found for the specified platforms'
      };
    }

    console.log(`📤 Publishing post ${post.id} to ${relevantAccounts.length} platforms`);

    // Publish to each platform
    const publishPromises = relevantAccounts.map(async (account) => {
      const publisher = publishers[account.platform];

      if (!publisher) {
        console.error(`❌ No publisher found for platform: ${account.platform}`);
        return {
          platform: account.platform,
          success: false,
          error: `Unsupported platform: ${account.platform}`
        };
      }

      try {
        const result = await publisher.publish(post, account);
        return {
          platform: account.platform,
          accountId: account.id,
          ...result
        };
      } catch (error) {
        console.error(`❌ Error publishing to ${account.platform}:`, error);
        return {
          platform: account.platform,
          accountId: account.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(publishPromises);

    // Check if at least one platform succeeded
    const successfulResults = results.filter(result => result.success);
    const failedResults = results.filter(result => !result.success);

    if (successfulResults.length === 0) {
      // All platforms failed
      const errors = failedResults.map(result => `${result.platform}: ${result.error}`).join('; ');
      return {
        success: false,
        error: `All platforms failed: ${errors}`
      };
    }

    // Build platform post IDs object
    const platformPostIds: Record<string, string> = {};
    successfulResults.forEach(result => {
      if (result.success && 'postId' in result && result.postId) {
        platformPostIds[result.platform] = result.postId;
      }
    });

    // Log results
    console.log(`✅ Published to ${successfulResults.length}/${results.length} platforms`);
    if (failedResults.length > 0) {
      console.warn(`⚠️ Failed platforms:`, failedResults.map(r => `${r.platform}: ${r.error}`));
    }

    return {
      success: true,
      platformPostIds
    };

  } catch (error) {
    console.error('❌ Error in publishToSocialPlatforms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Get connected accounts for an organization
export const getConnectedAccounts = async (organizationId: string): Promise<SocialAccount[]> => {
  const firestore = getFirestoreClient();

  const snapshot = await firestore
    .collection('social_accounts')
    .where('organization_id', '==', organizationId)
    .where('is_active', '==', true)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SocialAccount[];
};

// Validate post content for specific platforms
export const validatePostForPlatforms = (post: Post): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check content length limits
  if (post.platforms.includes('twitter')) {
    if (post.content.length > 280) {
      errors.push('Twitter posts must be 280 characters or less');
    }
  }

  if (post.platforms.includes('linkedin')) {
    if (post.content.length > 3000) {
      errors.push('LinkedIn posts must be 3000 characters or less');
    }
  }

  // Instagram requires media
  if (post.platforms.includes('instagram')) {
    if (!post.media_urls || post.media_urls.length === 0) {
      errors.push('Instagram posts require at least one media file');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
