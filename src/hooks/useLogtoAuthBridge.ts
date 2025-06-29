import { useEffect } from 'react';
import { useLogto } from '@logto/react';
import { useAuthStore } from '../stores/authStore';
import { fetchCurrentUser, LogtoUserData } from '../api-client/api-client';

/**
 * Hook that bridges Logto authentication with our AuthStore
 * This synchronizes Logto state with our Zustand store
 */
export const useLogtoAuthBridge = () => {
  const { isAuthenticated, isLoading, error, getIdTokenClaims, getIdToken } = useLogto();
  const { setCurrentUser, setAuthenticated, setLoading, setError } = useAuthStore();

  // Sync authentication state
  useEffect(() => {
    setAuthenticated(isAuthenticated);
  }, [isAuthenticated, setAuthenticated]);

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
        const jwt = await getIdToken();

        try {
          // Get detailed user claims from ID token
          const claims = await getIdTokenClaims();
          console.log('Logto user claims:', claims);

          
          // Combine user info with ID token claims for full profile
          const logtoUserData: LogtoUserData = {
            sub: claims!.sub,
            jwt: jwt || '', // Include JWT token if available
          };
          
          console.log('Fetching backend user for Logto data:', logtoUserData);
          
          // Get or create user in backend
          const backendUser = await fetchCurrentUser(logtoUserData);
          
          console.log('Backend user received:', backendUser);
          
          // Store the backend user data in auth store
          setCurrentUser(backendUser);
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

  return {
    isAuthenticated,
    isLoading,
    error,
  };
};