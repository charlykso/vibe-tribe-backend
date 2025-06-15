import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Users,
  Hash,
  Plus,
  Search,
  Phone,
  Video
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'system';
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  replyTo?: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  description?: string;
  members: string[];
  unreadCount: number;
  lastMessage?: Message;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export const TeamChat: React.FC = () => {
  const [channels] = useState<Channel[]>([
    {
      id: '1',
      name: 'general',
      type: 'channel',
      description: 'General team discussions',
      members: ['1', '2', '3', '4', '5'],
      unreadCount: 3
    },
    {
      id: '2',
      name: 'content-team',
      type: 'channel',
      description: 'Content creation discussions',
      members: ['1', '3', '5'],
      unreadCount: 0
    },
    {
      id: '3',
      name: 'design-feedback',
      type: 'channel',
      description: 'Design reviews and feedback',
      members: ['2', '3', '4'],
      unreadCount: 1
    }
  ]);

  const [users] = useState<User[]>([
    { id: '1', name: 'Sarah Johnson', avatar: '/api/placeholder/32/32', role: 'Content Creator', status: 'online' },
    { id: '2', name: 'Mike Chen', avatar: '/api/placeholder/32/32', role: 'Marketing Manager', status: 'online' },
    { id: '3', name: 'Emma Davis', avatar: '/api/placeholder/32/32', role: 'Designer', status: 'away' },
    { id: '4', name: 'Alex Rivera', avatar: '/api/placeholder/32/32', role: 'Team Lead', status: 'busy' },
    { id: '5', name: 'David Kim', avatar: '/api/placeholder/32/32', role: 'Social Media Manager', status: 'offline' }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey team! Just finished the Q1 content calendar. Would love to get your feedback.',
      sender: users[0],
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'text'
    },
    {
      id: '2',
      content: 'Great work Sarah! I\'ll review it this afternoon.',
      sender: users[1],
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      type: 'text',
      reactions: [
        { emoji: '👍', users: ['3', '4'] }
      ]
    },
    {
      id: '3',
      content: 'The holiday campaign graphics are ready for review. Check them out in the design channel!',
      sender: users[2],
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'text'
    },
    {
      id: '4',
      content: 'Team meeting in 30 minutes. We\'ll discuss the new social media strategy.',
      sender: users[3],
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      type: 'text'
    }
  ]);

  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: {
        id: 'current-user',
        name: 'You',
        avatar: '/api/placeholder/32/32',
        role: 'Current User'
      },
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    toast({
      title: "Message sent",
      description: `Message sent to #${activeChannel.name}`,
    });
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(message => {
        if (message.id === messageId) {
          const existingReaction = message.reactions?.find(r => r.emoji === emoji);
          if (existingReaction) {
            // Toggle reaction
            const userIndex = existingReaction.users.indexOf('current-user');
            if (userIndex > -1) {
              existingReaction.users.splice(userIndex, 1);
            } else {
              existingReaction.users.push('current-user');
            }
          } else {
            // Add new reaction
            message.reactions = message.reactions || [];
            message.reactions.push({ emoji, users: ['current-user'] });
          }
        }
        return message;
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineUsers = users.filter(user => user.status === 'online');

  return (
    <div className="h-[calc(100vh-200px)] flex bg-white dark:bg-gray-900 rounded-lg border">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Channels</h3>
              <Button size="sm" variant="ghost">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-1">
              {filteredChannels.map(channel => (
                <div
                  key={channel.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    activeChannel.id === channel.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                  onClick={() => setActiveChannel(channel)}
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{channel.name}</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {channel.unreadCount}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Online Users */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Online ({onlineUsers.length})
              </h3>
            </div>

            <div className="space-y-2">
              {onlineUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="relative">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-gray-500" />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {activeChannel.name}
                </h2>
                {activeChannel.description && (
                  <p className="text-sm text-gray-500">{activeChannel.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost">
                <Phone className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Video className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Users className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3 group">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.sender.avatar} />
                  <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{message.sender.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.sender.role}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>

                  <div className="text-sm text-gray-900 dark:text-white mb-2">
                    {message.content}
                  </div>

                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex space-x-1">
                      {message.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          type="button"
                          className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
                          onClick={() => addReaction(message.id, reaction.emoji)}
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addReaction(message.id, '👍')}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost">
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex-1 relative">
              <Input
                placeholder={`Message #${activeChannel.name}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <Button size="sm" variant="ghost">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
