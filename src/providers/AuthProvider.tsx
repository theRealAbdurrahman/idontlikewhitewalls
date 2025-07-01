import React, { createContext, useContext, useEffect, ReactNode, useRef } from 'react';
import { useLogto } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../config/api';
import { LogtoUserData, getCurrentUserProfile } from '../api-client/api-client';
import { UserProfileResponse } from '../models';
import { getAuthCallbackUrl, getLogoutRedirectUrl } from '../utils/auth';
import { isWebcontainerEnv, getMockUser, getMockToken, logWebcontainerInfo } from '../utils/webcontainer';

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
    const fetchRetryCount = useRef(0);
    const maxRetries = 3;

    // Check if we're in webcontainer environment
    const isWebcontainer = isWebcontainerEnv();
    
    // Log webcontainer info for debugging
    useEffect(() => {
        if (isWebcontainer) {
            logWebcontainerInfo();
        }
    }, [isWebcontainer]);

    // Logto hooks - Only use if not in webcontainer
    const logtoHooks = useLogto();
    const {
        isAuthenticated: logtoIsAuthenticated = false,
        isLoading: logtoIsLoading = false,
        error: logtoError = null,
        signIn: logtoSignIn,
        signOut: logtoSignOut,
        getIdToken,
        getAccessToken: logtoGetAccessToken
    } = isWebcontainer ? {} : logtoHooks;

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

    // Initial cleanup for webcontainer mode
    useEffect(() => {
        if (isWebcontainer) {
            // Immediately clear any persisted auth state in webcontainer
            setAuthenticated(false);
            setCurrentUser(null);
            setLoading(false);
            setError(null);
        }
    }, [isWebcontainer, setAuthenticated, setCurrentUser, setLoading, setError]);

    /**
     * SINGLE useEffect to handle ALL authentication synchronization
     * This prevents circular dependencies and infinite loops
     * Webcontainer mode authentication is now handled via signIn() method only
     */
    useEffect(() => {
        // Reduced logging to prevent console spam - only log significant state changes
        if (process.env.NODE_ENV === 'development' && !userSyncInProgress.current) {
            console.log('🔄 AuthProvider: Authentication state change:', {
                isWebcontainer,
                logtoIsAuthenticated,
                logtoIsLoading
            });
        }

        // Skip automatic authentication in webcontainer mode
        // Users must explicitly click login to authenticate
        if (isWebcontainer) {
            console.log('🔧 Webcontainer mode: Skipping auto-authentication, waiting for user action');

            // Ensure we start with clean, unauthenticated state - only update if needed
            if (storeIsAuthenticated) setAuthenticated(false);
            if (user) setCurrentUser(null);
            if (storeLoading) setLoading(false);
            if (storeError) setError(null);

            // Force navigation to login if not already there
            const currentPath = window.location.pathname;
            const authPages = ['/login', '/signup', '/callback', '/logout'];

            if (!authPages.includes(currentPath) && !navigationInProgress.current) {
                console.log('🔀 Webcontainer mode: Redirecting to login from:', currentPath);
                navigationInProgress.current = true;

                setTimeout(() => {
                    navigate('/login');
                    setTimeout(() => {
                        navigationInProgress.current = false;
                    }, 1000);
                }, 0);
            }

            return;
        }

        // Sync basic states immediately (no async operations) - only if values actually changed
        if (storeIsAuthenticated !== logtoIsAuthenticated) {
            setAuthenticated(logtoIsAuthenticated);
        }
        if (storeLoading !== logtoIsLoading) {
            setLoading(logtoIsLoading);
        }

        // Handle errors - only update if error state actually changed
        const newErrorMessage = logtoError ? (logtoError.message || 'Authentication error') : null;
        if (storeError !== newErrorMessage) {
            setError(newErrorMessage);
        }

        // Main authentication flow
        const handleAuthFlow = async () => {
            if (logtoIsAuthenticated && !logtoIsLoading && !userSyncInProgress.current) {
                // Check retry limit to prevent infinite loops
                if (fetchRetryCount.current >= maxRetries) {
                    console.warn('🚫 Max retry limit reached for user profile fetch, skipping...');
                    return;
                }

                userSyncInProgress.current = true;

                try {
                    console.log('✅ User authenticated, fetching user profile...');

                    // Get JWT token from Logto
                    const jwt = await getIdToken?.();

                    if (!jwt) {
                        throw new Error('Failed to get JWT token');
                    }

                    const userProfileResponse = await getCurrentUserProfile(jwt);
                    console.log('✅ User profile fetched successfully', userProfileResponse);

                    // Store the user data in auth store
                    setCurrentUser(userProfileResponse);
                    console.log('✅ User data stored in auth store:', user);

                    // Reset retry count on success
                    fetchRetryCount.current = 0;

                } catch (fetchError) {
                    fetchRetryCount.current += 1;
                    console.error(`❌ Failed to fetch user profile (attempt ${fetchRetryCount.current}/${maxRetries}):`, fetchError);
                    
                    if (fetchError && typeof fetchError === 'object' && 'status' in fetchError && (fetchError as any).status === 404) {
                        navigate('/signup');
                        return;
                    }
                    
                    // Only set error if we haven't reached max retries and it's different to prevent infinite loops
                    if (fetchRetryCount.current < maxRetries) {
                        const errorMessage = `Failed to fetch user data (attempt ${fetchRetryCount.current}/${maxRetries})`;
                        if (storeError !== errorMessage) {
                            setError(errorMessage);
                        }
                    } else {
                        const finalErrorMessage = 'Authentication failed after multiple attempts. Please refresh the page.';
                        if (storeError !== finalErrorMessage) {
                            setError(finalErrorMessage);
                        }
                    }
                } finally {
                    userSyncInProgress.current = false;
                }
            } else if (!logtoIsAuthenticated && !logtoIsLoading) {
                console.log('🚫 User not authenticated, clearing data...');

                // Clear user data when not authenticated
                setCurrentUser(null);
                userSyncInProgress.current = false;
                // Reset retry count when user becomes unauthenticated
                fetchRetryCount.current = 0;

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
        // Authentication state from Logto
        logtoIsAuthenticated,
        logtoIsLoading,
        logtoError,
        // Environment flag
        isWebcontainer,
        // Store state for comparison guards
        storeIsAuthenticated,
        storeLoading,
        storeError,
        // REMOVED 'user' from dependencies to prevent infinite loops
        // since 'user' is SET inside this effect, not READ from it
        // Functions are stable and don't need to be dependencies:
        // navigate, setter functions, and getIdToken are stable/memoized
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
     * Enhanced sign in with callback URL (with webcontainer bypass)
     */
    const signIn = () => {
        if (isWebcontainer) {
            // In webcontainer mode, set up mock authentication when user clicks login
            console.log('🔧 Webcontainer mode: Setting up mock authentication on user action');
            setAuthenticated(true);
            setLoading(false);
            setError(null);
            setCurrentUser(getMockUser());
            navigate('/home');
            return;
        }
        
        const callbackUrl = getAuthCallbackUrl();
        logtoSignIn?.(callbackUrl);
    };

    /**
     * Enhanced sign out with redirect URL and cleanup (with webcontainer bypass)
     */
    const signOut = () => {
        if (isWebcontainer) {
            // In webcontainer mode, just clear state and go to login
            console.log('🔧 Webcontainer mode: Mock sign out');
            setAuthenticated(false);
            setCurrentUser(null);
            navigate('/login');
            return;
        }
        
        const logoutUrl = getLogoutRedirectUrl();

        // Clear store state first
        setAuthenticated(false);
        setCurrentUser(null);
        setError(null);

        // Sign out from Logto
        logtoSignOut?.(logoutUrl);
    };

    /**
     * Get access token for API calls (with webcontainer mock)
     */
    const getAccessToken = async (): Promise<string | null> => {
        if (isWebcontainer) {
            console.log('🔧 Webcontainer mode: Returning mock token');
            return getMockToken();
        }
        
        try {
            const token = await logtoGetAccessToken?.();
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
            const jwt = await getIdToken?.();

            if (!jwt) {
                throw new Error('Failed to get JWT token');
            }

            const userProfileResponse = await getCurrentUserProfile(jwt);

            if (userProfileResponse) {
                setCurrentUser(userProfileResponse);
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
