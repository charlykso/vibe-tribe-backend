import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CommunityStats } from "@/lib/api";

interface CommunityOverviewProps {
  communityStats?: CommunityStats | null;
}

export const CommunityOverview = ({ communityStats }: CommunityOverviewProps) => {
  // Format communities data
  const communities = communityStats?.communities?.map(community => ({
    name: community.name,
    members: `${community.members.toLocaleString()} members`,
    status: community.status,
    change: `${community.change > 0 ? '+' : ''}${community.change}%`,
    trend: community.change > 0 ? "up" : community.change < 0 ? "down" : "stable"
  })) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "growing":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "stable":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-3 w-3" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-green-600 dark:text-green-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Communities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {communities.length > 0 ? (
            communities.map((community, index) => (
              <div key={`community-${community.name}-${index}`} className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{community.name}</h3>
                  <Badge variant="secondary" className={getStatusColor(community.status)}>
                    {community.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{community.members}</p>
                <div className={`flex items-center gap-1 text-sm ${getTrendColor(community.trend)}`}>
                  {getTrendIcon(community.trend)}
                  <span>{community.change}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No community data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
