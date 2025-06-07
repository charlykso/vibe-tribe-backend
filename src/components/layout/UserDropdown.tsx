import React from 'react';
import { ChevronDown, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export const UserDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      const result = await logout();

      if (result.success) {
        // Force a full page reload to ensure clean state
        window.location.href = '/login';
      } else {
        console.error('Logout failed:', result.error);
        // Still navigate to login even if server logout fails
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if there's an error
      window.location.href = '/login';
    }
  };

  const handleSettings = () => {
    navigate('/dashboard/settings');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get display name with better fallback logic
  const displayName = user?.name || user?.email || 'User';

  // Generate initials from name or email
  const getInitials = (name: string) => {
    if (!name || name === 'User') return 'U';

    // If it's an email, use the part before @
    if (name.includes('@')) {
      const emailName = name.split('@')[0];
      return emailName.charAt(0).toUpperCase();
    }

    // If it's a full name, get first letter of each word
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url || user?.photoURL} alt={displayName} />
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Welcome back
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'No email'}
            </p>
            {user?.role && (
              <p className="text-xs leading-none text-muted-foreground capitalize">
                {user.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === 'dark' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
