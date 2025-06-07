import { useState, useEffect, useCallback } from 'react';
import { AuthService, User, LoginCredentials, RegisterCredentials, ResetPasswordData, AuthState } from '@/lib/auth';
import { websocketService } from '@/lib/websocket';
import { useToast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = AuthService.getTokenFromStorage();

        if (token) {
          // First check if token is structurally valid
          if (AuthService.isTokenValid(token)) {
            try {
              const user = await AuthService.getCurrentUser();
              if (user) {
                setAuthState({ user, loading: false, error: null });
                // Connect to WebSocket with valid token
                websocketService.connect(token);
                return;
              }
            } catch (userError) {
              console.error('Failed to get current user:', userError);
              // Token might be expired or invalid on server side
              AuthService.removeTokenFromStorage();
            }
          } else {
            AuthService.removeTokenFromStorage();
          }
        }

        // No valid token or user, set unauthenticated state
        setAuthState({ user: null, loading: false, error: null });
      } catch (error) {
        console.error('Auth initialization error:', error);
        AuthService.removeTokenFromStorage();
        setAuthState({
          user: null,
          loading: false,
          error: null // Don't show error on initialization failure
        });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { user, token } = await AuthService.login(credentials);
      AuthService.setTokenInStorage(token);
      setAuthState({ user, loading: false, error: null });

      // Connect to WebSocket
      websocketService.connect(token);

      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${user.name || user.email}`,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { user, token } = await AuthService.register(credentials);
      AuthService.setTokenInStorage(token);
      setAuthState({ user, loading: false, error: null });

      // Connect to WebSocket
      websocketService.connect(token);

      toast({
        title: "Welcome to VibeTribe!",
        description: "Your account has been created successfully.",
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));

    try {
      await AuthService.logout();
      AuthService.removeTokenFromStorage();
      websocketService.disconnect();
      setAuthState({ user: null, loading: false, error: null });

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));

      toast({
        title: "Logout Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await AuthService.resetPassword(data);
      setAuthState(prev => ({ ...prev, loading: false }));

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));

      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!authState.user) {
      return { success: false, error: 'No user logged in' };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const updatedUser = await AuthService.updateProfile(authState.user.id, updates);
      setAuthState(prev => ({ ...prev, user: updatedUser, loading: false }));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));

      toast({
        title: "Profile Update Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [authState.user, toast]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Helper functions
  const isAuthenticated = !!authState.user;
  const isAdmin = authState.user?.role === 'admin';
  const isManager = authState.user?.role === 'manager' || isAdmin;
  const hasRole = (role: User['role']) => authState.user?.role === role || isAdmin;

  return {
    // State
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated,
    isAdmin,
    isManager,

    // Actions
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    clearError,
    hasRole,
  };
};
