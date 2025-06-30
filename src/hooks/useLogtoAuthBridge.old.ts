import { useEffect } from 'react';
import { useLogto } from '@logto/react';
import { useAuthStore } from '../stores/authStore';
import { LogtoUserData } from '../api-client/api-client';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../config/api'; // Add this import


/**
 * Hook that bridges Logto authentication with our AuthStore
 * This synchronizes Logto state with our Zustand store
 */
export const useLogtoAuthBridge = () => {
  const { isAuthenticated, isLoading, error, getIdTokenClaims, getIdToken } = useLogto();
  const { setCurrentUser, setAuthenticated, setLoading, setError } = useAuthStore();
  const navigate = useNavigate();

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
      debugger;
      if (isAuthenticated && !isLoading) {

        try {
          const logtoData = await fetchLogtoUserData();
          const isUserDidNotCompleteSignUp = await checkIfUserSignedUp(logtoData);

          if (isUserDidNotCompleteSignUp) {
            navigate('/signup');
            sessionStorage.setItem('redirectPath', '/signup');
            return;
          }
          sessionStorage.setItem('redirectPath', '/home');

          navigate('/home')
        } catch (fetchError) {
          console.error('Failed to fetch backend user:', fetchError);
          setError(fetchError as string)
          navigate('/signup'); // Redirect to home page after fetching user
          return;
        }
      } else if (!isAuthenticated) {
        // Clear user data when not authenticated
        setCurrentUser(null);
        navigate('/login'); // Redirect to login page
      }
    };

    syncUserData();
  }, [isAuthenticated, isLoading]);



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
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}api/v1/users/is_new/${logtoUserData.sub}`, {
        method: 'GET',
        // headers: {
        //   'Authorization': `Bearer ${logtoUserData.jwt}`,
        //   'Content-Type': 'application/json'
        // }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
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