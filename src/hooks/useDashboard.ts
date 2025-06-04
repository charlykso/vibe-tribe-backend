import { useState, useEffect } from 'react';
import { dashboardApi, DashboardMetrics, Activity, CommunityStats } from '@/lib/api';

// Hook for dashboard metrics
export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
};

// Hook for recent activity
export const useRecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getActivity();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
      console.error('Error fetching recent activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivity,
  };
};

// Hook for community stats
export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getCommunityStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch community stats');
      console.error('Error fetching community stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

// Combined hook for all dashboard data
export const useDashboardData = () => {
  const metrics = useDashboardMetrics();
  const activity = useRecentActivity();
  const community = useCommunityStats();

  const isLoading = metrics.loading || activity.loading || community.loading;
  const hasError = metrics.error || activity.error || community.error;

  const refetchAll = () => {
    metrics.refetch();
    activity.refetch();
    community.refetch();
  };

  return {
    metrics: metrics.metrics,
    activities: activity.activities,
    communityStats: community.stats,
    loading: isLoading,
    error: hasError,
    refetch: refetchAll,
  };
};
