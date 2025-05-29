import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  UserMinus,
  Shield,
  Flag,
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { CommunitiesService, CommunityMember, ModerationItem } from '@/lib/services/communities';
import { UsersService } from '@/lib/services/users';

// For backward compatibility with existing UI, we'll map CommunityMember to Member
interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
  email?: string;
  joinDate: Date;
  status: 'active' | 'inactive' | 'banned' | 'pending';
  role: 'member' | 'moderator' | 'admin';
  posts: number;
  engagement: number;
  lastActive: Date;
  platforms: string[];
}

// Helper function to convert CommunityMember to Member for UI compatibility
const mapCommunityMemberToMember = (communityMember: CommunityMember): Member => ({
  id: communityMember.id,
  name: communityMember.display_name,
  username: communityMember.username,
  avatar: communityMember.avatar_url || '/api/placeholder/40/40',
  email: communityMember.email,
  joinDate: new Date(communityMember.join_date || communityMember.created_at),
  status: communityMember.status,
  role: communityMember.role,
  posts: communityMember.message_count,
  engagement: Math.round(communityMember.engagement_score * 10) / 10, // Convert to percentage-like number
  lastActive: new Date(communityMember.last_active_at || communityMember.updated_at),
  platforms: communityMember.metadata?.platforms || []
});

// Helper function to convert ModerationItem timestamp
const mapModerationItem = (item: ModerationItem): ModerationItem => ({
  ...item,
  timestamp: new Date(item.created_at)
});

