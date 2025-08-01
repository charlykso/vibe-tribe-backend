import { Router } from 'express';
import { communityService } from '../services/community.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/v1/community/stats - Get overall community statistics (singular 'community')
router.get('/stats', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const { organization_id } = req.user!;
    
    // Get all communities for the organization
    const communities = await communityService.getCommunities(organization_id);
    
    // Calculate aggregate stats
    let totalMembers = 0;
    let totalMessages = 0;
    let totalEngagement = 0;
    let activeCommunities = 0;
    
    for (const community of communities) {
      totalMembers += community.member_count || 0;
      totalMessages += community.message_count || 0;
      totalEngagement += community.engagement_rate || 0;
      if (community.is_active) {
        activeCommunities++;
      }
    }
    
    const averageEngagement = communities.length > 0 ? totalEngagement / communities.length : 0;
    
    const stats = {
      total_communities: communities.length,
      active_communities: activeCommunities,
      total_members: totalMembers,
      total_messages: totalMessages,
      average_engagement_rate: averageEngagement,
      health_score: communities.length > 0 ? 
        communities.reduce((sum, c) => sum + (c.health_score || 0), 0) / communities.length : 0,
      generated_at: new Date()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch community statistics'
    });
  }
}));

export default router;
