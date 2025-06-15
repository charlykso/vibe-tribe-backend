import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Building,
  User,
  Calendar,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { InvitationsService, Invitation } from '@/lib/services/invitations';

export const AcceptInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setIsLoading(false);
      return;
    }

    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setError(null);
      const response = await InvitationsService.getInvitationByToken(token!);
      
      if (response.data?.invitation) {
        setInvitation(response.data.invitation);
        
        // Check if invitation is expired
        const expiresAt = new Date(response.data.invitation.expires_at);
        if (expiresAt < new Date()) {
          setError('This invitation has expired. Please request a new invitation.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setIsAccepting(true);
    try {
      const response = await InvitationsService.acceptInvitation(token);
      
      if (response.data) {
        toast.success('Invitation accepted successfully!', {
          description: 'Welcome to the team! You can now access the organization.',
        });

        // Redirect to login or dashboard
        navigate('/login?message=invitation-accepted');
      }
    } catch (err: any) {
      toast.error('Failed to accept invitation', {
        description: err.message || 'Please try again or contact support.',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };

    return (
      <Badge className={colors[role as keyof typeof colors] || ''}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading invitation...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Invitation not found'}</AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')} 
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAlreadyAccepted = invitation.status === 'accepted';
  const isCancelled = invitation.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Building className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium">Organization</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {invitation.organization_name || 'VibeTribe Organization'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">Role</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getRoleBadge(invitation.role)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium">Invited</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium">Expires</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {invitation.message && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Personal Message</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 italic">
                  "{invitation.message}"
                </p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {isExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired. Please request a new invitation from your team administrator.
              </AlertDescription>
            </Alert>
          )}

          {isAlreadyAccepted && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has already been accepted. You can now log in to access the organization.
              </AlertDescription>
            </Alert>
          )}

          {isCancelled && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has been cancelled. Please contact your team administrator for a new invitation.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isExpired && !isAlreadyAccepted && !isCancelled && (
              <Button 
                onClick={handleAcceptInvitation} 
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              {isAlreadyAccepted ? 'Go to Login' : 'Back to Login'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Need help? Contact your team administrator or</p>
            <a href="mailto:support@vibetribe.com" className="text-blue-600 hover:underline">
              reach out to support
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
