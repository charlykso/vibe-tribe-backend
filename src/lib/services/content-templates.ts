import { apiClient } from '../api';

export interface ContentTemplate {
  id: string;
  title: string;
  description?: string;
  content: string;
  platforms: string[];
  category: string;
  tags?: string[];
  is_public?: boolean;
  organization_id: string;
  created_by: string;
  uses: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  size: number;
  format: string;
  tags?: string[];
  category: string;
  created_by: {
    id: string;
    name: string;
    avatar: string;
  };
  created_at: string;
  last_modified: string;
  downloads: number;
  likes: number;
  views: number;
  is_public: boolean;
  is_favorite: boolean;
}

export interface CreateTemplateData {
  title: string;
  description?: string;
  content: string;
  platforms: string[];
  category: string;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

export interface TemplateFilters {
  category?: string;
  platform?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ContentTemplatesService {
  // Get content templates
  static async getTemplates(filters: TemplateFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.platform) {
      params.append('platform', filters.platform);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    const response = await apiClient.get(`/content-templates?${params.toString()}`);
    return response.data;
  }

  // Get specific template
  static async getTemplate(id: string) {
    const response = await apiClient.get(`/content-templates/${id}`);
    return response.data;
  }

  // Create new template
  static async createTemplate(data: CreateTemplateData) {
    const response = await apiClient.post('/content-templates', data);
    return response.data;
  }

  // Update template
  static async updateTemplate(id: string, data: UpdateTemplateData) {
    const response = await apiClient.put(`/content-templates/${id}`, data);
    return response.data;
  }

  // Delete template
  static async deleteTemplate(id: string) {
    const response = await apiClient.delete(`/content-templates/${id}`);
    return response.data;
  }

  // Track template usage
  static async useTemplate(id: string) {
    const response = await apiClient.post(`/content-templates/${id}/use`);
    return response.data;
  }

  // Get content items (media files)
  static async getContentItems(filters: { category?: string; search?: string; limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    // Use the existing media endpoint for content items
    const response = await apiClient.get(`/media?${params.toString()}`);
    
    // Transform media response to match ContentItem interface
    if (response.data?.files) {
      const transformedItems = response.data.files.map((file: any) => ({
        id: file.id || file.publicId,
        title: file.originalName || file.title || 'Untitled',
        description: file.description || '',
        type: file.resourceType === 'video' ? 'video' : 'image',
        url: file.url,
        thumbnail: file.url, // Use same URL for thumbnail for now
        size: file.size || 0,
        format: file.format?.toUpperCase() || 'UNKNOWN',
        tags: file.tags || [],
        category: file.category || 'General',
        created_by: {
          id: file.uploaded_by || 'unknown',
          name: 'User', // We'll need to enhance this with actual user data
          avatar: '/api/placeholder/32/32'
        },
        created_at: file.created_at || new Date().toISOString(),
        last_modified: file.updated_at || file.created_at || new Date().toISOString(),
        downloads: 0, // Not tracked in media service yet
        likes: 0, // Not tracked in media service yet
        views: 0, // Not tracked in media service yet
        is_public: file.is_public || false,
        is_favorite: false // Not tracked in media service yet
      }));

      return {
        success: true,
        data: {
          items: transformedItems,
          total: transformedItems.length
        }
      };
    }

    return response.data;
  }

  // Upload content item (delegate to media service)
  static async uploadContentItem(file: File, metadata?: { category?: string; tags?: string[]; description?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata?.category) {
      formData.append('category', metadata.category);
    }
    if (metadata?.tags) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }
    if (metadata?.description) {
      formData.append('description', metadata.description);
    }

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete content item (delegate to media service)
  static async deleteContentItem(id: string) {
    const response = await apiClient.delete(`/media/${id}`);
    return response.data;
  }

  // Get template categories
  static getTemplateCategories() {
    return [
      'Product',
      'Marketing',
      'Internal',
      'Social',
      'Educational',
      'Promotional',
      'Announcement',
      'Event',
      'Other'
    ];
  }

  // Get content categories
  static getContentCategories() {
    return [
      'Marketing',
      'Product',
      'Brand',
      'Social',
      'Educational',
      'Event',
      'General',
      'Other'
    ];
  }
}

export default ContentTemplatesService;
