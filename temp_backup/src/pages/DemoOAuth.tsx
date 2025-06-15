import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const DemoOAuth = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState('');
  const [state, setState] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    // Get OAuth parameters from URL
    const platformParam = searchParams.get('platform') || 'facebook';
    const stateParam = searchParams.get('state') || '';
    const redirectUriParam = searchParams.get('redirect_uri') || '';
    
    setPlatform(platformParam);
    setState(stateParam);
    setRedirectUri(redirectUriParam);
    
    // Set default demo values based on platform
    switch (platformParam) {
      case 'facebook':
        setUsername('demo.user');
        setDisplayName('Demo User');
        break;
      case 'instagram':
        setUsername('@demo_user');
        setDisplayName('Demo User');
        break;
      case 'linkedin':
        setUsername('demo-user');
        setDisplayName('Demo User');
        break;
      case 'twitter':
        setUsername('@demo_user');
        setDisplayName('Demo User');
        break;
      default:
        setUsername('demo_user');
        setDisplayName('Demo User');
    }
  }, [searchParams]);

  const handleAuthorize = async () => {
    setLoading(true);
    
    // Simulate OAuth authorization delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a demo authorization code
    const code = `demo_code_${platform}_${Date.now()}`;
    
    // Redirect back to the callback URL with the code
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('state', state);
    callbackUrl.searchParams.set('platform', platform);
    
    window.location.href = callbackUrl.toString();
  };

  const handleDeny = () => {
    // Redirect back with error
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('error', 'access_denied');
    callbackUrl.searchParams.set('error_description', 'User denied the authorization request');
    callbackUrl.searchParams.set('state', state);
    callbackUrl.searchParams.set('platform', platform);
    
    window.location.href = callbackUrl.toString();
  };

  const getPlatformInfo = (platform: string) => {
    const platformMap: Record<string, { name: string; icon: string; color: string }> = {
      twitter: { name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
      linkedin: { name: 'LinkedIn', icon: '💼', color: '#0077B5' },
      facebook: { name: 'Facebook', icon: '👥', color: '#1877F2' },
      instagram: { name: 'Instagram', icon: '📸', color: '#E4405F' }
    };
    return platformMap[platform] || { name: platform, icon: '🔗', color: '#6B7280' };
  };

  const platformInfo = getPlatformInfo(platform);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-3xl" 
               style={{ backgroundColor: platformInfo.color + '20' }}>
            {platformInfo.icon}
          </div>
          <CardTitle className="text-2xl">
            Connect to {platformInfo.name}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            VibeTribe would like to connect to your {platformInfo.name} account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              🚀 Demo Mode
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This is a demo OAuth flow. You can customize the demo user details below.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter demo username"
              />
            </div>
            
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter demo display name"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Permissions Requested:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Read your profile information</li>
              <li>• Post content on your behalf</li>
              <li>• Access your follower count</li>
              <li>• View engagement metrics</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={loading}
              className="flex-1"
            >
              Deny
            </Button>
            <Button
              onClick={handleAuthorize}
              disabled={loading}
              className="flex-1"
              style={{ backgroundColor: platformInfo.color }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                `Authorize`
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By authorizing, you agree to allow VibeTribe to access your {platformInfo.name} account
            according to the permissions listed above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
