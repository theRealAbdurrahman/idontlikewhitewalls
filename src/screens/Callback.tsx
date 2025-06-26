import { useHandleSignInCallback } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const Callback = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useHandleSignInCallback();
  
  useEffect(() => {
    // Only navigate when authentication is complete (not loading)
    if (!isLoading && !error) {
      navigate('/');
    }
  }, [isLoading, error, navigate]);

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