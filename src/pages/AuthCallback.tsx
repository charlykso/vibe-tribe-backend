import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { setUser, setToken } = useAuthContext();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        // Check for error parameters
        const errorParam = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        if (errorParam) {
          setError(errorMessage || 'Authentication failed');
          setStatus('error');
          return;
        }

        // Check if this is an invitation acceptance flow
        const invitationToken = localStorage.getItem('invitation_token');
        const oauthMode = localStorage.getItem('oauth_mode');

        if (code && invitationToken && oauthMode === 'invitation') {
          // Handle invitation acceptance via Google OAuth
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://vibe-tribe-backend-8yvp.onrender.com/api/v1';

            const response = await fetch(`${API_URL}/invitations/accept-google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: invitationToken,
                googleCode: code
              }),
            });

            const data = await response.json();

            if (response.ok) {
              // Clean up localStorage
              localStorage.removeItem('invitation_token');
              localStorage.removeItem('oauth_mode');

              setStatus('success');
              setIsNewUser(true);

              // Redirect to login page after successful acceptance
              setTimeout(() => {
                window.location.href = '/login?message=invitation-accepted-google';
              }, 2000);
              return;
            } else {
              throw new Error(data.error || 'Failed to accept invitation');
            }
          } catch (error) {
            console.error('Invitation acceptance error:', error);
            setError(error instanceof Error ? error.message : 'Failed to accept invitation');
            setStatus('error');

            // Clean up localStorage on error
            localStorage.removeItem('invitation_token');
            localStorage.removeItem('oauth_mode');
            return;
          }
        }

        // Regular Google OAuth authentication flow
        // Get token and user data from URL parameters
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const isNewUserParam = searchParams.get('isNewUser');

        if (!token || !userParam) {
          setError('Missing authentication data');
          setStatus('error');
          return;
        }

        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userParam));

        // Store authentication data
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update auth context
        setUser(userData);
        setToken(token);
        setIsNewUser(isNewUserParam === 'true');

        setStatus('success');

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);

      } catch (error) {
        console.error('Auth callback error:', error);
        setError('Failed to process authentication');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [searchParams, setUser, setToken]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              Completing Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              {isNewUser ? 'Welcome to Vibe Tribe!' : 'Welcome Back!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {isNewUser 
                ? 'Your account has been created successfully. Redirecting to your dashboard...'
                : 'You have been signed in successfully. Redirecting to your dashboard...'
              }
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Authentication Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'An unexpected error occurred during authentication.'}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = '/login'}
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = '/register'}
              >
                Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback redirect
  return <Navigate to="/login" replace />;
};
