
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Star, User, MessageSquare, Award } from 'lucide-react';

export const MemberManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const members = [
    {
      id: 1,
      name: 'Alex Chen',
      avatar: 'AC',
      email: 'alex.chen@email.com',
      joinDate: '2024-01-15',
      status: 'Champion',
      posts: 247,
      reactions: 1840,
      level: 'Gold',
      badges: ['Top Contributor', 'Helpful'],
      lastSeen: '2 hours ago'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      avatar: 'SJ',
      email: 'sarah.j@email.com',
      joinDate: '2024-02-03',
      status: 'Regular',
      posts: 89,
      reactions: 456,
      level: 'Silver',
      badges: ['Active Member'],
      lastSeen: '1 day ago'
    },
    {
      id: 3,
      name: 'Mike Rodriguez',
      avatar: 'MR',
      email: 'mike.r@email.com',
      joinDate: '2024-03-12',
      status: 'At Risk',
      posts: 12,
      reactions: 34,
      level: 'Bronze',
      badges: [],
      lastSeen: '2 weeks ago'
    },
    {
      id: 4,
      name: 'Emma Wilson',
      avatar: 'EW',
      email: 'emma.wilson@email.com',
      joinDate: '2024-01-08',
      status: 'Champion',
      posts: 312,
      reactions: 2150,
      level: 'Platinum',
      badges: ['Community Leader', 'Mentor', 'Top Contributor'],
      lastSeen: '30 minutes ago'
    }
  ];

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Member Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage and track your community members</p>
      </div>

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
    </div>
  );
};
