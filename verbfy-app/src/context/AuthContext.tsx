import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import api, { authAPI } from '../lib/api';
import { tokenStorage } from '../utils/secureStorage';

// User interface
export interface User {
  _id: string;
  id: string; // Alias for backward compatibility
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  profileImage?: string;
  bio?: string;
  phone?: string;
  emailVerified?: boolean;
  isApproved?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  // Learning progress fields
  cefrLevel?: string;
  overallProgress?: number;
  currentStreak?: number;
  longestStreak?: number;
  totalStudyTime?: number;
  achievements?: string[];
  // Subscription fields
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
  subscriptionType?: string;
  subscriptionExpiry?: string;
  // Lesson tokens
  lessonTokens?: number;
  createdAt: string;
  updatedAt: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean; // Alias for backward compatibility
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void; // For backward compatibility
  setAccessToken: (token: string) => void; // For backward compatibility
}

// Register data interface
interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from token
  const loadUser = async () => {
    try {
      const token = tokenStorage.getToken();
      // Even if token is missing (cookie-only auth), try to fetch current user
      const response = await authAPI.getCurrentUser();
      if (response.data.success) {
        const userData = response.data.user;
        const userWithId = {
          ...userData,
          id: userData._id
        } as User;
        setUser(userWithId);
        tokenStorage.setUser(userWithId);
      } else {
        if (!token) {
          setUser(null);
        } else {
          tokenStorage.clear();
        }
      }
    } catch (error) {
      // If cookies are absent or invalid, clear any residual storage
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        const { accessToken, user: userData, token } = response.data;
        const userWithId = { ...userData, id: userData._id } as User;
        const provided = accessToken || token;
        if (provided) tokenStorage.setToken(provided);
        tokenStorage.setUser(userWithId);
        setUser(userWithId);
        return true;
      }
      return false;
    } catch (_error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      if (response.data.success) {
        const { accessToken, user: newUser, token } = response.data;
        const userWithId = { ...newUser, id: newUser._id } as User;
        const provided = accessToken || token;
        if (provided) tokenStorage.setToken(provided);
        tokenStorage.setUser(userWithId);
        setUser(userWithId);
        return true;
      }
      return false;
    } catch (_error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear secure storage
      tokenStorage.clear();
      
      // Clear user state
      setUser(null);
      
      // Redirect to login
      router.push('/login');
    }
  };

  // Set user function for backward compatibility
  const setUserFunction = (newUser: User | null) => {
    setUser(newUser);
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        
        // Add id alias for backward compatibility
        const userWithId = {
          ...updatedUser,
          id: updatedUser._id
        };
        
        setUser(userWithId);
        tokenStorage.setUser(userWithId);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, logout
      logout();
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    login,
    register,
    logout,
    refreshUser,
    setUser: setUserFunction, // For backward compatibility
    setAccessToken: (token: string) => {
      tokenStorage.setToken(token);
    }, // For backward compatibility
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Alias for backward compatibility
export const useAuthContext = useAuth;

// Role guard hook
export function useRoleGuard(allowedRoles: ('student' | 'teacher' | 'admin')[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (user && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on user role
        switch (user.role) {
          case 'student':
            router.push('/dashboard/student');
            break;
          case 'teacher':
            router.push('/dashboard/teacher');
            break;
          case 'admin':
            router.push('/dashboard/admin');
            break;
          default:
            router.push('/login');
        }
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, router]);

  return {
    hasAccess: user ? allowedRoles.includes(user.role) : false,
    isLoading,
    user,
  };
} 