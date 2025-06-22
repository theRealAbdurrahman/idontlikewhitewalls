/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

/**
 * Get the API base URL from environment variables
 * Falls back to localhost for development if not set
 */
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
  },
} as const;

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