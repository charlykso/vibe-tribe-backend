import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Link, 
  BarChart3, 
  Upload, 
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface UsageLimit {
  id: string;
  name: string;
  current: number;
  limit: number;
  icon: React.ReactNode;
  color: string;
  description: string;
  resetPeriod: string;
}

interface UsageMeterProps {
  currentPlan?: 'starter' | 'professional' | 'business' | 'enterprise';
  onUpgrade?: () => void;
}

export const UsageMeters: React.FC<UsageMeterProps> = ({ 
  currentPlan = 'starter',
  onUpgrade 
}) => {
  const getUsageLimits = (): UsageLimit[] => {
    switch (currentPlan) {
      case 'starter':
        return [
          {
            id: 'posts',
            name: 'Posts',
            current: 7,
            limit: 10,
            icon: <FileText className="w-4 h-4" />,
            color: 'text-blue-600',
            description: 'Monthly post limit',
            resetPeriod: 'Resets in 23 days'
          },
          {
            id: 'platforms',
            name: 'Platforms',
            current: 2,
            limit: 2,
            icon: <Link className="w-4 h-4" />,
            color: 'text-green-600',
            description: 'Connected platforms',
            resetPeriod: 'Upgrade to add more'
          },
          {
            id: 'team',
            name: 'Team Members',
            current: 1,
            limit: 1,
            icon: <Users className="w-4 h-4" />,
            color: 'text-purple-600',
            description: 'Active team members',
            resetPeriod: 'Upgrade to add more'
          },
          {
            id: 'storage',
            name: 'Storage',
            current: 245,
            limit: 1000,
            icon: <Upload className="w-4 h-4" />,
            color: 'text-orange-600',
            description: 'Media storage (MB)',
            resetPeriod: 'Upgrade for more space'
          }
        ];
      
      case 'professional':
        return [
          {
            id: 'posts',
            name: 'Posts',
            current: 67,
            limit: 100,
            icon: <FileText className="w-4 h-4" />,
            color: 'text-blue-600',
            description: 'Monthly post limit',
            resetPeriod: 'Resets in 23 days'
          },
          {
            id: 'platforms',
            name: 'Platforms',
            current: 4,
            limit: 5,
            icon: <Link className="w-4 h-4" />,
            color: 'text-green-600',
            description: 'Connected platforms',
            resetPeriod: 'Upgrade to add more'
          },
          {
            id: 'team',
            name: 'Team Members',
            current: 3,
            limit: 5,
            icon: <Users className="w-4 h-4" />,
            color: 'text-purple-600',
            description: 'Active team members',
            resetPeriod: 'Upgrade to add more'
          },
          {
            id: 'storage',
            name: 'Storage',
            current: 2.1,
            limit: 10,
            icon: <Upload className="w-4 h-4" />,
            color: 'text-orange-600',
            description: 'Media storage (GB)',
            resetPeriod: 'Upgrade for more space'
          }
        ];
      
      case 'business':
        return [
          {
            id: 'posts',
            name: 'Posts',
            current: 234,
            limit: 500,
            icon: <FileText className="w-4 h-4" />,
            color: 'text-blue-600',
            description: 'Monthly post limit',
            resetPeriod: 'Resets in 23 days'
          },
          {
            id: 'platforms',
            name: 'Platforms',
            current: 7,
            limit: 10,
            icon: <Link className="w-4 h-4" />,
            color: 'text-green-600',
            description: 'Connected platforms',
            resetPeriod: 'Upgrade to unlimited'
          },
          {
            id: 'team',
            name: 'Team Members',
            current: 12,
            limit: 15,
            icon: <Users className="w-4 h-4" />,
            color: 'text-purple-600',
            description: 'Active team members',
            resetPeriod: 'Upgrade to unlimited'
          },
          {
            id: 'storage',
            name: 'Storage',
            current: 15.7,
            limit: 100,
            icon: <Upload className="w-4 h-4" />,
            color: 'text-orange-600',
            description: 'Media storage (GB)',
            resetPeriod: 'Upgrade for unlimited'
          }
        ];
      
      default:
        return [];
    }
  };

  const usageLimits = getUsageLimits();

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { color: 'text-red-600', bg: 'bg-red-100', status: 'critical' };
    if (percentage >= 75) return { color: 'text-yellow-600', bg: 'bg-yellow-100', status: 'warning' };
    return { color: 'text-green-600', bg: 'bg-green-100', status: 'good' };
  };

  const formatValue = (value: number, id: string) => {
    if (id === 'storage') {
      if (currentPlan === 'starter') {
        return `${value} MB`;
      }
      return `${value} GB`;
    }
    return value.toString();
  };

  const formatLimit = (limit: number, id: string) => {
    if (id === 'storage') {
      if (currentPlan === 'starter') {
        return `${limit} MB`;
      }
      return `${limit} GB`;
    }
    return limit.toString();
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      toast({
        title: "Upgrade Plan",
        description: "Redirecting to pricing page...",
      });
    }
  };

  const getPlanBadge = () => {
    const planConfig = {
      starter: { label: 'Starter', color: 'bg-gray-100 text-gray-800' },
      professional: { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
      business: { label: 'Business', color: 'bg-purple-100 text-purple-800' },
      enterprise: { label: 'Enterprise', color: 'bg-orange-100 text-orange-800' }
    };

    const config = planConfig[currentPlan];
    return (
      <Badge className={`${config.color} dark:bg-opacity-20`}>
        {config.label} Plan
      </Badge>
    );
  };

  const hasNearLimits = usageLimits.some(limit => getUsagePercentage(limit.current, limit.limit) >= 75);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Usage & Limits</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getPlanBadge()}
            {hasNearLimits && (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {usageLimits.map((usage) => {
          const percentage = getUsagePercentage(usage.current, usage.limit);
          const status = getUsageStatus(percentage);
          
          return (
            <div key={usage.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={usage.color}>
                    {usage.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{usage.name}</h4>
                    <p className="text-xs text-gray-500">{usage.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatValue(usage.current, usage.id)} / {formatLimit(usage.limit, usage.id)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(percentage)}% used
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={percentage} 
                  className={`h-2 ${status.bg}`}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{usage.resetPeriod}</span>
                  {percentage >= 75 && (
                    <span className={`${status.color} font-medium`}>
                      {percentage >= 90 ? 'Critical' : 'Warning'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Upgrade prompt */}
        {(currentPlan === 'starter' || currentPlan === 'professional') && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Crown className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Need more capacity?
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Upgrade your plan to get higher limits, more features, and better performance.
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <Button size="sm" onClick={handleUpgrade}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                  <Button size="sm" variant="outline">
                    View Plans
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enterprise message */}
        {currentPlan === 'enterprise' && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-3">
              <Crown className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-900 dark:text-orange-100">
                  Enterprise Plan
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-200">
                  You have unlimited access to all features. Contact your account manager for custom limits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage insights */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-sm mb-3 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Usage Insights</span>
          </h4>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Most active day</span>
              <span className="font-medium">Tuesday</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Average posts per day</span>
              <span className="font-medium">2.3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Peak usage time</span>
              <span className="font-medium">2:00 PM - 4:00 PM</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
