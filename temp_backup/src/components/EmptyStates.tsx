import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  MessageSquare, 
  Users, 
  Calendar, 
  BarChart3, 
  Upload, 
  Link, 
  Inbox,
  Search,
  Plus,
  Zap,
  Target,
  Heart
} from 'lucide-react';

interface EmptyStateProps {
  type: 'posts' | 'drafts' | 'messages' | 'members' | 'scheduled' | 'analytics' | 
        'media' | 'platforms' | 'inbox' | 'search' | 'tasks' | 'notifications' | 
        'engagement' | 'community';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'posts':
        return {
          icon: <FileText className="w-16 h-16 text-gray-400" />,
          title: title || 'No posts yet',
          description: description || 'Create your first post to get started with your social media journey.',
          actionLabel: actionLabel || 'Create Post',
          suggestions: [
            'Share an update about your business',
            'Post behind-the-scenes content',
            'Ask your audience a question'
          ]
        };
      
      case 'drafts':
        return {
          icon: <FileText className="w-16 h-16 text-gray-400" />,
          title: title || 'No drafts saved',
          description: description || 'Start writing a post and it will be automatically saved as a draft.',
          actionLabel: actionLabel || 'Start Writing',
          suggestions: [
            'Drafts are auto-saved every 30 seconds',
            'Use templates to speed up content creation',
            'Save ideas for later when inspiration strikes'
          ]
        };
      
      case 'messages':
        return {
          icon: <MessageSquare className="w-16 h-16 text-gray-400" />,
          title: title || 'No messages yet',
          description: description || 'When people interact with your posts, their messages will appear here.',
          actionLabel: actionLabel || 'Create Post',
          suggestions: [
            'Engage with your audience to get more messages',
            'Ask questions in your posts',
            'Respond to comments to encourage conversation'
          ]
        };
      
      case 'members':
        return {
          icon: <Users className="w-16 h-16 text-gray-400" />,
          title: title || 'No team members yet',
          description: description || 'Invite team members to collaborate on your social media management.',
          actionLabel: actionLabel || 'Invite Members',
          suggestions: [
            'Assign different roles and permissions',
            'Collaborate on content creation',
            'Share workload across team members'
          ]
        };
      
      case 'scheduled':
        return {
          icon: <Calendar className="w-16 h-16 text-gray-400" />,
          title: title || 'No scheduled posts',
          description: description || 'Schedule posts in advance to maintain consistent social media presence.',
          actionLabel: actionLabel || 'Schedule Post',
          suggestions: [
            'Plan content for the week ahead',
            'Schedule posts for optimal engagement times',
            'Maintain consistency even when busy'
          ]
        };
      
      case 'analytics':
        return {
          icon: <BarChart3 className="w-16 h-16 text-gray-400" />,
          title: title || 'No analytics data',
          description: description || 'Analytics will appear here once you start posting and engaging.',
          actionLabel: actionLabel || 'Create First Post',
          suggestions: [
            'Post regularly to generate analytics data',
            'Connect your social media accounts',
            'Engage with your audience for better insights'
          ]
        };
      
      case 'media':
        return {
          icon: <Upload className="w-16 h-16 text-gray-400" />,
          title: title || 'No media files',
          description: description || 'Upload images, videos, and other media to use in your posts.',
          actionLabel: actionLabel || 'Upload Media',
          suggestions: [
            'Drag and drop files to upload',
            'Organize media with tags and folders',
            'Reuse media across multiple posts'
          ]
        };
      
      case 'platforms':
        return {
          icon: <Link className="w-16 h-16 text-gray-400" />,
          title: title || 'No platforms connected',
          description: description || 'Connect your social media accounts to start managing them from one place.',
          actionLabel: actionLabel || 'Connect Platform',
          suggestions: [
            'Connect Twitter, Facebook, Instagram, and more',
            'Manage multiple accounts per platform',
            'Post to all platforms simultaneously'
          ]
        };
      
