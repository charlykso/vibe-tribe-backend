
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Shield, Users, Zap, Globe, Key, Database, Mail } from 'lucide-react';
import { TeamInvitations } from '@/components/team/TeamInvitations';

export const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoModeration, setAutoModeration] = useState(true);
  const [dataSync, setDataSync] = useState(false);

  const connectedPlatforms = [
    { name: 'Discord', status: 'connected', members: '15.4K', icon: '🎮' },
    { name: 'Telegram', status: 'connected', members: '8.9K', icon: '✈️' },
    { name: 'Slack', status: 'disconnected', members: '0', icon: '💼' },
    { name: 'WhatsApp Business', status: 'pending', members: '2.3K', icon: '📱' },
  ];



  return (
    <div className="p-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" defaultValue="SocialHub Pro" />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="https://socialhub.pro" />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" defaultValue="Leading social media and community management platform" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-sync data across platforms</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically sync member data and activities</p>
                </div>
                <Switch checked={dataSync} onCheckedChange={setDataSync} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable auto-moderation</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use AI to automatically moderate content</p>
                </div>
                <Switch checked={autoModeration} onCheckedChange={setAutoModeration} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Connected Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectedPlatforms.map((platform, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{platform.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{platform.members} members</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={
                        platform.status === 'connected' ? 'default' :
                        platform.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {platform.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {platform.status === 'connected' ? 'Configure' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" type="password" defaultValue="sk-1234567890abcdef" />
              </div>
              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" defaultValue="https://your-app.com/webhooks/socialhub" />
              </div>
              <Button>Update API Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                  </div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive browser notifications</p>
                  </div>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>

              <div className="space-y-3">
                <Label>Notification Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="new-members" defaultChecked />
                    <Label htmlFor="new-members">New member joins</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="high-engagement" defaultChecked />
                    <Label htmlFor="high-engagement">High engagement posts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="moderation-alerts" defaultChecked />
                    <Label htmlFor="moderation-alerts">Moderation alerts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="weekly-reports" />
                    <Label htmlFor="weekly-reports">Weekly reports</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team" className="space-y-6">
          <TeamInvitations />
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable 2FA</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                </div>
                <Switch />
              </div>
              <Button variant="outline">Setup Authenticator</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
