import { getFirestoreClient } from './database.js';
import { AIAnalysis, AutomationRule, AutomationExecution } from '../types/database.js';

// Mock OpenAI API - Replace with actual OpenAI integration
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || 'mock-api-key';
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

  async generateContent(prompt: string, organizationId: string): Promise<string> {
    try {
      // Mock content generation - Replace with actual OpenAI API call
      if (this.apiKey === 'mock-api-key') {
        return this.mockContentGeneration(prompt);
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful social media content creator. Generate engaging, professional content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json() as OpenAIResponse;
      return data.choices?.[0]?.message?.content || 'Failed to generate content';
    } catch (error) {
      console.error('Error generating content:', error);
      return this.mockContentGeneration(prompt);
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
