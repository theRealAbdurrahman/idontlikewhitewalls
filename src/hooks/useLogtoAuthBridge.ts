import { useEffect, useState } from 'react';
import { IdTokenClaims, useLogto } from '@logto/react';
import { useAuthStore } from '../stores/authStore';
import { fetchCurrentUser, LogtoUserData } from '../api-client/api-client';
import { useNavigate } from 'react-router-dom';

/**
 * Hook that bridges Logto authentication with our AuthStore
 * This synchronizes Logto state with our Zustand store
 */
export const useLogtoAuthBridge = () => {
  const { isAuthenticated, isLoading, error, getIdTokenClaims, getIdToken } = useLogto();
  const { setCurrentUser, setAuthenticated, setLoading, setError } = useAuthStore();
  const [user, setUser] = useState<IdTokenClaims>();
  const navigate = useNavigate();

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
          let backendUser;
          try {
            backendUser = await fetchCurrentUser(logtoUserData);
          } catch (fetchError) {
            console.error('Failed to fetch backend user:', fetchError);
            navigate('/signup'); // Redirect to signup if user not found
            return;
          }
          // Get or create user in backend
          
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
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
  };
};