/**
 * Environment configuration for the application
 * Centralized configuration for all environment variables
 */

export interface AppEnvironment {
  // API Configuration
  apiBaseUrl: string;
  
  // Image Service Configuration
  imageService: {
    enabled: boolean;
    cacheEnabled: boolean;
    cacheDuration: number; // milliseconds
    uploadMaxSize: number; // bytes
    uploadQuality: number; // 1-100
  };
  
  // Feature Flags
  features: {
    imageUpload: boolean;
    imageGallery: boolean;
    profileImageUpload: boolean;
  };
  
  // Development
  development: {
    debugApiRequests: boolean;
    debugImageCache: boolean;
  };
  
  // Authentication
  auth: {
    imageServiceAuthEnabled: boolean;
  };
}

/**
 * Parse environment variable as boolean
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * Parse environment variable as number
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Get the current environment configuration
 */
export const getEnvironment = (): AppEnvironment => {
  return {
    // API Configuration
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    
    // Image Service Configuration
    imageService: {
      enabled: parseBoolean(import.meta.env.VITE_ENABLE_IMAGE_SERVICE, true),
      cacheEnabled: parseBoolean(import.meta.env.VITE_IMAGE_CACHE_ENABLED, true),
      cacheDuration: parseNumber(import.meta.env.VITE_IMAGE_CACHE_DURATION, 3600000), // 1 hour
      uploadMaxSize: parseNumber(import.meta.env.VITE_IMAGE_UPLOAD_MAX_SIZE, 10 * 1024 * 1024), // 10MB
      uploadQuality: parseNumber(import.meta.env.VITE_IMAGE_UPLOAD_QUALITY, 85),
    },
    
    // Feature Flags
    features: {
      imageUpload: parseBoolean(import.meta.env.VITE_ENABLE_IMAGE_UPLOAD, true),
      imageGallery: parseBoolean(import.meta.env.VITE_ENABLE_IMAGE_GALLERY, true),
      profileImageUpload: parseBoolean(import.meta.env.VITE_ENABLE_PROFILE_IMAGE_UPLOAD, true),
    },
    
    // Development
    development: {
      debugApiRequests: parseBoolean(import.meta.env.VITE_DEBUG_API_REQUESTS, false),
      debugImageCache: parseBoolean(import.meta.env.VITE_DEBUG_IMAGE_CACHE, false),
    },
    
    // Authentication
    auth: {
      imageServiceAuthEnabled: parseBoolean(import.meta.env.VITE_IMAGE_SERVICE_AUTH_ENABLED, false),
    },
  };
};

/**
 * Environment configuration singleton
 */
export const env = getEnvironment();

/**
 * Environment-specific utilities
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

/**
 * Validate environment configuration
 */
export const validateEnvironment = (): string[] => {
  const errors: string[] = [];
  
  if (!env.apiBaseUrl) {
    errors.push('VITE_API_BASE_URL is required');
  }
  
  if (env.imageService.uploadMaxSize <= 0) {
    errors.push('VITE_IMAGE_UPLOAD_MAX_SIZE must be a positive number');
  }
  
  if (env.imageService.uploadQuality < 1 || env.imageService.uploadQuality > 100) {
    errors.push('VITE_IMAGE_UPLOAD_QUALITY must be between 1 and 100');
  }
  
  if (env.imageService.cacheDuration <= 0) {
    errors.push('VITE_IMAGE_CACHE_DURATION must be a positive number');
  }
  
  return errors;
};

/**
 * Log environment configuration (development only)
 */
export const logEnvironment = (): void => {
  if (!isDevelopment) return;
  
  console.group('🔧 Environment Configuration');
  console.log('API Base URL:', env.apiBaseUrl);
  console.log('Image Service:', env.imageService);
  console.log('Features:', env.features);
  console.log('Development:', env.development);
  console.groupEnd();
  
  const errors = validateEnvironment();
  if (errors.length > 0) {
    console.group('⚠️ Environment Validation Errors');
    errors.forEach(error => console.error(error));
    console.groupEnd();
  }
};

/**
 * Feature flag helpers
 */
export const isFeatureEnabled = (feature: keyof AppEnvironment['features']): boolean => {
  return env.features[feature];
};

/**
 * Image service helpers
 */
export const getMaxUploadSize = (): number => {
  return env.imageService.uploadMaxSize;
};

export const getUploadQuality = (): number => {
  return env.imageService.uploadQuality;
};

export const getCacheDuration = (): number => {
  return env.imageService.cacheDuration;
};

export const isImageServiceEnabled = (): boolean => {
  return env.imageService.enabled;
};

export const isImageCacheEnabled = (): boolean => {
  return env.imageService.cacheEnabled;
};

/**
 * Development helpers
 */
export const shouldDebugApiRequests = (): boolean => {
  return env.development.debugApiRequests;
};

export const shouldDebugImageCache = (): boolean => {
  return env.development.debugImageCache;
};