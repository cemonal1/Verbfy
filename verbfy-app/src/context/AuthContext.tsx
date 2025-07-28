import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthUser } from '../features/auth/model/AuthUser';
import api, { setApiAccessToken } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  accessToken: null,
  setAccessToken: () => {},
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load authentication state from localStorage on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          console.log('SSR detected, skipping auth initialization');
          setLoading(false);
          return;
        }

        console.log('Initializing auth from localStorage...');
        const storedUser = localStorage.getItem('verbfy_user');
        const storedToken = localStorage.getItem('verbfy_access_token');

        console.log('Stored user:', storedUser ? 'exists' : 'not found');
        console.log('Stored token:', storedToken ? 'exists' : 'not found');

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Parsed user:', parsedUser);
          
          // Set the token in the API client
          setApiAccessToken(storedToken);
          
          // Check if token is about to expire (within 2 minutes)
          try {
            const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
            const tokenExp = tokenPayload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilExpiry = tokenExp - now;
            
            console.log('Token expires in:', Math.floor(timeUntilExpiry / 1000), 'seconds');
            
            // If token expires within 2 minutes, refresh it proactively
            if (timeUntilExpiry < 120000) { // 2 minutes in milliseconds
              console.log('Token expires soon, refreshing proactively...');
              try {
                const response = await api.post('/api/auth/refresh-token');
                const newToken = response.data.accessToken;
                console.log('Token refreshed proactively');
                setApiAccessToken(newToken);
                setAccessToken(newToken);
                localStorage.setItem('verbfy_access_token', newToken);
              } catch (refreshError) {
                console.log('Proactive refresh failed, will validate existing token');
              }
            }
          } catch (parseError) {
            console.log('Could not parse token payload, proceeding with validation');
          }
          
          // Validate the token by making a test request
          try {
            console.log('Validating token with backend...');
            // Try to fetch user profile or validate token
            await api.get('/api/auth/me');
            
            // If successful, restore the user session
            console.log('Token validation successful, restoring session');
            setUser(parsedUser);
            setAccessToken(storedToken);
          } catch (error) {
            // Token is invalid, clear stored data
            console.log('Stored token is invalid, clearing auth data');
            console.error('Token validation error:', error);
            localStorage.removeItem('verbfy_user');
            localStorage.removeItem('verbfy_access_token');
            setApiAccessToken(null);
          }
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear any corrupted data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('verbfy_user');
          localStorage.removeItem('verbfy_access_token');
        }
        setApiAccessToken(null);
      } finally {
        console.log('Auth initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Update localStorage when user or token changes
  const updateUser = (newUser: AuthUser | null) => {
    console.log('updateUser called with:', newUser);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem('verbfy_user', JSON.stringify(newUser));
        console.log('User saved to localStorage');
      } else {
        localStorage.removeItem('verbfy_user');
        console.log('User removed from localStorage');
      }
    }
  };

  const updateAccessToken = (newToken: string | null) => {
    console.log('updateAccessToken called with:', newToken ? 'token exists' : 'null');
    setAccessToken(newToken);
    setApiAccessToken(newToken);
    if (typeof window !== 'undefined') {
      if (newToken) {
        localStorage.setItem('verbfy_access_token', newToken);
        console.log('Token saved to localStorage');
      } else {
        localStorage.removeItem('verbfy_access_token');
        console.log('Token removed from localStorage');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser: updateUser, 
      accessToken, 
      setAccessToken: updateAccessToken,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  return useContext(AuthContext);
} 