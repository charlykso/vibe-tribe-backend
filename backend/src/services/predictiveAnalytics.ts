import { getFirestoreClient } from './database.js';
import { aiService } from './ai.js';

interface ContentMetrics {
  engagement_rate: number;
  reach: number;
  impressions: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  saves?: number;
}

interface PerformancePrediction {
  id?: string;
  organization_id: string;
  content_id: string;
  content_text: string;
  platform: string;
  predicted_metrics: ContentMetrics;
  confidence_score: number;
  factors: {
    content_quality: number;
    timing: number;
    hashtags: number;
    length: number;
    sentiment: number;
    trending_topics: number;
  };
  recommendations: string[];
  created_at: string;
  actual_metrics?: ContentMetrics;
  accuracy_score?: number;
}

interface HistoricalData {
  platform: string;
  content_type: string;
  metrics: ContentMetrics;
  content_features: {
    length: number;
    hashtag_count: number;
    emoji_count: number;
    question_count: number;
    sentiment_score: number;
    posting_hour: number;
    posting_day: number;
  };
  timestamp: string;
}

export class PredictiveAnalyticsService {
  private db: any = null;

  private ensureDbConnection() {
    if (!this.db) {
      try {
        this.db = getFirestoreClient();
      } catch (error) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
      }
    }
    return this.db;
  }

  // ============================================================================
  // CONTENT PERFORMANCE PREDICTION
  // ============================================================================

  async predictContentPerformance(
    organizationId: string,
    contentId: string,
    contentText: string,
    platform: string,
    scheduledTime?: Date
  ): Promise<PerformancePrediction> {
    try {
      // Analyze content features
      const contentFeatures = await this.extractContentFeatures(contentText, scheduledTime);
      
      // Get historical performance data
      const historicalData = await this.getHistoricalData(organizationId, platform);
      
      // Calculate prediction using ML model (simplified version)
      const prediction = await this.calculatePrediction(
        contentFeatures,
        historicalData,
        platform
      );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        contentFeatures,
        prediction,
        platform
      );

      const performancePrediction: PerformancePrediction = {
        organization_id: organizationId,
        content_id: contentId,
        content_text: contentText,
        platform,
        predicted_metrics: prediction.metrics,
        confidence_score: prediction.confidence,
        factors: prediction.factors,
        recommendations,
        created_at: new Date().toISOString()
      };

      // Save prediction to database
      const docRef = await this.ensureDbConnection().collection('performance_predictions').add(performancePrediction);
      const doc = await docRef.get();
      
      return { id: doc.id, ...doc.data() } as PerformancePrediction;
    } catch (error) {
      console.error('Error predicting content performance:', error);
      throw new Error('Failed to predict content performance');
    }
  }

  async updateActualMetrics(
    predictionId: string,
    actualMetrics: ContentMetrics
  ): Promise<void> {
    try {
      const predictionRef = this.ensureDbConnection().collection('performance_predictions').doc(predictionId);
      const predictionDoc = await predictionRef.get();
      
      if (!predictionDoc.exists) {
        throw new Error('Prediction not found');
      }

      const prediction = predictionDoc.data() as PerformancePrediction;
      const accuracyScore = this.calculateAccuracyScore(
        prediction.predicted_metrics,
        actualMetrics
      );

      await predictionRef.update({
        actual_metrics: actualMetrics,
        accuracy_score: accuracyScore,
        updated_at: new Date().toISOString()
      });

      // Store as historical data for future predictions
      await this.storeHistoricalData(prediction, actualMetrics);
    } catch (error) {
      console.error('Error updating actual metrics:', error);
      throw new Error('Failed to update actual metrics');
    }
  }

  // ============================================================================
  // OPTIMAL TIMING PREDICTION
  // ============================================================================

  async predictOptimalPostingTime(
    organizationId: string,
    platform: string,
    contentType: string = 'post'
  ): Promise<{
    optimal_times: Array<{ hour: number; day: number; score: number }>;
    timezone: string;
    confidence: number;
  }> {
    try {
      const historicalData = await this.getHistoricalData(organizationId, platform);
      
      // Analyze posting time patterns
      const timeAnalysis = this.analyzePostingTimes(historicalData);
      
      return {
        optimal_times: timeAnalysis.optimal_times,
        timezone: 'UTC', // Should be configurable per organization
        confidence: timeAnalysis.confidence
      };
    } catch (error) {
      console.error('Error predicting optimal posting time:', error);
      throw new Error('Failed to predict optimal posting time');
    }
  }

  // ============================================================================
  // TRENDING TOPICS ANALYSIS
  // ============================================================================

  async analyzeTrendingTopics(
    organizationId: string,
    platform: string,
    industry?: string
  ): Promise<{
    trending_topics: Array<{
      topic: string;
      score: number;
      growth_rate: number;
      related_hashtags: string[];
    }>;
    updated_at: string;
  }> {
    try {
      // This would integrate with platform APIs and trend analysis services
      // For now, return mock trending topics
      const trendingTopics = [
        {
          topic: 'AI Technology',
          score: 0.95,
          growth_rate: 0.25,
          related_hashtags: ['#AI', '#Technology', '#Innovation', '#MachineLearning']
        },
        {
          topic: 'Sustainability',
          score: 0.87,
          growth_rate: 0.18,
          related_hashtags: ['#Sustainability', '#GreenTech', '#ClimateChange', '#EcoFriendly']
        },
        {
          topic: 'Remote Work',
          score: 0.82,
          growth_rate: 0.12,
          related_hashtags: ['#RemoteWork', '#WorkFromHome', '#DigitalNomad', '#Productivity']
        }
      ];

      return {
        trending_topics: trendingTopics,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing trending topics:', error);
      throw new Error('Failed to analyze trending topics');
    }
  }

  // ============================================================================
  // COMPETITOR ANALYSIS
  // ============================================================================

  async analyzeCompetitorPerformance(
    organizationId: string,
    competitorHandles: string[],
    platform: string,
    timeframe: number = 30 // days
  ): Promise<{
    competitors: Array<{
      handle: string;
      avg_engagement_rate: number;
      posting_frequency: number;
      top_content_types: string[];
      growth_rate: number;
    }>;
    benchmarks: {
      industry_avg_engagement: number;
      optimal_posting_frequency: number;
      top_performing_content_types: string[];
    };
    recommendations: string[];
  }> {
    try {
      // This would integrate with social media APIs to fetch competitor data
      // For now, return mock competitor analysis
      const competitors = competitorHandles.map(handle => ({
        handle,
        avg_engagement_rate: Math.random() * 0.1 + 0.02, // 2-12%
        posting_frequency: Math.floor(Math.random() * 10) + 3, // 3-13 posts per week
        top_content_types: ['image', 'video', 'text'],
        growth_rate: Math.random() * 0.2 - 0.05 // -5% to +15%
      }));

      const benchmarks = {
        industry_avg_engagement: 0.045, // 4.5%
        optimal_posting_frequency: 7, // posts per week
        top_performing_content_types: ['video', 'image', 'carousel']
      };

      const recommendations = [
        'Increase video content to match top performers',
        'Post during peak engagement hours (2-4 PM)',
        'Use trending hashtags to improve discoverability',
        'Engage more with audience comments to boost engagement'
      ];

      return {
        competitors,
        benchmarks,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing competitor performance:', error);
      throw new Error('Failed to analyze competitor performance');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async extractContentFeatures(
    content: string,
    scheduledTime?: Date
  ): Promise<any> {
    const now = scheduledTime || new Date();
    
    return {
      length: content.length,
      hashtag_count: (content.match(/#\w+/g) || []).length,
      emoji_count: (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length,
      question_count: (content.match(/\?/g) || []).length,
      sentiment_score: await this.getSentimentScore(content),
      posting_hour: now.getHours(),
      posting_day: now.getDay(),
      has_url: /https?:\/\//.test(content),
      word_count: content.split(/\s+/).length
    };
  }

  private async generateRecommendations(
    contentFeatures: any,
    prediction: any,
    platform: string
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Content length recommendations
    if (contentFeatures.length < 50) {
      recommendations.push('Consider adding more detail to your content for better engagement');
    } else if (contentFeatures.length > 300 && platform === 'twitter') {
      recommendations.push('Consider shortening your content for Twitter to improve readability');
    }

    // Hashtag recommendations
    if (contentFeatures.hashtag_count === 0) {
      recommendations.push('Add 3-5 relevant hashtags to improve discoverability');
    } else if (contentFeatures.hashtag_count > 10) {
      recommendations.push('Reduce hashtags to 5-7 for better engagement');
    }

    // Emoji recommendations
    if (contentFeatures.emoji_count === 0 && platform !== 'linkedin') {
      recommendations.push('Add 1-2 emojis to make your content more engaging');
    }

    // Question recommendations
    if (contentFeatures.question_count === 0) {
      recommendations.push('Consider adding a question to encourage audience interaction');
    }

    // Timing recommendations
    if (contentFeatures.posting_hour < 9 || contentFeatures.posting_hour > 17) {
      recommendations.push('Consider posting during business hours (9 AM - 5 PM) for better reach');
    }

    // Sentiment recommendations
    if (contentFeatures.sentiment_score < 0) {
      recommendations.push('Consider using more positive language to improve engagement');
    }

    return recommendations;
  }

  private calculateAccuracyScore(
    predicted: ContentMetrics,
    actual: ContentMetrics
  ): number {
    const metrics = ['engagement_rate', 'reach', 'impressions', 'clicks', 'shares', 'comments', 'likes'];
    let totalAccuracy = 0;
    let validMetrics = 0;

    metrics.forEach(metric => {
      const predictedValue = predicted[metric as keyof ContentMetrics] as number;
      const actualValue = actual[metric as keyof ContentMetrics] as number;

      if (predictedValue && actualValue) {
        const accuracy = 1 - Math.abs(predictedValue - actualValue) / Math.max(predictedValue, actualValue);
        totalAccuracy += Math.max(0, accuracy);
        validMetrics++;
      }
    });

    return validMetrics > 0 ? totalAccuracy / validMetrics : 0;
  }

  private async storeHistoricalData(
    prediction: PerformancePrediction,
    actualMetrics: ContentMetrics
  ): Promise<void> {
    try {
      const contentFeatures = await this.extractContentFeatures(prediction.content_text);

      const historicalData: HistoricalData = {
        platform: prediction.platform,
        content_type: 'post', // Could be extracted from content analysis
        metrics: actualMetrics,
        content_features: contentFeatures,
        timestamp: new Date().toISOString()
      };

      await this.ensureDbConnection().collection('historical_performance').add({
        organization_id: prediction.organization_id,
        ...historicalData
      });
    } catch (error) {
      console.error('Error storing historical data:', error);
    }
  }

  private analyzePostingTimes(historicalData: HistoricalData[]): {
    optimal_times: Array<{ hour: number; day: number; score: number }>;
    confidence: number;
  } {
    const timePerformance = new Map<string, { total: number; count: number }>();

    // Analyze historical performance by time
    historicalData.forEach(data => {
      const hour = data.content_features.posting_hour;
      const day = data.content_features.posting_day;
      const key = `${day}-${hour}`;

      const existing = timePerformance.get(key) || { total: 0, count: 0 };
      timePerformance.set(key, {
        total: existing.total + data.metrics.engagement_rate,
        count: existing.count + 1
      });
    });

    // Calculate average performance for each time slot
    const optimalTimes = Array.from(timePerformance.entries())
      .map(([key, data]) => {
        const [day, hour] = key.split('-').map(Number);
        return {
          hour,
          day,
          score: data.total / data.count
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 optimal times

    const confidence = historicalData.length > 50 ? 0.9 : historicalData.length / 50 * 0.9;

    return {
      optimal_times: optimalTimes,
      confidence
    };
  }

  // ============================================================================
  // PUBLIC ANALYTICS METHODS
  // ============================================================================

  async getPerformanceTrends(
    organizationId: string,
    platform: string,
    timeframe: number = 30
  ): Promise<{
    trends: Array<{
      date: string;
      avg_engagement: number;
      total_posts: number;
      reach: number;
    }>;
    growth_rate: number;
    insights: string[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeframe * 24 * 60 * 60 * 1000);

      const snapshot = await this.ensureDbConnection().collection('historical_performance')
        .where('organization_id', '==', organizationId)
        .where('platform', '==', platform)
        .where('timestamp', '>=', startDate.toISOString())
        .where('timestamp', '<=', endDate.toISOString())
        .orderBy('timestamp', 'asc')
        .get();

      const dailyData = new Map<string, { engagement: number; posts: number; reach: number }>();

      snapshot.docs.forEach(doc => {
        const data = doc.data() as HistoricalData & { organization_id: string };
        const date = data.timestamp.split('T')[0];

        const existing = dailyData.get(date) || { engagement: 0, posts: 0, reach: 0 };
        dailyData.set(date, {
          engagement: existing.engagement + data.metrics.engagement_rate,
          posts: existing.posts + 1,
          reach: existing.reach + data.metrics.reach
        });
      });

      const trends = Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        avg_engagement: data.posts > 0 ? data.engagement / data.posts : 0,
        total_posts: data.posts,
        reach: data.reach
      }));

      // Calculate growth rate
      const firstWeek = trends.slice(0, 7);
      const lastWeek = trends.slice(-7);
      const firstWeekAvg = firstWeek.reduce((sum, day) => sum + day.avg_engagement, 0) / firstWeek.length;
      const lastWeekAvg = lastWeek.reduce((sum, day) => sum + day.avg_engagement, 0) / lastWeek.length;
      const growthRate = firstWeekAvg > 0 ? (lastWeekAvg - firstWeekAvg) / firstWeekAvg : 0;

      // Generate insights
      const insights = this.generatePerformanceInsights(trends, growthRate);

      return {
        trends,
        growth_rate: growthRate,
        insights
      };
    } catch (error) {
      console.error('Error getting performance trends:', error);
      throw new Error('Failed to get performance trends');
    }
  }

  private generatePerformanceInsights(
    trends: Array<{ date: string; avg_engagement: number; total_posts: number; reach: number }>,
    growthRate: number
  ): string[] {
    const insights: string[] = [];

    if (growthRate > 0.1) {
      insights.push('Your engagement rate has improved significantly over the past month');
    } else if (growthRate < -0.1) {
      insights.push('Your engagement rate has declined - consider reviewing your content strategy');
    }

    const avgPosts = trends.reduce((sum, day) => sum + day.total_posts, 0) / trends.length;
    if (avgPosts < 1) {
      insights.push('Consider posting more frequently to maintain audience engagement');
    } else if (avgPosts > 3) {
      insights.push('You\'re posting frequently - ensure quality remains high');
    }

    const bestDay = trends.reduce((best, current) =>
      current.avg_engagement > best.avg_engagement ? current : best
    );
    insights.push(`Your best performing day was ${bestDay.date} with ${(bestDay.avg_engagement * 100).toFixed(1)}% engagement`);

    return insights;
  }

  private async getSentimentScore(content: string): Promise<number> {
    try {
      // Use existing AI service for sentiment analysis
      const analysis = await aiService.analyzeSentiment(content, 'temp', 'temp');
      return analysis.result.score || 0;
    } catch (error) {
      return 0; // Neutral sentiment as fallback
    }
  }

  private async getHistoricalData(
    organizationId: string,
    platform: string
  ): Promise<HistoricalData[]> {
    try {
      const snapshot = await this.ensureDbConnection().collection('historical_performance')
        .where('organization_id', '==', organizationId)
        .where('platform', '==', platform)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      return snapshot.docs.map(doc => doc.data() as HistoricalData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  private async calculatePrediction(
    contentFeatures: any,
    historicalData: HistoricalData[],
    platform: string
  ): Promise<{
    metrics: ContentMetrics;
    confidence: number;
    factors: any;
  }> {
    // Simplified ML prediction algorithm
    // In production, this would use a trained ML model
    
    let baseEngagement = 0.03; // 3% base engagement rate
    let confidence = 0.7;
    
    // Adjust based on content features
    if (contentFeatures.hashtag_count > 0 && contentFeatures.hashtag_count <= 5) {
      baseEngagement *= 1.2;
    }
    
    if (contentFeatures.emoji_count > 0) {
      baseEngagement *= 1.1;
    }
    
    if (contentFeatures.question_count > 0) {
      baseEngagement *= 1.15;
    }
    
    if (contentFeatures.sentiment_score > 0.1) {
      baseEngagement *= 1.1;
    }
    
    // Platform-specific adjustments
    const platformMultipliers = {
      twitter: 1.0,
      linkedin: 0.8,
      facebook: 0.9,
      instagram: 1.3,
      tiktok: 2.0,
      youtube: 0.7
    };
    
    baseEngagement *= platformMultipliers[platform as keyof typeof platformMultipliers] || 1.0;
    
    // Estimate other metrics based on engagement
    const estimatedReach = Math.floor(Math.random() * 5000) + 1000;
    const estimatedImpressions = estimatedReach * (Math.random() * 2 + 1);
    const estimatedEngagements = Math.floor(estimatedImpressions * baseEngagement);
    
    return {
      metrics: {
        engagement_rate: baseEngagement,
        reach: estimatedReach,
        impressions: estimatedImpressions,
        clicks: Math.floor(estimatedEngagements * 0.3),
        shares: Math.floor(estimatedEngagements * 0.1),
        comments: Math.floor(estimatedEngagements * 0.2),
        likes: Math.floor(estimatedEngagements * 0.7),
        saves: Math.floor(estimatedEngagements * 0.05)
      },
      confidence,
      factors: {
        content_quality: Math.min(1, contentFeatures.sentiment_score + 0.5),
        timing: Math.random() * 0.3 + 0.7,
        hashtags: Math.min(1, contentFeatures.hashtag_count / 5),
        length: contentFeatures.length > 50 && contentFeatures.length < 200 ? 0.9 : 0.7,
        sentiment: Math.max(0, contentFeatures.sentiment_score),
        trending_topics: Math.random() * 0.4 + 0.6
      }
    };
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
