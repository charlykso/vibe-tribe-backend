
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, MessageSquare, Heart, AlertTriangle } from 'lucide-react';

export const CommunityHealth = () => {
  const healthMetrics = [
    { name: 'Overall Health Score', value: 87, status: 'excellent', color: 'bg-green-500' },
    { name: 'Member Retention', value: 92, status: 'excellent', color: 'bg-green-500' },
    { name: 'Engagement Rate', value: 74, status: 'good', color: 'bg-blue-500' },
    { name: 'Content Quality', value: 68, status: 'fair', color: 'bg-yellow-500' },
    { name: 'Moderation Efficiency', value: 95, status: 'excellent', color: 'bg-green-500' },
    { name: 'Growth Rate', value: 58, status: 'fair', color: 'bg-yellow-500' },
  ];

  const trendingTopics = [
    { topic: 'Product Updates', mentions: 847, sentiment: 'positive', change: '+23%' },
    { topic: 'Feature Requests', mentions: 623, sentiment: 'neutral', change: '+8%' },
    { topic: 'Bug Reports', mentions: 234, sentiment: 'negative', change: '-12%' },
    { topic: 'Community Events', mentions: 445, sentiment: 'positive', change: '+45%' },
  ];

  const memberSegments = [
    { segment: 'Champions', count: 1247, percentage: 5, description: 'Highly active contributors' },
    { segment: 'Regular Members', count: 8934, percentage: 36, description: 'Consistently active' },
    { segment: 'Casual Members', count: 11456, percentage: 46, description: 'Moderately active' },
    { segment: 'At Risk', count: 2847, percentage: 11, description: 'Declining engagement' },
    { segment: 'Inactive', count: 363, percentage: 2, description: 'No recent activity' },
  ];

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {healthMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.name}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                  <Badge variant={metric.status === 'excellent' ? 'default' : metric.status === 'good' ? 'secondary' : 'destructive'}>
                    {metric.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health Summary */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Health Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">87</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Health Score</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Engagement trending up</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Strong member retention</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Monitor content quality</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trending Topics and Member Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Trending Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trendingTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{topic.topic}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{topic.mentions} mentions</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={topic.sentiment === 'positive' ? 'default' : topic.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                      {topic.sentiment}
                    </Badge>
                    <p className={`text-sm ${topic.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {topic.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Member Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberSegments.map((segment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">{segment.segment}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{segment.count.toLocaleString()}</span>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{segment.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
