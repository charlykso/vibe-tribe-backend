import { Router } from 'express';
import { z } from 'zod';
import { getFirestoreClient } from '../services/database.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest, requireOrganization } from '../middleware/auth.js';
import { Post, SocialAccount, Analytics } from '../types/database.js';

const router = Router();

// Apply organization requirement to all routes
router.use(requireOrganization);

// Validation schemas
const analyticsQuerySchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram']).optional(),
  metric_type: z.string().optional()
});

// GET /api/v1/analytics/overview
router.get('/overview', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();

  // Get basic metrics for the organization
  const postsSnapshot = await firestore
    .collection('posts')
    .where('organization_id', '==', req.user!.organization_id!)
    .get();

  const socialAccountsSnapshot = await firestore
    .collection('social_accounts')
    .where('organization_id', '==', req.user!.organization_id!)
    .get();

  // Get analytics data from the analytics collection
  const analyticsSnapshot = await firestore
    .collection('analytics')
    .where('organization_id', '==', req.user!.organization_id!)
    .get();

  const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
  const socialAccounts = socialAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SocialAccount[];
  const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Analytics[];

  // Calculate basic post metrics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;

  // Calculate engagement metrics from analytics data
  const totalEngagement = analyticsData
    .filter(a => ['likes', 'comments', 'shares'].includes(a.metric_type))
    .reduce((sum, a) => sum + (a.metric_value || 0), 0);

  const totalReach = analyticsData
    .filter(a => a.metric_type === 'reach')
    .reduce((sum, a) => sum + (a.metric_value || 0), 0);

  const totalViews = analyticsData
    .filter(a => a.metric_type === 'views')
    .reduce((sum, a) => sum + (a.metric_value || 0), 0);

  // Calculate engagement rate
  const engagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100) : 0;

  // Find top performing platform
  const platformEngagement = socialAccounts.reduce((acc, account) => {
    if (account.is_active) {
      const accountEngagement = analyticsData
        .filter(a => a.social_account_id === account.id && ['likes', 'comments', 'shares'].includes(a.metric_type))
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);
      acc[account.platform] = (acc[account.platform] || 0) + accountEngagement;
    }
    return acc;
  }, {} as Record<string, number>);

  const topPlatform = Object.entries(platformEngagement).reduce((top, [platform, engagement]) =>
    engagement > (platformEngagement[top] || 0) ? platform : top, 'LinkedIn');

  // Calculate growth rate (simplified - comparing last 30 days to previous 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentEngagement = analyticsData
    .filter(a => {
      const recordedAt = a.recorded_at instanceof Date
        ? a.recorded_at
        : typeof a.recorded_at === 'string'
          ? new Date(a.recorded_at)
          : (a.recorded_at as any).toDate();
      return recordedAt >= thirtyDaysAgo && ['likes', 'comments', 'shares'].includes(a.metric_type);
    })
    .reduce((sum, a) => sum + (a.metric_value || 0), 0);

  const previousEngagement = analyticsData
    .filter(a => {
      const recordedAt = a.recorded_at instanceof Date
        ? a.recorded_at
        : typeof a.recorded_at === 'string'
          ? new Date(a.recorded_at)
          : (a.recorded_at as any).toDate();
      return recordedAt >= sixtyDaysAgo && recordedAt < thirtyDaysAgo && ['likes', 'comments', 'shares'].includes(a.metric_type);
    })
    .reduce((sum, a) => sum + (a.metric_value || 0), 0);

  const growthRate = previousEngagement > 0 ?
    (((recentEngagement - previousEngagement) / previousEngagement) * 100) : 0;

  // Return data in the format expected by the frontend
  res.json({
    total_posts: publishedPosts,
    total_engagement: totalEngagement,
    total_reach: totalReach || totalViews, // Use views as fallback for reach
    engagement_rate: parseFloat(engagementRate.toFixed(2)),
    top_platform: topPlatform,
    growth_rate: parseFloat(growthRate.toFixed(2))
  });
}));

