import { useState, useEffect, useCallback } from 'react';
import { NotificationData, websocketService } from '@/lib/websocket';
import { useToast } from '@/components/ui/use-toast';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    post_published: boolean;
    comment_received: boolean;
    mention: boolean;
    system: boolean;
    team_invite: boolean;
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    inApp: true,
    types: {
      post_published: true,
      comment_received: true,
      mention: true,
      system: true,
      team_invite: true,
    },
  });
  const { toast } = useToast();

  // Load initial notifications and preferences
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // In a real app, this would fetch from an API
        const storedNotifications = localStorage.getItem('notifications');
        const storedPreferences = localStorage.getItem('notification_preferences');

        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications);
          setNotifications(parsedNotifications);
          setUnreadCount(parsedNotifications.filter((n: NotificationData) => !n.read).length);
        } else {
          // Add some mock notifications for development
          const mockNotifications: NotificationData[] = [
            {
              id: 'notif-1',
              type: 'post_published',
              title: 'Post Published Successfully',
              message: 'Your post "Community Update" has been published to Twitter and LinkedIn.',
              read: false,
              created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
              user_id: '1',
            },
            {
              id: 'notif-2',
              type: 'comment_received',
              title: 'New Comment',
              message: 'Sarah Johnson commented on your post about social media trends.',
              read: false,
              created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
              user_id: '1',
            },
            {
              id: 'notif-3',
              type: 'mention',
              title: 'You were mentioned',
              message: 'John Doe mentioned you in a discussion about community management.',
              read: true,
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              user_id: '1',
            },
            {
              id: 'notif-4',
              type: 'system',
              title: 'Weekly Report Ready',
              message: 'Your weekly analytics report is now available for download.',
              read: true,
              created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              user_id: '1',
            },
          ];

          setNotifications(mockNotifications);
          setUnreadCount(mockNotifications.filter(n => !n.read).length);
          localStorage.setItem('notifications', JSON.stringify(mockNotifications));
        }

        if (storedPreferences) {
          setPreferences(JSON.parse(storedPreferences));
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Set up WebSocket listeners
  useEffect(() => {
    const handleNewNotification = (notification: NotificationData) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification if in-app notifications are enabled
      if (preferences.inApp && preferences.types[notification.type]) {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      }

      // Store in localStorage
      const updatedNotifications = [notification, ...notifications];
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications.slice(0, 100))); // Keep last 100
    };

    websocketService.on('notification', handleNewNotification);

    return () => {
      websocketService.off('notification', handleNewNotification);
    };
  }, [notifications, preferences, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));

    // Update WebSocket
    websocketService.markNotificationAsRead(notificationId);

    // Update localStorage
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    setUnreadCount(0);

    // Update WebSocket
    websocketService.markAllNotificationsAsRead();

    // Update localStorage
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  }, [notifications]);

  const deleteNotification = useCallback((notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Update localStorage
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  }, [notifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    localStorage.setItem('notification_preferences', JSON.stringify(updatedPreferences));

    toast({
      title: "Preferences Updated",
      description: "Your notification preferences have been saved.",
    });
  }, [preferences, toast]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive browser notifications.",
      });
      return true;
    } else {
      toast({
        title: "Notifications Disabled",
        description: "You won't receive browser notifications.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const showBrowserNotification = useCallback((notification: NotificationData) => {
    if (Notification.permission === 'granted' && preferences.push && preferences.types[notification.type]) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }, [preferences]);

  // Filter notifications by type
  const getNotificationsByType = useCallback((type: NotificationData['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return notifications.filter(n => new Date(n.created_at) > oneDayAgo);
  }, [notifications]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    preferences,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    requestPermission,
    showBrowserNotification,

    // Helpers
    getNotificationsByType,
    getRecentNotifications,
  };
};
