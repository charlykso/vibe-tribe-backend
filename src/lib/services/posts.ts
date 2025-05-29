// Posts API Service
import { apiClient, ApiResponse } from '../api';

export interface Post {
  id: string;
  content: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_date?: string;
  published_date?: string;
  media_urls?: string[];
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  created_at: string;
  updated_at: string;
  organization_id: string;
  user_id: string;
}

export interface CreatePostData {
  content: string;
  platforms: string[];
  scheduled_date?: string;
  media_urls?: string[];
}

export interface UpdatePostData {
  content?: string;
  platforms?: string[];
  scheduled_date?: string;
  media_urls?: string[];
}

export class PostsService {
  // Get all posts
  static async getPosts(params?: {
    status?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ posts: Post[]; total: number }>> {
    const searchParams = new URLSearchParams();

    if (params?.status) searchParams.append('status', params.status);
    if (params?.platform) searchParams.append('platform', params.platform);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiClient.get<{ posts: Post[]; total: number }>(`/posts${query ? `?${query}` : ''}`);
  }

  // Get draft posts
  static async getDrafts(): Promise<ApiResponse<{ posts: Post[] }>> {
    return apiClient.get<{ posts: Post[] }>('/posts/drafts');
  }

  // Get scheduled posts
  static async getScheduledPosts(): Promise<ApiResponse<{ posts: Post[] }>> {
    return apiClient.get<{ posts: Post[] }>('/posts/scheduled');
  }

  // Get single post
  static async getPost(postId: string): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.get<{ post: Post }>(`/posts/${postId}`);
  }

  // Create new post
  static async createPost(data: CreatePostData): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.post<{ post: Post }>('/posts', data);
  }

  // Update post
  static async updatePost(postId: string, data: UpdatePostData): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.put<{ post: Post }>(`/posts/${postId}`, data);
  }

  // Delete post
  static async deletePost(postId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/posts/${postId}`);
  }

  // Publish post immediately
  static async publishPost(postId: string): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.post<{ post: Post }>(`/posts/${postId}/publish`);
  }

  // Schedule post for later
  static async schedulePost(postId: string, scheduledDate: string): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.post<{ post: Post }>(`/posts/${postId}/schedule`, { scheduled_date: scheduledDate });
  }






}
