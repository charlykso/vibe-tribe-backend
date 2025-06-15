import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Calendar, 
  Users, 
  FileText,
  Heart,
  Share2,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'post_created' | 'post_approved' | 'post_rejected' | 'post_published' | 'comment_added' | 
        'media_uploaded' | 'task_assigned' | 'task_completed' | 'member_joined' | 'workflow_updated';
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  timestamp: Date;
  description: string;
  metadata?: {
    postTitle?: string;
    platform?: string;
    assignee?: string;
    fileName?: string;
    taskTitle?: string;
    memberName?: string;
  };
  priority?: 'low' | 'medium' | 'high';
}

export const TeamActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'post_published',
      user: {
        id: '1',
        name: 'Sarah Johnson',
        avatar: '/api/placeholder/32/32',
        role: 'Content Creator'
      },
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      description: 'Published a new post to Twitter and Instagram',
      metadata: {
        postTitle: 'Holiday Campaign Launch',
        platform: 'Twitter, Instagram'
      }
    },
    {
      id: '2',
      type: 'post_approved',
      user: {
        id: '2',
        name: 'Mike Chen',
        avatar: '/api/placeholder/32/32',
        role: 'Marketing Manager'
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      description: 'Approved a post for publication',
      metadata: {
        postTitle: 'Product Feature Announcement'
      }
    },
    {
      id: '3',
      type: 'task_assigned',
      user: {
        id: '3',
        name: 'Alex Rivera',
        avatar: '/api/placeholder/32/32',
        role: 'Team Lead'
      },
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      description: 'Assigned a new task to Emma Davis',
      metadata: {
        taskTitle: 'Create Q1 Content Calendar',
        assignee: 'Emma Davis'
      },
      priority: 'high'
    },
    {
      id: '4',
      type: 'media_uploaded',
      user: {
        id: '4',
        name: 'Emma Davis',
        avatar: '/api/placeholder/32/32',
        role: 'Designer'
      },
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      description: 'Uploaded new media assets',
      metadata: {
        fileName: 'holiday-banner-2024.jpg'
      }
    },
    {
      id: '5',
      type: 'comment_added',
      user: {
        id: '5',
        name: 'David Kim',
        avatar: '/api/placeholder/32/32',
        role: 'Social Media Manager'
      },
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      description: 'Added a comment to a post review',
      metadata: {
        postTitle: 'Black Friday Campaign'
      }
    },
    {
      id: '6',
      type: 'member_joined',
      user: {
        id: '6',
        name: 'Lisa Park',
        avatar: '/api/placeholder/32/32',
        role: 'Content Writer'
      },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      description: 'Joined the team',
      metadata: {
        memberName: 'Lisa Park'
      }
    },
    {
      id: '7',
      type: 'task_completed',
      user: {
        id: '1',
        name: 'Sarah Johnson',
        avatar: '/api/placeholder/32/32',
        role: 'Content Creator'
      },
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      description: 'Completed a task',
      metadata: {
        taskTitle: 'Write Instagram captions for week 3'
      }
    }
  ]);

  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(activities.map(a => a.user.id)))
    .map(id => activities.find(a => a.user.id === id)?.user)
    .filter(Boolean);

  const filteredActivities = activities.filter(activity => {
    const typeMatch = filterType === 'all' || activity.type === filterType;
    const userMatch = filterUser === 'all' || activity.user.id === filterUser;
    return typeMatch && userMatch;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post_created': return <FileText className="w-4 h-4" />;
      case 'post_approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'post_rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'post_published': return <Share2 className="w-4 h-4 text-blue-500" />;
      case 'comment_added': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'media_uploaded': return <Upload className="w-4 h-4 text-orange-500" />;
      case 'task_assigned': return <Calendar className="w-4 h-4 text-yellow-500" />;
      case 'task_completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'member_joined': return <Users className="w-4 h-4 text-indigo-500" />;
      case 'workflow_updated': return <Edit className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post_approved':
      case 'task_completed': return 'border-l-green-500';
      case 'post_rejected': return 'border-l-red-500';
      case 'post_published': return 'border-l-blue-500';
      case 'comment_added': return 'border-l-purple-500';
      case 'media_uploaded': return 'border-l-orange-500';
      case 'task_assigned': return 'border-l-yellow-500';
      case 'member_joined': return 'border-l-indigo-500';
      default: return 'border-l-gray-300';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <Badge className={`text-xs ${colors[priority as keyof typeof colors]}`}>
        {priority}
      </Badge>
    );
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new activities (simulation)
      if (Math.random() > 0.8) {
        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: 'comment_added',
          user: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: '/api/placeholder/32/32',
            role: 'Content Creator'
          },
          timestamp: new Date(),
          description: 'Added a new comment',
          metadata: {
            postTitle: 'Live Activity Update'
          }
        };
        
        setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep only 20 items
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Activity Feed</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time updates from your team</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="post_created">Posts Created</SelectItem>
              <SelectItem value="post_approved">Posts Approved</SelectItem>
              <SelectItem value="post_published">Posts Published</SelectItem>
              <SelectItem value="task_assigned">Tasks Assigned</SelectItem>
              <SelectItem value="task_completed">Tasks Completed</SelectItem>
              <SelectItem value="comment_added">Comments</SelectItem>
              <SelectItem value="media_uploaded">Media Uploads</SelectItem>
              <SelectItem value="member_joined">New Members</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map(user => (
                <SelectItem key={user?.id} value={user?.id || ''}>
                  {user?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Activity
            <Badge variant="outline" className="text-xs">
              {filteredActivities.length} activities
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-start space-x-3 p-4 border-l-4 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg ${getActivityColor(activity.type)}`}
              >
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(activity.type)}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.user.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.user.role}
                      </Badge>
                      {getPriorityBadge(activity.priority)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  
                  {activity.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      {activity.metadata.postTitle && (
                        <span className="font-medium">"{activity.metadata.postTitle}"</span>
                      )}
                      {activity.metadata.platform && (
                        <span> on {activity.metadata.platform}</span>
                      )}
                      {activity.metadata.assignee && (
                        <span> to <span className="font-medium">{activity.metadata.assignee}</span></span>
                      )}
                      {activity.metadata.fileName && (
                        <span className="font-medium">"{activity.metadata.fileName}"</span>
                      )}
                      {activity.metadata.taskTitle && (
                        <span className="font-medium">"{activity.metadata.taskTitle}"</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
