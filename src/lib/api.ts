// API Client for Tribe Backend Integration
import { AuthService } from './auth';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    // Use deployed backend on Render for production
    this.baseURL = import.meta.env.VITE_API_URL || 'https://vibe-tribe-backend-8yvp.onrender.com/api/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token if available
    const token = AuthService.getTokenFromStorage();
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.error || data.message || 'Request failed',
          status: response.status,
          code: data.code,
        } as ApiError;
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // File upload
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const token = AuthService.getTokenFromStorage();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.error || data.message || 'Upload failed',
          status: response.status,
          code: data.code,
        } as ApiError;
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Dashboard API types
export interface DashboardMetrics {
  totalMembers: number;
  activeMembers: number;
  messagesToday: number;
  engagementRate: number;
  growth?: {
    members: number;
    active: number;
    messages: number;
    engagement: number;
  };
}

export interface Activity {
  id: number;
  type: string;
  title: string;
  time: string;
  icon: string;
}

export interface Community {
  name: string;
  members: number;
  status: string;
  change: number;
}

export interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  newMembersToday: number;
  engagementRate: number;
  communities: Community[];
}

// Mock data for fallback - will be replaced with real API data
const mockMetrics: DashboardMetrics = {
  totalMembers: 0, // Real data will be fetched from API
  activeMembers: 0, // Real data will be fetched from API
  messagesToday: 0, // Real data will be fetched from API
  engagementRate: 0, // Real data will be fetched from API
  growth: {
    members: 0, // Real data will be fetched from API
    active: 0, // Real data will be fetched from API
    messages: 0, // Real data will be fetched from API
    engagement: 0 // Real data will be fetched from API
  }
};

const mockActivities: Activity[] = [
  {
    id: 1,
    type: 'member_joined',
    title: 'John Smith joined the community',
    time: '2 minutes ago',
    icon: 'Users'
  },
  {
    id: 2,
    type: 'engagement',
    title: 'Post about product updates got 150+ reactions',
    time: '15 minutes ago',
    icon: 'Heart'
  },
  {
    id: 3,
    type: 'moderation',
    title: 'Spam message auto-removed in #general',
    time: '32 minutes ago',
    icon: 'AlertTriangle'
  },
  {
    id: 4,
    type: 'milestone',
    title: 'Community reached 25K members!',
    time: '1 hour ago',
    icon: 'CheckCircle'
  }
];

const mockCommunityStats: CommunityStats = {
  totalMembers: 24847,
  activeMembers: 18492,
  newMembersToday: 127,
  engagementRate: 74.8,
  communities: [
    { name: 'Discord Community', members: 15420, status: 'healthy', change: 5.2 },
    { name: 'Telegram Group', members: 8947, status: 'growing', change: 12.8 },
    { name: 'Slack Workspace', members: 2340, status: 'stable', change: -2.1 }
  ]
};

// Dashboard API functions with fallback to mock data
export const dashboardApi = {
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient.get<DashboardMetrics>('/analytics/overview');
      return response.data!;
    } catch (error) {
      console.warn('Backend not available, using mock data for metrics');
      return mockMetrics;
    }
  },

  async getActivity(): Promise<Activity[]> {
    try {
      const response = await apiClient.get<{ activities: Activity[] }>('/activity/recent');
      return response.data!.activities;
    } catch (error) {
      console.warn('Backend not available, using mock data for activities');
      return mockActivities;
    }
  },

  async getCommunityStats(): Promise<CommunityStats> {
    try {
      const response = await apiClient.get<CommunityStats>('/community/stats');
      return response.data!;
    } catch (error) {
      console.warn('Backend not available, using mock data for community stats');
      return mockCommunityStats;
    }
  },
};

// Auth API functions
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async register(email: string, password: string, name: string) {
    const response = await apiClient.post('/auth/register', { email, password, name });
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

// System API functions
export const systemApi = {
  async healthCheck(): Promise<boolean> {
    return apiClient.healthCheck();
  },
};

// Export types
export type { ApiClient };
