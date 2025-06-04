import React, { useState } from 'react';
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
  Star
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Holiday Campaign Banner',
      description: 'Main banner for holiday campaign 2024',
      type: 'image',
      url: '/api/placeholder/400/300',
      thumbnail: '/api/placeholder/200/150',
      size: 2048000,
      format: 'PNG',
      tags: ['holiday', 'campaign', 'banner'],
      category: 'Marketing',
      createdBy: {
        id: '1',
        name: 'Emma Davis',
        avatar: '/api/placeholder/32/32'
      },
      createdAt: new Date('2024-01-10'),
      lastModified: new Date('2024-01-15'),
      downloads: 23,
      likes: 12,
      views: 156,
      isPublic: true,
      isFavorite: false
    },
    {
      id: '2',
      title: 'Product Demo Video',
      description: 'Short demo video showcasing key features',
      type: 'video',
      url: '/api/placeholder/video.mp4',
      thumbnail: '/api/placeholder/400/225',
      size: 15728640,
      format: 'MP4',
      tags: ['product', 'demo', 'features'],
      category: 'Product',
      createdBy: {
        id: '2',
        name: 'Sarah Johnson',
        avatar: '/api/placeholder/32/32'
      },
      createdAt: new Date('2024-01-08'),
      lastModified: new Date('2024-01-12'),
      downloads: 45,
      likes: 28,
      views: 234,
      isPublic: true,
      isFavorite: true
    }
  ]);

  const [templates, setTemplates] = useState<ContentTemplate[]>([
    {
      id: '1',
      title: 'Product Launch Announcement',
      description: 'Template for announcing new product launches',
      content: '🚀 Exciting news! We\'re thrilled to announce the launch of [PRODUCT_NAME]! \n\n✨ Key features:\n• [FEATURE_1]\n• [FEATURE_2]\n• [FEATURE_3]\n\nGet yours today: [LINK]\n\n#ProductLaunch #Innovation #[BRAND_HASHTAG]',
      platform: ['twitter', 'linkedin', 'facebook'],
      category: 'Product',
      tags: ['launch', 'announcement', 'product'],
      createdBy: {
        id: '1',
        name: 'Mike Chen',
        avatar: '/api/placeholder/32/32'
      },
      createdAt: new Date('2024-01-05'),
      uses: 15,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Weekly Team Update',
      description: 'Template for sharing weekly team achievements',
      content: '📊 Week in Review:\n\n🎯 This week we:\n• [ACHIEVEMENT_1]\n• [ACHIEVEMENT_2]\n• [ACHIEVEMENT_3]\n\n🚀 Next week focus:\n• [GOAL_1]\n• [GOAL_2]\n\n#TeamWork #Progress #[COMPANY_HASHTAG]',
      platform: ['linkedin', 'twitter'],
      category: 'Internal',
      tags: ['update', 'team', 'weekly'],
      createdBy: {
        id: '2',
        name: 'Alex Rivera',
        avatar: '/api/placeholder/32/32'
      },
      createdAt: new Date('2024-01-03'),
      uses: 8,
      rating: 4.5
    }
  ]);

  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const categories = ['Marketing', 'Product', 'Internal', 'Design', 'Social'];
  const types = ['image', 'video', 'template', 'document', 'audio'];

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
                       template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const copyTemplate = (template: ContentTemplate) => {
    navigator.clipboard.writeText(template.content);
    setTemplates(prev => 
      prev.map(t => 
        t.id === template.id 
          ? { ...t, uses: t.uses + 1 }
          : t
      )
    );
    toast({
      title: "Template Copied",
      description: "Template content copied to clipboard",
    });
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
                <Input placeholder="Template title" />
                <Textarea placeholder="Template description" />
                <Textarea 
                  placeholder="Template content (use [VARIABLE_NAME] for placeholders)"
                  className="min-h-[200px]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select>
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
                  <Input placeholder="Tags (comma separated)" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsTemplateDialogOpen(false)}>
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
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
                        {template.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t gap-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={template.createdBy.avatar} />
                          <AvatarFallback>{template.createdBy.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {template.createdBy.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{template.uses} uses</span>
                        <span>⭐ {template.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
