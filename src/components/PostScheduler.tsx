import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Edit, Trash2, Eye, Send } from 'lucide-react';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PostsService } from '@/lib/services/posts';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  scheduledDate: Date;
  status: 'scheduled' | 'published' | 'failed';
  timezone: string;
}

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
];

export const PostScheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  // Load scheduled posts from API
  useEffect(() => {
    const loadScheduledPosts = async () => {
      try {
        const response = await PostsService.getPosts({ status: 'scheduled' });
        const posts = response.data?.posts || [];

        // Convert API posts to ScheduledPost format
        const scheduledPosts: ScheduledPost[] = posts
          .filter(post => post.scheduled_date)
          .map(post => ({
            id: post.id,
            title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''), // Use content as title
            content: post.content,
            platforms: post.platforms,
            scheduledDate: new Date(post.scheduled_date!),
            status: post.status as 'scheduled' | 'published' | 'failed',
            timezone: 'UTC' // Default timezone, could be made configurable
          }));

        setScheduledPosts(scheduledPosts);
      } catch (error) {
        console.error('Failed to load scheduled posts:', error);
        toast.error('Failed to load scheduled posts');
      }
    };

    loadScheduledPosts();
  }, []);

  const calendarEvents = scheduledPosts.map(post => ({
    id: post.id,
    title: post.title,
    start: post.scheduledDate,
    backgroundColor: post.status === 'scheduled' ? '#3B82F6' :
                    post.status === 'published' ? '#10B981' : '#EF4444',
    borderColor: 'transparent',
    textColor: 'white'
  }));

  const handleEventClick = (clickInfo: any) => {
    const post = scheduledPosts.find(p => p.id === clickInfo.event.id);
    if (post) {
      setSelectedPost(post);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('Enter post title:');
    if (title) {
      const newPost: ScheduledPost = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        content: '',
        platforms: [],
        scheduledDate: selectInfo.start,
        status: 'scheduled',
        timezone: selectedTimezone
      };
      setScheduledPosts(prev => [...prev, newPost]);
      toast.success('Post scheduled successfully!');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await PostsService.deletePost(postId);
      setScheduledPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
      toast.success('Scheduled post deleted');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const publishNow = async (postId: string) => {
    try {
      await PostsService.publishPost(postId);
      setScheduledPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, status: 'published' as const }
            : p
        )
      );
      setSelectedPost(null);
      toast.success('Post published successfully!');
    } catch (error) {
      console.error('Failed to publish post:', error);
      toast.error('Failed to publish post');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'default',
      published: 'secondary',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post Scheduler</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Schedule and manage your content calendar
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={calendarView} onValueChange={(value) => setCalendarView(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dayGridMonth">Month</SelectItem>
              <SelectItem value="timeGridWeek">Week</SelectItem>
              <SelectItem value="timeGridDay">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Content Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView={calendarView}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={calendarEvents}
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="auto"
              eventDisplay="block"
              eventTextColor="white"
            />
          </CardContent>
        </Card>

        {/* Scheduled Posts List */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>Scheduled Posts ({scheduledPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPost?.id === post.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{post.title}</h4>
                    {getStatusBadge(post.status)}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {getPlatformEmojis(post.platforms)}
                    </span>
                    <span className="text-gray-500">
                      {post.scheduledDate.toLocaleDateString()} {post.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {scheduledPosts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No scheduled posts</p>
                  <p className="text-xs">Click on the calendar to schedule a post</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Post Details */}
      {selectedPost && (
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Post Details</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => publishNow(selectedPost.id)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publish Now
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePost(selectedPost.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPost.title}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Content</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPost.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Platforms</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getPlatformEmojis(selectedPost.platforms)} {selectedPost.platforms.join(', ')}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Scheduled Time</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPost.scheduledDate.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedPost.status)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