// GET /api/v1/analytics/posts
router.get('/posts', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = analyticsQuerySchema.safeParse(req.query);

  if (!validation.success) {
    throw new ValidationError('Invalid query parameters', validation.error.errors);
  }

  const { start_date, end_date, platform } = validation.data;
  const firestore = getFirestoreClient();

  // Get published posts for the organization
  let query = firestore
    .collection('posts')
    .where('organization_id', '==', req.user!.organization_id!)
    .where('status', '==', 'published')
    .orderBy('published_at', 'desc');

  const snapshot = await query.get();
  let posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];

  // Apply date filters in memory
  if (start_date) {
    posts = posts.filter(post => {
      if (!post.published_at) return false;
      const publishedDate = post.published_at instanceof Date
        ? post.published_at
        : typeof post.published_at === 'string'
          ? new Date(post.published_at)
          : (post.published_at as any).toDate();
      return publishedDate >= new Date(start_date);
    });
  }
  if (end_date) {
    posts = posts.filter(post => {
      if (!post.published_at) return false;
      const publishedDate = post.published_at instanceof Date
        ? post.published_at
        : typeof post.published_at === 'string'
          ? new Date(post.published_at)
          : (post.published_at as any).toDate();
      return publishedDate <= new Date(end_date);
    });
  }

  // Apply platform filter in memory
  if (platform) {
    posts = posts.filter(post => post.platforms?.includes(platform));
  }

  // Get analytics data for the organization
  const analyticsSnapshot = await firestore
    .collection('analytics')
    .where('organization_id', '==', req.user!.organization_id!)
    .get();

  const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Analytics[];

  // Get user data for each post and add real metrics
  const postsWithMetrics = await Promise.all(
    posts.map(async (post) => {
      let userData = null;
      if (post.user_id) {
        const userDoc = await firestore.collection('users').doc(post.user_id).get();
        if (userDoc.exists) {
          userData = { name: userDoc.data()?.name };
        }
      }

      // Get real analytics for this post
      const postAnalytics = analyticsData.filter(a => a.post_id === post.id);

      const views = postAnalytics
        .filter(a => a.metric_type === 'views')
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);

      const likes = postAnalytics
        .filter(a => a.metric_type === 'likes')
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);

      const shares = postAnalytics
        .filter(a => a.metric_type === 'shares')
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);

      const comments = postAnalytics
        .filter(a => a.metric_type === 'comments')
        .reduce((sum, a) => sum + (a.metric_value || 0), 0);

      const totalEngagement = likes + shares + comments;
      const engagementRate = views > 0 ? ((totalEngagement / views) * 100) : 0;

      return {
        ...post,
        users: userData,
        metrics: {
          views: views || 0,
          likes: likes || 0,
          shares: shares || 0,
          comments: comments || 0,
          engagement_rate: parseFloat(engagementRate.toFixed(2))
        }
      };
    })
  );

  res.json({
    posts: postsWithMetrics,
    summary: {
      total_posts: postsWithMetrics.length,
      avg_engagement: postsWithMetrics.length > 0
        ? (postsWithMetrics.reduce((sum, post) => sum + post.metrics.engagement_rate, 0) / postsWithMetrics.length).toFixed(2)
        : '0.00'
    }
  });
}));

