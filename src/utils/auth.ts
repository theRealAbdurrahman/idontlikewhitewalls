/**
 * Authentication utility functions for handling environment-specific URLs
 */

/**
 * Gets the base URL for the current environment
 * @returns The base URL for the current environment
 */
export const getBaseUrl = (): string => {
  // First check for explicit environment variable
  if (import.meta.env.VITE_AUTH_BASE_URL) {
    return import.meta.env.VITE_AUTH_BASE_URL;
  }
  
  // For any deployment (including staging), use the current window location
  // This makes it work dynamically for app-28-juno.meetball.fun, bolt.meetball.fun, etc.
  return `${window.location.protocol}//${window.location.host}`;
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
