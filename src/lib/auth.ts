// Mock auth service - no external dependencies


export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'manager' | 'member';
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

export interface ResetPasswordData {
  email: string;
}



export class AuthService {
  private static readonly API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

  static async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? data.message ?? 'Login failed');
    }

    return {
      user: data.user,
      token: data.token,
    };
  }

  static async register(credentials: RegisterCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch(`${this.API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? data.message ?? 'Registration failed');
    }

    return {
      user: data.user,
      token: data.token,
    };
  }

  static async logout(): Promise<void> {
    const token = AuthService.getTokenFromStorage();

    if (token) {
      try {
        await fetch(`${this.API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Even if logout fails on server, we still clear local storage
        console.warn('Server logout failed, clearing local storage anyway:', error);
      }
    }

    // Always clear local storage
    AuthService.removeTokenFromStorage();
  }

  static async resetPassword(data: ResetPasswordData): Promise<void> {
    const response = await fetch(`${this.API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error ?? responseData.message ?? 'Password reset failed');
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const token = AuthService.getTokenFromStorage();

    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token is invalid, remove it
        AuthService.removeTokenFromStorage();
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      // Remove invalid token on any error
      AuthService.removeTokenFromStorage();
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const token = AuthService.getTokenFromStorage();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? data.message ?? 'Profile update failed');
    }

    return data.user;
  }

  static isTokenValid(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    try {
      // Basic JWT format validation (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Check if payload can be decoded (basic validation)
      const payload = JSON.parse(atob(parts[1]));

      // Check if token has expiration and is not expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }

      return true;
    } catch (error) {
      // If token can't be parsed, it's invalid
      return false;
    }
  }

  static getTokenFromStorage(): string | null {
    return localStorage.getItem('auth_token');
  }

  static setTokenInStorage(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  static removeTokenFromStorage(): void {
    localStorage.removeItem('auth_token');
  }
}
