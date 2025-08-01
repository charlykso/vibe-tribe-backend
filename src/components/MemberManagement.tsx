
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Star, User, MessageSquare, Award, Loader2, Users } from 'lucide-react';
import { UsersService, UserWithStats } from '@/lib/services/users';

// Helper interface for UI compatibility
interface MemberDisplay {
  id: string;
  name: string;
  avatar: string;
  email: string;
  joinDate: string;
  status: string;
  posts: number;
  reactions: number;
  level: string;
  badges: string[];
  lastSeen: string;
}

// Helper function to map UserWithStats to MemberDisplay
const mapUserToMemberDisplay = (user: UserWithStats): MemberDisplay => {
  const getStatusFromRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Champion';
      case 'moderator': return 'Regular';
      default: return user.stats?.engagement_score > 50 ? 'Champion' :
               user.stats?.engagement_score > 20 ? 'Regular' : 'At Risk';
    }
  };

  const getLevelFromStats = (stats?: any) => {
    if (!stats) return 'Bronze';
    const score = stats.engagement_score || 0;
    if (score > 80) return 'Platinum';
    if (score > 60) return 'Gold';
    if (score > 30) return 'Silver';
    return 'Bronze';
  };

  return {
    id: user.id,
    name: user.name,
    avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
    email: user.email,
    joinDate: user.created_at,
    status: getStatusFromRole(user.role),
    posts: user.stats?.total_posts || 0,
    reactions: user.stats?.total_reactions || 0,
    level: getLevelFromStats(user.stats),
    badges: user.stats?.badges || [],
    lastSeen: user.stats?.last_seen || 'Unknown'
  };
};

export const MemberManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Temporarily disabled - using community members instead
  // TODO: Fix the /users/organization/members endpoint
  const membersData = { members: [], total: 0 };
  const isLoading = false;
  const error = null;

  // // Fetch organization members with stats
  // const {
  //   data: membersData,
  //   isLoading,
  //   error
  // } = useQuery({
  //   queryKey: ['organization-members', searchTerm, selectedFilter],
  //   queryFn: () => UsersService.getOrganizationMembers({
  //     search: searchTerm || undefined,
  //     limit: 100
  //   }),
  //   select: (response) => ({
  //     members: (response.data?.members || []).map(mapUserToMemberDisplay),
  //     total: response.data?.pagination?.total || 0
  //   })
  // });

  const members = membersData?.members || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Champion': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Regular': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'At Risk': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Platinum': return 'text-purple-600';
      case 'Gold': return 'text-yellow-600';
      case 'Silver': return 'text-gray-600';
      case 'Bronze': return 'text-orange-600';
      default: return 'text-gray-400';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || member.status.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={selectedFilter === 'champion' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('champion')}
            size="sm"
          >
            Champions
          </Button>
          <Button
            variant={selectedFilter === 'regular' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('regular')}
            size="sm"
          >
            Regular
          </Button>
          <Button
            variant={selectedFilter === 'at risk' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('at risk')}
            size="sm"
          >
            At Risk
          </Button>
        </div>
      </div>

      {/* Members Grid */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load members: {error.message}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={`member-skeleton-${i}`} className="bg-white dark:bg-gray-800">
              <CardContent className="p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Organization Member Management</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            This feature is currently being updated. Please use Community Management to view and manage members.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.href = '/dashboard/community/overview'}
          >
            Go to Community Management
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
          <Card key={member.id} className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(member.status)}>
                  {member.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
                  <span className={`text-sm font-semibold ${getLevelColor(member.level)}`}>
                    {member.level}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{member.posts} posts</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{member.reactions} reactions</span>
                  </div>
                </div>

                {member.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {member.badges.map((badge, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last seen: {member.lastSeen}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Joined: {new Date(member.joinDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
};
