import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { AuthService } from '@/lib/auth';

interface ConnectionStatus {
  backend: 'connected' | 'disconnected' | 'checking';
  auth: 'working' | 'failed' | 'checking';
  lastChecked: string;
}

export function BackendStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    backend: 'checking',
    auth: 'checking',
    lastChecked: 'Never'
  });

  const checkBackendConnection = async () => {
    setStatus(prev => ({ ...prev, backend: 'checking', auth: 'checking' }));

    try {
      // Test backend health
      const isHealthy = await apiClient.healthCheck();
      
      if (isHealthy) {
        setStatus(prev => ({ ...prev, backend: 'connected' }));
        
        // Test authentication
        try {
          const loginResult = await AuthService.login({
            email: 'test@example.com',
            password: 'password123'
          });
          
          if (loginResult.token) {
            setStatus(prev => ({ 
              ...prev, 
              auth: 'working',
              lastChecked: new Date().toLocaleTimeString()
            }));
          } else {
            setStatus(prev => ({ ...prev, auth: 'failed' }));
          }
        } catch (authError) {
          console.error('Auth test failed:', authError);
          setStatus(prev => ({ ...prev, auth: 'failed' }));
        }
      } else {
        setStatus(prev => ({ 
          ...prev, 
          backend: 'disconnected', 
          auth: 'failed',
          lastChecked: new Date().toLocaleTimeString()
        }));
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setStatus(prev => ({ 
        ...prev, 
        backend: 'disconnected', 
        auth: 'failed',
        lastChecked: new Date().toLocaleTimeString()
      }));
    }
  };

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const getStatusIcon = (statusType: 'connected' | 'disconnected' | 'checking' | 'working' | 'failed') => {
    switch (statusType) {
      case 'connected':
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (statusType: 'connected' | 'disconnected' | 'checking' | 'working' | 'failed') => {
    switch (statusType) {
      case 'connected':
      case 'working':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'disconnected':
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Backend Integration Status
          <Button
            variant="outline"
            size="sm"
            onClick={checkBackendConnection}
            disabled={status.backend === 'checking' || status.auth === 'checking'}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.backend)}
            <span className="font-medium">Backend Server</span>
          </div>
          {getStatusBadge(status.backend)}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.auth)}
            <span className="font-medium">Authentication</span>
          </div>
          {getStatusBadge(status.auth)}
        </div>

        <div className="pt-2 border-t">
          <div className="text-sm text-gray-600">
            <div>API URL: {import.meta.env.VITE_API_URL}</div>
            <div>Last checked: {status.lastChecked}</div>
          </div>
        </div>

        {status.backend === 'connected' && status.auth === 'working' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-800">
              ✅ Frontend successfully integrated with Firebase backend!
              <br />
              <span className="text-xs">You can now use real API calls instead of mock data.</span>
            </div>
          </div>
        )}

        {(status.backend === 'disconnected' || status.auth === 'failed') && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800">
              ⚠️ Using mock data fallback.
              <br />
              <span className="text-xs">Backend integration will work when server is available.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
