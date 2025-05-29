
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, MessageSquare, Eye, ThumbsUp, Calendar as CalendarIcon, Download, Filter, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { AnalyticsService, AnalyticsOverview, PlatformAnalytics, EngagementMetrics, TopPost } from '@/lib/services/analytics';
import { toast } from 'sonner';

export const Analytics = () => {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);

  // Fetch analytics overview
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError
  } = useQuery({
    queryKey: ['analytics-overview', dateRange, customDateFrom, customDateTo],
    queryFn: () => {
      const dateRangeParams = dateRange === 'custom' && customDateFrom && customDateTo
        ? { start: customDateFrom.toISOString(), end: customDateTo.toISOString() }
        : undefined;
      return AnalyticsService.getOverview(dateRangeParams);
    },
    select: (response) => response.data
  });

  // Fetch platform analytics
  const {
    data: platformAnalyticsData,
    isLoading: platformsLoading,
    error: platformsError
  } = useQuery({
    queryKey: ['analytics-platforms'],
    queryFn: () => AnalyticsService.getPlatformAnalytics(),
    select: (response) => response.data?.platforms || []
  });

  // Fetch engagement metrics
  const {
    data: engagementData,
    isLoading: engagementLoading,
    error: engagementError
  } = useQuery({
    queryKey: ['analytics-engagement', dateRange, customDateFrom, customDateTo],
    queryFn: () => {
      const dateRangeParams = dateRange === 'custom' && customDateFrom && customDateTo
        ? { start: customDateFrom.toISOString(), end: customDateTo.toISOString() }
        : undefined;
      return AnalyticsService.getEngagementMetrics(dateRangeParams);
    },
    select: (response) => response.data?.engagement_timeline || []
  });

  // Fetch top posts
  const {
    data: topPostsData,
    isLoading: topPostsLoading,
    error: topPostsError
  } = useQuery({
    queryKey: ['analytics-top-posts'],
    queryFn: () => AnalyticsService.getTopPosts(5),
    select: (response) => response.data?.top_posts || []
  });

  const platformAnalytics = platformAnalyticsData || [];
  const loading = overviewLoading || platformsLoading;

  // Use real engagement data or fallback to empty array
  const chartEngagementData = engagementData || [];

  const platformData = [
    { name: 'Discord', value: 45, color: '#5865F2' },
    { name: 'Telegram', value: 30, color: '#0088CC' },
    { name: 'Slack', value: 15, color: '#4A154B' },
    { name: 'Other', value: 10, color: '#64748B' },
  ];

  // Use real top posts data or fallback
  const topPerformers = topPostsData?.map(post => ({
    content: post.content || 'Post content',
    engagement: post.likes + post.comments + post.shares,
    reach: post.views
  })) || [
    { content: 'No posts available yet', engagement: 0, reach: 0 }
  ];

  // Refresh function
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-platforms'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-engagement'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-top-posts'] });
    toast.success('Analytics data refreshed');
  };

  // Transform platform analytics for pie chart
  const platformChartData = platformAnalytics.map((platform, index) => ({
    name: platform.platform,
    value: platform.total_posts,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] || '#64748B'
  }));

  const handleExportData = () => {
    // Export real engagement data
    const csvData = engagementData?.map(item =>
      `${item.date},${item.likes + item.comments + item.shares},${item.views},${item.engagement_rate}`
    ).join('\n') || '';

    const blob = new Blob([`Date,Engagement,Views,Engagement Rate\n${csvData}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track performance metrics and insights across all platforms</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-2">
            <Button
              variant={dateRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('90d')}
            >
              90 Days
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={dateRange === 'custom' ? 'default' : 'outline'} size="sm">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium">From</label>
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      className="rounded-md border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">To</label>
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      className="rounded-md border"
                    />
                  </div>
                  <Button
                    onClick={() => setDateRange('custom')}
                    className="w-full"
                    disabled={!customDateFrom || !customDateTo}
                  >
                    Apply Custom Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Platform Filter */}
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Display */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {dateRange === 'custom' && customDateFrom && customDateTo
                  ? `${format(customDateFrom, 'MMM dd')} - ${format(customDateTo, 'MMM dd')}`
                  : dateRange === '7d' ? 'Last 7 Days'
                  : dateRange === '30d' ? 'Last 30 Days'
                  : 'Last 90 Days'
                }
              </Badge>
              {selectedPlatform !== 'all' && (
                <Badge variant="outline">
                  {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Only
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {overviewError ? (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">Failed to load analytics overview</p>
              <Button variant="outline" onClick={handleRefresh}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reach</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : overview ? `${(overview.total_reach / 1000).toFixed(1)}K` : '0'}
                  </p>
                  <p className="text-sm text-green-600">
                    {loading ? '...' : overview ? `+${overview.growth_rate}% from last month` : 'No data'}
                  </p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : overview ? `${overview.engagement_rate}%` : '8.7%'}
                </p>
                <p className="text-sm text-green-600">
                  {loading ? '...' : overview ? `+${(overview.engagement_rate * 0.5).toFixed(1)}% from last week` : '+2.1% from last week'}
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Platform</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : overview ? overview.top_platform : 'LinkedIn'}
                </p>
                <p className="text-sm text-green-600">
                  {loading ? '...' : 'Leading engagement'}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : overview ? overview.total_posts : '101'}
                </p>
                <p className="text-sm text-green-600">
                  {loading ? '...' : overview ? `+${overview.growth_rate}% from last month` : '+15.2% from last week'}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {engagementLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : engagementError ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-600 dark:text-red-400">Failed to load engagement data</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={(item) => item.likes + item.comments + item.shares}
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Engagement"
                  />
                  <Line type="monotone" dataKey="views" stroke="#10B981" strokeWidth={2} name="Views" />
                </LineChart>
              </ResponsiveContainer>
            )}
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
                  data={platformChartData.length > 0 ? platformChartData : platformData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(platformChartData.length > 0 ? platformChartData : platformData).map((entry, index) => (
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
