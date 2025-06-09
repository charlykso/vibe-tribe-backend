import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { getFirestoreClient } from './database.js';
export class AnalyticsSyncService {
    firestore = getFirestoreClient();
    /**
     * Sync analytics for all accounts in an organization
     */
    async syncOrganizationAnalytics(organizationId) {
        console.log(`📊 Starting analytics sync for organization: ${organizationId}`);
        try {
            // Get all active social accounts for the organization
            const accountsSnapshot = await this.firestore
                .collection('social_accounts')
                .where('organization_id', '==', organizationId)
                .where('is_active', '==', true)
                .get();
            const accounts = accountsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sync analytics for each account
            for (const account of accounts) {
                await this.syncAccountAnalytics(account);
            }
            console.log(`✅ Analytics sync completed for organization: ${organizationId}`);
        }
        catch (error) {
            console.error(`❌ Failed to sync analytics for organization ${organizationId}:`, error);
            throw error;
        }
    }
    /**
     * Sync analytics for a specific social account
     */
    async syncAccountAnalytics(account) {
        console.log(`📊 Syncing analytics for ${account.platform} account: ${account.username}`);
        try {
            switch (account.platform) {
                case 'twitter':
                    await this.syncTwitterAnalytics(account);
                    break;
                case 'linkedin':
                    await this.syncLinkedInAnalytics(account);
                    break;
                case 'facebook':
                    await this.syncFacebookAnalytics(account);
                    break;
                case 'instagram':
                    await this.syncInstagramAnalytics(account);
                    break;
                default:
                    console.warn(`⚠️ Analytics sync not implemented for platform: ${account.platform}`);
            }
            // Update last sync timestamp
            await this.firestore
                .collection('social_accounts')
                .doc(account.id)
                .update({
                last_sync_at: new Date().toISOString()
            });
        }
        catch (error) {
            console.error(`❌ Failed to sync analytics for ${account.platform} account ${account.username}:`, error);
            throw error;
        }
    }
    /**
     * Sync Twitter analytics
     */
    async syncTwitterAnalytics(account) {
        if (!account.access_token) {
            throw new Error('Twitter access token not found');
        }
        try {
            const client = new TwitterApi(account.access_token);
            // Get user profile data
            const user = await client.v2.me({
                'user.fields': ['public_metrics', 'created_at']
            });
            if (user.data) {
                const metrics = user.data.public_metrics;
                // Store account-level analytics
                await this.storeAnalytics({
                    organization_id: account.organization_id,
                    social_account_id: account.id,
                    metric_type: 'followers',
                    metric_value: metrics?.followers_count || 0,
                    metadata: { platform: 'twitter' }
                });
                await this.storeAnalytics({
                    organization_id: account.organization_id,
                    social_account_id: account.id,
                    metric_type: 'following',
                    metric_value: metrics?.following_count || 0,
                    metadata: { platform: 'twitter' }
                });
                await this.storeAnalytics({
                    organization_id: account.organization_id,
                    social_account_id: account.id,
                    metric_type: 'posts_count',
                    metric_value: metrics?.tweet_count || 0,
                    metadata: { platform: 'twitter' }
                });
            }
            // Get recent tweets and their analytics
            const tweets = await client.v2.userTimeline(user.data.id, {
                max_results: 10,
                'tweet.fields': ['public_metrics', 'created_at']
            });
            if (tweets.data && Array.isArray(tweets.data)) {
                for (const tweet of tweets.data) {
                    if (tweet.public_metrics) {
                        const postAnalytics = {
                            likes: tweet.public_metrics.like_count,
                            comments: tweet.public_metrics.reply_count,
                            shares: tweet.public_metrics.retweet_count,
                            views: tweet.public_metrics.impression_count
                        };
                        await this.storePostAnalytics(account, tweet.id, postAnalytics);
                    }
                }
            }
        }
        catch (error) {
            console.error('Twitter analytics sync error:', error);
            throw error;
        }
    }
    /**
     * Sync LinkedIn analytics
     */
    async syncLinkedInAnalytics(account) {
        if (!account.access_token) {
            throw new Error('LinkedIn access token not found');
        }
        try {
            // Get profile information
            const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
                headers: {
                    'Authorization': `Bearer ${account.access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            // LinkedIn doesn't provide follower count in basic profile
            // Store basic metrics
            await this.storeAnalytics({
                organization_id: account.organization_id,
                social_account_id: account.id,
                metric_type: 'profile_views',
                metric_value: 0, // LinkedIn API doesn't provide this in basic access
                metadata: { platform: 'linkedin' }
            });
        }
        catch (error) {
            console.error('LinkedIn analytics sync error:', error);
            throw error;
        }
    }
    /**
     * Sync Facebook analytics
     */
    async syncFacebookAnalytics(account) {
        if (!account.access_token) {
            throw new Error('Facebook access token not found');
        }
        try {
            // Get user's pages
            const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
                params: {
                    access_token: account.access_token,
                    fields: 'id,name,fan_count,access_token'
                }
            });
            for (const page of pagesResponse.data.data || []) {
                // Store page followers
                await this.storeAnalytics({
                    organization_id: account.organization_id,
                    social_account_id: account.id,
                    metric_type: 'followers',
                    metric_value: page.fan_count || 0,
                    metadata: { platform: 'facebook', page_id: page.id }
                });
                // Get page insights (requires page access token)
                if (page.access_token) {
                    try {
                        const insightsResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}/insights`, {
                            params: {
                                access_token: page.access_token,
                                metric: 'page_impressions,page_reach',
                                period: 'day',
                                since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            }
                        });
                        for (const insight of insightsResponse.data.data || []) {
                            const latestValue = insight.values?.[insight.values.length - 1]?.value || 0;
                            await this.storeAnalytics({
                                organization_id: account.organization_id,
                                social_account_id: account.id,
                                metric_type: insight.name,
                                metric_value: latestValue,
                                metadata: { platform: 'facebook', page_id: page.id }
                            });
                        }
                    }
                    catch (insightError) {
                        console.warn('Failed to fetch Facebook page insights:', insightError);
                    }
                }
            }
        }
        catch (error) {
            console.error('Facebook analytics sync error:', error);
            throw error;
        }
    }
    /**
     * Sync Instagram analytics
     */
    async syncInstagramAnalytics(account) {
        if (!account.access_token) {
            throw new Error('Instagram access token not found');
        }
        try {
            // Get Instagram Business Account
            const accountResponse = await axios.get('https://graph.instagram.com/me', {
                params: {
                    fields: 'id,username,followers_count,follows_count,media_count',
                    access_token: account.access_token
                }
            });
            const accountData = accountResponse.data;
            // Store account metrics
            await this.storeAnalytics({
                organization_id: account.organization_id,
                social_account_id: account.id,
                metric_type: 'followers',
                metric_value: accountData.followers_count || 0,
                metadata: { platform: 'instagram' }
            });
            await this.storeAnalytics({
                organization_id: account.organization_id,
                social_account_id: account.id,
                metric_type: 'following',
                metric_value: accountData.follows_count || 0,
                metadata: { platform: 'instagram' }
            });
            await this.storeAnalytics({
                organization_id: account.organization_id,
                social_account_id: account.id,
                metric_type: 'posts_count',
                metric_value: accountData.media_count || 0,
                metadata: { platform: 'instagram' }
            });
        }
        catch (error) {
            console.error('Instagram analytics sync error:', error);
            throw error;
        }
    }
    /**
     * Store analytics data in Firestore
     */
    async storeAnalytics(analytics) {
        const analyticsData = {
            ...analytics,
            recorded_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        await this.firestore
            .collection('analytics')
            .add(analyticsData);
    }
    /**
     * Store post-specific analytics
     */
    async storePostAnalytics(account, platformPostId, analytics) {
        // Find the post in our database by platform post ID
        const postsSnapshot = await this.firestore
            .collection('posts')
            .where('organization_id', '==', account.organization_id)
            .where('platform_post_ids.' + account.platform, '==', platformPostId)
            .get();
        const postId = postsSnapshot.docs[0]?.id;
        // Store each metric
        for (const [metricType, value] of Object.entries(analytics)) {
            await this.storeAnalytics({
                organization_id: account.organization_id,
                social_account_id: account.id,
                post_id: postId,
                metric_type: metricType,
                metric_value: value,
                metadata: {
                    platform: account.platform,
                    platform_post_id: platformPostId
                }
            });
        }
    }
}
//# sourceMappingURL=analyticsSync.js.map