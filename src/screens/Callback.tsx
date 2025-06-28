import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const Callback = () => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error } = useHandleSignInCallback();
  
  useEffect(() => {
    // Only navigate when authentication is complete (not loading)
    if (!isLoading && isAuthenticated && !error) {
      console.log("Authentication successful");
      // Check if we have a stored path to redirect to
      const redirectPath = sessionStorage.getItem('redirectPath') || '/home';
      // Clear the stored path
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath);
    }
  }, [isLoading, error, isAuthenticated, navigate]);

  // Show loading state while processing
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h2>Completing authentication...</h2>
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      </div>
    </div>
  );
};