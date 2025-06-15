import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Loader2, Save, User as UserIcon } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const UserProfile: React.FC = () => {
  const { user, updateProfile, loading } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      avatar_url: user?.avatar_url || '',
    },
  });

  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user, reset]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    let avatarUrl = data.avatar_url;

    // In a real app, you would upload the avatar file to a storage service
    if (avatarFile) {
      // Simulate avatar upload
      avatarUrl = avatarPreview || '';
    }

    const result = await updateProfile({
      name: data.name,
      avatar_url: avatarUrl,
    });

    if (result.success) {
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    reset();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'member':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No user data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your account details and preferences
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={avatarPreview || user.avatar_url}
                    alt={user.name || user.email}
                  />
                  <AvatarFallback className="text-lg">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      title="Upload new profile picture"
                      aria-label="Upload new profile picture"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-medium">{user.name || user.email}</h3>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getRoleColor(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  disabled={!isEditing}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled={true} // Email should not be editable
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isSubmitting || loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">User ID</Label>
              <p className="mt-1 text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {user.id}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Organization</Label>
              <p className="mt-1 text-sm">
                {user.organization_id ? `Org ID: ${user.organization_id}` : 'No organization'}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Account Created</Label>
              <p className="mt-1 text-sm">
                {new Date(user.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
              <p className="mt-1 text-sm">
                {new Date(user.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
