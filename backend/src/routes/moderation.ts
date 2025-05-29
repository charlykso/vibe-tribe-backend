import { Router } from 'express';
import { z } from 'zod';
import { moderationService } from '../services/moderation';
import { authMiddleware } from '../middleware/auth';
import '../types/express';

const router = Router();

// Validation schemas
const createModerationRuleSchema = z.object({
  community_id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rule_type: z.enum(['keyword', 'regex', 'ai_sentiment', 'ai_toxicity', 'spam_detection']),
  conditions: z.record(z.any()),
  actions: z.record(z.any()),
  severity: z.number().min(1).max(5).default(1),
  is_active: z.boolean().default(true)
});

const moderateContentSchema = z.object({
  action: z.enum(['approve', 'reject', 'escalate']),
  notes: z.string().optional()
});

const addToQueueSchema = z.object({
  community_id: z.string().optional(),
  content_type: z.string().min(1),
  content_id: z.string().min(1),
  content_text: z.string().optional(),
  author_id: z.string().optional(),
  author_name: z.string().optional(),
  reason: z.string().min(1),
  ai_confidence: z.number().min(0).max(1).optional(),
  priority: z.number().min(1).max(5).default(1),
  auto_action: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// MODERATION QUEUE ROUTES
// ============================================================================

// GET /api/v1/moderation/queue - Get moderation queue
router.get('/queue', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const { status, limit = 50, offset = 0 } = req.query;

    const queueItems = await moderationService.getModerationQueue(
      organization_id,
      status as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: queueItems
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation queue'
    });
  }
});

// POST /api/v1/moderation/queue - Add item to moderation queue
router.post('/queue', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const validatedData = addToQueueSchema.parse(req.body);

    const queueItem = await moderationService.addToModerationQueue({
      organization_id,
      content_type: validatedData.content_type,
      content_id: validatedData.content_id,
      reason: validatedData.reason,
      community_id: validatedData.community_id,
      content_text: validatedData.content_text,
      author_id: validatedData.author_id,
      author_name: validatedData.author_name,
      ai_confidence: validatedData.ai_confidence,
      priority: validatedData.priority,
      auto_action: validatedData.auto_action,
      metadata: validatedData.metadata
    });

    res.status(201).json({
      success: true,
      data: queueItem
    });
  } catch (error) {
    console.error('Error adding to moderation queue:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to add to moderation queue'
      });
    }
  }
});

// POST /api/v1/moderation/queue/:id/moderate - Moderate content
router.post('/queue/:id/moderate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: moderatorId } = req.user!;
    const validatedData = moderateContentSchema.parse(req.body);

    const moderationAction = await moderationService.moderateContent(
      id,
      validatedData.action,
      moderatorId,
      validatedData.notes
    );

    res.json({
      success: true,
      data: moderationAction
    });
  } catch (error) {
    console.error('Error moderating content:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to moderate content'
      });
    }
  }
});

// ============================================================================
// MODERATION RULES ROUTES
// ============================================================================

// GET /api/v1/moderation/rules - Get moderation rules
router.get('/rules', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const { community_id } = req.query;

    const rules = await moderationService.getModerationRules(
      organization_id,
      community_id as string
    );

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching moderation rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation rules'
    });
  }
});

// POST /api/v1/moderation/rules - Create moderation rule
router.post('/rules', authMiddleware, async (req, res) => {
  try {
    const { organization_id, id: created_by } = req.user!;
    const validatedData = createModerationRuleSchema.parse(req.body);

    const rule = await moderationService.createModerationRule({
      organization_id,
      name: validatedData.name,
      rule_type: validatedData.rule_type,
      conditions: validatedData.conditions,
      actions: validatedData.actions,
      description: validatedData.description,
      community_id: validatedData.community_id,
      severity: validatedData.severity,
      is_active: validatedData.is_active,
      created_by
    });

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating moderation rule:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create moderation rule'
      });
    }
  }
});

// ============================================================================
// MODERATION ANALYTICS ROUTES
// ============================================================================

// GET /api/v1/moderation/stats - Get moderation statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const { days = 30 } = req.query;

    const stats = await moderationService.getModerationStats(
      organization_id,
      parseInt(days as string)
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation stats'
    });
  }
});

// ============================================================================
// MODERATION RULE TEMPLATES
// ============================================================================

// GET /api/v1/moderation/rule-templates - Get predefined rule templates
router.get('/rule-templates', authMiddleware, async (req, res) => {
  try {
    const templates = [
      {
        id: 'spam-keywords',
        name: 'Spam Keywords Detection',
        description: 'Detects common spam keywords',
        rule_type: 'keyword',
        conditions: {
          keywords: ['spam', 'scam', 'free money', 'click here', 'buy now'],
          case_sensitive: false
        },
        actions: {
          auto_action: 'hide',
          notify_moderators: true
        },
        severity: 3
      },
      {
        id: 'toxic-language',
        name: 'Toxic Language Detection',
        description: 'Detects toxic and harmful language',
        rule_type: 'ai_toxicity',
        conditions: {
          threshold: 0.7
        },
        actions: {
          auto_action: 'hide',
          notify_moderators: true,
          escalate: true
        },
        severity: 4
      },
      {
        id: 'negative-sentiment',
        name: 'Negative Sentiment Detection',
        description: 'Flags highly negative content',
        rule_type: 'ai_sentiment',
        conditions: {
          threshold: -0.8
        },
        actions: {
          auto_action: 'none',
          notify_moderators: true
        },
        severity: 2
      },
      {
        id: 'excessive-caps',
        name: 'Excessive Caps Detection',
        description: 'Detects messages with excessive capital letters',
        rule_type: 'regex',
        conditions: {
          patterns: ['[A-Z]{10,}'],
          flags: 'g'
        },
        actions: {
          auto_action: 'warn',
          notify_moderators: false
        },
        severity: 1
      },
      {
        id: 'url-spam',
        name: 'URL Spam Detection',
        description: 'Detects messages with suspicious URLs',
        rule_type: 'regex',
        conditions: {
          patterns: ['http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'],
          flags: 'gi'
        },
        actions: {
          auto_action: 'hide',
          notify_moderators: true
        },
        severity: 3
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching rule templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule templates'
    });
  }
});

// POST /api/v1/moderation/rule-templates/:id/apply - Apply a rule template
router.post('/rule-templates/:id/apply', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { id: templateId } = req.params;
    const { organization_id, id: created_by } = req.user!;
    const { community_id, name_override } = req.body;

    // Get template (this would normally come from a database)
    const templates: any[] = [
      // ... same templates as above
    ];

    const template = templates.find(t => t.id === templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
      return;
    }

    const rule = await moderationService.createModerationRule({
      organization_id,
      community_id,
      name: name_override || template.name,
      description: template.description,
      rule_type: template.rule_type as any,
      conditions: template.conditions,
      actions: template.actions,
      severity: template.severity,
      is_active: true,
      created_by
    });

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error applying rule template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply rule template'
    });
  }
});

export default router;
