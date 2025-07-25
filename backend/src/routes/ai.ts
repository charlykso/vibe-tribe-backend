import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai.js';
import { predictiveAnalyticsService } from '../services/predictiveAnalytics.js';
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
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube']).optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'humorous', 'inspirational']).optional(),
  max_length: z.number().min(10).max(2000).optional(),
  options: z.object({
    length: z.enum(['short', 'medium', 'long']).optional(),
    includeHashtags: z.boolean().optional(),
    includeEmojis: z.boolean().optional(),
    targetAudience: z.string().optional(),
    brandVoice: z.string().optional(),
    variations: z.number().min(1).max(10).optional()
  }).optional()
});

const generateVariationsSchema = z.object({
  prompt: z.string().min(1),
  options: z.object({
    platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube']).optional(),
    tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'humorous', 'inspirational']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    includeHashtags: z.boolean().optional(),
    includeEmojis: z.boolean().optional(),
    targetAudience: z.string().optional(),
    brandVoice: z.string().optional(),
    variations: z.number().min(1).max(10).optional()
  }).optional()
});

const createBrandVoiceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sampleContent: z.array(z.string().min(10)).min(3).max(20)
});

const predictPerformanceSchema = z.object({
  contentId: z.string().min(1),
  contentText: z.string().min(1),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube']),
  scheduledTime: z.string().datetime().optional()
});

const updateMetricsSchema = z.object({
  engagement_rate: z.number().min(0).max(1),
  reach: z.number().min(0),
  impressions: z.number().min(0),
  clicks: z.number().min(0),
  shares: z.number().min(0),
  comments: z.number().min(0),
  likes: z.number().min(0),
  saves: z.number().min(0).optional()
}).transform((data) => ({
  engagement_rate: data.engagement_rate,
  reach: data.reach,
  impressions: data.impressions,
  clicks: data.clicks,
  shares: data.shares,
  comments: data.comments,
  likes: data.likes,
  saves: data.saves
}));

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
router.post('/analyze', authMiddleware, async (req, res): Promise<void> => {
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
router.post('/generate', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const validatedData = generateContentSchema.parse(req.body);

    // Build content generation options
    const options = {
      platform: validatedData.platform,
      tone: validatedData.tone,
      ...validatedData.options
    };

    const generatedContent = await aiService.generateContent(
      validatedData.prompt,
      organization_id,
      options
    );

    res.json({
      success: true,
      data: {
        original_prompt: validatedData.prompt,
        generated_content: generatedContent,
        options: options,
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

// POST /api/v1/ai/generate/variations - Generate multiple content variations for A/B testing
router.post('/generate/variations', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const validatedData = generateVariationsSchema.parse(req.body);

    const variations = await aiService.generateContentVariations(
      validatedData.prompt,
      organization_id,
      validatedData.options || {}
    );

    const providerStatus = aiService.getProviderStatus();

    res.json({
      success: true,
      data: {
        original_prompt: validatedData.prompt,
        variations,
        generated_at: new Date(),
        total_variations: variations.length,
        provider: providerStatus.preferred,
        fallback_available: providerStatus.fallback
      }
    });
  } catch (error) {
    console.error('Error generating content variations:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate content variations'
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
// BRAND VOICE LEARNING ROUTES
// ============================================================================

// POST /api/v1/ai/brand-voice/profiles - Create brand voice profile
router.post('/brand-voice/profiles', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const validatedData = createBrandVoiceSchema.parse(req.body);

    const profile = await aiService.createBrandVoiceProfile(
      organization_id,
      validatedData.name,
      validatedData.description || '',
      validatedData.sampleContent
    );

    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error creating brand voice profile:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create brand voice profile'
      });
    }
  }
});

// GET /api/v1/ai/brand-voice/profiles/:profileId? - Get brand voice profile
router.get('/brand-voice/profiles/:profileId?', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const { profileId } = req.params;

    const profile = await aiService.getBrandVoiceProfile(organization_id, profileId);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Brand voice profile not found'
      });
      return;
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting brand voice profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get brand voice profile'
    });
  }
});

// ============================================================================
// PREDICTIVE ANALYTICS ROUTES
// ============================================================================

// POST /api/v1/ai/predict/performance - Predict content performance
router.post('/predict/performance', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const validatedData = predictPerformanceSchema.parse(req.body);

    const scheduledTime = validatedData.scheduledTime ? new Date(validatedData.scheduledTime) : undefined;

    const prediction = await predictiveAnalyticsService.predictContentPerformance(
      organization_id,
      validatedData.contentId,
      validatedData.contentText,
      validatedData.platform,
      scheduledTime
    );

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Error predicting content performance:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to predict content performance'
      });
    }
  }
});

