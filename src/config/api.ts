// import { useAuth } from "../providers";


/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

/**
 * Get the API base URL from environment variables
 * Falls back to localhost for development if not set
 * 
 * 
 */

// const { getAccessToken } = useAuth();

export const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!baseUrl) {
    console.warn('VITE_API_BASE_URL environment variable not set, falling back to localhost');
    return 'http://localhost:8000';
  }
  
  // Ensure the URL ends with a slash for proper path joining
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
};

/**
 * API configuration object
 */
export const apiConfig = {
  baseURL: getApiBaseUrl(),
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // 'Authorization': `Bearer ${getAccessToken()}`, // Use the access token from the auth provider
  },
} as const;
// TODO: if the problem is getting a new token and we can refresh it, find a way to implement this
// the current problem is we can't use hooks outside a component
export const getApiConfig = async (getAccessToken: () => Promise<string | null>) => {
  const token = await getAccessToken();
  return {
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  } as const;
};

/**
 * API endpoints configuration
 */
export const endpoints = {
  // Events
  events: 'api/v1/events',
  eventParticipants: 'api/v1/event-participants',
  
  // Questions
  questions: 'api/v1/questions',
  
  // Answers
  answers: 'api/v1/answers',
  
  // Interactions
  interactions: 'api/v1/interactions',
  
  // Users
  users: 'api/v1/users',
} as const;

/**
 * Environment-specific configuration
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

/**
 * Debug logging for API requests (only in development)
 */
export const shouldLogApiRequests = isDevelopment;