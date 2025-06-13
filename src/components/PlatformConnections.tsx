import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  RefreshCw,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { SocialAccountsService, SocialAccount, Platform } from '@/lib/services/socialAccounts';

interface PlatformAccount {
  id: string;
  platform: string;
  platformName: string;
  icon: string;
  color: string;
  isConnected: boolean;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
  account: {
    username: string;
    displayName: string;
    profilePicture: string;
    followers: number;
    verified: boolean;
  } | null;
  permissions: string[];
  lastSync: Date | null;
  features: {
    posting: boolean;
    scheduling: boolean;
    analytics: boolean;
    messaging: boolean;
  };
  metrics: {
    postsThisMonth: number;
    engagement: number;
    reach: number;
  } | null;
}

// Removed mock platform accounts - now using real API data only

export const PlatformConnections = () => {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // Default platforms to show when API fails or no data
  const defaultPlatforms = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      features: ['posts', 'threads', 'analytics', 'mentions']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: '#0077B5',
      features: ['posts', 'articles', 'analytics', 'company_pages']
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '👥',
      color: '#1877F2',
      features: ['posts', 'pages', 'analytics', 'groups']
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📸',
      color: '#E4405F',
      features: ['posts', 'stories', 'analytics', 'reels']
    }
  ];

  // Load connected accounts and supported platforms
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [accountsData, platformsData] = await Promise.all([
          SocialAccountsService.getConnectedAccounts(),
          SocialAccountsService.getSupportedPlatforms()
        ]);
        setAccounts(accountsData);
        setPlatforms(platformsData.length > 0 ? platformsData : defaultPlatforms);
      } catch (error) {
        console.error('Error loading platform data:', error);
        toast.error('Failed to load platform connections, showing available platforms');
        // Use default platforms as fallback
        setPlatforms(defaultPlatforms);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Connected';
      case 'warning':
        return 'Limited Access';
      case 'error':
        return 'Connection Error';
      default:
        return 'Not Connected';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Create combined platform data (connected accounts + available platforms)
  const getCombinedPlatforms = () => {
    const combinedPlatforms = [];

    // Add all supported platforms
    for (const platform of platforms) {
      const connectedAccount = accounts.find(acc => acc.platform === platform.id);

      if (connectedAccount) {
        // Platform is connected - use account data
        combinedPlatforms.push({
          id: connectedAccount.id,
          platform: connectedAccount.platform,
          platformName: platform.name,
          icon: platform.icon,
          color: `bg-blue-500`, // Convert hex to Tailwind class
          isConnected: true,
          status: connectedAccount.is_active ? 'healthy' : 'error',
          account: {
            username: connectedAccount.username,
            displayName: connectedAccount.display_name,
            profilePicture: connectedAccount.avatar_url || '/api/placeholder/40/40',
            followers: connectedAccount.metadata?.followers_count || 0,
            verified: connectedAccount.metadata?.verified || false
          },
          permissions: connectedAccount.permissions || [],
          lastSync: connectedAccount.updated_at ? new Date(connectedAccount.updated_at) : null,
          features: {
            posting: true,
            scheduling: true,
            analytics: true,
            messaging: true
          },
          metrics: {
            postsThisMonth: 0,
            engagement: 0,
            reach: 0
          }
        });
      } else {
        // Platform is not connected - show as available for connection
        combinedPlatforms.push({
          id: platform.id,
          platform: platform.id,
          platformName: platform.name,
          icon: platform.icon,
          color: `bg-blue-500`, // Convert hex to Tailwind class
          isConnected: false,
          status: 'disconnected',
          account: null,
          permissions: [],
          lastSync: null,
          features: {
            posting: false,
            scheduling: false,
            analytics: false,
            messaging: false
          },
          metrics: null
        });
      }
    }

    return combinedPlatforms;
  };

  const handleConnect = async (platform: string) => {
    try {
      setConnecting(platform);
      const platformInfo = platforms.find(p => p.id === platform);
      toast.info(`Connecting to ${platformInfo?.name || platform}...`);

      const result = await SocialAccountsService.connectPlatform(platform);

      // Reload accounts to get the updated list
      const updatedAccounts = await SocialAccountsService.getConnectedAccounts();
      setAccounts(updatedAccounts);

      toast.success(`${platformInfo?.name || platform} account connected successfully!`);
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect platform');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      await SocialAccountsService.disconnectAccount(accountId);

      // Remove the account from the local state
      setAccounts(prev => prev.filter(a => a.id !== accountId));

      const platformInfo = platforms.find(p => p.id === account.platform);
      toast.success(`${platformInfo?.name || account.platform} account disconnected`);
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect platform');
    }
  };

  const handleRefresh = (platformId: string) => {
    setRefreshing(platformId);

    setTimeout(() => {
      setAccounts(prev =>
        prev.map(account =>
          account.id === platformId
            ? { ...account, updated_at: new Date().toISOString() }
            : account
        )
      );
      setRefreshing(null);
      toast.success('Data refreshed');
    }, 2000);
  };

  // Get combined platform data for rendering
  const combinedPlatforms = getCombinedPlatforms();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">

      {/* Connection Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Connected</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {combinedPlatforms.filter(p => p.isConnected).length}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Available Platforms</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {combinedPlatforms.length}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total Followers</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {formatNumber(combinedPlatforms.reduce((sum, platform) => sum + (platform.account?.followers || 0), 0))}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Ready to Connect</p>
                <p className="text-xl sm:text-2xl font-bold text-pink-600">
                  {combinedPlatforms.filter(p => !p.isConnected).length}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {loading ? (
          // Loading state
          <div className="col-span-full flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading platforms...</span>
          </div>
        ) : (
          combinedPlatforms.map((platform) => (
            <Card key={platform.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white text-lg`}>
                    {platform.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{platform.platformName}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(platform.status)}
                      <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(platform.status)}`}>
                        {getStatusText(platform.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {platform.isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRefresh(platform.id)}
                      disabled={refreshing === platform.id}
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing === platform.id ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {platform.isConnected && platform.account ? (
                <>
                  {/* Account Info */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Avatar>
                      <AvatarImage src={platform.account.profilePicture} />
                      <AvatarFallback>{platform.account.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{platform.account.displayName}</p>
                        {platform.account.verified && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {platform.account.username} • {formatNumber(platform.account.followers)} followers
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Available Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Posting</span>
                        <Switch checked={platform.features.posting} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Scheduling</span>
                        <Switch checked={platform.features.scheduling} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Analytics</span>
                        <Switch checked={platform.features.analytics} disabled />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Messaging</span>
                        <Switch checked={platform.features.messaging} disabled />
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  {platform.metrics && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">This Month's Performance</h4>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-blue-600">{platform.metrics.postsThisMonth}</p>
                          <p className="text-xs text-gray-500">Posts</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{platform.metrics.engagement}%</p>
                          <p className="text-xs text-gray-500">Engagement</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">{formatNumber(platform.metrics.reach)}</p>
                          <p className="text-xs text-gray-500">Reach</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Last Sync */}
                  {platform.lastSync && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Last synced: {formatTimeAgo(platform.lastSync)}</span>
                      <Button variant="link" size="sm" className="p-0 h-auto">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View on {platform.platformName}
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      Manage Permissions
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnect(platform.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </>
              ) : (
                /* Not Connected State */
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{platform.icon}</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Connect your {platform.platformName} account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Manage your {platform.platformName} content and engage with your audience
                  </p>
                  <Button
                    onClick={() => handleConnect(platform.platform)}
                    className={platform.color}
                    disabled={connecting === platform.platform}
                  >
                    {connecting === platform.platform ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      `Connect ${platform.platformName}`
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
};
