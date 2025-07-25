import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Reply, 
  Archive, 
  Trash2, 
  Star, 
  CheckCircle,
  User,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  platform: string;
  platformIcon: string;
  platformColor: string;
  sender: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  conversationId: string;
  messageType: 'direct' | 'mention' | 'comment' | 'review';
}

const mockMessages: Message[] = [
  {
    id: '1',
    platform: 'twitter',
    platformIcon: '🐦',
    platformColor: 'bg-blue-500',
    sender: {
      name: 'John Smith',
      username: '@johnsmith',
      avatar: '/api/placeholder/32/32',
      verified: false
    },
    content: 'Hey @tribe, loving the new features! When will the mobile app be available?',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    isRead: false,
    isStarred: false,
    isArchived: false,
    conversationId: 'conv_1',
    messageType: 'mention'
  },
  {
    id: '2',
    platform: 'linkedin',
    platformIcon: '💼',
    platformColor: 'bg-blue-700',
    sender: {
      name: 'Sarah Johnson',
      username: 'sarah-johnson-ceo',
      avatar: '/api/placeholder/32/32',
      verified: true
    },
    content: 'Great article about community management! Would love to collaborate on a project.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
    isStarred: true,
    isArchived: false,
    conversationId: 'conv_2',
    messageType: 'direct'
  }
];

export const UnifiedInbox = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlatform = filterPlatform === 'all' || message.platform === filterPlatform;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'unread' && !message.isRead) ||
                         (filterStatus === 'starred' && message.isStarred) ||
                         (filterStatus === 'archived' && message.isArchived);
    
    const matchesType = filterType === 'all' || message.messageType === filterType;
    
    return matchesSearch && matchesPlatform && matchesStatus && matchesType && !message.isArchived;
  });

  const unreadCount = messages.filter(m => !m.isRead && !m.isArchived).length;

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const handleToggleStar = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
      )
    );
  };

  const handleArchive = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isArchived: true } : msg
      )
    );
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
    toast.success('Message archived');
  };

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
    toast.success('Message deleted');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'direct': return <User className="w-3 h-3" />;
      case 'mention': return <span className="text-xs">@</span>;
      case 'comment': return <Reply className="w-3 h-3" />;
      case 'review': return <Star className="w-3 h-3" />;
      default: return null;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    const colors = {
      direct: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      mention: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      comment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    
    return (
      <Badge variant="secondary" className={`text-xs ${colors[type as keyof typeof colors]}`}>
        {getMessageTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="mention">Mentions</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Messages ({filteredMessages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedMessage?.id === message.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : message.isRead 
                        ? 'border-gray-200 dark:border-gray-700' 
                        : 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10'
                  }`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.isRead) {
                      handleMarkAsRead(message.id);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={message.sender.avatar} />
                          <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${message.platformColor} flex items-center justify-center text-xs`}>
                          {message.platformIcon}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm">{message.sender.name}</p>
                          {message.sender.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-xs text-gray-500">{message.sender.username}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getMessageTypeBadge(message.messageType)}
                          <span className="text-xs text-gray-500">{formatTimeAgo(message.timestamp)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {message.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(message.id);
                            }}
                          >
                            <Star className={`w-3 h-3 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(message.id);
                            }}
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(message.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredMessages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No messages found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle>
              {selectedMessage ? 'Message Details' : 'Select a Message'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Avatar>
                    <AvatarImage src={selectedMessage.sender.avatar} />
                    <AvatarFallback>{selectedMessage.sender.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{selectedMessage.sender.name}</p>
                      {selectedMessage.sender.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMessage.sender.username}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full ${selectedMessage.platformColor} flex items-center justify-center text-white`}>
                    {selectedMessage.platformIcon}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatTimeAgo(selectedMessage.timestamp)}
                    </span>
                    {getMessageTypeBadge(selectedMessage.messageType)}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Reply className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No message selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a message from the list to view details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
