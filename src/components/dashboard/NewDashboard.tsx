import { Button } from "@/components/ui/button";
import { Users, MessageSquare, TrendingUp, Heart, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CommunityOverview } from "@/components/dashboard/CommunityOverview";
import { AISummary } from "@/components/dashboard/AISummary";
import { useDashboardData } from "@/hooks/useDashboard";

export const NewDashboard = () => {
  const { metrics, activities, communityStats, loading, error, refetch } = useDashboardData();

  // Format metrics for display
  const formatMetrics = () => {
    if (!metrics ||
        typeof metrics.totalMembers !== 'number' ||
        typeof metrics.activeMembers !== 'number' ||
        typeof metrics.messagesToday !== 'number' ||
        typeof metrics.engagementRate !== 'number') {
      return [];
    }

    return [
      {
        title: "Total Members",
        value: metrics.totalMembers.toLocaleString(),
        change: `+${metrics.growth?.members || 0}% from last month`,
        icon: Users,
        trend: "up" as const,
        color: "blue" as const
      },
      {
        title: "Active Members",
        value: metrics.activeMembers.toLocaleString(),
        change: `+${metrics.growth?.active || 0}% from last month`,
        icon: TrendingUp,
        trend: "up" as const,
        color: "green" as const
      },
      {
        title: "Messages Today",
        value: metrics.messagesToday.toLocaleString(),
        change: `+${metrics.growth?.messages || 0}% from last month`,
        icon: MessageSquare,
        trend: "up" as const,
        color: "purple" as const
      },
      {
        title: "Engagement Rate",
        value: `${metrics.engagementRate}%`,
        change: `+${metrics.growth?.engagement || 0}% from last month`,
        icon: Heart,
        trend: "up" as const,
        color: "pink" as const
      }
    ];
  };

  const displayMetrics = formatMetrics();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-300">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">Failed to load dashboard data</p>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Monitor your community health and engagement metrics</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        {/* AI Summary */}
        <AISummary />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Feed - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <ActivityFeed activities={activities || []} />
          </div>

          {/* Community Overview - Takes up 1 column */}
          <div className="lg:col-span-1">
            <CommunityOverview communityStats={communityStats} />
          </div>
        </div>
      </div>
    </div>
  );
};