export const CommunityManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'members' | 'moderation'>('members');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  // Fetch communities to get the first one (for now, we'll use the first community)
  const { data: communitiesData } = useQuery({
    queryKey: ['communities'],
    queryFn: () => CommunitiesService.getCommunities(),
    select: (response) => response.data?.communities || []
  });

  // Set the first community as selected if none is selected
  useEffect(() => {
    if (communitiesData && communitiesData.length > 0 && !selectedCommunityId) {
      setSelectedCommunityId(communitiesData[0].id);
    }
  }, [communitiesData, selectedCommunityId]);

  // Fetch community members
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError
  } = useQuery({
    queryKey: ['community-members', selectedCommunityId, searchTerm, filterRole, filterStatus],
    queryFn: () => selectedCommunityId ? CommunitiesService.getCommunityMembers(selectedCommunityId, {
      search: searchTerm || undefined,
      role: filterRole !== 'all' ? filterRole : undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      limit: 100
    }) : Promise.resolve({ data: { members: [], total: 0 } }),
    enabled: !!selectedCommunityId,
    select: (response) => ({
      members: (response.data?.members || []).map(mapCommunityMemberToMember),
      total: response.data?.total || 0
    })
  });

  // Fetch moderation queue
  const {
    data: moderationData,
    isLoading: moderationLoading,
    error: moderationError
  } = useQuery({
    queryKey: ['moderation-queue', selectedCommunityId],
    queryFn: () => selectedCommunityId ? CommunitiesService.getModerationQueue(selectedCommunityId, {
      limit: 100
    }) : Promise.resolve({ data: { items: [], total: 0 } }),
    enabled: !!selectedCommunityId,
    select: (response) => ({
      items: (response.data?.items || []).map(mapModerationItem),
      total: response.data?.total || 0
    })
  });

  const members = membersData?.members || [];
  const moderationQueue = moderationData?.items || [];

  // Mutations for member actions
  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: any }) =>
      CommunitiesService.updateCommunityMember(selectedCommunityId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', selectedCommunityId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member');
    }
  });

  // Mutation for moderation actions
  const updateModerationMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      CommunitiesService.updateModerationItem(selectedCommunityId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue', selectedCommunityId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update moderation item');
    }
  });

  // Client-side filtering (since we're already filtering on the server, this is for immediate UI feedback)
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingModerationCount = moderationQueue.filter(item => item.status === 'pending').length;

  const handleMemberAction = async (memberId: string, action: 'promote' | 'demote' | 'ban' | 'unban' | 'approve') => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      let updateData: any = {};

      switch (action) {
        case 'promote':
          updateData.role = member.role === 'member' ? 'moderator' : 'admin';
          break;
        case 'demote':
          updateData.role = member.role === 'admin' ? 'moderator' : 'member';
          break;
        case 'ban':
          updateData.status = 'banned';
          break;
        case 'unban':
          updateData.status = 'active';
          break;
        case 'approve':
          updateData.status = 'active';
          break;
        default:
          return;
      }

      await updateMemberMutation.mutateAsync({ memberId, data: updateData });
      toast.success(`Member ${action}d successfully`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleModerationAction = async (itemId: string, action: 'approve' | 'reject') => {
    try {
      await updateModerationMutation.mutateAsync({
        itemId,
        data: { status: action === 'approve' ? 'approved' : 'rejected' }
      });
      toast.success(`Content ${action}d successfully`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, color: 'bg-green-500' },
      inactive: { variant: 'secondary' as const, color: 'bg-gray-500' },
      banned: { variant: 'destructive' as const, color: 'bg-red-500' },
      pending: { variant: 'outline' as const, color: 'bg-yellow-500' }
    };

    const config = variants[status as keyof typeof variants] || variants.active;

    return (
      <Badge variant={config.variant}>
        <div className={`w-2 h-2 rounded-full ${config.color} mr-2`}></div>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      member: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <Badge variant="secondary" className={colors[role as keyof typeof colors]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your community members and moderate content
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
          <Button>
            <Shield className="w-4 h-4 mr-2" />
            Moderation Settings
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-blue-600">{members.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {members.filter(m => m.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Moderation Queue</p>
                <p className="text-2xl font-bold text-red-600">{pendingModerationCount}</p>
              </div>
              <Flag className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="members" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Moderation Queue ({pendingModerationCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Filters */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>
                Members ({membersLoading ? '...' : filteredMembers.length})
                {membersLoading && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    Failed to load members: {membersError.message}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['community-members', selectedCommunityId] })}
                  >
                    Retry
                  </Button>
                </div>
              ) : membersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No members found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{member.name}</h3>
                          {getRoleBadge(member.role)}
                          {getStatusBadge(member.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.username} • {member.email}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{member.posts} posts</span>
                          <span>{member.engagement}% engagement</span>
                          <span>Last active: {formatTimeAgo(member.lastActive)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {member.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleMemberAction(member.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}

                      {member.status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMemberAction(member.id, 'unban')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleMemberAction(member.id, 'ban')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Ban
                        </Button>
                      )}

                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle>
                Moderation Queue ({moderationLoading ? '...' : moderationQueue.length})
                {moderationLoading && <Loader2 className="w-4 h-4 animate-spin inline ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moderationError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    Failed to load moderation queue: {moderationError.message}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['moderation-queue', selectedCommunityId] })}
                  >
                    Retry
                  </Button>
                </div>
              ) : moderationLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={`moderation-skeleton-${i}`} className="p-4 border rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-1"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                        </div>
                      </div>
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              ) : moderationQueue.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No items in moderation queue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moderationQueue.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={item.author.avatar} />
                          <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{item.author.name}</p>
                          <p className="text-xs text-gray-500">{item.author.username}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.platform}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(item.priority)}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">
                      <p className="text-sm">{item.content}</p>
                    </div>

                    {item.reportReason && (
                      <div className="mb-3">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          <Flag className="w-3 h-3 inline mr-1" />
                          Reported for: {item.reportReason}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={item.status === 'pending' ? 'outline' :
                                  item.status === 'approved' ? 'default' : 'destructive'}
                        >
                          {item.status}
                        </Badge>
                      </div>

                      {item.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModerationAction(item.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleModerationAction(item.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvitationSent={() => {
          // Optionally refresh member list or show success message
          toast.success('Team member invitation sent successfully!');
        }}
      />
    </div>
  );
};
