import React, { useEffect, useRef } from "react";
import { useAuth } from "../providers";
import { useNavigate } from "react-router-dom";

export const Logout: React.FC = () => {
  const { signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const logoutInitiated = useRef(false);

  // Automatically sign out when component mounts
  useEffect(() => {
    // console.log('🚪 Logout page mounted, isAuthenticated:', isAuthenticated);

    if (isAuthenticated && !logoutInitiated.current) {
      // console.log('🔄 Signing out user...');
      logoutInitiated.current = true;
      signOut();
    } else if (!isAuthenticated && logoutInitiated.current) {
      // User has been signed out, redirect to login after a short delay
      // console.log('✅ User signed out successfully, redirecting to login...');
      const timer = setTimeout(() => {
        navigate('/login');
      }, 1500);

      return () => clearTimeout(timer);
    } else if (!isAuthenticated && !logoutInitiated.current) {
      // User is already not authenticated, redirect immediately
      // console.log('👤 User already not authenticated, redirecting to login...');
      const timer = setTimeout(() => {
        navigate('/login');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, signOut, navigate]);

  const handleManualLogout = () => {
    if (!logoutInitiated.current) {
      logoutInitiated.current = true;
      signOut();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0efeb]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isAuthenticated ? 'Signing out...' : 'Redirecting to login...'}
        </p>

        {/* Manual logout button as fallback */}
        <button
          onClick={handleManualLogout}
          className="mt-4 px-4 py-2 bg-[#3ec6c6] text-white rounded hover:bg-[#2ea5a5] transition-colors"
          disabled={!isAuthenticated || logoutInitiated.current}
        >
          {logoutInitiated.current ? 'Signing out...' : 'Click here if not redirected'}
        </button>
      </div>
    </div>
  );
};