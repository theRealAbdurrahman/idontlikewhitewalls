/**
 * @deprecated This hook has been integrated into the centralized AuthProvider
 * Use useAuth() from '../providers/AuthProvider' instead
 * 
 * This file is kept for compatibility but should not be used in new code.
 * All authentication logic is now centralized in AuthProvider.
 */

import { useEffect } from 'react';
import { useLogto } from '@logto/react';
import { useAuthStore } from '../stores/authStore';
import { signUpAndfetchCurrentUser, LogtoUserData } from '../api-client/api-client';

/**
 * @deprecated Hook that bridges Logto authentication with our AuthStore
 * This functionality has been moved to AuthProvider
 */
export const useLogtoAuthBridge = () => {
    console.warn('useLogtoAuthBridge is deprecated. Use useAuth() from providers/AuthProvider instead.');

    const { isAuthenticated, isLoading, error, getIdTokenClaims, getIdToken } = useLogto();
    const { setCurrentUser, setAuthenticated, setLoading, setError } = useAuthStore();

    // Sync authentication state
    // useEffect(() => {
    //   setAuthenticated(isAuthenticated);
    // }, [isAuthenticated]);

    // Sync loading state
    useEffect(() => {
        setLoading(isLoading);
    }, [isLoading, setLoading]);

    // Sync error state
    useEffect(() => {
        if (error) {
            setError(error.message || 'Authentication error');
        } else {
            setError(null);
        }
    }, [error, setError]);

    // Sync user data when authenticated
    useEffect(() => {
        const syncUserData = async () => {
            if (isAuthenticated && !isLoading) {
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
                    setCurrentUser(backendUser.data);
                } catch (error) {
                    console.error('Failed to sync user with backend:', error);
                    setError('Failed to sync user data');
                }
            } else if (!isAuthenticated) {
                // Clear user data when not authenticated
                setCurrentUser(null);
            }
        };

        syncUserData();
    }, [isAuthenticated, isLoading, getIdTokenClaims, setCurrentUser, setError]);

    // Helper function to fetch Logto user data
    const fetchLogtoUserData = async (): Promise<LogtoUserData> => {
        const jwt = await getIdToken();
        const claims = await getIdTokenClaims();

        console.log('Logto user claims:', claims);

        if (!claims) {
            throw new Error('Failed to get user claims');
        }

        return {
            sub: claims.sub,
            jwt: jwt || '',
        };
    };

    const checkIfUserSignedUp = async (logtoUserData: any): Promise<boolean> => {
        try {
            // Use the sub from logtoUserData as the auth_id
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const response = await fetch(`${baseUrl}api/v1/users/is_new/${logtoUserData.sub}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

    return {
        isAuthenticated,
        isLoading,
        error,
        checkIfUserSignedUp,
    };
};
