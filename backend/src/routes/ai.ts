import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai.js';
import { authMiddleware } from '../middleware/auth.js';
import '../types/express.js';

const router = Router();

// Validation schemas
const analyzeContentSchema = z.object({
  content: z.string().min(1),
  content_id: z.string().min(1),
  analysis_types: z.array(z.enum(['sentiment', 'toxicity', 'spam'])).optional()
});

const generateContentSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(['post', 'comment', 'response']).optional(),
  platform: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal']).optional(),
  max_length: z.number().min(10).max(2000).optional()
});

const createAutomationRuleSchema = z.object({
  community_id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  trigger_type: z.enum(['new_message', 'new_member', 'keyword_match', 'sentiment_change']),
  trigger_conditions: z.record(z.any()),
  actions: z.record(z.any()),
  is_active: z.boolean().default(true)
});

const executeRuleSchema = z.object({
  trigger_data: z.record(z.any())
});

// ============================================================================
// CONTENT ANALYSIS ROUTES
// ============================================================================

// POST /api/v1/ai/analyze - Analyze content with AI
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const validatedData = analyzeContentSchema.parse(req.body);

    const analysisTypes = validatedData.analysis_types || ['sentiment', 'toxicity', 'spam'];
    const results: any = {};

    // Run requested analyses
    for (const analysisType of analysisTypes) {
      try {
        switch (analysisType) {
          case 'sentiment':
            results.sentiment = await aiService.analyzeSentiment(
              validatedData.content,
              organization_id,
              validatedData.content_id
            );
            break;
          case 'toxicity':
            results.toxicity = await aiService.analyzeToxicity(
              validatedData.content,
              organization_id,
              validatedData.content_id
            );
            break;
          case 'spam':
            results.spam = await aiService.detectSpam(
              validatedData.content,
              organization_id,
              validatedData.content_id
            );
            break;
        }
      } catch (error) {
        console.error(`Error in ${analysisType} analysis:`, error);
        results[analysisType] = { error: 'Analysis failed' };
      }
    }

    res.json({
      success: true,
      data: {
        content_id: validatedData.content_id,
        analyses: results,
        analyzed_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to analyze content'
      });
    }
  }
});

// ============================================================================
// CONTENT GENERATION ROUTES
// ============================================================================

// POST /api/v1/ai/generate - Generate content with AI
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const validatedData = generateContentSchema.parse(req.body);

    // Enhance prompt based on parameters
    let enhancedPrompt = validatedData.prompt;

    if (validatedData.type) {
      enhancedPrompt = `Create a ${validatedData.type} about: ${enhancedPrompt}`;
    }

    if (validatedData.platform) {
      enhancedPrompt += ` for ${validatedData.platform}`;
    }

    if (validatedData.tone) {
      enhancedPrompt += ` in a ${validatedData.tone} tone`;
    }

    if (validatedData.max_length) {
      enhancedPrompt += ` (max ${validatedData.max_length} characters)`;
    }

    const generatedContent = await aiService.generateContent(enhancedPrompt, organization_id);

    res.json({
      success: true,
      data: {
        original_prompt: validatedData.prompt,
        enhanced_prompt: enhancedPrompt,
        generated_content: generatedContent,
        generated_at: new Date(),
        character_count: generatedContent.length
      }
    });
  } catch (error) {
    console.error('Error generating content:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate content'
      });
    }
  }
});

// GET /api/v1/ai/content-suggestions - Get content suggestions
router.get('/content-suggestions', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { topic, platform, type = 'post' } = req.query;

    if (!topic) {
      res.status(400).json({
        success: false,
        error: 'Topic parameter is required'
      });
      return;
    }

    const suggestions = [];
    const prompts = [
      `Create an engaging ${type} about ${topic}`,
      `Write a thought-provoking ${type} discussing ${topic}`,
      `Generate a fun and informative ${type} about ${topic}`,
      `Create a professional ${type} explaining ${topic}`,
      `Write an inspiring ${type} related to ${topic}`
    ];

    for (const prompt of prompts) {
      try {
        const content = await aiService.generateContent(
          platform ? `${prompt} for ${platform}` : prompt,
          req.user!.organization_id
        );
        suggestions.push({
          prompt,
          content,
          character_count: content.length
        });
      } catch (error) {
        console.error('Error generating suggestion:', error);
      }
    }

    res.json({
      success: true,
      data: {
        topic: topic as string,
        platform: platform as string,
        type: type as string,
        suggestions,
        generated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting content suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content suggestions'
    });
  }
});

// ============================================================================
// AUTOMATION RULES ROUTES
// ============================================================================

// GET /api/v1/ai/automation-rules - Get automation rules
router.get('/automation-rules', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const { community_id } = req.query;

    // This would typically fetch from database
    // For now, return mock data
    const rules = [
      {
        id: '1',
        organization_id,
        community_id: community_id || null,
        name: 'Welcome New Members',
        description: 'Automatically welcome new community members',
        trigger_type: 'new_member',
        trigger_conditions: {},
        actions: {
          send_message: {
            template: 'Welcome to our community! 👋',
            channel: 'general'
          }
        },
        is_active: true,
        execution_count: 45,
        created_at: new Date()
      }
    ];

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch automation rules'
    });
  }
});

// POST /api/v1/ai/automation-rules - Create automation rule
router.post('/automation-rules', authMiddleware, async (req, res) => {
  try {
    const { organization_id, id: created_by } = req.user!;
    const validatedData = createAutomationRuleSchema.parse(req.body);

    const rule = await aiService.createAutomationRule({
      organization_id,
      name: validatedData.name,
      trigger_type: validatedData.trigger_type,
      trigger_conditions: validatedData.trigger_conditions,
      actions: validatedData.actions,
      description: validatedData.description,
      community_id: validatedData.community_id,
      is_active: validatedData.is_active,
      created_by
    });

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create automation rule'
      });
    }
  }
});

// POST /api/v1/ai/automation-rules/:id/execute - Execute automation rule
router.post('/automation-rules/:id/execute', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = executeRuleSchema.parse(req.body);

    const execution = await aiService.executeAutomationRule(id, validatedData.trigger_data);

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('Error executing automation rule:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to execute automation rule'
      });
    }
  }
});

// ============================================================================
// AI ANALYTICS ROUTES
// ============================================================================

// GET /api/v1/ai/analytics - Get AI usage analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { organization_id } = req.user!;
    const { days = 30 } = req.query;

    // Mock analytics data - replace with actual database queries
    const analytics = {
      total_analyses: 1250,
      sentiment_analyses: 450,
      toxicity_analyses: 380,
      spam_detections: 420,
      content_generations: 125,
      automation_executions: 89,
      average_confidence: 0.87,
      flagged_content: 23,
      auto_moderated: 15,
      processing_time_avg: 245, // ms
      daily_usage: Array.from({ length: parseInt(days as string) }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        analyses: Math.floor(Math.random() * 50) + 10,
        generations: Math.floor(Math.random() * 10) + 2
      })).reverse()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI analytics'
    });
  }
});

export default router;