// GET /api/v1/analytics/platforms
router.get('/platforms', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = analyticsQuerySchema.safeParse(req.query);

  if (!validation.success) {
    throw new ValidationError('Invalid query parameters', validation.error.errors);
  }

  const firestore = getFirestoreClient();

  // Get active social accounts for the organization
  const snapshot = await firestore
    .collection('social_accounts')
    .where('organization_id', '==', req.user!.organization_id!)
    .where('is_active', '==', true)
    .get();

  const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SocialAccount[];

  // Get analytics data for the organization
  const analyticsSnapshot = await firestore
    .collection('analytics')
    .where('organization_id', '==', req.user!.organization_id!)
    .get();

  const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Analytics[];

  // Generate real analytics for each platform
  const platformAnalytics = accounts.map(account => {
    // Get analytics for this specific account
    const accountAnalytics = analyticsData.filter(a => a.social_account_id === account.id);

    // Calculate metrics from real data
    const followers = accountAnalytics
      .filter(a => a.metric_type === 'followers')
      .reduce((max, a) => Math.max(max, a.metric_value ?? 0), 0);

    const following = accountAnalytics
      .filter(a => a.metric_type === 'following')
      .reduce((max, a) => Math.max(max, a.metric_value ?? 0), 0);

    const totalLikes = accountAnalytics
      .filter(a => a.metric_type === 'likes')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const totalComments = accountAnalytics
      .filter(a => a.metric_type === 'comments')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const totalShares = accountAnalytics
      .filter(a => a.metric_type === 'shares')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const totalViews = accountAnalytics
      .filter(a => a.metric_type === 'views')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const reach = accountAnalytics
      .filter(a => a.metric_type === 'reach')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const impressions = accountAnalytics
      .filter(a => a.metric_type === 'impressions')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    // Calculate engagement rate
    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate = totalViews > 0 ? ((totalEngagement / totalViews) * 100) : 0;

    // Calculate growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentFollowers = accountAnalytics
      .filter(a => {
        const recordedAt = a.recorded_at instanceof Date
          ? a.recorded_at
          : typeof a.recorded_at === 'string'
            ? new Date(a.recorded_at)
            : (a.recorded_at as any).toDate();
        return recordedAt >= thirtyDaysAgo && a.metric_type === 'followers';
      })
      .reduce((max, a) => Math.max(max, a.metric_value ?? 0), 0);

    const previousFollowers = accountAnalytics
      .filter(a => {
        const recordedAt = a.recorded_at instanceof Date
          ? a.recorded_at
          : typeof a.recorded_at === 'string'
            ? new Date(a.recorded_at)
            : (a.recorded_at as any).toDate();
        return recordedAt >= sixtyDaysAgo && recordedAt < thirtyDaysAgo && a.metric_type === 'followers';
      })
      .reduce((max, a) => Math.max(max, a.metric_value ?? 0), 0);

    const followersChange = recentFollowers - previousFollowers;

    const recentEngagement = accountAnalytics
      .filter(a => {
        const recordedAt = a.recorded_at instanceof Date
          ? a.recorded_at
          : typeof a.recorded_at === 'string'
            ? new Date(a.recorded_at)
            : (a.recorded_at as any).toDate();
        return recordedAt >= thirtyDaysAgo && ['likes', 'comments', 'shares'].includes(a.metric_type);
      })
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const previousEngagement = accountAnalytics
      .filter(a => {
        const recordedAt = a.recorded_at instanceof Date
          ? a.recorded_at
          : typeof a.recorded_at === 'string'
            ? new Date(a.recorded_at)
            : (a.recorded_at as any).toDate();
        return recordedAt >= sixtyDaysAgo && recordedAt < thirtyDaysAgo && ['likes', 'comments', 'shares'].includes(a.metric_type);
      })
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const engagementChange = previousEngagement > 0 ?
      (((recentEngagement - previousEngagement) / previousEngagement) * 100) : 0;

    return {
      account_id: account.id,
      platform: account.platform,
      username: account.username,
      display_name: account.display_name,
      last_sync: account.last_sync_at,
      metrics: {
        followers: followers || 0,
        following: following || 0,
        posts_count: accountAnalytics.filter(a => a.post_id).length,
        engagement_rate: parseFloat(engagementRate.toFixed(2)),
        reach: reach || totalViews,
        impressions: impressions || totalViews
      },
      growth: {
        followers_change: followersChange,
        engagement_change: parseFloat(engagementChange.toFixed(2))
      }
    };
  });

  res.json({
    platforms: platformAnalytics
  });
}));

