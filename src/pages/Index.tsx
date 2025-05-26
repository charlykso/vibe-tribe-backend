
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { Dashboard } from '@/components/Dashboard';
import { CommunityHealth } from '@/components/CommunityHealth';
import { MemberManagement } from '@/components/MemberManagement';
import { ModerationTools } from '@/components/ModerationTools';
import { EngagementTools } from '@/components/EngagementTools';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
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
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-6 py-8">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