      case 'inbox':
        return {
          icon: <Inbox className="w-16 h-16 text-gray-400" />,
          title: title || 'Inbox is empty',
          description: description || 'Messages, mentions, and comments from all platforms will appear here.',
          actionLabel: actionLabel || 'Check Platforms',
          suggestions: [
            'Connect platforms to see messages',
            'Respond to comments and mentions',
            'Manage all conversations in one place'
          ]
        };
      
      case 'search':
        return {
          icon: <Search className="w-16 h-16 text-gray-400" />,
          title: title || 'No results found',
          description: description || 'Try adjusting your search terms or filters.',
          actionLabel: actionLabel || 'Clear Filters',
          suggestions: [
            'Check your spelling',
            'Try broader search terms',
            'Remove some filters'
          ]
        };
      
      case 'tasks':
        return {
          icon: <Target className="w-16 h-16 text-gray-400" />,
          title: title || 'No tasks assigned',
          description: description || 'Create and assign tasks to keep your team organized.',
          actionLabel: actionLabel || 'Create Task',
          suggestions: [
            'Break down projects into smaller tasks',
            'Set deadlines and priorities',
            'Track progress and completion'
          ]
        };
      
      case 'notifications':
        return {
          icon: <Zap className="w-16 h-16 text-gray-400" />,
          title: title || 'No notifications',
          description: description || 'You\'re all caught up! Notifications will appear here.',
          actionLabel: actionLabel || 'Notification Settings',
          suggestions: [
            'Customize notification preferences',
            'Get alerts for important events',
            'Stay updated on team activities'
          ]
        };
      
      case 'engagement':
        return {
          icon: <Heart className="w-16 h-16 text-gray-400" />,
          title: title || 'No engagement data',
          description: description || 'Engagement metrics will show up as your content gets interactions.',
          actionLabel: actionLabel || 'Create Content',
          suggestions: [
            'Post engaging content regularly',
            'Ask questions to encourage interaction',
            'Respond to comments and messages'
          ]
        };
      
      case 'community':
        return {
          icon: <Users className="w-16 h-16 text-gray-400" />,
          title: title || 'No community activity',
          description: description || 'Community insights and member activity will appear here.',
          actionLabel: actionLabel || 'Engage Community',
          suggestions: [
            'Create content that sparks discussion',
            'Welcome new community members',
            'Moderate and guide conversations'
          ]
        };
      
      default:
        return {
          icon: <FileText className="w-16 h-16 text-gray-400" />,
          title: title || 'Nothing here yet',
          description: description || 'Content will appear here once you start using this feature.',
          actionLabel: actionLabel || 'Get Started',
          suggestions: []
        };
    }
  };

  const config = getEmptyStateConfig();

  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center text-center p-12">
        <div className="mb-6">
          {config.icon}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {config.description}
        </p>
        
        {onAction && config.actionLabel && (
          <Button onClick={onAction} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            {config.actionLabel}
          </Button>
        )}
        
        {config.suggestions.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-w-md">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              💡 Tips to get started:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {config.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Convenience components for common empty states
export const EmptyPosts: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="posts" {...props} />
);

export const EmptyDrafts: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="drafts" {...props} />
);

export const EmptyMessages: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="messages" {...props} />
);

export const EmptyMembers: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="members" {...props} />
);

export const EmptyScheduled: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="scheduled" {...props} />
);

export const EmptyAnalytics: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="analytics" {...props} />
);

export const EmptyMedia: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="media" {...props} />
);

export const EmptyPlatforms: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="platforms" {...props} />
);

export const EmptyInbox: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="inbox" {...props} />
);

export const EmptySearch: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="search" {...props} />
);

export const EmptyTasks: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="tasks" {...props} />
);

export const EmptyNotifications: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="notifications" {...props} />
);

export const EmptyEngagement: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="engagement" {...props} />
);

export const EmptyCommunity: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="community" {...props} />
);
