import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Image, Smile, Hash, Send, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PostsService, CreatePostData } from '@/lib/services/posts';

interface Platform {
  id: string;
  name: string;
  icon: string;
  charLimit: number;
  color: string;
  features: string[];
}

const platforms: Platform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    charLimit: 280,
    color: 'bg-blue-500',
    features: ['threads', 'hashtags', 'mentions']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    charLimit: 3000,
    color: 'bg-blue-700',
    features: ['articles', 'hashtags', 'mentions']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    charLimit: 2200,
    color: 'bg-pink-500',
    features: ['stories', 'hashtags', 'mentions']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    charLimit: 63206,
    color: 'bg-blue-600',
    features: ['pages', 'groups', 'hashtags']
  }
];

const hashtagSuggestions = [
  '#socialmedia', '#marketing', '#community', '#engagement', '#content',
  '#digital', '#strategy', '#growth', '#brand', '#viral', '#trending'
];

interface PostComposerProps {
  showHeader?: boolean;
}

export const PostComposer = ({ showHeader = false }: PostComposerProps) => {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter']);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [postType, setPostType] = useState<'post' | 'thread' | 'story' | 'article'>('post');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem('draft_post', JSON.stringify({
          content,
          selectedPlatforms,
          postType,
          timestamp: new Date().toISOString()
        }));
        setIsDraft(true);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSave);
  }, [content, selectedPlatforms, postType]);

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('draft_post');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setContent(draft.content || '');
        setSelectedPlatforms(draft.selectedPlatforms || ['twitter']);
        setPostType(draft.postType || 'post');
        setIsDraft(true);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  const getCharacterCount = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? platform.charLimit : 280;
  };

  const getCharacterStatus = (platformId: string) => {
    const limit = getCharacterCount(platformId);
    const remaining = limit - content.length;

    if (remaining < 0) return { color: 'text-red-500', status: 'over' };
    if (remaining < 20) return { color: 'text-yellow-500', status: 'warning' };
    return { color: 'text-green-500', status: 'good' };
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const insertHashtag = (hashtag: string) => {
    setContent(prev => prev + ' ' + hashtag);
    setShowHashtagSuggestions(false);
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    // Check character limits for selected platforms
    const overLimitPlatforms = selectedPlatforms.filter(platformId => {
      const limit = getCharacterCount(platformId);
      return content.length > limit;
    });

    if (overLimitPlatforms.length > 0) {
      const platformNames = overLimitPlatforms.map(id =>
        platforms.find(p => p.id === id)?.name
      ).join(', ');
      toast.error(`Content exceeds character limit for: ${platformNames}`);
      return;
    }

    try {
      const postData: CreatePostData = {
        content,
        platforms: selectedPlatforms,
      };

      const response = await PostsService.createPost(postData);
      const post = response.data?.post;

      if (!post) {
        throw new Error('Failed to create post');
      }

      // Publish immediately
      await PostsService.publishPost(post.id);

      toast.success('Post published successfully!');
      setContent('');
      setIsDraft(false);
      localStorage.removeItem('draft_post');
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish post');
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error('Please select a date and time');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    try {
      const postData: CreatePostData = {
        content,
        platforms: selectedPlatforms,
        scheduled_date: scheduledDate.toISOString(),
      };

      await PostsService.createPost(postData);

      toast.success('Post scheduled successfully!');
      setContent('');
      setIsDraft(false);
      setScheduledDate(null);
      localStorage.removeItem('draft_post');
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to schedule post');
    }
  };

  const saveDraft = () => {
    localStorage.setItem('draft_post', JSON.stringify({
      content,
      selectedPlatforms,
      postType,
      timestamp: new Date().toISOString()
    }));
    setIsDraft(true);
    toast.success('Draft saved!');
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {showHeader && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Create Post</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Compose and schedule content across multiple platforms
          </p>
        </div>
      )}

      <Card className="bg-white dark:bg-gray-800">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <span>Post Composer</span>
            {isDraft && (
              <Badge variant="secondary" className="text-xs">
                <Save className="w-3 h-3 mr-1" />
                Draft Saved
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {platforms.map((platform) => (
                <Button
                  key={platform.id}
                  variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`
                    flex-shrink-0 min-w-0
                    text-xs sm:text-sm
                    px-2 sm:px-3 py-2
                    h-8 sm:h-9
                    ${selectedPlatforms.includes(platform.id) ? platform.color : ''}
                  `}
                >
                  <span className="mr-1 sm:mr-2 text-sm">{platform.icon}</span>
                  <span className="truncate">{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Post Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Post Type
            </label>
            <Tabs value={postType} onValueChange={(value) => setPostType(value as 'post' | 'thread' | 'story' | 'article')}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                <TabsTrigger value="post" className="text-xs sm:text-sm py-2">Regular Post</TabsTrigger>
                <TabsTrigger value="thread" className="text-xs sm:text-sm py-2">Thread</TabsTrigger>
                <TabsTrigger value="story" className="text-xs sm:text-sm py-2">Story</TabsTrigger>
                <TabsTrigger value="article" className="text-xs sm:text-sm py-2">Article</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Content
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHashtagSuggestions(!showHashtagSuggestions)}
                >
                  <Hash className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Image className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="min-h-[120px] resize-none"
            />

            {/* Character Counters */}
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {selectedPlatforms.map((platformId) => {
                const platform = platforms.find(p => p.id === platformId);
                const status = getCharacterStatus(platformId);
                const remaining = getCharacterCount(platformId) - content.length;

                return (
                  <div key={platformId} className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                    <span className="text-xs sm:text-sm">{platform?.icon}</span>
                    <span className="text-xs sm:text-sm font-medium">{platform?.name}:</span>
                    <span className={`text-xs sm:text-sm font-medium ${status.color}`}>
                      {remaining}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Quick Actions */}
          {showEmojiPicker && (
            <Card className="p-3 sm:p-4">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
                {['😀', '😂', '😍', '🤔', '👍', '❤️', '🔥', '💯', '🎉', '👏', '🚀', '💪', '🌟', '✨', '🎯', '📈'].map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => insertEmoji(emoji)}
                    className="text-base sm:text-lg h-8 sm:h-9 w-8 sm:w-9 p-0"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {showHashtagSuggestions && (
            <Card className="p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {hashtagSuggestions.map((hashtag) => (
                  <Button
                    key={hashtag}
                    variant="outline"
                    size="sm"
                    onClick={() => insertHashtag(hashtag)}
                    className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                  >
                    {hashtag}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t">
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col space-y-3 sm:hidden">
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={saveDraft} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" className="flex-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button onClick={handlePublish} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Publish Now
                </Button>
              </div>
            </div>

            {/* Desktop Layout - Side by Side */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button onClick={handlePublish}>
                  <Send className="w-4 h-4 mr-2" />
                  Publish Now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
