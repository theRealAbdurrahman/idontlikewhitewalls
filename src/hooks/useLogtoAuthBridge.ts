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
  const navigate = useNavigate();

  // Sync authentication state
  useEffect(() => {
    setAuthenticated(isAuthenticated);
  }, [isAuthenticated]);

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
          try {
            // this request always fails because it doesn't have the data it needs and BE returns an error
            // so it always redirects to signup
            // but if we remove something doesn't work so we need another way to check if the user is signed up
            const backendUser = await fetchCurrentUser(logtoUserData);
            navigate('/home')
          } catch (fetchError) {
            console.error('Failed to fetch backend user:', fetchError);
            navigate('/signup'); // Redirect to home page after fetching user
            return;
          }

        } catch (error) {
          console.error('Failed to sync user with backend:', error);
          setError('Failed to sync user data');
        }
      } else if (!isAuthenticated) {
        // Clear user data when not authenticated
        setCurrentUser(null);
        navigate('/login'); // Redirect to login page
      }
    };

    syncUserData();
  }, [isAuthenticated]);
  const checkIfUserSignedUp = async (logtoUserData: any): Promise<boolean> => {
    const user = await fetchCurrentUser(logtoUserData);
    return user ? true : false;
  };
  return {
    isAuthenticated,
    isLoading,
    error,
    checkIfUserSignedUp,
  };
};