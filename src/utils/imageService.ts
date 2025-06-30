/**
 * Image service utilities for Cloudflare R2 integration
 * Handles presigned URLs, caching, and image operations
 */

export interface ImageMetadata {
  id: string;
  r2_bucket: string;
  r2_object_key: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  content_type_enum: 'user_profile' | 'question' | 'answer' | 'event';
  content_id: string;
  uploaded_by: string;
  cache_version: string;
  is_active: boolean;
  alt_text?: string;
  created_at: string;
  updated_at: string;
}

export interface PresignedUrlResponse {
  image_id: string;
  presigned_url: string;
  expires_at: string;
  cache_version: string;
}

export interface ImageUploadResponse {
  image: ImageMetadata;
  upload_success: boolean;
  message: string;
}

// Cache management utilities
export class ImageCache {
  private static readonly CACHE_PREFIX = 'image_cache_';
  private static readonly PRESIGNED_PREFIX = 'presigned_url_';

  static getCacheKey(imageId: string, cacheVersion?: string): string {
    return `${this.CACHE_PREFIX}${imageId}${cacheVersion ? `_${cacheVersion}` : ''}`;
  }

  static getPresignedCacheKey(imageId: string): string {
    return `${this.PRESIGNED_PREFIX}${imageId}`;
  }

  static set(imageId: string, data: PresignedUrlResponse): void {
    try {
      const cacheKey = this.getPresignedCacheKey(imageId);
      const cacheData = {
        ...data,
        cachedAt: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache image data:', error);
    }
  }

  static get(imageId: string): PresignedUrlResponse | null {
    try {
      const cacheKey = this.getPresignedCacheKey(imageId);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();

      // Check if URL has expired (with 5 minute buffer)
      if (now >= expiresAt - 300000) {
        this.remove(imageId);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to retrieve cached image data:', error);
      return null;
    }
  }

  static remove(imageId: string): void {
    try {
      const cacheKey = this.getPresignedCacheKey(imageId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove cached image data:', error);
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX) || key.startsWith(this.PRESIGNED_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }

  static getStats(): {
    totalItems: number;
    expiredCount: number;
    totalSizeBytes: number;
  } {
    const keys = Object.keys(localStorage);
    const imageKeys = keys.filter(key => 
      key.startsWith(this.CACHE_PREFIX) || key.startsWith(this.PRESIGNED_PREFIX)
    );

    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();

    imageKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
          const data = JSON.parse(item);
          if (data.expires_at && new Date(data.expires_at).getTime() < now) {
            expiredCount++;
          }
        }
      } catch (e) {
        expiredCount++;
      }
    });

    return {
      totalItems: imageKeys.length,
      expiredCount,
      totalSizeBytes: totalSize
    };
  }

  static cleanExpired(): number {
    const keys = Object.keys(localStorage);
    const imageKeys = keys.filter(key => 
      key.startsWith(this.CACHE_PREFIX) || key.startsWith(this.PRESIGNED_PREFIX)
    );
    const now = Date.now();
    let cleanedCount = 0;

    imageKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.expires_at && new Date(data.expires_at).getTime() < now) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (e) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }
}

// Image validation utilities
export class ImageValidator {
  static readonly SUPPORTED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static readonly MIN_FILE_SIZE = 1024; // 1KB

  static validateFileType(file: File): boolean {
    return this.SUPPORTED_TYPES.includes(file.type);
  }

  static validateFileSize(file: File): boolean {
    return file.size >= this.MIN_FILE_SIZE && file.size <= this.MAX_FILE_SIZE;
  }

  static getFileTypeError(file: File): string | null {
    if (!this.validateFileType(file)) {
      return `Unsupported file type: ${file.type}. Supported types: ${this.SUPPORTED_TYPES.join(', ')}`;
    }
    return null;
  }

  static getFileSizeError(file: File): string | null {
    if (file.size < this.MIN_FILE_SIZE) {
      return 'File is too small. Minimum size is 1KB.';
    }
    if (file.size > this.MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return `File is too large: ${sizeMB}MB. Maximum size is ${maxMB}MB.`;
    }
    return null;
  }

  static validateFile(file: File): string[] {
    const errors: string[] = [];
    
    const typeError = this.getFileTypeError(file);
    if (typeError) errors.push(typeError);
    
    const sizeError = this.getFileSizeError(file);
    if (sizeError) errors.push(sizeError);
    
    return errors;
  }
}

// Cache invalidation utilities
export class ImageCacheManager {
  static invalidateImage(imageId: string, newCacheVersion?: string): void {
    // Remove from localStorage
    ImageCache.remove(imageId);
    
    // Dispatch event for components to react
    const event = new CustomEvent('image-cache-invalidate', {
      detail: { imageId, cacheVersion: newCacheVersion }
    });
    window.dispatchEvent(event);
  }

  static invalidateContent(contentType: string, contentId: string): void {
    // Dispatch event for bulk invalidation
    const event = new CustomEvent('content-cache-invalidate', {
      detail: { contentType, contentId }
    });
    window.dispatchEvent(event);
  }

  static clearAll(): void {
    ImageCache.clear();
    
    const event = new CustomEvent('image-cache-clear-all');
    window.dispatchEvent(event);
  }
}

// URL utilities
export class ImageUrlUtils {
  /**
   * Get optimized image URL with query parameters
   */
  static getOptimizedUrl(
    presignedUrl: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    }
  ): string {
    if (!options) return presignedUrl;

    try {
      const url = new URL(presignedUrl);
      
      if (options.width) url.searchParams.set('w', options.width.toString());
      if (options.height) url.searchParams.set('h', options.height.toString());
      if (options.quality) url.searchParams.set('q', options.quality.toString());
      if (options.format) url.searchParams.set('f', options.format);
      
      return url.toString();
    } catch (error) {
      console.warn('Failed to optimize image URL:', error);
      return presignedUrl;
    }
  }

  /**
   * Preload an image in the browser
   */
  static preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
      img.src = src;
    });
  }

  /**
   * Get fallback image URL based on content type
   */
  static getFallbackUrl(contentType?: string): string {
    switch (contentType) {
      case 'user_profile':
        return '/placeholder-avatar.svg';
      case 'event':
        return '/placeholder-event.svg';
      case 'question':
      case 'answer':
        return '/placeholder-content.svg';
      default:
        return '/placeholder-image.svg';
    }
  }
}

// Error handling
export class ImageError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'ImageError';
  }
}

export class ImageUploadError extends ImageError {
  constructor(message: string, public file?: File) {
    super(message, 'UPLOAD_ERROR');
    this.name = 'ImageUploadError';
  }
}

export class ImageNotFoundError extends ImageError {
  constructor(imageId: string) {
    super(`Image not found: ${imageId}`, 'NOT_FOUND');
    this.name = 'ImageNotFoundError';
  }
}

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

export const isImageContentType = (contentType: string): boolean => {
  return contentType.startsWith('image/');
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf('.'));
};

export const generateImageId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};