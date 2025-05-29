// Media API Service
import { apiClient, ApiResponse } from '../api';

export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumbnail_url?: string;
  alt_text?: string;
  created_at: string;
  organization_id: string;
  user_id: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class MediaService {
  // Upload single file
  static async uploadFile(
    file: File,
    options?: {
      alt_text?: string;
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<ApiResponse<{ file: MediaFile }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.alt_text) {
      formData.append('alt_text', options.alt_text);
    }

    // For progress tracking, we'd need to use XMLHttpRequest instead of fetch
    if (options?.onProgress) {
      return this.uploadWithProgress(formData, options.onProgress);
    }

    return apiClient.uploadFile<{ file: MediaFile }>('/media/upload', file, {
      alt_text: options?.alt_text,
    });
  }

  // Upload multiple files
  static async uploadFiles(
    files: File[],
    options?: {
      onProgress?: (fileIndex: number, progress: UploadProgress) => void;
    }
  ): Promise<ApiResponse<{ files: MediaFile[] }>> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/media/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? data.message ?? 'Upload failed');
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get media files
  static async getMediaFiles(params?: {
    type?: 'image' | 'video' | 'document';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ files: MediaFile[]; total: number }>> {
    const searchParams = new URLSearchParams();
    
    if (params?.type) searchParams.append('type', params.type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiClient.get<{ files: MediaFile[]; total: number }>(`/media${query ? `?${query}` : ''}`);
  }

  // Get single media file
  static async getMediaFile(fileId: string): Promise<ApiResponse<{ file: MediaFile }>> {
    return apiClient.get<{ file: MediaFile }>(`/media/${fileId}`);
  }

  // Delete media file
  static async deleteMediaFile(fileId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/media/${fileId}`);
  }

  // Upload with progress tracking
  private static uploadWithProgress(
    formData: FormData,
    onProgress: (progress: UploadProgress) => void
  ): Promise<ApiResponse<{ file: MediaFile }>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data,
              status: xhr.status,
            });
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.error ?? errorData.message ?? 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${import.meta.env.VITE_API_URL}/media/upload`);
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }

  // Mock data for development
  static getMockMediaFiles(): MediaFile[] {
    return [
      {
        id: '1',
        filename: 'product-screenshot.png',
        original_name: 'Product Screenshot.png',
        mime_type: 'image/png',
        size: 245760,
        url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=200&h=150&fit=crop',
        alt_text: 'Product dashboard screenshot',
        created_at: '2024-01-15T10:30:00Z',
        organization_id: 'org-1',
        user_id: 'user-1',
      },
      {
        id: '2',
        filename: 'team-photo.jpg',
        original_name: 'Team Photo.jpg',
        mime_type: 'image/jpeg',
        size: 512000,
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=150&fit=crop',
        alt_text: 'Team working together',
        created_at: '2024-01-14T15:20:00Z',
        organization_id: 'org-1',
        user_id: 'user-1',
      },
      {
        id: '3',
        filename: 'demo-video.mp4',
        original_name: 'Product Demo.mp4',
        mime_type: 'video/mp4',
        size: 15728640,
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop',
        alt_text: 'Product demonstration video',
        created_at: '2024-01-13T09:45:00Z',
        organization_id: 'org-1',
        user_id: 'user-1',
      },
    ];
  }

  // Upload with fallback to mock
  static async uploadFileWithFallback(
    file: File,
    options?: {
      alt_text?: string;
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<MediaFile> {
    try {
      const response = await this.uploadFile(file, options);
      return response.data?.file!;
    } catch (error) {
      if (import.meta.env.DEV && error instanceof TypeError) {
        console.warn('Backend not available, creating mock media file');
        
        // Simulate upload progress
        if (options?.onProgress) {
          const steps = [20, 40, 60, 80, 100];
          for (const percentage of steps) {
            await new Promise(resolve => setTimeout(resolve, 200));
            options.onProgress({
              loaded: (file.size * percentage) / 100,
              total: file.size,
              percentage,
            });
          }
        }

        const mockFile: MediaFile = {
          id: `file-${Date.now()}`,
          filename: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
          original_name: file.name,
          mime_type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          thumbnail_url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          alt_text: options?.alt_text,
          created_at: new Date().toISOString(),
          organization_id: 'org-1',
          user_id: 'user-1',
        };

        return mockFile;
      }
      throw error;
    }
  }

  // Get media files with fallback
  static async getMediaFilesWithFallback(params?: {
    type?: 'image' | 'video' | 'document';
    limit?: number;
    offset?: number;
  }): Promise<MediaFile[]> {
    try {
      const response = await this.getMediaFiles(params);
      return response.data?.files ?? [];
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Backend not available, using mock media files');
        let files = this.getMockMediaFiles();
        
        // Apply type filter
        if (params?.type) {
          files = files.filter(file => {
            if (params.type === 'image') return file.mime_type.startsWith('image/');
            if (params.type === 'video') return file.mime_type.startsWith('video/');
            if (params.type === 'document') return file.mime_type === 'application/pdf';
            return true;
          });
        }
        
        return files;
      }
      throw error;
    }
  }
}
