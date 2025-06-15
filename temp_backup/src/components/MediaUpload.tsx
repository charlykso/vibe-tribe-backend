import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Edit, Eye, Download, Trash2, Image as ImageIcon, Video, File } from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: number;
  url: string;
  thumbnail?: string;
  altText?: string;
  uploadProgress?: number;
}

export const MediaUpload = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mov', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not supported`);
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'document';

      const newFile: MediaFile = {
        id: fileId,
        name: file.name,
        type: fileType,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadProgress: 0
      };

      setMediaFiles(prev => [...prev, newFile]);

      // Simulate upload progress
      simulateUpload(fileId);
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        toast.success('File uploaded successfully!');
      }
      
      setMediaFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, uploadProgress: Math.round(progress) }
            : file
        )
      );
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success('File removed');
  };

  const updateAltText = (fileId: string, altText: string) => {
    setMediaFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, altText } : file
      )
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media Upload</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload and manage your media files
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop files here or click to upload
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Support for images, videos, and documents up to 10MB
            </p>
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Library */}
      {mediaFiles.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Media Library ({mediaFiles.length} files)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 space-y-3">
                  {/* File Preview */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {file.type === 'image' ? (
                      <img 
                        src={file.url} 
                        alt={file.altText || file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        {getFileIcon(file.type)}
                        <span className="text-sm mt-2">{file.name}</span>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {file.type}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>

                    {/* Upload Progress */}
                    {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                      <div className="space-y-1">
                        <Progress value={file.uploadProgress} className="h-2" />
                        <div className="text-xs text-gray-500">
                          Uploading... {file.uploadProgress}%
                        </div>
                      </div>
                    )}

                    {/* Alt Text for Images */}
                    {file.type === 'image' && (
                      <div className="space-y-1">
                        <Label htmlFor={`alt-${file.id}`} className="text-xs">
                          Alt Text (for accessibility)
                        </Label>
                        <Input
                          id={`alt-${file.id}`}
                          value={file.altText || ''}
                          onChange={(e) => updateAltText(file.id, e.target.value)}
                          placeholder="Describe this image..."
                          className="text-xs"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                        {file.type === 'image' && (
                          <Button variant="ghost" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
