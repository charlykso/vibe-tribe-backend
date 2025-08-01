import { Router } from 'express';
import { getFirestoreClient, getServerTimestamp } from '../services/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/activity/recent - Get recent activity for the organization
router.get('/recent', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const { organization_id } = req.user!;
    const { limit = 20 } = req.query;

    console.log('🔍 Activity route accessed for organization:', organization_id);
    const firestore = getFirestoreClient();

    // Get recent posts (simplified query to avoid index issues)
    const postsSnapshot = await firestore
      .collection('posts')
      .where('organization_id', '==', organization_id)
      .limit(parseInt(limit as string) / 2)
      .get();

    // Get recent social account connections (simplified query)
    const socialAccountsSnapshot = await firestore
      .collection('social_accounts')
      .where('organization_id', '==', organization_id)
      .limit(5)
      .get();

    // Get recent invitations (simplified query)
    const invitationsSnapshot = await firestore
      .collection('invitations')
      .where('organization_id', '==', organization_id)
      .limit(5)
      .get();

    console.log('🔍 Query results:');
    console.log(`   Posts: ${postsSnapshot.docs.length}`);
    console.log(`   Social Accounts: ${socialAccountsSnapshot.docs.length}`);
    console.log(`   Invitations: ${invitationsSnapshot.docs.length}`);

    const activities: any[] = [];

    // Add post activities
    postsSnapshot.docs.forEach(doc => {
      const post = doc.data();
      activities.push({
        id: `post_${doc.id}`,
        type: 'post_created',
        title: 'New post created',
        description: `Post "${post.content?.substring(0, 50)}..." was created`,
        user: post.created_by || 'System',
        timestamp: post.created_at?.toDate?.() || new Date(post.created_at),
        metadata: {
          post_id: doc.id,
          platforms: post.platforms || [],
          status: post.status
        }
      });
    });

    // Add social account activities
    socialAccountsSnapshot.docs.forEach(doc => {
      const account = doc.data();
      activities.push({
        id: `social_${doc.id}`,
        type: 'social_account_connected',
        title: 'Social account connected',
        description: `${account.platform} account connected`,
        user: account.created_by || 'System',
        timestamp: account.created_at?.toDate?.() || new Date(account.created_at),
        metadata: {
          platform: account.platform,
          account_name: account.account_name
        }
      });
    });

    // Add invitation activities
    invitationsSnapshot.docs.forEach(doc => {
      const invitation = doc.data();
      activities.push({
        id: `invitation_${doc.id}`,
        type: 'invitation_sent',
        title: 'Team invitation sent',
        description: `Invitation sent to ${invitation.email}`,
        user: invitation.invited_by || 'System',
        timestamp: invitation.created_at?.toDate?.() || new Date(invitation.created_at),
        metadata: {
          email: invitation.email,
          role: invitation.role,
          status: invitation.status
        }
      });
    });

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to requested number
    const limitedActivities = activities.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        activities: limitedActivities,
        total: activities.length
      }
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity'
    });
  }
}));

// GET /api/v1/activity/stats - Get activity statistics
router.get('/stats', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const { organization_id } = req.user!;
    const { days = 30 } = req.query;

    const firestore = getFirestoreClient();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    // Get activity counts for the period
    const [postsSnapshot, socialAccountsSnapshot, invitationsSnapshot] = await Promise.all([
      firestore
        .collection('posts')
        .where('organization_id', '==', organization_id)
        .where('created_at', '>=', daysAgo)
        .get(),
      firestore
        .collection('social_accounts')
        .where('organization_id', '==', organization_id)
        .where('created_at', '>=', daysAgo)
        .get(),
      firestore
        .collection('invitations')
        .where('organization_id', '==', organization_id)
        .where('created_at', '>=', daysAgo)
        .get()
    ]);

    const stats = {
      posts_created: postsSnapshot.size,
      social_accounts_connected: socialAccountsSnapshot.size,
      invitations_sent: invitationsSnapshot.size,
      total_activities: postsSnapshot.size + socialAccountsSnapshot.size + invitationsSnapshot.size,
      period_days: parseInt(days as string),
      generated_at: new Date()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity statistics'
    });
  }
}));

export default router;
