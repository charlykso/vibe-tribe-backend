
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MessageSquare, Eye, ThumbsUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export const Analytics = () => {
  const engagementData = [
    { name: 'Mon', posts: 12, engagement: 145, reach: 2340 },
    { name: 'Tue', posts: 8, engagement: 98, reach: 1890 },
    { name: 'Wed', posts: 15, engagement: 203, reach: 3120 },
    { name: 'Thu', posts: 10, engagement: 156, reach: 2450 },
    { name: 'Fri', posts: 18, engagement: 267, reach: 3890 },
    { name: 'Sat', posts: 22, engagement: 312, reach: 4230 },
    { name: 'Sun', posts: 16, engagement: 189, reach: 2980 },
  ];

  const platformData = [
    { name: 'Discord', value: 45, color: '#5865F2' },
    { name: 'Telegram', value: 30, color: '#0088CC' },
    { name: 'Slack', value: 15, color: '#4A154B' },
    { name: 'Other', value: 10, color: '#64748B' },
  ];

  const topPerformers = [
    { content: 'Product launch announcement', engagement: 1247, reach: 12450 },
    { content: 'Community challenge results', engagement: 892, reach: 8920 },
    { content: 'Weekly newsletter', engagement: 634, reach: 6340 },
    { content: 'Feature update demo', engagement: 567, reach: 5670 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Track performance metrics and insights across all platforms</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reach</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">127.5K</p>
                <p className="text-sm text-green-600">+12.3% from last week</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8.7%</p>
                <p className="text-sm text-green-600">+2.1% from last week</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Communities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-sm text-green-600">+1 this month</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Posts This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">101</p>
                <p className="text-sm text-green-600">+15.2% from last week</p>
              </div>
              <MessageSquare className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="reach" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{item.content}</p>
                  <div className="flex space-x-4 mt-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.engagement} engagements
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.reach.toLocaleString()} reach
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <TrendingUp className="h-4 w-4 text-green-600 inline" />
                  <span className="text-sm text-green-600 ml-1">
                    {((item.engagement / item.reach) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
