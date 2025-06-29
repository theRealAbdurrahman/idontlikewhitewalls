import { useEffect } from 'react';
import { useLogto } from '@logto/react';
import { useAuthStore } from '../stores/authStore';
import { fetchCurrentUser, LogtoUserData } from '../api-client/api-client';

/**
 * Hook that bridges Logto authentication with our AuthStore
 * This synchronizes Logto state with our Zustand store
 */
export const useLogtoAuthBridge = () => {
  const { isAuthenticated, isLoading, user, error, getIdTokenClaims } = useLogto();
  const { updateUserFromLogto, setAuthenticated, setLoading, setError } = useAuthStore();

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
        try {
          // Get detailed user claims from ID token
          const claims = await getIdTokenClaims();
          
          // Combine user info with ID token claims for full profile
          const logtoUserData: LogtoUserData = {
            sub: claims?.sub || user?.sub || `logto_${Date.now()}`,
            email: claims?.email || user?.email,
            name: claims?.name || user?.name,
            given_name: claims?.given_name || user?.given_name,
            family_name: claims?.family_name || user?.family_name,
            picture: claims?.picture || user?.picture,
            bio: claims?.bio,
            job_title: claims?.job_title,
            linkedin_url: claims?.linkedin_url,
          };
          
          console.log('Fetching backend user for Logto data:', logtoUserData);
          
          // Get or create user in backend
          const backendUser = await fetchCurrentUser(logtoUserData);
          
          console.log('Backend user received:', backendUser);
          
          // Store backend user data (with UUID) in auth store
          updateUserFromLogto(backendUser);
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
          setError('Failed to sync user data');
        }
      } else if (!isAuthenticated) {
        // Clear user data when not authenticated
        updateUserFromLogto(null);
      }
    };

    syncUserData();
  }, [isAuthenticated, isLoading, user, getIdTokenClaims, updateUserFromLogto, setError]);

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
  };
};