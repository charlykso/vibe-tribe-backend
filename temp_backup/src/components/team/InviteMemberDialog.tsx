import React, { useState } from 'react';
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
import { Loader2, Mail, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { InvitationsService, CreateInvitationRequest } from '@/lib/services/invitations';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationSent?: () => void;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onOpenChange,
  onInvitationSent,
}) => {
  const [formData, setFormData] = useState<CreateInvitationRequest>({
    email: '',
    role: 'member',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate email
      if (!formData.email || !formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const response = await InvitationsService.sendInvitation(formData);

      if (response.data) {
        toast.success('Invitation sent successfully!', {
          description: `An invitation has been sent to ${formData.email}`,
        });

        // Reset form
        setFormData({
          email: '',
          role: 'member',
          message: '',
        });

        // Close dialog and notify parent
        onOpenChange(false);
        onInvitationSent?.();
      }
    } catch (err: any) {
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
