/**
 * Authentication utility functions for handling environment-specific URLs
 */

/**
 * Gets the base URL for the current environment
 * @returns The base URL for the current environment
 */
export const getBaseUrl = (): string => {
  return import.meta.env.VITE_AUTH_BASE_URL || 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${window.location.protocol}//${window.location.host}`  // localhost with port
      : 'https://app.meetball.fun');
};

/**
 * Gets the callback URL for authentication based on environment
 * @returns The callback URL for authentication
 */
export const getAuthCallbackUrl = (): string => {
  return import.meta.env.VITE_AUTH_CALLBACK_URL || `${getBaseUrl()}/callback`;
};

/**
 * Gets the post-logout redirect URL based on environment
 * @returns The URL to redirect to after logout
 */
export const getLogoutRedirectUrl = (): string => {
  return import.meta.env.VITE_AUTH_LOGOUT_URL || getBaseUrl();
};
