import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { SocialAccountsService } from '@/lib/services/socialAccounts';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors
        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing required OAuth parameters');
        }

        // Extract platform from state (assuming state format: userId_orgId_timestamp_platform)
        const stateParts = state.split('_');
        if (stateParts.length < 4) {
          throw new Error('Invalid state parameter format');
        }

        // For now, we'll determine platform from the current URL or a query parameter
        const platform = searchParams.get('platform') || 'twitter'; // Default to twitter

        setMessage(`Connecting your ${SocialAccountsService.getPlatformInfo(platform).name} account...`);

        // Handle the OAuth callback
        const result = await SocialAccountsService.handleOAuthCallback({
          platform,
          code,
          state,
          codeVerifier: searchParams.get('code_verifier') || undefined
        });

        setStatus('success');
        setMessage(`Successfully connected ${result.account.display_name} (${result.account.username})`);

        // Send success message to parent window (for popup flow)
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_SUCCESS',
            code,
            state,
            account: result.account
          }, window.location.origin);
          window.close();
          return;
        }

        // Redirect to platform connections page after a delay
        setTimeout(() => {
          navigate('/platform-connections', { 
            state: { 
              message: `${result.account.platform} account connected successfully!`,
              type: 'success'
            }
          });
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to connect account');

        // Send error message to parent window (for popup flow)
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: error instanceof Error ? error.message : 'OAuth failed'
          }, window.location.origin);
          window.close();
          return;
        }

        // Redirect to platform connections page after a delay
        setTimeout(() => {
          navigate('/platform-connections', { 
            state: { 
              message: error instanceof Error ? error.message : 'Failed to connect account',
              type: 'error'
            }
          });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {status === 'loading' && 'Connecting Account'}
            {status === 'success' && 'Account Connected!'}
            {status === 'error' && 'Connection Failed'}
          </h1>
          
          <p className={`text-sm ${getStatusColor()} mb-6`}>
            {message}
          </p>

          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-gray-500">
                Please wait while we complete the connection...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-xs text-gray-500">
                Redirecting you back to the platform connections page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                You will be redirected back to try again...
              </p>
              <button
                onClick={() => navigate('/platform-connections')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go Back to Platform Connections
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
