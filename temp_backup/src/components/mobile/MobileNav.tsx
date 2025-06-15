import React, { useState } from 'react';
import { Menu, X, Home, Edit, Calendar, Inbox, Users, BarChart3, Settings, MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'post-composer', label: 'Compose', icon: Edit },
  { id: 'scheduler', label: 'Schedule', icon: Calendar },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'team-chat', label: 'Team Chat', icon: MessageCircle },
  { id: 'approval-workflows', label: 'Approvals', icon: CheckCircle },
  { id: 'community-management', label: 'Community', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleNavigation = (tabId: string) => {
    setActiveTab(tabId);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile Navigation Trigger */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"></div>
                  <span className="text-xl font-bold">VibeTribe</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const showBadge = item.id === 'inbox' && unreadCount > 0;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigation(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                        {showBadge && (
                          <Badge variant="destructive" className="ml-auto">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  VibeTribe Mobile v1.0
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showBadge = item.id === 'inbox' && unreadCount > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
                {showBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
