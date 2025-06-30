import React, { createContext, useContext, useEffect, ReactNode, useRef } from 'react';
import { useLogto } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../config/api';
import { LogtoUserData, getCurrentUserProfile } from '../api-client/api-client';
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
 * This component consolidates ALL authentication logic:
 * - Manages all Logto authentication state
 * - Synchronizes with the Zustand auth store
 * - Handles user session management
 * - Provides authentication methods to the app
 * - Manages navigation based on auth state
 * - Integrates the functionality from useLogtoAuthBridge
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const navigate = useNavigate();
    const navigationInProgress = useRef(false);
    const userSyncInProgress = useRef(false);

    // Logto hooks - All Logto interactions happen here
    const {
        isAuthenticated: logtoIsAuthenticated,
        isLoading: logtoIsLoading,
        error: logtoError,
        signIn: logtoSignIn,
        signOut: logtoSignOut,
        getIdToken,
        getAccessToken: logtoGetAccessToken
    } = useLogto();

    // Zustand store - Single source of truth for auth state
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
     * SINGLE useEffect to handle ALL authentication synchronization
     * This prevents circular dependencies and infinite loops
     */
    useEffect(() => {
        console.log('🔄 AuthProvider: Single effect triggered:', {
            logtoIsAuthenticated,
            logtoIsLoading,
            currentPath: window.location.pathname,
            userSyncInProgress: userSyncInProgress.current
        });

        // Sync basic states immediately (no async operations)
        setAuthenticated(logtoIsAuthenticated);
        setLoading(logtoIsLoading);

        // Handle errors
        if (logtoError) {
            setError(logtoError.message || 'Authentication error');
        } else {
            setError(null);
        }

        // Main authentication flow
        const handleAuthFlow = async () => {
            if (logtoIsAuthenticated && !logtoIsLoading && !userSyncInProgress.current) {
                userSyncInProgress.current = true;

                try {
                    console.log('✅ User authenticated, fetching user profile...');

                    // Get JWT token from Logto
                    const jwt = await getIdToken();

                    if (!jwt) {
                        throw new Error('Failed to get JWT token');
                    }

                    // Fetch current user profile from backend (two-step process)
                    const userProfileResponse = await getCurrentUserProfile(jwt);
                    console.log('✅ User profile fetched successfully');

                    // Store the user data in auth store
                    setCurrentUser(userProfileResponse.data);

                } catch (fetchError) {
                    console.error('❌ Failed to fetch user profile:', fetchError);
                    setError('Failed to fetch user data');
                } finally {
                    userSyncInProgress.current = false;
                }
            } else if (!logtoIsAuthenticated && !logtoIsLoading) {
                console.log('🚫 User not authenticated, clearing data...');

                // Clear user data when not authenticated
                setCurrentUser(null);
                userSyncInProgress.current = false;

                // Handle navigation for unauthenticated users
                const currentPath = window.location.pathname;
                const authPages = ['/login', '/signup', '/callback', '/logout'];

                if (!authPages.includes(currentPath) && !navigationInProgress.current) {
                    console.log('🔀 Redirecting to login from:', currentPath);
                    navigationInProgress.current = true;

                    // Use setTimeout to avoid navigation during render
                    setTimeout(() => {
                        navigate('/login');
                        setTimeout(() => {
                            navigationInProgress.current = false;
                        }, 1000);
                    }, 0);
                }
            }
        };

        // Only run async operations if not loading
        if (!logtoIsLoading) {
            handleAuthFlow();
        }

        // Cleanup function
        return () => {
            // Reset flags if component unmounts during async operations
            if (userSyncInProgress.current) {
                userSyncInProgress.current = false;
            }
        };
    }, [
        // Only include primitive values that actually change
        logtoIsAuthenticated,
        logtoIsLoading,
        // Don't include functions or objects that get recreated
        // logtoError - handled inline
        // navigate - stable function
        // setter functions - not needed as dependencies
    ]);

    /**
     * Check if user has completed signup in our backend
     * This integrates the functionality from useLogtoAuthBridge
     */
    const checkIfUserSignedUp = async (logtoUserData: LogtoUserData): Promise<boolean> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}api/v1/users/is_new/${logtoUserData.sub}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${logtoUserData.jwt}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to check user signup status: ${response.status}`);
            }

            const data = await response.json();
            const user = data.user;
            // If we got user data back, the user exists/is signed up
            return !!user;
        } catch (error) {
            console.error('Error checking if user is signed up:', error);
            return false;
        }
    };

    /**
     * Enhanced sign in with callback URL
     */
    const signIn = () => {
        const callbackUrl = getAuthCallbackUrl();
        logtoSignIn(callbackUrl);
    };

    /**
     * Enhanced sign out with redirect URL and cleanup
     */
    const signOut = () => {
        const logoutUrl = getLogoutRedirectUrl();

        // Clear store state first
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

            // Get JWT token from Logto
            const jwt = await getIdToken();

            if (!jwt) {
                throw new Error('Failed to get JWT token');
            }

            // Fetch current user profile from backend (two-step process)
            const userProfileResponse = await getCurrentUserProfile(jwt);

            if (userProfileResponse) {
                setCurrentUser(userProfileResponse.data);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
            setError(error instanceof Error ? error.message : 'Failed to refresh user');
        } finally {
            setLoading(false);
        }
    };

    // Context value with all authentication functionality
    const value: AuthContextType = {
        isAuthenticated: storeIsAuthenticated,
        isLoading: storeLoading,
        error: storeError,
        user,
        signIn,
        signOut,
        getAccessToken,
        refreshUser,
        checkIfUserSignedUp,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use centralized authentication
 * This is the ONLY hook components should use for authentication
 * Replaces: useAuthStore, useLogto, useLogtoAuthBridge
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

    // Show loading while determining auth state
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

    // The AuthProvider will handle navigation for unauthenticated users
    // so we just render nothing here if not authenticated
    return isAuthenticated ? <>{children}</> : null;
};
