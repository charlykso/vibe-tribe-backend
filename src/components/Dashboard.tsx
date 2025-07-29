
import React from 'react';
import { TrendingUp, Users, MessageSquare, Heart, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackendStatus } from '@/components/BackendStatus';
import { useQuery } from '@tanstack/react-query';
import { CommunitiesService } from '@/lib/services/communities';

export const Dashboard = () => {
  // Fetch communities data
  const {
    data: communitiesData,
    isLoading: communitiesLoading,
    error: communitiesError
  } = useQuery({
    queryKey: ['communities'],
    queryFn: () => CommunitiesService.getCommunities(),
    select: (response) => response.data?.communities || []
  });

  // Calculate stats from real data
  const stats = React.useMemo(() => {
    if (!communitiesData || communitiesData.length === 0) {
      return [
        {
          title: 'Total Members',
          value: communitiesLoading ? '...' : '0',
          change: '+0%',
          trend: 'up',
          icon: Users,
          color: 'text-blue-600'
        },
        {
          title: 'Active Members',
          value: communitiesLoading ? '...' : '0',
          change: '+0%',
          trend: 'up',
          icon: TrendingUp,
          color: 'text-green-600'
        },
        {
          title: 'Messages Total',
          value: communitiesLoading ? '...' : '0',
          change: '+0%',
          trend: 'up',
          icon: MessageSquare,
          color: 'text-purple-600'
        },
        {
          title: 'Avg Engagement',
          value: communitiesLoading ? '...' : '0%',
          change: '+0%',
          trend: 'up',
          icon: Heart,
          color: 'text-pink-600'
        }
      ];
    }

    const totalMembers = communitiesData.reduce((sum, community) => sum + (community.member_count || 0), 0);
    const activeMembers = communitiesData.reduce((sum, community) => sum + (community.active_member_count || 0), 0);
    const totalMessages = communitiesData.reduce((sum, community) => sum + (community.message_count || 0), 0);
    const avgEngagement = communitiesData.reduce((sum, community) => sum + (community.engagement_rate || 0), 0) / communitiesData.length;

    return [
      {
        title: 'Total Members',
        value: totalMembers.toLocaleString(),
        change: '+12.5%',
        trend: 'up',
        icon: Users,
        color: 'text-blue-600'
      },
      {
        title: 'Active Members',
        value: activeMembers.toLocaleString(),
        change: '+8.2%',
        trend: 'up',
        icon: TrendingUp,
        color: 'text-green-600'
      },
      {
        title: 'Messages Total',
        value: totalMessages.toLocaleString(),
        change: '+23.1%',
        trend: 'up',
        icon: MessageSquare,
        color: 'text-purple-600'
      },
      {
        title: 'Avg Engagement',
        value: `${avgEngagement.toFixed(1)}%`,
        change: '+4.3%',
        trend: 'up',
        icon: Heart,
        color: 'text-pink-600'
      }
    ];
  }, [communitiesData, communitiesLoading]);

  const recentActivity = [
    { type: 'new_member', message: 'John Smith joined the community', time: '2 minutes ago', icon: Users },
    { type: 'high_engagement', message: 'Post about product updates got 150+ reactions', time: '15 minutes ago', icon: Heart },
    { type: 'moderation', message: 'Spam message auto-removed in #general', time: '32 minutes ago', icon: AlertTriangle },
    { type: 'milestone', message: 'Community reached 25K members!', time: '1 hour ago', icon: CheckCircle },
  ];

  // Use real communities data for the communities section
  const communities = React.useMemo(() => {
    if (!communitiesData || communitiesData.length === 0) {
      return [];
    }

    return communitiesData.map(community => ({
      name: community.name,
      members: community.member_count || 0,
      status: community.health_score > 80 ? 'healthy' : community.health_score > 60 ? 'growing' : 'stable',
      growth: `+${(Math.random() * 15).toFixed(1)}%` // Mock growth data for now
    }));
  }, [communitiesData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor your community health and engagement metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Backend Integration Status */}
      <div className="flex justify-center">
        <BackendStatus />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Community Overview */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Communities</CardTitle>
          </CardHeader>
          <CardContent>
            {communitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading communities...</span>
              </div>
            ) : communitiesError ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">Failed to load communities</p>
              </div>
            ) : communities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No communities found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {communities.map((community, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{community.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{community.members.toLocaleString()} members</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      community.status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      community.status === 'growing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {community.status}
                    </span>
                    <p className="text-xs text-green-600 mt-1">{community.growth}</p>
                  </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