// PUT /api/v1/ai/predict/performance/:predictionId/metrics - Update actual metrics
router.put('/predict/performance/:predictionId/metrics', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { predictionId } = req.params;
    const validatedData = updateMetricsSchema.parse(req.body);

    await predictiveAnalyticsService.updateActualMetrics(predictionId, validatedData);

    res.json({
      success: true,
      message: 'Metrics updated successfully'
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update metrics'
      });
    }
  }
});

// GET /api/v1/ai/predict/optimal-timing - Get optimal posting times
router.get('/predict/optimal-timing', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const { platform, contentType } = req.query;

    if (!platform) {
      res.status(400).json({
        success: false,
        error: 'Platform parameter is required'
      });
      return;
    }

    const optimalTiming = await predictiveAnalyticsService.predictOptimalPostingTime(
      organization_id,
      platform as string,
      contentType as string
    );

    res.json({
      success: true,
      data: optimalTiming
    });
  } catch (error) {
    console.error('Error predicting optimal timing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict optimal timing'
    });
  }
});

// GET /api/v1/ai/trending-topics - Get trending topics analysis
router.get('/trending-topics', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const { platform, industry } = req.query;

    if (!platform) {
      res.status(400).json({
        success: false,
        error: 'Platform parameter is required'
      });
      return;
    }

    const trendingTopics = await predictiveAnalyticsService.analyzeTrendingTopics(
      organization_id,
      platform as string,
      industry as string
    );

    res.json({
      success: true,
      data: trendingTopics
    });
  } catch (error) {
    console.error('Error analyzing trending topics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze trending topics'
    });
  }
});

// GET /api/v1/ai/competitor-analysis - Get competitor performance analysis
router.get('/competitor-analysis', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const { platform, competitors, timeframe } = req.query;

    if (!platform || !competitors) {
      res.status(400).json({
        success: false,
        error: 'Platform and competitors parameters are required'
      });
      return;
    }

    const competitorHandles = Array.isArray(competitors) ? competitors : [competitors];
    const timeframeNum = timeframe ? parseInt(timeframe as string) : 30;

    const analysis = await predictiveAnalyticsService.analyzeCompetitorPerformance(
      organization_id,
      competitorHandles as string[],
      platform as string,
      timeframeNum
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing competitor performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze competitor performance'
    });
  }
});

// GET /api/v1/ai/performance-trends - Get performance trends
router.get('/performance-trends', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { organization_id } = req.user!;
    const { platform, timeframe } = req.query;

    if (!platform) {
      res.status(400).json({
        success: false,
        error: 'Platform parameter is required'
      });
      return;
    }

    const timeframeNum = timeframe ? parseInt(timeframe as string) : 30;

    const trends = await predictiveAnalyticsService.getPerformanceTrends(
      organization_id,
      platform as string,
      timeframeNum
    );

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting performance trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance trends'
    });
  }
});

// ============================================================================
// AI PROVIDER MANAGEMENT ROUTES
// ============================================================================

// GET /api/v1/ai/providers/status - Get AI provider status
router.get('/providers/status', authMiddleware, async (req, res): Promise<void> => {
  try {
    const status = aiService.getProviderStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting provider status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider status'
    });
  }
});

// POST /api/v1/ai/providers/test - Test AI providers
router.post('/providers/test', authMiddleware, async (req, res): Promise<void> => {
  try {
    const testResults = await aiService.testProviders();

    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    console.error('Error testing providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test providers'
    });
  }
});

// PUT /api/v1/ai/providers/preferred - Set preferred AI provider
router.put('/providers/preferred', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { provider } = req.body;

    if (!provider || !['openai', 'gemini'].includes(provider)) {
      res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be "openai" or "gemini"'
      });
      return;
    }

    const success = aiService.setPreferredProvider(provider);

    if (!success) {
      res.status(400).json({
        success: false,
        error: `Cannot set ${provider} as preferred provider - not available`
      });
      return;
    }

    res.json({
      success: true,
      message: `Preferred provider set to ${provider}`
    });
  } catch (error) {
    console.error('Error setting preferred provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set preferred provider'
    });
  }
});

// ============================================================================
// AUTOMATION RULES ROUTES
// ============================================================================

// GET /api/v1/ai/automation-rules - Get automation rules
router.get('/automation-rules', authMiddleware, async (req, res): Promise<void> => {
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
router.post('/automation-rules', authMiddleware, async (req, res): Promise<void> => {
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
router.post('/automation-rules/:id/execute', authMiddleware, async (req, res): Promise<void> => {
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
router.get('/analytics', authMiddleware, async (req, res): Promise<void> => {
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
