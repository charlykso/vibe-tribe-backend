
import React from 'react';
import {
  Home,
  Users,
  Shield,
  Heart,
  BarChart3,
  Settings,
  Activity,
  MessageSquare,
  Edit3,
  Calendar,
  FileText,
  Link,
  Inbox,
  Upload,
  CheckCircle,
  Clock,
  UserCheck,
  MessageCircle,
  FolderOpen,
  DollarSign,
  CreditCard,
  Zap,
  TestTube,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'post-composer', label: 'Create Post', icon: Edit3 },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'drafts', label: 'Drafts', icon: FileText },
    { id: 'media', label: 'Media Library', icon: Upload },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'platforms', label: 'Platforms', icon: Link },
    { id: 'community-management', label: 'Community', icon: Users },
    { id: 'community-health', label: 'Community Health', icon: Activity },
    { id: 'members', label: 'Member Management', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'engagement', label: 'Engagement', icon: Heart },
    { id: 'approval-workflows', label: 'Approval Workflows', icon: CheckCircle },
    { id: 'team-activity', label: 'Team Activity', icon: Clock },
    { id: 'task-assignment', label: 'Task Assignment', icon: UserCheck },
    { id: 'team-chat', label: 'Team Chat', icon: MessageCircle },
    { id: 'team-invitations', label: 'Team Invitations', icon: UserPlus },
    { id: 'content-library', label: 'Content Library', icon: FolderOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'integration-test', label: 'Integration Test', icon: TestTube },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'onboarding', label: 'Onboarding', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">SocialHub Pro</h1>
        </div>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                activeTab === item.id
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-r-4 border-blue-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
