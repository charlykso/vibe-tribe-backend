// Communities API Service for VibeTribe
import { apiClient, ApiResponse } from '../api';

// ============================================================================
// TYPES
// ============================================================================

export interface Community {
  id: string;
  organization_id: string;
  name: string;
  platform: string;
  platform_community_id: string;
  description?: string;
  settings?: Record<string, any>;
  health_score: number;
  member_count: number;
  active_member_count: number;
  message_count: number;
  engagement_rate: number;
  sentiment_score: number;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  is_active: boolean;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  platform_user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  join_date?: string;
  engagement_score: number;
  sentiment_score: number;
  message_count: number;
  last_active_at?: string;
  last_message_at?: string;
  roles: string[]; // ['admin', 'moderator', 'member']
  tags: string[]; // ['vip', 'supporter', 'active', 'new']
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ModerationItem {
  id: string;
  community_id: string;
  type: 'post' | 'comment' | 'user' | 'report';
  content: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  platform: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  reportReason?: string;
  platform_content_id?: string;
  reporter_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommunityRequest {
  name: string;
  platform: string;
  platform_community_id: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface AddMemberRequest {
  platform_user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  roles?: string[];
  tags?: string[];
  join_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMemberRequest {
  status?: 'active' | 'inactive' | 'banned' | 'pending';
  role?: 'member' | 'moderator' | 'admin';
  roles?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// COMMUNITIES SERVICE
// ============================================================================

export class CommunitiesService {
  // Get all communities for organization
  static async getCommunities(): Promise<ApiResponse<{ communities: Community[] }>> {
    return apiClient.get<{ communities: Community[] }>('/communities');
  }

  // Get single community
  static async getCommunity(communityId: string): Promise<ApiResponse<{ community: Community }>> {
    return apiClient.get<{ community: Community }>(`/communities/${communityId}`);
  }

  // Create new community
  static async createCommunity(data: CreateCommunityRequest): Promise<ApiResponse<{ community: Community }>> {
    return apiClient.post<{ community: Community }>('/communities', data);
  }

  // Update community
  static async updateCommunity(communityId: string, data: Partial<CreateCommunityRequest>): Promise<ApiResponse<{ community: Community }>> {
    return apiClient.put<{ community: Community }>(`/communities/${communityId}`, data);
  }

  // Delete community
  static async deleteCommunity(communityId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/communities/${communityId}`);
  }

  // Get community members
  static async getCommunityMembers(
    communityId: string,
    params?: {
      limit?: number;
      offset?: number;
      search?: string;
      role?: string;
      status?: string;
    }
  ): Promise<ApiResponse<{ members: CommunityMember[]; total: number }>> {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    return apiClient.get<{ members: CommunityMember[]; total: number }>(
      `/communities/${communityId}/members${query ? `?${query}` : ''}`
    );
  }

  // Add community member
  static async addCommunityMember(communityId: string, data: AddMemberRequest): Promise<ApiResponse<{ member: CommunityMember }>> {
    return apiClient.post<{ member: CommunityMember }>(`/communities/${communityId}/members`, data);
  }

  // Update community member
  static async updateCommunityMember(
    communityId: string,
    memberId: string,
    data: UpdateMemberRequest
  ): Promise<ApiResponse<{ member: CommunityMember }>> {
    return apiClient.put<{ member: CommunityMember }>(`/communities/${communityId}/members/${memberId}`, data);
  }

  // Remove community member
  static async removeCommunityMember(communityId: string, memberId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/communities/${communityId}/members/${memberId}`);
  }

  // Get moderation queue
  static async getModerationQueue(
    communityId: string,
    params?: {
      limit?: number;
      offset?: number;
      status?: string;
      priority?: string;
      type?: string;
    }
  ): Promise<ApiResponse<{ items: ModerationItem[]; total: number }>> {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.type) searchParams.append('type', params.type);

    const query = searchParams.toString();
    return apiClient.get<{ items: ModerationItem[]; total: number }>(
      `/communities/${communityId}/moderation${query ? `?${query}` : ''}`
    );
  }

  // Update moderation item
  static async updateModerationItem(
    communityId: string,
    itemId: string,
    data: { status: 'approved' | 'rejected'; reason?: string }
  ): Promise<ApiResponse<{ item: ModerationItem }>> {
    return apiClient.put<{ item: ModerationItem }>(`/communities/${communityId}/moderation/${itemId}`, data);
  }

  // Refresh community statistics
  static async refreshCommunityStats(communityId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/communities/${communityId}/refresh-stats`);
  }
}
