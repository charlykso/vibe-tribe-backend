import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Mail, Shield, Loader2 } from 'lucide-react';
import { InviteMemberDialog } from './InviteMemberDialog';
import { InvitationsList } from './InvitationsList';
import { InvitationsService, TeamStats } from '@/lib/services/invitations';

interface TeamInvitationsProps {
  className?: string;
}

export const TeamInvitations: React.FC<TeamInvitationsProps> = ({ className }) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchTeamStats = async () => {
    try {
      setStatsLoading(true);
      const response = await InvitationsService.getTeamStats();
      console.log('📊 Team stats response:', response);
      // The API client returns { data: { success: true, data: { stats } }, status }
      // So we need to access response.data.data to get the actual stats
      const statsData = (response.data as any).data;
      setTeamStats(statsData);
    } catch (error) {
      console.error('Failed to fetch team stats:', error);
      // Set default values on error
      setTeamStats({
        totalMembers: 0,
        pendingInvites: 0,
        admins: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamStats();
  }, [refreshTrigger]);

  const handleInvitationSent = () => {
    // Trigger refresh of invitations list and stats
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between">

        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    teamStats?.totalMembers || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invites</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    teamStats?.pendingInvites || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    teamStats?.admins || 0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <InvitationsList refreshTrigger={refreshTrigger} />

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvitationSent={handleInvitationSent}
      />

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 text-lg">
            How Team Invitations Work
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Invited members receive an email with a secure invitation link</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Invitations expire after 7 days for security</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>You can resend or cancel invitations at any time</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Only organization admins can send invitations</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
