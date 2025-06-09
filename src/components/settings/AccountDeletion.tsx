import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Download, Shield } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export const AccountDeletion = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [acknowledgments, setAcknowledgments] = useState({
    dataLoss: false,
    irreversible: false,
    socialAccounts: false,
    teamAccess: false
  });

  const { user, logout } = useAuthContext();
  const { toast } = useToast();

  const isFormValid = 
    confirmationText === 'DELETE MY ACCOUNT' &&
    password.length > 0 &&
    Object.values(acknowledgments).every(Boolean);

  const handleAcknowledgmentChange = (key: keyof typeof acknowledgments) => {
    setAcknowledgments(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/v1/users/export-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `socialtribe-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Data Export Complete",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAccountDeletion = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/v1/users/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          confirmation: confirmationText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Log out and redirect
      await logout();
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800">
      <CardHeader>
        <CardTitle className="flex items-center text-red-600 dark:text-red-400">
          <Trash2 className="h-5 w-5 mr-2" />
          Delete Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Warning:</strong> Account deletion is permanent and cannot be undone. 
            All your data, posts, and team access will be permanently removed.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Before you delete your account:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Download your data if you want to keep a copy</li>
            <li>Transfer ownership of any teams you manage</li>
            <li>Cancel any active subscriptions</li>
            <li>Disconnect your social media accounts</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            onClick={handleDataExport}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export My Data
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Confirm Account Deletion
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account 
                  and remove all your data from our servers.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Acknowledgments */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Please confirm you understand:</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="dataLoss"
                        checked={acknowledgments.dataLoss}
                        onCheckedChange={() => handleAcknowledgmentChange('dataLoss')}
                      />
                      <Label htmlFor="dataLoss" className="text-sm">
                        All my data will be permanently deleted
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="irreversible"
                        checked={acknowledgments.irreversible}
                        onCheckedChange={() => handleAcknowledgmentChange('irreversible')}
                      />
                      <Label htmlFor="irreversible" className="text-sm">
                        This action is irreversible
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="socialAccounts"
                        checked={acknowledgments.socialAccounts}
                        onCheckedChange={() => handleAcknowledgmentChange('socialAccounts')}
                      />
                      <Label htmlFor="socialAccounts" className="text-sm">
                        My connected social accounts will be disconnected
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="teamAccess"
                        checked={acknowledgments.teamAccess}
                        onCheckedChange={() => handleAcknowledgmentChange('teamAccess')}
                      />
                      <Label htmlFor="teamAccess" className="text-sm">
                        I will lose access to all teams and organizations
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Confirmation Text */}
                <div>
                  <Label htmlFor="confirmation" className="text-sm font-medium">
                    Type "DELETE MY ACCOUNT" to confirm:
                  </Label>
                  <Input
                    id="confirmation"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="mt-1"
                  />
                </div>

                {/* Password Confirmation */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    Enter your password to confirm:
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your current password"
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleAccountDeletion}
                  disabled={!isFormValid || isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>
            Need help? Contact our support team at{' '}
            <a href="mailto:support@socialtribe.com" className="text-blue-600 hover:underline">
              support@socialtribe.com
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
