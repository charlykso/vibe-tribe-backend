import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Settings, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationData } from '@/lib/websocket';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: NotificationData['type']) => {
  switch (type) {
    case 'post_published':
      return '📝';
    case 'comment_received':
      return '💬';
    case 'mention':
      return '@';
    case 'system':
      return '⚙️';
    case 'team_invite':
      return '👥';
    default:
      return '🔔';
  }
};

const getNotificationColor = (type: NotificationData['type']) => {
  switch (type) {
    case 'post_published':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'comment_received':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'mention':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'system':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    case 'team_invite':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}) => {
  return (
    <div className={`p-4 border-l-4 ${notification.read ? 'border-gray-200 dark:border-gray-700' : 'border-blue-500'} ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {notification.title}
              </h4>
              <Badge variant="secondary" className={`text-xs ${getNotificationColor(notification.type)}`}>
                {notification.type.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(notification.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getNotificationsByType,
    getRecentNotifications,
  } = useNotifications();

  const recentNotifications = getRecentNotifications();
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-96">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-sm text-gray-500">Loading notifications...</div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                      <Bell className="h-8 w-8 text-gray-400 mb-2" />
                      <div className="text-sm text-gray-500">No notifications yet</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification, index) => (
                        <div key={notification.id}>
                          <NotificationItem
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                          />
                          {index < notifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread" className="mt-0">
                <ScrollArea className="h-96">
                  {unreadNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                      <CheckCheck className="h-8 w-8 text-green-500 mb-2" />
                      <div className="text-sm text-gray-500">All caught up!</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {unreadNotifications.map((notification, index) => (
                        <div key={notification.id}>
                          <NotificationItem
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                          />
                          {index < unreadNotifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-0">
                <ScrollArea className="h-96">
                  {recentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                      <Bell className="h-8 w-8 text-gray-400 mb-2" />
                      <div className="text-sm text-gray-500">No recent notifications</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentNotifications.map((notification, index) => (
                        <div key={notification.id}>
                          <NotificationItem
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                          />
                          {index < recentNotifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-4 flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear all
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
