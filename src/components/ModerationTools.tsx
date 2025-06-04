
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Check, X, Eye, Flag } from 'lucide-react';

export const ModerationTools = () => {
  const [activeQueue, setActiveQueue] = useState('pending');

  const pendingItems = [
    {
      id: 1,
      type: 'message',
      content: 'Check out this amazing deal on our competitor\'s product...',
      author: 'suspicious_user_123',
      channel: '#general',
      timestamp: '2 minutes ago',
      reason: 'Potential spam',
      risk: 'high'
    },
    {
      id: 2,
      type: 'message',
      content: 'This feature is completely useless and the developers are idiots',
      author: 'angry_member',
      channel: '#feedback',
      timestamp: '15 minutes ago',
      reason: 'Toxic language',
      risk: 'medium'
    },
    {
      id: 3,
      type: 'image',
      content: 'Inappropriate meme image',
      author: 'meme_lover',
      channel: '#random',
      timestamp: '1 hour ago',
      reason: 'NSFW content',
      risk: 'high'
    }
  ];

  const moderationStats = [
    { label: 'Items Reviewed Today', value: '47', trend: '+12%' },
    { label: 'Auto-Moderated', value: '23', trend: '+8%' },
    { label: 'Manual Reviews', value: '24', trend: '+15%' },
    { label: 'Appeals Pending', value: '3', trend: '-25%' }
  ];

  const recentActions = [
    {
      action: 'Message removed',
      target: 'spam link in #general',
      moderator: 'AI Auto-Mod',
      time: '5 minutes ago'
    },
    {
      action: 'User warned',
      target: '@toxic_user for harassment',
      moderator: 'Sarah Johnson',
      time: '1 hour ago'
    },
    {
      action: 'Message approved',
      target: 'Product question in #support',
      moderator: 'Mike Chen',
      time: '2 hours ago'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {moderationStats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.trend}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Moderation Queue */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Moderation Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeQueue} onValueChange={setActiveQueue}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({pendingItems.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="space-y-4">
                {pendingItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskColor(item.risk)}>
                          {item.risk} risk
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item.reason}</span>
                      </div>
                      <span className="text-xs text-gray-400">{item.timestamp}</span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 dark:text-white">@{item.author} in {item.channel}</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{item.content}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="approved">
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No approved items to show</p>
              </TabsContent>
              
              <TabsContent value="rejected">
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No rejected items to show</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActions.map((action, index) => (
                <div key={index} className="border-l-2 border-blue-500 pl-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{action.action}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{action.target}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">by {action.moderator}</span>
                    <span className="text-xs text-gray-400">{action.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
