import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Search,
  Download,
  Copy,
  Heart,
  FileText,
  Image,
  Video,
  File,
  Plus,
  Star,
  Loader2,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { ContentTemplatesService, ContentTemplate, ContentItem as APIContentItem } from '@/lib/services/content-templates';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'template' | 'document' | 'audio';
  url: string;
  thumbnail?: string;
  size: number;
  format: string;
  tags: string[];
  category: string;
  createdBy: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  lastModified: Date;
  downloads: number;
  likes: number;
  views: number;
  isPublic: boolean;
  isFavorite: boolean;
}

interface ContentTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  platform: string[];
  category: string;
  tags: string[];
  createdBy: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  uses: number;
  rating: number;
}

export const SharedContentLibrary: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch content items (media files)
  const {
    data: contentItemsData,
    isLoading: contentItemsLoading,
    error: contentItemsError
  } = useQuery({
    queryKey: ['content-items', filterCategory, searchTerm],
    queryFn: () => ContentTemplatesService.getContentItems({
      category: filterCategory,
      search: searchTerm,
      limit: 50
    }),
    refetchInterval: 30000
  });

  // Fetch content templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: ['content-templates', filterCategory, searchTerm],
    queryFn: () => ContentTemplatesService.getTemplates({
      category: filterCategory,
      search: searchTerm,
      limit: 50
    }),
    refetchInterval: 30000
  });

  const contentItems = contentItemsData?.data?.items || [];
  const templates = templatesData?.data?.templates || [];

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: ContentTemplatesService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ContentTemplatesService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: ContentTemplatesService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    }
  });

  const useTemplateMutation = useMutation({
    mutationFn: ContentTemplatesService.useTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to track template usage');
    }
  });

  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    platforms: [] as string[],
    tags: '',
    is_public: false
  });

  const categories = ContentTemplatesService.getTemplateCategories();
  const contentCategories = ContentTemplatesService.getContentCategories();
  const types = ['image', 'video', 'template', 'document', 'audio'];
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'];

  // Template handlers
  const handleCreateTemplate = async () => {
    if (!templateForm.title || !templateForm.content || !templateForm.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createTemplateMutation.mutateAsync({
        title: templateForm.title,
        description: templateForm.description,
        content: templateForm.content,
        category: templateForm.category,
        platforms: templateForm.platforms,
        tags: templateForm.tags ? templateForm.tags.split(',').map(tag => tag.trim()) : [],
        is_public: templateForm.is_public
      });

      // Reset form
      setTemplateForm({
        title: '',
        description: '',
        content: '',
        category: '',
        platforms: [],
        tags: '',
        is_public: false
      });
      setIsTemplateDialogOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      await useTemplateMutation.mutateAsync(templateId);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const filteredContent = contentItems.filter(item => {
    const searchMatch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    const typeMatch = filterType === 'all' || item.type === filterType;
    return searchMatch && categoryMatch && typeMatch;
  });

  const filteredTemplates = templates.filter(template => {
    const searchMatch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const categoryMatch = filterCategory === 'all' || template.category === filterCategory;
    return searchMatch && categoryMatch;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'document': return <FileText className="w-5 h-5 text-green-500" />;
      case 'template': return <FileText className="w-5 h-5 text-orange-500" />;
      default: return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (item: ContentItem) => {
    setContentItems(prev => 
      prev.map(content => 
        content.id === item.id 
          ? { ...content, downloads: content.downloads + 1 }
          : content
      )
    );
    toast({
      title: "Download Started",
      description: `Downloading ${item.title}`,
    });
  };

  const handleLike = (itemId: string) => {
    setContentItems(prev => 
      prev.map(content => 
        content.id === itemId 
          ? { ...content, likes: content.likes + 1 }
          : content
      )
    );
  };

  const handleFavorite = (itemId: string) => {
    setContentItems(prev => 
      prev.map(content => 
        content.id === itemId 
          ? { ...content, isFavorite: !content.isFavorite }
          : content
      )
    );
  };

  const copyTemplate = async (template: ContentTemplate) => {
    try {
      await navigator.clipboard.writeText(template.content);
      await handleUseTemplate(template.id);
      toast.success('Template copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy template');
    }
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter (for assets) */}
          {activeTab === 'assets' && (
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button variant="outline" className="mt-4">
                    Choose Files
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Template title"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Template description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <Textarea
                  placeholder="Template content (use [VARIABLE_NAME] for placeholders)"
                  className="min-h-[200px]"
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={templateForm.category}
                    onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Tags (comma separated)"
                    value={templateForm.tags}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={createTemplateMutation.isPending}
                  >
                    {createTemplateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assets">Assets ({contentItems.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          {contentItemsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading content items...</span>
            </div>
          ) : contentItemsError ? (
            <div className="text-center py-8 text-red-600">
              Failed to load content items. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {filteredContent.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="relative mb-3">
                    {item.type === 'image' || item.type === 'video' ? (
                      <img 
                        src={item.thumbnail || item.url} 
                        alt={item.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        {getFileIcon(item.type)}
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => handleFavorite(item.id)}
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(item.size)}</span>
                      <span>{item.format}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={item.createdBy.avatar} />
                          <AvatarFallback>{item.createdBy.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {item.createdBy.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLike(item.id)}
                        >
                          <Heart className="w-3 h-3" />
                          <span className="text-xs ml-1">{item.likes}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : templatesError ? (
            <div className="text-center py-8 text-red-600">
              Failed to load templates. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{template.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyTemplate(template)}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-hidden">
                      <pre className="text-sm whitespace-pre-wrap text-gray-900 dark:text-white line-clamp-4 overflow-hidden">
                        {template.content}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {template.platform.map(platform => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.tags && template.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t gap-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          Created by you
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{template.uses || 0} uses</span>
                        <span>⭐ {template.rating || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
