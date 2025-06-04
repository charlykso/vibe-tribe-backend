import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, AlertTriangle, CheckCircle, LucideIcon } from "lucide-react";
import { Activity } from "@/lib/api";

interface ActivityFeedProps {
  activities?: Activity[];
}

export const ActivityFeed = ({ activities = [] }: ActivityFeedProps) => {
  // Map icon names to actual icon components
  const getIconComponent = (iconName: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      Users,
      Heart,
      AlertTriangle,
      CheckCircle,
    };
    return iconMap[iconName] || Users;
  };

  // Map activity types to colors
  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      member_joined: "blue",
      engagement: "pink",
      moderation: "yellow",
      milestone: "green",
    };
    return colorMap[type] || "blue";
  };

  // Enhanced activities with icon components and colors
  const enhancedActivities = activities.map(activity => ({
    ...activity,
    iconComponent: getIconComponent(activity.icon),
    color: getActivityColor(activity.type)
  }));

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/30",
      pink: "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-800/30",
      yellow: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-800/30",
      green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800/30"
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {enhancedActivities.length > 0 ? (
            enhancedActivities.map((activity) => {
              const Icon = activity.iconComponent;
              return (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className={`p-2 rounded-full ${getIconColor(activity.color)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
