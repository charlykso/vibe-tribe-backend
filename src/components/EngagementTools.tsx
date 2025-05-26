
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageSquare, Gift, Calendar, Target, Send } from 'lucide-react';

export const EngagementTools = () => {
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    type: 'challenge'
  });

  const activeCampaigns = [
    {
      id: 1,
      title: 'Share Your Success Story',
      type: 'challenge',
      participants: 247,
      deadline: '2024-06-15',
      status: 'active',
      engagement: 78
    },
    {
      id: 2,
      title: 'Product Feature Poll',
      type: 'poll',
      participants: 892,
      deadline: '2024-06-10',
      status: 'active',
      engagement: 92
    },
    {
      id: 3,
      title: 'Welcome New Members',
      type: 'automation',
      participants: 45,
      deadline: 'Ongoing',
      status: 'active',
      engagement: 85
    }
  ];

  const engagementMetrics = [
    { label: 'Active Campaigns', value: '12', icon: Target },
    { label: 'Total Participants', value: '2,847', icon: Heart },
    { label: 'Messages Sent', value: '15,632', icon: MessageSquare },
    { label: 'Events This Month', value: '8', icon: Calendar }
  ];

  const upcomingEvents = [
    {
      title: 'Product Demo Webinar',
      date: '2024-06-12',
      time: '2:00 PM UTC',
      attendees: 156,
      type: 'webinar'
    },
    {
      title: 'Community AMA',
      date: '2024-06-15',
      time: '3:00 PM UTC',
      attendees: 89,
      type: 'ama'
    },
    {
      title: 'Feature Launch Party',
      date: '2024-06-20',
      time: '6:00 PM UTC',
      attendees: 234,
      type: 'celebration'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Engagement Tools</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Create campaigns and boost community engagement</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {engagementMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Management */}
        <Card className="lg:col-span-2 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Campaign Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-4">
                {activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{campaign.type}</p>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Participants:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{campaign.participants}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Deadline:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{campaign.deadline}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Engagement:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{campaign.engagement}%</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Details</Button>
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm" variant="outline" className="text-red-600">End Campaign</Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="create" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Campaign Title
                    </label>
                    <Input
                      placeholder="Enter campaign title..."
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe your campaign..."
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Campaign Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={newCampaign.type}
                      onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                    >
                      <option value="challenge">Challenge</option>
                      <option value="poll">Poll</option>
                      <option value="contest">Contest</option>
                      <option value="survey">Survey</option>
                    </select>
                  </div>
                  
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="templates">
                <div className="space-y-3">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Welcome Series</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Automated welcome sequence for new members</p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Feedback Collection</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gather product feedback from community</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.date} at {event.time}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{event.attendees} attending</span>
                    <Badge variant="secondary" className="capitalize">{event.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="w-full mt-4" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
