import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
  color: "blue" | "green" | "purple" | "pink";
}

export const MetricCard = ({ title, value, change, icon: Icon, trend, color }: MetricCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700",
    pink: "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-700"
  };

  const iconBgClasses = {
    blue: "bg-blue-100 dark:bg-blue-800/30",
    green: "bg-green-100 dark:bg-green-800/30",
    purple: "bg-purple-100 dark:bg-purple-800/30",
    pink: "bg-pink-100 dark:bg-pink-800/30"
  };

  return (
    <Card className={cn("border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1", colorClasses[color])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-xl", iconBgClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant={trend === "up" ? "default" : "destructive"} className="text-xs">
            {trend === "up" ? "↗" : "↘"}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{change}</p>
        </div>
      </CardContent>
    </Card>
  );
};
