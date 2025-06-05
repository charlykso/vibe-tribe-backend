import { Router } from 'express';
import { z } from 'zod';
import { communityService } from '../services/community.js';
import { moderationService } from '../services/moderation.js';
import { authMiddleware } from '../middleware/auth.js';
import '../types/express.js';
const router = Router();
// Validation schemas
const createCommunitySchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    platform: z.string().min(1),
    platform_community_id: z.string().min(1),
    settings: z.record(z.any()).optional()
});
const updateCommunitySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    settings: z.record(z.any()).optional()
});
const addMemberSchema = z.object({
    platform_user_id: z.string().min(1),
    username: z.string().optional(),
    display_name: z.string().optional(),
    avatar_url: z.string().url().optional(),
    roles: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    join_date: z.string().datetime().optional(),
    metadata: z.record(z.any()).default({})
});
const ingestMessageSchema = z.object({
    platform_message_id: z.string().min(1),
    member_id: z.string().optional(),
    thread_id: z.string().optional(),
    parent_message_id: z.string().optional(),
    content: z.string().min(1),
    message_type: z.string().default('text'),
    attachments: z.array(z.any()).default([]),
    reactions: z.record(z.number()).default({}),
    mentions: z.array(z.string()).default([]),
    hashtags: z.array(z.string()).default([]),
    platform_created_at: z.string().datetime().optional()
});
// ============================================================================
// COMMUNITY MANAGEMENT ROUTES
// ============================================================================
// GET /api/v1/communities - Get all communities for organization
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { organization_id } = req.user;
        const communities = await communityService.getCommunities(organization_id);
        res.json({
            success: true,
            data: communities
        });
    }
    catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch communities'
        });
    }
});
// POST /api/v1/communities - Create new community
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { organization_id } = req.user;
        const validatedData = createCommunitySchema.parse(req.body);
        const community = await communityService.createCommunity({
            organization_id,
            name: validatedData.name,
            platform: validatedData.platform,
            platform_community_id: validatedData.platform_community_id,
            description: validatedData.description,
            settings: validatedData.settings
        });
        res.status(201).json({
            success: true,
            data: community
        });
    }
    catch (error) {
        console.error('Error creating community:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid input data',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to create community'
            });
        }
    }
});
// GET /api/v1/communities/:id - Get specific community
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const community = await communityService.getCommunityById(id);
        if (!community) {
            res.status(404).json({
                success: false,
                error: 'Community not found'
            });
            return;
        }
        res.json({
            success: true,
            data: community
        });
    }
    catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch community'
        });
    }
});
// PUT /api/v1/communities/:id - Update community
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateCommunitySchema.parse(req.body);
        const community = await communityService.updateCommunity(id, validatedData);
        res.json({
            success: true,
            data: community
        });
    }
    catch (error) {
        console.error('Error updating community:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid input data',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to update community'
            });
        }
    }
});
// DELETE /api/v1/communities/:id - Delete community
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await communityService.deleteCommunity(id);
        res.json({
            success: true,
            message: 'Community deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting community:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete community'
        });
    }
});
// ============================================================================
// MEMBER MANAGEMENT ROUTES
// ============================================================================
// GET /api/v1/communities/:id/members - Get community members
router.get('/:id/members', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const members = await communityService.getCommunityMembers(id, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: members
        });
    }
    catch (error) {
        console.error('Error fetching community members:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch community members'
        });
    }
});
// POST /api/v1/communities/:id/members - Add community member
router.post('/:id/members', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = addMemberSchema.parse(req.body);
        const member = await communityService.addCommunityMember({
            community_id: id,
            platform_user_id: validatedData.platform_user_id,
            username: validatedData.username,
            display_name: validatedData.display_name,
            avatar_url: validatedData.avatar_url,
            roles: validatedData.roles,
            tags: validatedData.tags,
            join_date: validatedData.join_date,
            metadata: validatedData.metadata
        });
        res.status(201).json({
            success: true,
            data: member
        });
    }
    catch (error) {
        console.error('Error adding community member:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid input data',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to add community member'
            });
        }
    }
});
// ============================================================================
// MESSAGE MANAGEMENT ROUTES
// ============================================================================
// GET /api/v1/communities/:id/messages - Get community messages
router.get('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0, thread_id } = req.query;
        const messages = await communityService.getCommunityMessages(id, parseInt(limit), parseInt(offset), thread_id);
        res.json({
            success: true,
            data: messages
        });
    }
    catch (error) {
        console.error('Error fetching community messages:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch community messages'
        });
    }
});
// POST /api/v1/communities/:id/messages - Ingest new message
router.post('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = ingestMessageSchema.parse(req.body);
        const message = await communityService.ingestMessage({
            community_id: id,
            platform_message_id: validatedData.platform_message_id,
            content: validatedData.content,
            member_id: validatedData.member_id,
            thread_id: validatedData.thread_id,
            parent_message_id: validatedData.parent_message_id,
            message_type: validatedData.message_type,
            attachments: validatedData.attachments,
            reactions: validatedData.reactions,
            mentions: validatedData.mentions,
            hashtags: validatedData.hashtags,
            platform_created_at: validatedData.platform_created_at
        });
        // Process message for moderation
        await moderationService.processMessage(message);
        res.status(201).json({
            success: true,
            data: message
        });
    }
    catch (error) {
        console.error('Error ingesting message:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid input data',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to ingest message'
            });
        }
    }
});
// ============================================================================
// COMMUNITY ANALYTICS ROUTES
// ============================================================================
// GET /api/v1/communities/:id/health - Get community health score
router.get('/:id/health', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const healthScore = await communityService.calculateHealthScore(id);
        res.json({
            success: true,
            data: {
                community_id: id,
                health_score: healthScore,
                calculated_at: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error calculating health score:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate health score'
        });
    }
});
// POST /api/v1/communities/:id/refresh-stats - Refresh community statistics
router.post('/:id/refresh-stats', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await communityService.updateCommunityStats(id);
        res.json({
            success: true,
            message: 'Community statistics refreshed successfully'
        });
    }
    catch (error) {
        console.error('Error refreshing community stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh community statistics'
        });
    }
});
export default router;
//# sourceMappingURL=communities.js.map