// GET /api/v1/analytics/engagement
router.get('/engagement', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const validation = analyticsQuerySchema.safeParse(req.query);

  if (!validation.success) {
    throw new ValidationError('Invalid query parameters', validation.error.errors);
  }

  const { start_date, end_date, platform } = validation.data;
  const firestore = getFirestoreClient();

  // Get analytics data for the organization
  const analyticsSnapshot = await firestore
    .collection('analytics')
    .where('organization_id', '==', req.user!.organization_id!)
    .get();

  const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Analytics[];

  // Filter by platform if specified
  let filteredAnalytics = analyticsData;
  if (platform) {
    // Get social accounts for the platform
    const accountsSnapshot = await firestore
      .collection('social_accounts')
      .where('organization_id', '==', req.user!.organization_id!)
      .where('platform', '==', platform)
      .get();

    const platformAccountIds = accountsSnapshot.docs.map(doc => doc.id);
    filteredAnalytics = analyticsData.filter(a => platformAccountIds.includes(a.social_account_id));
  }

  // Generate engagement data for the last 30 days
  const days = 30;
  const engagementData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];

    // Get analytics for this specific date
    const dayAnalytics = filteredAnalytics.filter(a => {
      const recordedAt = a.recorded_at instanceof Date
        ? a.recorded_at
        : typeof a.recorded_at === 'string'
          ? new Date(a.recorded_at)
          : (a.recorded_at as any).toDate();
      return recordedAt.toISOString().split('T')[0] === dateStr;
    });

    const likes = dayAnalytics
      .filter(a => a.metric_type === 'likes')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const comments = dayAnalytics
      .filter(a => a.metric_type === 'comments')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const shares = dayAnalytics
      .filter(a => a.metric_type === 'shares')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const views = dayAnalytics
      .filter(a => a.metric_type === 'views')
      .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

    const totalEngagement = likes + comments + shares;
    const engagementRate = views > 0 ? ((totalEngagement / views) * 100) : 0;

    return {
      date: dateStr,
      likes,
      comments,
      shares,
      views,
      engagement_rate: parseFloat(engagementRate.toFixed(2))
    };
  });

  // Platform-specific data if requested
  let platformData = null;
  if (platform) {
    platformData = {
      platform,
      total_engagement: engagementData.reduce((sum, day) =>
        sum + day.likes + day.comments + day.shares, 0
      ),
      avg_engagement_rate: (
        engagementData.reduce((sum, day) => sum + day.engagement_rate, 0) / days
      ).toFixed(2),
      best_performing_day: engagementData.reduce((best, current) =>
        (current.likes + current.comments + current.shares) >
        (best.likes + best.comments + best.shares) ? current : best,
        engagementData[0]
      )
    };
  }

  res.json({
    engagement_timeline: engagementData,
    platform_specific: platformData,
    summary: {
      total_likes: engagementData.reduce((sum, day) => sum + day.likes, 0),
      total_comments: engagementData.reduce((sum, day) => sum + day.comments, 0),
      total_shares: engagementData.reduce((sum, day) => sum + day.shares, 0),
      total_views: engagementData.reduce((sum, day) => sum + day.views, 0),
      avg_engagement_rate: (
        engagementData.reduce((sum, day) => sum + day.engagement_rate, 0) / days
      ).toFixed(2)
    }
  });
}));

// GET /api/v1/analytics/top-posts
router.get('/top-posts', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const firestore = getFirestoreClient();
  const limit = parseInt(req.query.limit as string) || 10;
  const platform = req.query.platform as string;

  // Get published posts for the organization
  const snapshot = await firestore
    .collection('posts')
    .where('organization_id', '==', req.user!.organization_id!)
    .where('status', '==', 'published')
    .orderBy('published_at', 'desc')
    .limit(limit * 2) // Get more posts to filter by platform if needed
    .get();

  let posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];

  // Apply platform filter in memory
  if (platform) {
    posts = posts.filter(post => post.platforms?.includes(platform));
  }

  // Limit to requested number
  posts = posts.slice(0, limit);

  // Get analytics data for the organization
  const analyticsSnapshot = await firestore
    .collection('analytics')
    .where('organization_id', '==', req.user!.organization_id!)
    .get();

  const analyticsData = analyticsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Analytics[];

  // Get user data for each post and add real engagement metrics
  const postsWithMetrics = await Promise.all(
    posts.map(async (post) => {
      let userData = null;
      if (post.user_id) {
        const userDoc = await firestore.collection('users').doc(post.user_id).get();
        if (userDoc.exists) {
          userData = { name: userDoc.data()?.name };
        }
      }

      // Get real analytics for this post
      const postAnalytics = analyticsData.filter(a => a.post_id === post.id);

      const views = postAnalytics
        .filter(a => a.metric_type === 'views')
        .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

      const likes = postAnalytics
        .filter(a => a.metric_type === 'likes')
        .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

      const shares = postAnalytics
        .filter(a => a.metric_type === 'shares')
        .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

      const comments = postAnalytics
        .filter(a => a.metric_type === 'comments')
        .reduce((sum, a) => sum + (a.metric_value ?? 0), 0);

      const totalEngagement = likes + shares + comments;
      const engagementRate = views > 0 ? ((totalEngagement / views) * 100) : 0;

      return {
        ...post,
        users: userData,
        metrics: {
          total_engagement: totalEngagement,
          likes: likes || 0,
          comments: comments || 0,
          shares: shares || 0,
          views: views || 0,
          engagement_rate: parseFloat(engagementRate.toFixed(2))
        }
      };
    })
  );

  // Sort by engagement
  postsWithMetrics.sort((a, b) => b.metrics.total_engagement - a.metrics.total_engagement);

  res.json({
    top_posts: postsWithMetrics
  });
}));

export default router;
