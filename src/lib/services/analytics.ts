// Analytics API Service
import { apiClient, ApiResponse } from '../api';

export interface AnalyticsOverview {
  total_posts: number;
  total_engagement: number;
  total_reach: number;
  engagement_rate: number;
  top_platform: string;
  growth_rate: number;
}

export interface PostAnalytics {
  post_id: string;
  platform: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagement_rate: number;
  reach: number;
  created_at: string;
}

export interface PlatformAnalytics {
  platform: string;
  total_posts: number;
  total_engagement: number;
  total_reach: number;
  engagement_rate: number;
  follower_count: number;
  growth_rate: number;
}

export interface EngagementMetrics {
  date: string;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  engagement_rate: number;
}

export interface TopPost {
  id: string;
  content: string;
  platform: string;
  engagement_score: number;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  published_date: string;
}

export class AnalyticsService {
  // Get analytics overview
  static async getOverview(dateRange?: { start: string; end: string }): Promise<ApiResponse<AnalyticsOverview>> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start_date', dateRange.start);
      params.append('end_date', dateRange.end);
    }

    const query = params.toString();
    return apiClient.get<AnalyticsOverview>(`/analytics/overview${query ? `?${query}` : ''}`);
  }

  // Get post analytics
  static async getPostAnalytics(params?: {
    post_id?: string;
    platform?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{ posts: any[]; summary: any }>> {
    const searchParams = new URLSearchParams();

    if (params?.post_id) searchParams.append('post_id', params.post_id);
    if (params?.platform) searchParams.append('platform', params.platform);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    const query = searchParams.toString();
    return apiClient.get<{ posts: any[]; summary: any }>(`/analytics/posts${query ? `?${query}` : ''}`);
  }

  // Get platform analytics
  static async getPlatformAnalytics(): Promise<ApiResponse<{ platforms: any[] }>> {
    return apiClient.get<{ platforms: any[] }>('/analytics/platforms');
  }

  // Get engagement metrics
  static async getEngagementMetrics(dateRange?: { start: string; end: string }): Promise<ApiResponse<{ engagement_timeline: EngagementMetrics[]; platform_specific: any; summary: any }>> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start_date', dateRange.start);
      params.append('end_date', dateRange.end);
    }

    const query = params.toString();
    return apiClient.get<{ engagement_timeline: EngagementMetrics[]; platform_specific: any; summary: any }>(`/analytics/engagement${query ? `?${query}` : ''}`);
  }

  // Get top performing posts
  static async getTopPosts(limit = 10): Promise<ApiResponse<{ top_posts: TopPost[] }>> {
    return apiClient.get<{ top_posts: TopPost[] }>(`/analytics/top-posts?limit=${limit}`);
  }
}
