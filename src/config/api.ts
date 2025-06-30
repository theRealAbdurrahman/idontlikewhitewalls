/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */
import axios, { AxiosRequestConfig } from 'axios';

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
  
  // Images
  images: 'api/v1/images',
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

/**
 * Axios instance for orval-generated API client
 */
export const axiosInstance = axios.create(apiConfig);

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging in development
    if (shouldLogApiRequests) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }
    
    return config;
  },
  (error) => {
    if (shouldLogApiRequests) {
      console.error('❌ API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    if (shouldLogApiRequests) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (shouldLogApiRequests) {
      console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);