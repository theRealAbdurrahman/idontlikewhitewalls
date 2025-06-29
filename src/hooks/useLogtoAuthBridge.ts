import { useEffect } from 'react';
import { useLogto } from '@logto/react';
import { useAuthStore } from '../stores/authStore';

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
          const fullUserData = {
            ...user,
            ...claims,
          };
          
          console.log('Syncing Logto user data to AuthStore:', fullUserData);
          updateUserFromLogto(fullUserData);
        } catch (error) {
          console.error('Failed to get user claims:', error);
          // Fallback to basic user data
          updateUserFromLogto(user);
        }
      } else if (!isAuthenticated) {
        // Clear user data when not authenticated
        updateUserFromLogto(null);
      }
    };

    syncUserData();
  }, [isAuthenticated, isLoading, user, getIdTokenClaims, updateUserFromLogto]);

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
  };
};