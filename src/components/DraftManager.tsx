import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Edit, Trash2, Copy, Send, Save, Clock, FileText, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { PostsService } from '@/lib/services/posts';

interface Draft {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  lastModified: Date;
  autoSaved: boolean;
  wordCount: number;
  tags: string[];
}

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  platforms: string[];
  variables: string[];
}



export const DraftManager = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [templates] = useState<Template[]>([]); // Templates will be implemented later
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'lastModified' | 'title' | 'wordCount'>('lastModified');
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [activeTab, setActiveTab] = useState<'drafts' | 'templates'>('drafts');
  const [loading, setLoading] = useState(true);

  // Load drafts from API
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        setLoading(true);
        const response = await PostsService.getPosts({ status: 'draft' });
        const posts = response.data?.posts || [];

        // Convert API posts to Draft format
        const draftPosts: Draft[] = posts.map(post => ({
          id: post.id,
          title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
          content: post.content,
          platforms: post.platforms,
          lastModified: new Date(post.updated_at),
          autoSaved: true, // Assume all API drafts are auto-saved
          wordCount: post.content.split(' ').length,
          tags: [] // Tags not implemented in API yet
        }));

        setDrafts(draftPosts);
      } catch (error) {
        console.error('Failed to load drafts:', error);
        toast.error('Failed to load drafts');
      } finally {
        setLoading(false);
      }
    };

    loadDrafts();

    // Auto-save recovery simulation
    const recoveredDraft = localStorage.getItem('recovered_draft');
    if (recoveredDraft) {
      try {
        const draft = JSON.parse(recoveredDraft);
        toast.success('Recovered unsaved draft from previous session');
        setDrafts(prev => [draft, ...prev]);
        localStorage.removeItem('recovered_draft');
      } catch (error) {
        console.error('Error recovering draft:', error);
      }
    }
  }, []);

  const filteredDrafts = drafts
    .filter(draft => {
      const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPlatform = filterPlatform === 'all' ||
                             draft.platforms.includes(filterPlatform);

      return matchesSearch && matchesPlatform;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'lastModified':
          return b.lastModified.getTime() - a.lastModified.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'wordCount':
          return b.wordCount - a.wordCount;
        default:
          return 0;
      }
    });

  const deleteDraft = async (draftId: string) => {
    try {
      await PostsService.deletePost(draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      if (selectedDraft?.id === draftId) {
        setSelectedDraft(null);
      }
      toast.success('Draft deleted');
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const duplicateDraft = (draft: Draft) => {
    const newDraft: Draft = {
      ...draft,
      id: Math.random().toString(36).substring(2, 11),
      title: `${draft.title} (Copy)`,
      lastModified: new Date(),
      autoSaved: false
    };
    setDrafts(prev => [newDraft, ...prev]);
    toast.success('Draft duplicated');
  };

  const createFromTemplate = (template: Template) => {
    const newDraft: Draft = {
      id: Math.random().toString(36).substring(2, 11),
      title: `New ${template.name}`,
      content: template.content,
      platforms: template.platforms,
      lastModified: new Date(),
      autoSaved: false,
      wordCount: template.content.split(' ').length,
      tags: [template.category.toLowerCase()]
    };
    setDrafts(prev => [newDraft, ...prev]);
    setActiveTab('drafts');
    setSelectedDraft(newDraft);
    toast.success('Draft created from template');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getPlatformEmojis = (platforms: string[]) => {
    const platformEmojis = {
      twitter: '🐦',
      linkedin: '💼',
      facebook: '👥',
      instagram: '📸'
    };

    return platforms.map(platform =>
      platformEmojis[platform as keyof typeof platformEmojis] || '📱'
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Draft Manager</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your drafts and templates
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="drafts" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Drafts ({drafts.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center">
            <Layout className="w-4 h-4 mr-2" />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="space-y-6">
          {/* Filters and Search */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search drafts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastModified">Last Modified</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="wordCount">Word Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Drafts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrafts.map((draft) => (
              <Card
                key={draft.id}
                className={`bg-white dark:bg-gray-800 cursor-pointer transition-all hover:shadow-lg ${
                  selectedDraft?.id === draft.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDraft(draft)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{draft.title}</CardTitle>
                    {draft.autoSaved && (
                      <Badge variant="secondary" className="text-xs">
                        <Save className="w-3 h-3 mr-1" />
                        Auto-saved
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {draft.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{getPlatformEmojis(draft.platforms)}</span>
                    <span>{draft.wordCount} words</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {draft.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(draft.lastModified)}
                    </span>

                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        duplicateDraft(draft);
                      }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDraft(draft.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDrafts.length === 0 && (
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No drafts found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || filterPlatform !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start creating content to see your drafts here'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {template.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{getPlatformEmojis(template.platforms)}</span>
                    <span>{template.variables.length} variables</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => createFromTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Draft Details */}
      {selectedDraft && activeTab === 'drafts' && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Draft Preview</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{selectedDraft.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Last modified {formatTimeAgo(selectedDraft.lastModified)}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{selectedDraft.content}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Platforms: {getPlatformEmojis(selectedDraft.platforms)} {selectedDraft.platforms.join(', ')}</span>
                <span>{selectedDraft.wordCount} words</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
