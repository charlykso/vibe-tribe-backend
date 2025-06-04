import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { UserDropdown } from "@/components/layout/UserDropdown";

// Import existing components
import { PostComposer } from '@/components/PostComposer';
import { PostScheduler } from '@/components/PostScheduler';
import { DraftManager } from '@/components/DraftManager';
import { MediaUpload } from '@/components/MediaUpload';
import { UnifiedInbox } from '@/components/UnifiedInbox';
import { PlatformConnections } from '@/components/PlatformConnections';
import { CommunityManagement } from '@/components/CommunityManagement';
import { CommunityHealth } from '@/components/CommunityHealth';
import { MemberManagement } from '@/components/MemberManagement';
import { ModerationTools } from '@/components/ModerationTools';
import { EngagementTools } from '@/components/EngagementTools';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';
import { ApprovalWorkflows } from '@/components/ApprovalWorkflows';
import { TeamActivityFeed } from '@/components/TeamActivityFeed';
import { TaskAssignment } from '@/components/TaskAssignment';
import { TeamChat } from '@/components/TeamChat';
import { SharedContentLibrary } from '@/components/SharedContentLibrary';
import { TeamInvitations } from '@/components/team/TeamInvitations';

// Import new dashboard components
import { NewDashboard } from '@/components/dashboard/NewDashboard';

export const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <SidebarInset className="flex-1 ml-2 sm:ml-4">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 bg-white dark:bg-gray-800 shadow-sm rounded-t-lg">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center gap-4">
              <UserDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border-l border-r border-b border-gray-200 dark:border-gray-700">
            <Routes>
              <Route index element={<NewDashboard />} />
              <Route path="overview" element={<NewDashboard />} />

              {/* Content Management Routes */}
              <Route path="content/create" element={
                <PageWrapper title="Create Post" description="Compose and publish content across multiple platforms">
                  <PostComposer />
                </PageWrapper>
              } />
              <Route path="content/scheduler" element={
                <PageWrapper title="Post Scheduler" description="Schedule and manage your content calendar">
                  <PostScheduler />
                </PageWrapper>
              } />
              <Route path="content/drafts" element={
                <PageWrapper title="Draft Manager" description="Manage your draft posts and templates">
                  <DraftManager />
                </PageWrapper>
              } />
              <Route path="content/media" element={
                <PageWrapper title="Media Library" description="Upload and manage your media files">
                  <MediaUpload />
                </PageWrapper>
              } />

              {/* Communications Routes */}
              <Route path="communications/inbox" element={
                <PageWrapper title="Unified Inbox" description="Manage messages from all platforms in one place">
                  <UnifiedInbox />
                </PageWrapper>
              } />
              <Route path="communications/team-chat" element={
                <PageWrapper title="Team Chat" description="Collaborate with your team members">
                  <TeamChat />
                </PageWrapper>
              } />

              {/* Community & Platforms Routes */}
              <Route path="community/overview" element={
                <PageWrapper title="Community Management" description="Monitor and manage your community">
                  <CommunityManagement />
                </PageWrapper>
              } />
              <Route path="community/platforms" element={
                <PageWrapper title="Platform Connections" description="Connect and manage your social media accounts">
                  <PlatformConnections />
                </PageWrapper>
              } />
              <Route path="community/health" element={
                <PageWrapper title="Community Health" description="Monitor community wellness and engagement">
                  <CommunityHealth />
                </PageWrapper>
              } />
              <Route path="community/members" element={
                <PageWrapper title="Member Management" description="Manage community members and permissions">
                  <MemberManagement />
                </PageWrapper>
              } />
              <Route path="community/moderation" element={
                <PageWrapper title="Moderation Tools" description="Review and moderate community content">
                  <ModerationTools />
                </PageWrapper>
              } />
              <Route path="community/engagement" element={
                <PageWrapper title="Engagement Tools" description="Boost community engagement and interaction">
                  <EngagementTools />
                </PageWrapper>
              } />

              {/* Team Management Routes */}
              <Route path="team/activity" element={
                <PageWrapper title="Team Activity" description="Monitor team activity and performance">
                  <TeamActivityFeed />
                </PageWrapper>
              } />
              <Route path="team/tasks" element={
                <PageWrapper title="Task Assignment" description="Assign and track team tasks">
                  <TaskAssignment />
                </PageWrapper>
              } />
              <Route path="team/invitations" element={
                <PageWrapper title="Team Invitations" description="Manage team member invitations">
                  <TeamInvitations />
                </PageWrapper>
              } />
              <Route path="team/workflows" element={
                <PageWrapper title="Approval Workflows" description="Configure content approval processes">
                  <ApprovalWorkflows />
                </PageWrapper>
              } />

              {/* Analytics & Reports Routes */}
              <Route path="analytics/overview" element={
                <PageWrapper title="Analytics" description="View detailed analytics and insights">
                  <Analytics />
                </PageWrapper>
              } />
              <Route path="analytics/content" element={
                <PageWrapper title="Content Library" description="Browse and manage your content library">
                  <SharedContentLibrary />
                </PageWrapper>
              } />

              {/* Settings */}
              <Route path="settings" element={
                <PageWrapper title="Settings" description="Configure your application preferences">
                  <Settings />
                </PageWrapper>
              } />

              {/* Fallback to dashboard */}
              <Route path="*" element={<NewDashboard />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
