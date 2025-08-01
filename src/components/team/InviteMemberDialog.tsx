import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, UserPlus, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { InvitationsService, CreateInvitationRequest } from '@/lib/services/invitations';
import { CommunitiesService } from '@/lib/services/communities';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationSent?: () => void;
  defaultCommunityId?: string; // Pre-select a specific community
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onOpenChange,
  onInvitationSent,
  defaultCommunityId,
}) => {
  const [formData, setFormData] = useState<CreateInvitationRequest>({
    email: '',
    role: 'member',
    message: '',
    community_id: defaultCommunityId || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch communities for selection
  const { data: communitiesData, isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => CommunitiesService.getCommunities(),
    select: (response) => {
      const apiData = (response.data as any).data;
      return apiData?.communities || [];
    }
  });

  // Update community_id when defaultCommunityId changes
  useEffect(() => {
    if (defaultCommunityId && formData.community_id !== defaultCommunityId) {
      setFormData(prev => ({ ...prev, community_id: defaultCommunityId }));
    }
  }, [defaultCommunityId, formData.community_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        throw new Error('Email address is required');
      }
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate community selection
      if (!formData.community_id) {
        throw new Error('Please select a community to invite the user to');
      }

      // Validate role
      if (!formData.role) {
        throw new Error('Please select a role for the user');
      }

      const response = await InvitationsService.sendInvitation(formData);

      if (response.data) {
        const selectedCommunity = communitiesData?.find((c: any) => c.id === formData.community_id);
        const communityName = selectedCommunity?.name || 'the selected community';

        toast.success('Invitation sent successfully!', {
          description: `${formData.email} has been invited to join ${communityName}`,
        });

        // Reset form
        setFormData({
          email: '',
          role: 'member',
          message: '',
          community_id: defaultCommunityId || '',
        });

        // Close dialog and notify parent
        onOpenChange(false);
        onInvitationSent?.();
      }
    } catch (err: any) {
      console.error('🚨 Invitation error details:', err);
      console.error('🚨 Error message:', err.message);
      console.error('🚨 Error response:', err.response);

      const errorMessage = err.message || 'Failed to send invitation';
      setError(errorMessage);
      toast.error('Failed to send invitation', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateInvitationRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const roleDescriptions = {
    admin: 'Full access to all features and settings',
    moderator: 'Can manage content and moderate community',
    member: 'Basic access to create and manage content',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They'll receive an email with instructions to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Member</span>
                    <span className="text-xs text-gray-500">Basic access to create and manage content</span>
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Moderator</span>
                    <span className="text-xs text-gray-500">Can manage content and moderate community</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-gray-500">Full access to all features and settings</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {roleDescriptions[formData.role as keyof typeof roleDescriptions]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="community">Community *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Select
                value={formData.community_id}
                onValueChange={(value) => handleInputChange('community_id', value)}
                disabled={isLoading || communitiesLoading}
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select community to invite to" />
                </SelectTrigger>
                <SelectContent>
                  {communitiesData?.map((community: any) => (
                    <SelectItem key={community.id} value={community.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{community.name}</span>
                        <span className="text-xs text-gray-500">
                          {community.platform} • {community.member_count || 0} members
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              The user will be invited to join this specific community
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
