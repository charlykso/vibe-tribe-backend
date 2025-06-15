// Users API Service for VibeTribe
import { apiClient, ApiResponse } from '../api';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'active' | 'inactive' | 'pending' | 'banned';
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface UserStats {
  total_posts: number;
  total_reactions: number;
  engagement_score: number;
  level: string;
  badges: string[];
  last_seen: string;
  join_date: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role?: 'admin' | 'moderator' | 'member';
  avatar_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  name?: string;
  role?: 'admin' | 'moderator' | 'member';
  status?: 'active' | 'inactive' | 'pending' | 'banned';
  avatar_url?: string;
  metadata?: Record<string, any>;
}

export interface UserWithStats extends User {
  stats?: UserStats;
}

// ============================================================================
// USERS SERVICE
// ============================================================================

export class UsersService {
  // Get all users for organization
  static async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<{ 
    users: User[]; 
    pagination: { 
      page: number; 
      limit: number; 
      total: number; 
      pages: number; 
    } 
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    return apiClient.get<{ 
      users: User[]; 
      pagination: { 
        page: number; 
        limit: number; 
        total: number; 
        pages: number; 
      } 
    }>(`/users${query ? `?${query}` : ''}`);
  }

  // Get single user
  static async getUser(userId: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>(`/users/${userId}`);
  }

  // Get user with stats
  static async getUserWithStats(userId: string): Promise<ApiResponse<{ user: UserWithStats }>> {
    return apiClient.get<{ user: UserWithStats }>(`/users/${userId}/stats`);
  }

  // Create new user
  static async createUser(data: CreateUserRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post<{ user: User }>('/users', data);
  }

  // Update user
  static async updateUser(userId: string, data: UpdateUserRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>(`/users/${userId}`, data);
  }

  // Delete user
  static async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/users/${userId}`);
  }

  // Get current user profile
  static async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get<{ user: User }>('/users/me');
  }

  // Update current user profile
  static async updateCurrentUser(data: Partial<UpdateUserRequest>): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put<{ user: User }>('/users/me', data);
  }

  // Get organization members (for member management)
  static async getOrganizationMembers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<{ 
    members: UserWithStats[]; 
    pagination: { 
      page: number; 
      limit: number; 
      total: number; 
      pages: number; 
    } 
  }>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    return apiClient.get<{ 
      members: UserWithStats[]; 
      pagination: { 
        page: number; 
        limit: number; 
        total: number; 
        pages: number; 
      } 
    }>(`/users/organization/members${query ? `?${query}` : ''}`);
  }

  // Promote/demote user role
  static async updateUserRole(userId: string, role: 'admin' | 'moderator' | 'member'): Promise<ApiResponse<{ user: User }>> {
    return apiClient.patch<{ user: User }>(`/users/${userId}/role`, { role });
  }

  // Ban/unban user
  static async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'banned'): Promise<ApiResponse<{ user: User }>> {
    return apiClient.patch<{ user: User }>(`/users/${userId}/status`, { status });
  }
}
