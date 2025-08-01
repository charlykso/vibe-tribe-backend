import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  MoreVertical,
  RefreshCw,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { InvitationsService, Invitation } from '@/lib/services/invitations';

interface InvitationsListProps {
  refreshTrigger?: number;
}

export const InvitationsList: React.FC<InvitationsListProps> = ({ refreshTrigger }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setError(null);
      const response = await InvitationsService.getInvitations();
      
      if (response.data?.invitations) {
        setInvitations(response.data.invitations);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch invitations';
      setError(errorMessage);
      console.error('Error fetching invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [refreshTrigger]);

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    setActionLoading(invitationId);
    try {
      await InvitationsService.cancelInvitation(invitationId);
      
      toast.success('Invitation cancelled', {
        description: `Invitation to ${email} has been cancelled`,
      });

      // Refresh the list
      await fetchInvitations();
    } catch (err: any) {
      toast.error('Failed to cancel invitation', {
        description: err.message || 'Please try again',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setActionLoading(invitationId);
    try {
      await InvitationsService.resendInvitation(invitationId);
      
      toast.success('Invitation resent', {
        description: `A new invitation has been sent to ${email}`,
      });

      // Refresh the list
      await fetchInvitations();
    } catch (err: any) {
      toast.error('Failed to resend invitation', {
        description: err.message || 'Please try again',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-600 border-red-600"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };

    return (
      <Badge variant="secondary" className={colors[role as keyof typeof colors] || ''}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading invitations...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={fetchInvitations} 
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Filter invitations based on showAll toggle
  const filteredInvitations = showAll ? invitations : invitations.filter(inv => inv.status === 'pending');
  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {showAll ? `All Invitations (${invitations.length})` : `Pending Invitations (${pendingCount})`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showAll ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show Pending Only" : "Show All"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchInvitations}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {showAll ? "No invitations sent yet" : "No pending invitations"}
            </p>
            <p className="text-sm">
              {showAll ? "Invite team members to start collaborating" : "All invitations have been processed"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {invitation.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {invitation.email}
                      </p>
                      {getRoleBadge(invitation.role)}
                      {getStatusBadge(invitation.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                      </span>
                      {invitation.status === 'pending' && (
                        <span>
                          Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    
                    {invitation.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
                        "{invitation.message}"
                      </p>
                    )}
                  </div>
                </div>

                {invitation.status === 'pending' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={actionLoading === invitation.id}
                      >
                        {actionLoading === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Resend Invitation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
