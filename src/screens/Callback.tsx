import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const Callback = () => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error } = useHandleSignInCallback();

  
  useEffect(() => {
    // Only navigate when authentication is complete (not loading)
    if (!isLoading && isAuthenticated && !error) {
      // console.log("Authentication successful");
      // Check if we have a stored path to redirect to
      const redirectPath = sessionStorage.getItem('redirectPath') || '/home';
      // Clear the stored path
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath);
    }
  }, [isLoading, error, isAuthenticated, navigate]);

  // Show loading state while processing
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div>
        <h2>Completing authentication...</h2>
        {error && <p className="text-red-500">Error: {error.message}</p>}
      </div>
    </div>
  );
};