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

    // Logto hooks - All Logto interactions happen here
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
     * Sync authentication state from Logto to store
     */
    useEffect(() => {
        setAuthenticated(logtoIsAuthenticated);
    }, [logtoIsAuthenticated, setAuthenticated]);

    /**
     * Sync loading state from Logto to store
     */
    useEffect(() => {
        setLoading(logtoIsLoading);
    }, [logtoIsLoading, setLoading]);

    /**
     * Sync error state from Logto to store
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
     * This replaces the useLogtoAuthBridge functionality
     */
    useEffect(() => {
        const syncUserData = async () => {
            if (logtoIsAuthenticated && !logtoIsLoading) {
                try {
                    // Get detailed user claims and token from Logto
                    const jwt = await getIdToken();
                    const claims = await getIdTokenClaims();

                    console.log('Logto user claims:', claims);

                    if (!claims) {
                        throw new Error('Failed to get user claims');
                    }

                    // Combine user info with ID token claims for full profile
                    const logtoUserData: LogtoUserData = {
                        sub: claims.sub,
                        jwt: jwt || '',
                    };

                    console.log('Fetching backend user for Logto data:', logtoUserData);

                    // Get or create user in backend
                    const backendUser = await signUpAndfetchCurrentUser(logtoUserData);

                    console.log('Backend user received:', backendUser);

                    // Store the backend user data in auth store
                    setCurrentUser(backendUser);

                } catch (fetchError) {
                    console.error('Failed to sync user with backend:', fetchError);
                    setError('Failed to sync user data');
                }
            } else if (!logtoIsAuthenticated) {
                // Clear user data when not authenticated
                setCurrentUser(null);

                // Only redirect to login if not already on auth pages
                const currentPath = window.location.pathname;
                const authPages = ['/login', '/signup', '/callback'];

                if (!authPages.includes(currentPath)) {
                    navigate('/login');
                }
            }
        };

        syncUserData();
    }, [logtoIsAuthenticated, logtoIsLoading, getIdTokenClaims, getIdToken, setCurrentUser, setError, navigate]);

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
            return await logtoGetAccessToken();
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
            const backendUser = await signUpAndfetchCurrentUser(logtoUserData);

            if (backendUser) {
                setCurrentUser(backendUser.data);
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
