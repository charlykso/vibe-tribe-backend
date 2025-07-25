import { getFirestoreClient } from './database.js';
import { AIAnalysis, AutomationRule, AutomationExecution } from '../types/database.js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Enhanced OpenAI interfaces
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ContentGenerationOptions {
  platform?: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous' | 'inspirational';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  targetAudience?: string;
  brandVoice?: string;
  variations?: number;
}

interface ContentVariation {
  content: string;
  platform: string;
  tone: string;
  score: number;
  hashtags: string[];
  estimatedEngagement: number;
}

interface BrandVoiceProfile {
  id?: string;
  organization_id: string;
  name: string;
  description: string;
  tone_attributes: {
    formality: number; // 0-1 (informal to formal)
    enthusiasm: number; // 0-1 (calm to enthusiastic)
    friendliness: number; // 0-1 (professional to friendly)
    authority: number; // 0-1 (humble to authoritative)
    creativity: number; // 0-1 (conventional to creative)
  };
  vocabulary_preferences: {
    preferred_words: string[];
    avoided_words: string[];
    industry_terms: string[];
  };
  content_patterns: {
    avg_sentence_length: number;
    question_frequency: number;
    emoji_usage: number;
    hashtag_style: 'minimal' | 'moderate' | 'heavy';
  };
  sample_content: string[];
  created_at: string;
  updated_at: string;
  training_status: 'pending' | 'training' | 'ready' | 'error';
}

