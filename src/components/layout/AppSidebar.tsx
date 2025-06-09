import { useState } from "react";
import {
  LayoutDashboard,
  PenTool,
  Calendar,
  FileText,
  Image,
  Inbox,
  MessageCircle,
  Users,
  Globe,
  Heart,
  UserCheck,
  Shield,
  TrendingUp,
  UserPlus,
  ClipboardList,
  Mail,
  GitBranch,
  BarChart3,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Settings
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isExpandable: false
  },
  {
    title: "Content",
    icon: PenTool,
    isExpandable: true,
    subItems: [
      { title: "Create Post", url: "/dashboard/content/create", icon: PenTool },
      { title: "Scheduler", url: "/dashboard/content/scheduler", icon: Calendar },
      { title: "Drafts", url: "/dashboard/content/drafts", icon: FileText },
      { title: "Media Library", url: "/dashboard/content/media", icon: Image }
    ]
  },
  {
    title: "Communications",
    icon: MessageCircle,
    isExpandable: true,
    subItems: [
      { title: "Inbox", url: "/dashboard/communications/inbox", icon: Inbox },
      { title: "Team Chat", url: "/dashboard/communications/team-chat", icon: MessageCircle }
    ]
  },
  {
    title: "Community",
    icon: Users,
    isExpandable: true,
    subItems: [
      { title: "Community", url: "/dashboard/community/overview", icon: Users },
      { title: "Platforms", url: "/dashboard/community/platforms", icon: Globe },
      { title: "Health", url: "/dashboard/community/health", icon: Heart },
      { title: "Members", url: "/dashboard/community/members", icon: UserCheck },
      { title: "Moderation", url: "/dashboard/community/moderation", icon: Shield },
      { title: "Engagement", url: "/dashboard/community/engagement", icon: TrendingUp }
    ]
  },
  {
    title: "Team",
    icon: UserPlus,
    isExpandable: true,
    subItems: [
      { title: "Activity", url: "/dashboard/team/activity", icon: TrendingUp },
      { title: "Tasks", url: "/dashboard/team/tasks", icon: ClipboardList },
      { title: "Invitations", url: "/dashboard/team/invitations", icon: Mail },
      { title: "Workflows", url: "/dashboard/team/workflows", icon: GitBranch }
    ]
  },
  {
    title: "Analytics",
    icon: BarChart3,
    isExpandable: true,
    subItems: [
      { title: "Overview", url: "/dashboard/analytics/overview", icon: BarChart3 },
      { title: "Content Library", url: "/dashboard/analytics/content", icon: FolderOpen }
    ]
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    isExpandable: false
  }
];

export function AppSidebar() {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(["Dashboard"]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const isActive = (url: string) => location.pathname === url;
  const isGroupActive = (subItems?: Array<{url: string}>) => 
    subItems?.some(item => isActive(item.url)) || false;

  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 w-64 min-w-64">
      <SidebarContent className="p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">SocialTribe</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300 truncate">AI-Powered Social Media Manager</p>
        </div>

        <SidebarGroup>
          <SidebarMenu className="space-y-2">
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {!item.isExpandable ? (
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url || '#'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors min-w-0 ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-500'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                ) : (
                  <Collapsible
                    open={openGroups.includes(item.title)}
                    onOpenChange={() => toggleGroup(item.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors ${
                          isGroupActive(item.subItems)
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-500'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{item.title}</span>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {openGroups.includes(item.title) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="mt-2 ml-6 space-y-1">
                        {item.subItems?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={subItem.url}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors min-w-0 ${
                                    isActive
                                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-100 font-medium'
                                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                  }`
                                }
                              >
                                <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
