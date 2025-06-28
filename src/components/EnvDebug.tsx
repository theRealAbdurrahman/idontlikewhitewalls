import React from 'react';
import { getBaseUrl, getAuthCallbackUrl, getLogoutRedirectUrl } from '../utils/auth';

/**
 * A debug component to display environment variables and auth URLs
 * Only use this component during development
 */
export const EnvDebug: React.FC = () => {
  return (
    <div className="p-4 bg-gray-100 rounded-md text-sm font-mono">
      <h3 className="font-bold mb-2">Environment Variables:</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>VITE_APP_ENV:</div>
        <div>{import.meta.env.VITE_APP_ENV || 'Not set'}</div>
        
        <div>MODE:</div>
        <div>{import.meta.env.MODE || 'Not set'}</div>
        
        <div>VITE_AUTH_BASE_URL:</div>
        <div>{import.meta.env.VITE_AUTH_BASE_URL || 'Not set'}</div>
        
        <div>VITE_AUTH_CALLBACK_URL:</div>
        <div>{import.meta.env.VITE_AUTH_CALLBACK_URL || 'Not set'}</div>
        
        <div>VITE_AUTH_LOGOUT_URL:</div>
        <div>{import.meta.env.VITE_AUTH_LOGOUT_URL || 'Not set'}</div>
      </div>
      
      <h3 className="font-bold mt-4 mb-2">Auth Utility Functions:</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>getBaseUrl():</div>
        <div>{getBaseUrl()}</div>
        
        <div>getAuthCallbackUrl():</div>
        <div>{getAuthCallbackUrl()}</div>
        
        <div>getLogoutRedirectUrl():</div>
        <div>{getLogoutRedirectUrl()}</div>
      </div>
    </div>
  );
};
