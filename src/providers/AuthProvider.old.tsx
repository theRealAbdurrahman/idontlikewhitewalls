import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLogto } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../config/api';
import { LogtoUserData, signUpAndfetchCurrentUser } from '../api-client/api-client';
import { UserProfileResponse } from '../models';
import { getAuthCallbackUrl, getLogoutRedirectUrl } from '../utils/auth';

/**
 * Centralized Authentication Context Interface
 * This is the single source of truth for authentication state
 */
interface AuthContextType {
  // Core authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: UserProfileResponse | null;

  // Authentication actions
  signIn: () => void;
  signOut: () => void;

  // Helper methods
  getAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
  checkIfUserSignedUp: (logtoUserData: LogtoUserData) => Promise<boolean>;
}

/**
 * Authentication Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Centralized Authentication Provider
 * 
 * This component:
 * - Manages all Logto authentication state
 * - Synchronizes with the Zustand auth store
 * - Handles user session management
 * - Provides authentication methods to the app
 * - Manages navigation based on auth state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  // Logto hooks
  const {
    isAuthenticated: logtoIsAuthenticated,
    isLoading: logtoIsLoading,
    error: logtoError,
    signIn: logtoSignIn,
    signOut: logtoSignOut,
    getIdToken,
    getIdTokenClaims,
    getAccessToken: logtoGetAccessToken
  } = useLogto();

  // Zustand store
  const {
    user,
    isAuthenticated: storeIsAuthenticated,
    loading: storeLoading,
    error: storeError,
    setCurrentUser,
    setAuthenticated,
    setLoading,
    setError
  } = useAuthStore();

  /**
   * Sync Logto loading state with store
   */
  useEffect(() => {
    setLoading(logtoIsLoading);
  }, [logtoIsLoading, setLoading]);

  /**
   * Sync Logto error state with store
   */
  useEffect(() => {
    if (logtoError) {
      setError(logtoError.message || 'Authentication error');
    } else {
      setError(null);
    }
  }, [logtoError, setError]);

  /**
   * Main authentication synchronization effect
   * This handles the core authentication flow
   */
  useEffect(() => {
    const syncAuthState = async () => {
      if (logtoIsLoading) {
        return; // Wait for Logto to finish loading
      }

      if (logtoIsAuthenticated) {
        try {
          setLoading(true);

          // Get Logto user data
          const logtoUserData = await fetchLogtoUserData();

          // Check if user exists in our backend
          const backendUser = await fetchBackendUser(logtoUserData);

          if (backendUser) {
            // User exists, set authenticated state
            setCurrentUser(backendUser);
            setAuthenticated(true);

            // Navigate to intended page or home
            const redirectPath = sessionStorage.getItem('redirectPath') || '/home';
            sessionStorage.removeItem('redirectPath');

            if (window.location.pathname === '/login' || window.location.pathname === '/callback') {
              navigate(redirectPath);
            }
          } else {
            // User doesn't exist, redirect to signup
            setAuthenticated(false);
            setCurrentUser(null);
            sessionStorage.setItem('redirectPath', '/signup');
            navigate('/signup');
          }
        } catch (error) {
          console.error('Authentication sync error:', error);
          setError(error instanceof Error ? error.message : 'Authentication failed');
          setAuthenticated(false);
          setCurrentUser(null);
          navigate('/signup');
        } finally {
          setLoading(false);
        }
      } else {
        // Not authenticated with Logto
        setAuthenticated(false);
        setCurrentUser(null);

        // Only redirect to login if not already on auth pages
        const currentPath = window.location.pathname;
        const authPages = ['/login', '/signup', '/callback'];

        if (!authPages.includes(currentPath)) {
          navigate('/login');
        }
      }
    };

    syncAuthState();
  }, [logtoIsAuthenticated, logtoIsLoading]);

  /**
   * Fetch Logto user data (JWT and claims)
   */
  const fetchLogtoUserData = async (): Promise<LogtoUserData> => {
    const jwt = await getIdToken();
    const claims = await getIdTokenClaims();

    if (!claims) {
      throw new Error('Failed to get user claims from Logto');
    }

    return {
      sub: claims.sub,
      jwt: jwt || '',
    };
  };

  /**
   * Fetch user data from our backend API
   */
  const fetchBackendUser = async (logtoUserData: LogtoUserData): Promise<UserProfileResponse | null> => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}api/v1/users/profile/${logtoUserData.sub}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${logtoUserData.jwt}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // User doesn't exist in our system yet
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const userData = await response.json();
      return userData.user || userData; // Handle different response formats
    } catch (error) {
      console.error('Error fetching backend user:', error);
      // If it's a 404, return null (user needs to sign up)
      // Otherwise, throw the error
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  };

  /**
   * Enhanced sign in with callback URL
   */
  const signIn = () => {
    const callbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL ||
      `${window.location.origin}/callback`;
    logtoSignIn(callbackUrl);
  };

  /**
   * Enhanced sign out with redirect URL
   */
  const signOut = () => {
    const logoutUrl = import.meta.env.VITE_AUTH_LOGOUT_URL ||
      window.location.origin;

    // Clear store state
    setAuthenticated(false);
    setCurrentUser(null);
    setError(null);

    // Sign out from Logto
    logtoSignOut(logoutUrl);
  };

  /**
   * Get access token for API calls
   */
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const token = await logtoGetAccessToken();
      return token || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  };

  /**
   * Refresh user data from backend
   */
  const refreshUser = async (): Promise<void> => {
    if (!logtoIsAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const logtoUserData = await fetchLogtoUserData();
      const backendUser = await fetchBackendUser(logtoUserData);

      if (backendUser) {
        setCurrentUser(backendUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh user');
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: AuthContextType = {
    isAuthenticated: storeIsAuthenticated,
    isLoading: storeLoading,
    error: storeError,
    user,
    signIn,
    signOut,
    getAccessToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use centralized authentication
 * This is the only hook components should use for authentication
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component for route protection
 */
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};