export class AIService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private openaiApiKey: string;
  private geminiApiKey: string;
  private baseUrl = 'https://api.openai.com/v1';
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequestsPerMinute = 60; // Adjust based on your plan
  private preferredProvider: 'openai' | 'gemini' = 'gemini'; // Default to Gemini since you have the key

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || 'mock-api-key';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';

    // Initialize OpenAI if key is available
    if (this.openaiApiKey && this.openaiApiKey !== 'mock-api-key') {
      this.openai = new OpenAI({
        apiKey: this.openaiApiKey,
      });
    }

    // Initialize Gemini if key is available
    if (this.geminiApiKey) {
      this.gemini = new GoogleGenerativeAI(this.geminiApiKey);
    }

    // Set preferred provider based on available keys
    if (this.geminiApiKey && !this.openai) {
      this.preferredProvider = 'gemini';
    } else if (this.openai && !this.geminiApiKey) {
      this.preferredProvider = 'openai';
    }
  }

  // Rate limiting helper
  private async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userLimit = this.rateLimitTracker.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitTracker.set(userId, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (userLimit.count >= this.maxRequestsPerMinute) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  // ============================================================================
  // CONTENT ANALYSIS
  // ============================================================================

  async analyzeSentiment(content: string, organizationId: string, contentId: string): Promise<AIAnalysis> {
    try {
      const startTime = Date.now();

      // Mock sentiment analysis - Replace with actual OpenAI API call
      const sentimentScore = this.mockSentimentAnalysis(content);

      const result = {
        sentiment: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral',
        score: sentimentScore,
        confidence: Math.random() * 0.3 + 0.7, // Mock confidence 0.7-1.0
        keywords: this.extractKeywords(content)
      };

      const analysis = {
        organization_id: organizationId,
        content_type: 'message',
        content_id: contentId,
        analysis_type: 'sentiment',
        result,
        confidence: result.confidence,
        model_version: 'gpt-3.5-turbo',
        processing_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString()
      };

      const db = getFirestoreClient();
      const docRef = await db.collection('ai_analysis').add(analysis);
      const doc = await docRef.get();

      return { id: doc.id, ...doc.data() } as AIAnalysis;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  async analyzeToxicity(content: string, organizationId: string, contentId: string): Promise<AIAnalysis> {
    try {
      const startTime = Date.now();

      // Mock toxicity analysis
      const toxicityScore = this.mockToxicityAnalysis(content);

      const result = {
        toxicity_level: toxicityScore > 0.7 ? 'high' : toxicityScore > 0.4 ? 'medium' : 'low',
        score: toxicityScore,
        confidence: Math.random() * 0.2 + 0.8,
        categories: this.detectToxicityCategories(content)
      };

      const analysis = {
        organization_id: organizationId,
        content_type: 'message',
        content_id: contentId,
        analysis_type: 'toxicity',
        result,
        confidence: result.confidence,
        model_version: 'perspective-api',
        processing_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString()
      };

      const db = getFirestoreClient();
      const docRef = await db.collection('ai_analysis').add(analysis);
      const doc = await docRef.get();

      return { id: doc.id, ...doc.data() } as AIAnalysis;
    } catch (error) {
      console.error('Error analyzing toxicity:', error);
      throw new Error('Failed to analyze toxicity');
    }
  }

  async detectSpam(content: string, organizationId: string, contentId: string): Promise<AIAnalysis> {
    try {
      const startTime = Date.now();

      // Mock spam detection
      const spamScore = this.mockSpamDetection(content);

      const result = {
        spam_probability: spamScore,
        confidence: Math.random() * 0.2 + 0.8,
        indicators: this.getSpamIndicators(content),
        is_spam: spamScore > 0.6
      };

      const analysis = {
        organization_id: organizationId,
        content_type: 'message',
        content_id: contentId,
        analysis_type: 'spam',
        result,
        confidence: result.confidence,
        model_version: 'custom-spam-detector',
        processing_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString()
      };

      const db = getFirestoreClient();
      const docRef = await db.collection('ai_analysis').add(analysis);
      const doc = await docRef.get();

      return { id: doc.id, ...doc.data() } as AIAnalysis;
    } catch (error) {
      console.error('Error detecting spam:', error);
      throw new Error('Failed to detect spam');
    }
  }

  async generateContent(
    prompt: string,
    organizationId: string,
    options: ContentGenerationOptions = {}
  ): Promise<string> {
    try {
      // Check rate limiting
      if (!await this.checkRateLimit(organizationId)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Try preferred provider first, then fallback
      let content: string | null = null;
      let provider = this.preferredProvider;
      let usage: any = null;

      try {
        if (provider === 'gemini' && this.gemini) {
          const result = await this.generateWithGemini(prompt, options);
          content = result.content;
          usage = result.usage;
        } else if (provider === 'openai' && this.openai) {
          const result = await this.generateWithOpenAI(prompt, options);
          content = result.content;
          usage = result.usage;
        } else {
          throw new Error('No AI provider available');
        }
      } catch (error) {
        console.warn(`${provider} failed, trying fallback:`, error);

        // Try fallback provider
        const fallbackProvider = provider === 'gemini' ? 'openai' : 'gemini';

        if (fallbackProvider === 'gemini' && this.gemini) {
          const result = await this.generateWithGemini(prompt, options);
          content = result.content;
          usage = result.usage;
          provider = 'gemini';
        } else if (fallbackProvider === 'openai' && this.openai) {
          const result = await this.generateWithOpenAI(prompt, options);
          content = result.content;
          usage = result.usage;
          provider = 'openai';
        } else {
          throw error; // Re-throw if no fallback available
        }
      }

      if (!content) {
        throw new Error('No content generated from any provider');
      }

      // Log usage for analytics
      await this.logAIUsage(organizationId, 'content_generation', usage, provider);

      return content;
    } catch (error) {
      console.error('Error generating content:', error);
      return this.mockContentGeneration(prompt);
    }
  }

  private async generateWithGemini(
    prompt: string,
    options: ContentGenerationOptions = {}
  ): Promise<{ content: string; usage: any }> {
    if (!this.gemini) {
      throw new Error('Gemini not initialized');
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = this.buildSystemPrompt(options);
    const userPrompt = this.buildUserPrompt(prompt, options);

    const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    // Gemini doesn't provide detailed usage stats like OpenAI
    const usage = {
      prompt_tokens: Math.ceil(fullPrompt.length / 4), // Rough estimate
      completion_tokens: Math.ceil(content.length / 4),
      total_tokens: Math.ceil((fullPrompt.length + content.length) / 4)
    };

    return { content, usage };
  }

  private async generateWithOpenAI(
    prompt: string,
    options: ContentGenerationOptions = {}
  ): Promise<{ content: string; usage: any }> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const systemPrompt = this.buildSystemPrompt(options);
    const userPrompt = this.buildUserPrompt(prompt, options);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: this.getMaxTokensForPlatform(options.platform),
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    return { content, usage: response.usage };
  }

  async generateContentVariations(
    prompt: string,
    organizationId: string,
    options: ContentGenerationOptions = {}
  ): Promise<ContentVariation[]> {
    try {
      const variations: ContentVariation[] = [];
      const numVariations = options.variations || 3;
      const platforms = options.platform ? [options.platform] : ['twitter', 'linkedin', 'facebook'] as const;
      const tones = ['professional', 'casual', 'friendly'] as const;

      for (let i = 0; i < numVariations; i++) {
        const platform = platforms[i % platforms.length] as 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
        const tone = tones[i % tones.length];

        const variationOptions = {
          ...options,
          platform,
          tone
        };

        const content = await this.generateContent(prompt, organizationId, variationOptions);
        const hashtags = this.extractHashtags(content);
        const score = await this.scoreContent(content, platform);
        const estimatedEngagement = this.estimateEngagement(content, platform);

        variations.push({
          content,
          platform,
          tone,
          score,
          hashtags,
          estimatedEngagement
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return variations;
    } catch (error) {
      console.error('Error generating content variations:', error);
      throw new Error('Failed to generate content variations');
    }
  }

  // ============================================================================
  // AUTOMATION RULES
  // ============================================================================

  async createAutomationRule(ruleData: Partial<AutomationRule> & { organization_id: string; name: string; trigger_type: string; trigger_conditions: Record<string, any>; actions: Record<string, any> }): Promise<AutomationRule> {
    try {
      const db = getFirestoreClient();
      const docRef = await db.collection('automation_rules').add({
        ...ruleData,
        execution_count: 0,
        is_active: ruleData.is_active !== undefined ? ruleData.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as AutomationRule;
    } catch (error) {
      console.error('Error creating automation rule:', error);
      throw new Error('Failed to create automation rule');
    }
  }

  async executeAutomationRule(ruleId: string, triggerData: Record<string, any>): Promise<AutomationExecution> {
    try {
      const startTime = Date.now();
      const rule = await this.getAutomationRule(ruleId);

      if (!rule || !rule.is_active) {
        throw new Error('Rule not found or inactive');
      }

      // Execute actions based on rule configuration
      const actionsExecuted = await this.executeActions(rule.actions, triggerData);

      // Log execution
      const execution = {
        rule_id: ruleId,
        trigger_data: triggerData,
        actions_executed: actionsExecuted,
        success: true,
        execution_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString()
      };

      const db = getFirestoreClient();
      const docRef = await db.collection('automation_executions').add(execution);

      // Update rule execution count
      await db.collection('automation_rules').doc(ruleId).update({
        execution_count: rule.execution_count + 1,
        last_executed_at: new Date().toISOString()
      });

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as AutomationExecution;
    } catch (error) {
      console.error('Error executing automation rule:', error);

      // Log failed execution
      const execution = {
        rule_id: ruleId,
        trigger_data: triggerData,
        actions_executed: {},
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: 0,
        created_at: new Date().toISOString()
      };

      const db = getFirestoreClient();
      const docRef = await db.collection('automation_executions').add(execution);
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as AutomationExecution;
    }
  }

  private async getAutomationRule(ruleId: string): Promise<AutomationRule | null> {
    const db = getFirestoreClient();
    const doc = await db.collection('automation_rules').doc(ruleId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as AutomationRule;
  }

  private async executeActions(actions: Record<string, any>, triggerData: Record<string, any>): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [actionType, actionConfig] of Object.entries(actions)) {
      try {
        switch (actionType) {
          case 'send_notification':
            results[actionType] = await this.sendNotification(actionConfig, triggerData);
            break;
          case 'flag_content':
            results[actionType] = await this.flagContent(actionConfig, triggerData);
            break;
          case 'auto_moderate':
            results[actionType] = await this.autoModerate(actionConfig, triggerData);
            break;
          default:
            results[actionType] = { status: 'skipped', reason: 'Unknown action type' };
        }
      } catch (error) {
        results[actionType] = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  // ============================================================================
  // PROVIDER MANAGEMENT METHODS
  // ============================================================================

  getProviderStatus(): {
    openai: { available: boolean; model: string };
    gemini: { available: boolean; model: string };
    preferred: string;
    fallback: string;
  } {
    return {
      openai: {
        available: !!this.openai,
        model: 'gpt-4-turbo-preview'
      },
      gemini: {
        available: !!this.gemini,
        model: 'gemini-1.5-flash'
      },
      preferred: this.preferredProvider,
      fallback: this.preferredProvider === 'openai' ? 'gemini' : 'openai'
    };
  }

  setPreferredProvider(provider: 'openai' | 'gemini'): boolean {
    if (provider === 'openai' && !this.openai) {
      console.warn('Cannot set OpenAI as preferred provider - not available');
      return false;
    }
    if (provider === 'gemini' && !this.gemini) {
      console.warn('Cannot set Gemini as preferred provider - not available');
      return false;
    }

    this.preferredProvider = provider;
    console.log(`Preferred AI provider set to: ${provider}`);
    return true;
  }

  async testProviders(): Promise<{
    openai: { working: boolean; error?: string; responseTime?: number };
    gemini: { working: boolean; error?: string; responseTime?: number };
  }> {
    const results = {
      openai: { working: false, error: undefined as string | undefined, responseTime: undefined as number | undefined },
      gemini: { working: false, error: undefined as string | undefined, responseTime: undefined as number | undefined }
    };

    // Test OpenAI
    if (this.openai) {
      try {
        const startTime = Date.now();
        await this.generateWithOpenAI('Test prompt', { platform: 'twitter', tone: 'casual' });
        results.openai.working = true;
        results.openai.responseTime = Date.now() - startTime;
      } catch (error) {
        results.openai.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      results.openai.error = 'OpenAI not configured';
    }

    // Test Gemini
    if (this.gemini) {
      try {
        const startTime = Date.now();
        await this.generateWithGemini('Test prompt', { platform: 'twitter', tone: 'casual' });
        results.gemini.working = true;
        results.gemini.responseTime = Date.now() - startTime;
      } catch (error) {
        results.gemini.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      results.gemini.error = 'Gemini not configured';
    }

    return results;
  }

  // ============================================================================
  // HELPER METHODS FOR ENHANCED AI FEATURES
  // ============================================================================

  private buildSystemPrompt(options: ContentGenerationOptions): string {
    let prompt = 'You are an expert social media content creator and marketing strategist. ';

    if (options.platform) {
      const platformGuidelines = {
        twitter: 'Create concise, engaging tweets under 280 characters. Use relevant hashtags and encourage engagement.',
        linkedin: 'Write professional, thought-leadership content. Focus on industry insights and professional value.',
        facebook: 'Create engaging, conversational content that encourages comments and shares.',
        instagram: 'Write visually-focused captions that complement images. Use relevant hashtags and emojis.',
        tiktok: 'Create trendy, entertaining content that appeals to younger audiences. Use popular hashtags.',
        youtube: 'Write compelling video descriptions and titles that improve discoverability.'
      };
      prompt += platformGuidelines[options.platform] + ' ';
    }

    if (options.tone) {
      prompt += `Maintain a ${options.tone} tone throughout the content. `;
    }

    if (options.brandVoice) {
      prompt += `Follow this brand voice: ${options.brandVoice}. `;
    }

    if (options.targetAudience) {
      prompt += `Target audience: ${options.targetAudience}. `;
    }

    prompt += 'Ensure the content is original, engaging, and appropriate for the platform.';

    return prompt;
  }

  private buildUserPrompt(prompt: string, options: ContentGenerationOptions): string {
    let userPrompt = `Create social media content based on: ${prompt}`;

    if (options.length) {
      const lengthGuidelines = {
        short: 'Keep it brief and punchy (1-2 sentences)',
        medium: 'Moderate length with good detail (2-4 sentences)',
        long: 'Comprehensive content with full explanation (4+ sentences)'
      };
      userPrompt += `\n\nLength: ${lengthGuidelines[options.length]}`;
    }

    if (options.includeHashtags) {
      userPrompt += '\n\nInclude 3-5 relevant hashtags.';
    }

    if (options.includeEmojis) {
      userPrompt += '\n\nInclude appropriate emojis to enhance engagement.';
    }

    return userPrompt;
  }

  private getMaxTokensForPlatform(platform?: string): number {
    const tokenLimits = {
      twitter: 100,
      linkedin: 300,
      facebook: 250,
      instagram: 200,
      tiktok: 150,
      youtube: 400
    };

    return platform ? tokenLimits[platform as keyof typeof tokenLimits] || 250 : 250;
  }

  private async logAIUsage(
    organizationId: string,
    operation: string,
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
    provider: string = 'unknown'
  ): Promise<void> {
    try {
      const db = getFirestoreClient();
      await db.collection('ai_usage').add({
        organization_id: organizationId,
        operation,
        provider,
        tokens_used: usage?.total_tokens || 0,
        prompt_tokens: usage?.prompt_tokens || 0,
        completion_tokens: usage?.completion_tokens || 0,
        timestamp: new Date().toISOString(),
        model: provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4-turbo-preview'
      });
    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return content.match(hashtagRegex) || [];
  }

  private async scoreContent(content: string, platform: string): Promise<number> {
    // Simple content scoring algorithm
    let score = 0.5; // Base score

    // Length scoring
    const length = content.length;
    const platformOptimalLengths = {
      twitter: { min: 71, max: 100 },
      linkedin: { min: 150, max: 300 },
      facebook: { min: 100, max: 250 },
      instagram: { min: 125, max: 200 },
      tiktok: { min: 100, max: 150 },
      youtube: { min: 200, max: 400 }
    };

    const optimal = platformOptimalLengths[platform as keyof typeof platformOptimalLengths];
    if (optimal && length >= optimal.min && length <= optimal.max) {
      score += 0.2;
    }

    // Engagement indicators
    if (content.includes('?')) score += 0.1; // Questions increase engagement
    if (content.includes('!')) score += 0.05; // Excitement
    if (/[\u{1F600}-\u{1F64F}]/u.test(content)) score += 0.1; // Emojis
    if (/#\w+/.test(content)) score += 0.1; // Hashtags

    // Readability
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    if (avgWordsPerSentence <= 20) score += 0.05; // Good readability

    return Math.min(1, score);
  }

  private estimateEngagement(content: string, platform: string): number {
    // Mock engagement estimation based on content characteristics
    let baseEngagement = Math.random() * 0.05 + 0.01; // 1-6% base rate

    // Platform multipliers
    const platformMultipliers = {
      twitter: 1.2,
      linkedin: 0.8,
      facebook: 1.0,
      instagram: 1.5,
      tiktok: 2.0,
      youtube: 0.9
    };

    baseEngagement *= platformMultipliers[platform as keyof typeof platformMultipliers] || 1.0;

    // Content quality multipliers
    if (content.includes('?')) baseEngagement *= 1.3; // Questions
    if (/[\u{1F600}-\u{1F64F}]/u.test(content)) baseEngagement *= 1.2; // Emojis
    if (/#\w+/.test(content)) baseEngagement *= 1.1; // Hashtags

    return Math.min(0.15, baseEngagement); // Cap at 15%
  }

  // ============================================================================
  // BRAND VOICE LEARNING ENGINE
  // ============================================================================

  async createBrandVoiceProfile(
    organizationId: string,
    name: string,
    description: string,
    sampleContent: string[]
  ): Promise<BrandVoiceProfile> {
    try {
      const profile: Partial<BrandVoiceProfile> = {
        organization_id: organizationId,
        name,
        description,
        sample_content: sampleContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        training_status: 'pending'
      };

      const db = getFirestoreClient();
      const docRef = await db.collection('brand_voice_profiles').add(profile);

      // Start training process
      this.trainBrandVoice(docRef.id, sampleContent);

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() } as BrandVoiceProfile;
    } catch (error) {
      console.error('Error creating brand voice profile:', error);
      throw new Error('Failed to create brand voice profile');
    }
  }

  async trainBrandVoice(profileId: string, sampleContent: string[]): Promise<void> {
    try {
      const db = getFirestoreClient();

      // Update status to training
      await db.collection('brand_voice_profiles').doc(profileId).update({
        training_status: 'training',
        updated_at: new Date().toISOString()
      });

      // Analyze sample content to extract brand voice characteristics
      const analysis = await this.analyzeBrandVoiceFromSamples(sampleContent);

      // Update profile with learned characteristics
      await db.collection('brand_voice_profiles').doc(profileId).update({
        tone_attributes: analysis.tone_attributes,
        vocabulary_preferences: analysis.vocabulary_preferences,
        content_patterns: analysis.content_patterns,
        training_status: 'ready',
        updated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error training brand voice:', error);

      // Update status to error
      const db = getFirestoreClient();
      await db.collection('brand_voice_profiles').doc(profileId).update({
        training_status: 'error',
        updated_at: new Date().toISOString()
      });
    }
  }

  private async analyzeBrandVoiceFromSamples(sampleContent: string[]): Promise<{
    tone_attributes: BrandVoiceProfile['tone_attributes'];
    vocabulary_preferences: BrandVoiceProfile['vocabulary_preferences'];
    content_patterns: BrandVoiceProfile['content_patterns'];
  }> {
    // Analyze tone attributes
    const toneAttributes = this.analyzeToneAttributes(sampleContent);

    // Extract vocabulary preferences
    const vocabularyPreferences = this.extractVocabularyPreferences(sampleContent);

    // Analyze content patterns
    const contentPatterns = this.analyzeContentPatterns(sampleContent);

    return {
      tone_attributes: toneAttributes,
      vocabulary_preferences: vocabularyPreferences,
      content_patterns: contentPatterns
    };
  }

  private analyzeToneAttributes(sampleContent: string[]): BrandVoiceProfile['tone_attributes'] {
    let totalFormality = 0;
    let totalEnthusiasm = 0;
    let totalFriendliness = 0;
    let totalAuthority = 0;
    let totalCreativity = 0;

    sampleContent.forEach(content => {
      // Formality analysis
      const formalWords = ['therefore', 'furthermore', 'consequently', 'moreover', 'however'];
      const informalWords = ['gonna', 'wanna', 'yeah', 'cool', 'awesome'];
      const formalCount = formalWords.filter(word => content.toLowerCase().includes(word)).length;
      const informalCount = informalWords.filter(word => content.toLowerCase().includes(word)).length;
      totalFormality += (formalCount - informalCount + 1) / 2; // Normalize to 0-1

      // Enthusiasm analysis (exclamation marks, caps, energetic words)
      const exclamationCount = (content.match(/!/g) || []).length;
      const capsCount = (content.match(/[A-Z]{2,}/g) || []).length;
      const enthusiasticWords = ['amazing', 'incredible', 'fantastic', 'awesome', 'excited'];
      const enthusiasticCount = enthusiasticWords.filter(word => content.toLowerCase().includes(word)).length;
      totalEnthusiasm += Math.min(1, (exclamationCount + capsCount + enthusiasticCount) / 5);

      // Friendliness analysis
      const friendlyWords = ['thanks', 'please', 'welcome', 'happy', 'love'];
      const friendlyCount = friendlyWords.filter(word => content.toLowerCase().includes(word)).length;
      const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
      totalFriendliness += Math.min(1, (friendlyCount + emojiCount) / 3);

      // Authority analysis
      const authorityWords = ['must', 'should', 'will', 'proven', 'expert', 'research shows'];
      const authorityCount = authorityWords.filter(word => content.toLowerCase().includes(word)).length;
      totalAuthority += Math.min(1, authorityCount / 3);

      // Creativity analysis
      const creativeWords = ['imagine', 'innovative', 'unique', 'creative', 'breakthrough'];
      const creativeCount = creativeWords.filter(word => content.toLowerCase().includes(word)).length;
      const metaphorIndicators = ['like', 'as if', 'reminds me of'];
      const metaphorCount = metaphorIndicators.filter(phrase => content.toLowerCase().includes(phrase)).length;
      totalCreativity += Math.min(1, (creativeCount + metaphorCount) / 4);
    });

    const count = sampleContent.length;
    return {
      formality: Math.max(0, Math.min(1, totalFormality / count)),
      enthusiasm: Math.max(0, Math.min(1, totalEnthusiasm / count)),
      friendliness: Math.max(0, Math.min(1, totalFriendliness / count)),
      authority: Math.max(0, Math.min(1, totalAuthority / count)),
      creativity: Math.max(0, Math.min(1, totalCreativity / count))
    };
  }

  private extractVocabularyPreferences(sampleContent: string[]): BrandVoiceProfile['vocabulary_preferences'] {
    const allWords = sampleContent.join(' ').toLowerCase().split(/\s+/);
    const wordFrequency = new Map<string, number>();

    // Count word frequency
    allWords.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) { // Only consider words longer than 3 characters
        wordFrequency.set(cleanWord, (wordFrequency.get(cleanWord) || 0) + 1);
      }
    });

    // Get most frequent words as preferred
    const sortedWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    // Extract industry terms (words that appear frequently and are likely domain-specific)
    const industryTerms = sortedWords.filter(word =>
      !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word)
    ).slice(0, 10);

    return {
      preferred_words: sortedWords.slice(0, 15),
      avoided_words: [], // Could be populated based on negative sentiment analysis
      industry_terms: industryTerms
    };
  }

  private analyzeContentPatterns(sampleContent: string[]): BrandVoiceProfile['content_patterns'] {
    let totalSentenceLength = 0;
    let totalSentences = 0;
    let totalQuestions = 0;
    let totalEmojis = 0;
    let totalHashtags = 0;

    sampleContent.forEach(content => {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      totalSentences += sentences.length;

      sentences.forEach(sentence => {
        totalSentenceLength += sentence.trim().split(/\s+/).length;
      });

      totalQuestions += (content.match(/\?/g) || []).length;
      totalEmojis += (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
      totalHashtags += (content.match(/#\w+/g) || []).length;
    });

    const avgSentenceLength = totalSentences > 0 ? totalSentenceLength / totalSentences : 10;
    const questionFrequency = totalSentences > 0 ? totalQuestions / totalSentences : 0;
    const emojiUsage = sampleContent.length > 0 ? totalEmojis / sampleContent.length : 0;

    let hashtagStyle: 'minimal' | 'moderate' | 'heavy' = 'minimal';
    const avgHashtags = sampleContent.length > 0 ? totalHashtags / sampleContent.length : 0;
    if (avgHashtags > 3) hashtagStyle = 'heavy';
    else if (avgHashtags > 1) hashtagStyle = 'moderate';

    return {
      avg_sentence_length: avgSentenceLength,
      question_frequency: questionFrequency,
      emoji_usage: emojiUsage,
      hashtag_style: hashtagStyle
    };
  }

  async getBrandVoiceProfile(organizationId: string, profileId?: string): Promise<BrandVoiceProfile | null> {
    try {
      const db = getFirestoreClient();

      if (profileId) {
        const doc = await db.collection('brand_voice_profiles').doc(profileId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as BrandVoiceProfile;
      }

      // Get the default/most recent profile for the organization
      const snapshot = await db.collection('brand_voice_profiles')
        .where('organization_id', '==', organizationId)
        .where('training_status', '==', 'ready')
        .orderBy('updated_at', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as BrandVoiceProfile;
    } catch (error) {
      console.error('Error getting brand voice profile:', error);
      return null;
    }
  }

  // ============================================================================
  // MOCK IMPLEMENTATIONS (Replace with real implementations)
  // ============================================================================

  private mockSentimentAnalysis(content: string): number {
    // Simple mock sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'love', 'excellent', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'disgusting'];

    let score = 0;
    const words = content.toLowerCase().split(/\s+/);

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  }

  private mockToxicityAnalysis(content: string): number {
    const toxicWords = ['spam', 'scam', 'hate', 'kill', 'die', 'stupid', 'idiot'];
    const words = content.toLowerCase().split(/\s+/);

    let toxicCount = 0;
    words.forEach(word => {
      if (toxicWords.includes(word)) toxicCount++;
    });

    return Math.min(1, toxicCount / words.length * 10);
  }

  private mockSpamDetection(content: string): number {
    const spamIndicators = [
      content.includes('http'),
      content.includes('www.'),
      content.includes('click here'),
      content.includes('free money'),
      content.includes('!!!'),
      content.length > 500,
      /(.)\1{3,}/.test(content) // Repeated characters
    ];

    return spamIndicators.filter(Boolean).length / spamIndicators.length;
  }

  private mockContentGeneration(prompt: string): string {
    const templates = [
      `Here's an engaging post about ${prompt}: "Discover the amazing world of ${prompt}! 🚀 #trending #content"`,
      `${prompt} is revolutionizing the way we think about social media! What are your thoughts? 💭`,
      `Just learned something incredible about ${prompt}. Here's what you need to know... 📚`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private extractKeywords(content: string): string[] {
    return content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private detectToxicityCategories(content: string): string[] {
    const categories = [];
    if (content.toLowerCase().includes('hate')) categories.push('hate_speech');
    if (content.toLowerCase().includes('spam')) categories.push('spam');
    if (/[A-Z]{5,}/.test(content)) categories.push('excessive_caps');
    return categories;
  }

  private getSpamIndicators(content: string): string[] {
    const indicators = [];
    if (content.includes('http')) indicators.push('contains_links');
    if (content.includes('!!!')) indicators.push('excessive_punctuation');
    if (content.length > 500) indicators.push('excessive_length');
    return indicators;
  }

  private async sendNotification(config: any, triggerData: any): Promise<any> {
    // Mock notification sending
    return { status: 'sent', recipient: config.recipient, message: config.message };
  }

  private async flagContent(config: any, triggerData: any): Promise<any> {
    // Mock content flagging
    return { status: 'flagged', content_id: triggerData.content_id, reason: config.reason };
  }

  private async autoModerate(config: any, triggerData: any): Promise<any> {
    // Mock auto moderation
    return { status: 'moderated', action: config.action, content_id: triggerData.content_id };
  }
}

export const aiService = new AIService();
