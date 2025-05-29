
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { MobileNav } from '@/components/mobile/MobileNav';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { Dashboard } from '@/components/Dashboard';
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
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { PricingPage } from '@/components/PricingPage';
import { BillingSection } from '@/components/BillingSection';
import { IntegrationTest } from '@/components/IntegrationTest';
import { TeamInvitations } from '@/components/team/TeamInvitations';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const handleRefresh = async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, this would refresh the current page data
    console.log('Refreshing data...');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'post-composer':
        return <PostComposer />;
      case 'scheduler':
        return <PostScheduler />;
      case 'drafts':
        return <DraftManager />;
      case 'media':
        return <MediaUpload />;
      case 'inbox':
        return <UnifiedInbox />;
      case 'platforms':
        return <PlatformConnections />;
      case 'community-management':
        return <CommunityManagement />;
      case 'community-health':
        return <CommunityHealth />;
      case 'members':
        return <MemberManagement />;
      case 'moderation':
        return <ModerationTools />;
      case 'engagement':
        return <EngagementTools />;
      case 'analytics':
        return <Analytics />;
      case 'integration-test':
        return <IntegrationTest />;
      case 'settings':
        return <Settings />;
      case 'approval-workflows':
        return <ApprovalWorkflows />;
      case 'team-activity':
        return <TeamActivityFeed />;
      case 'task-assignment':
        return <TaskAssignment />;
      case 'team-chat':
        return <TeamChat />;
      case 'content-library':
        return <SharedContentLibrary />;
      case 'onboarding':
        return <OnboardingFlow />;
      case 'pricing':
        return <PricingPage />;
      case 'billing':
        return <BillingSection />;
      case 'team-invitations':
        return <TeamInvitations />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between md:justify-end p-4 md:p-0">
            {/* Mobile Navigation */}
            <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
            <TopNav darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <PullToRefresh onRefresh={handleRefresh}>
              <div className="container mx-auto px-6 py-8 pb-20 md:pb-8">
                {renderContent()}
              </div>
            </PullToRefresh>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
