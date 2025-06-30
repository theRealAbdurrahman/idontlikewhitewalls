/**
 * Image management hooks for Cloudflare R2 integration
 * Provides caching, presigned URL management, and image operations
 */

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../config/api';
import { 
  ImageCache, 
  ImageCacheManager, 
  ImageValidator,
  ImageUploadError,
  type PresignedUrlResponse,
  type ImageMetadata
} from '../utils/imageService';

export interface UseImageManagerOptions {
  imageId?: string;
  contentType?: 'user_profile' | 'question' | 'answer' | 'event';
  contentIds?: string[];
  expiresIn?: number;
  autoCache?: boolean;
}

/**
 * Hook for managing individual image operations
 */
export const useImageManager = (options: UseImageManagerOptions = {}) => {
  const queryClient = useQueryClient();
  const [cacheStats, setCacheStats] = useState(ImageCache.getStats());

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => setCacheStats(ImageCache.getStats());
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle cache invalidation events
  useEffect(() => {
    const handleImageInvalidation = (event: CustomEvent) => {
      const { imageId, cacheVersion } = event.detail;
      
      // Invalidate React Query cache
      queryClient.invalidateQueries({ 
        queryKey: ['presigned-url', imageId] 
      });
      
      console.log(`Cache invalidated for image ${imageId}, version ${cacheVersion}`);
    };

    const handleContentInvalidation = (event: CustomEvent) => {
      const { contentType, contentId } = event.detail;
      
      // Invalidate React Query cache for bulk operations
      queryClient.invalidateQueries({ 
        queryKey: ['images-content', contentType] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['bulk-presigned-urls', contentType] 
      });
      
      console.log(`Content cache invalidated for ${contentType} ${contentId}`);
    };

    const handleClearAll = () => {
      queryClient.invalidateQueries({ 
        queryKey: ['presigned-url'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['images-content'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['bulk-presigned-urls'] 
      });
      
      setCacheStats(ImageCache.getStats());
      console.log('All image cache cleared');
    };

    window.addEventListener('image-cache-invalidate', handleImageInvalidation as EventListener);
    window.addEventListener('content-cache-invalidate', handleContentInvalidation as EventListener);
    window.addEventListener('image-cache-clear-all', handleClearAll as EventListener);

    return () => {
      window.removeEventListener('image-cache-invalidate', handleImageInvalidation as EventListener);
      window.removeEventListener('content-cache-invalidate', handleContentInvalidation as EventListener);
      window.removeEventListener('image-cache-clear-all', handleClearAll as EventListener);
    };
  }, [queryClient]);

  // Auto-cleanup expired cache entries
  useEffect(() => {
    const cleanup = () => {
      const cleaned = ImageCache.cleanExpired();
      if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} expired cache entries`);
        setCacheStats(ImageCache.getStats());
      }
    };

    // Clean on mount
    cleanup();

    // Set up periodic cleanup (every 5 minutes)
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Cache management functions
  const invalidateImage = useCallback((imageId: string, newCacheVersion?: string) => {
    ImageCacheManager.invalidateImage(imageId, newCacheVersion);
    setCacheStats(ImageCache.getStats());
  }, []);

  const invalidateContent = useCallback((contentType: string, contentId: string) => {
    ImageCacheManager.invalidateContent(contentType, contentId);
  }, []);

  const clearAllCache = useCallback(() => {
    ImageCacheManager.clearAll();
    setCacheStats(ImageCache.getStats());
  }, []);

  const getCachedUrl = useCallback((imageId: string): PresignedUrlResponse | null => {
    return ImageCache.get(imageId);
  }, []);

  const preloadImages = useCallback(async (imageIds: string[]) => {
    try {
      await Promise.all(
        imageIds.map(imageId =>
          queryClient.prefetchQuery({
            queryKey: ['presigned-url', imageId],
            staleTime: 1000 * 60 * 50 // 50 minutes
          })
        )
      );
    } catch (error) {
      console.warn('Failed to preload some images:', error);
    }
  }, [queryClient]);

  return {
    // Cache management
    invalidateImage,
    invalidateContent,
    clearAllCache,
    getCachedUrl,
    preloadImages,
    
    // Cache statistics
    cacheStats,
    
    // Utility functions
    cleanExpired: () => {
      const cleaned = ImageCache.cleanExpired();
      setCacheStats(ImageCache.getStats());
      return cleaned;
    }
  };
};

/**
 * Hook for getting presigned URL for a single image
 */
export const usePresignedUrl = (
  imageId: string | undefined,
  options: { expiresIn?: number; enabled?: boolean } = {}
) => {
  const { expiresIn = 3600, enabled = true } = options;
  
  // Check cache first
  const cachedData = imageId ? ImageCache.get(imageId) : null;
  
  return useQuery({
    queryKey: ['presigned-url', imageId, expiresIn],
    queryFn: async () => {
      if (!imageId) throw new Error('Image ID is required');
      
      // Use axiosInstance following the same pattern as other API calls
      // This matches what the generated API client will produce
      const response = await axiosInstance.post('/api/v1/images/presigned-urls', {
        image_ids: [imageId],
        expires_in: expiresIn
      });
      
      const urlData = response.data[0];
      
      // Cache the result
      if (urlData) {
        ImageCache.set(imageId, urlData);
      }
      
      return urlData;
    },
    enabled: enabled && !!imageId && !cachedData,
    staleTime: 1000 * 60 * 50, // 50 minutes
    retry: 2,
    initialData: cachedData || undefined
  });
};

/**
 * Hook for getting bulk presigned URLs
 */
export const useBulkPresignedUrls = (
  contentType: 'user_profile' | 'question' | 'answer' | 'event' | undefined,
  contentIds: string[],
  options: { expiresIn?: number; enabled?: boolean } = {}
) => {
  const { expiresIn = 3600, enabled = true } = options;
  
  return useQuery({
    queryKey: ['bulk-presigned-urls', contentType, contentIds, expiresIn],
    queryFn: async () => {
      if (!contentType || !contentIds.length) {
        throw new Error('Content type and content IDs are required');
      }
      
      // Use axiosInstance following the same pattern as other API calls
      const response = await axiosInstance.post('/api/v1/images/presigned-urls/bulk', {
        content_type: contentType,
        content_ids: contentIds,
        expires_in: expiresIn
      });
      
      const data = response.data;
      
      // Cache individual URLs
      data.urls?.forEach((urlData: PresignedUrlResponse) => {
        ImageCache.set(urlData.image_id, urlData);
      });
      
      return data;
    },
    enabled: enabled && !!contentType && contentIds.length > 0,
    staleTime: 1000 * 60 * 50, // 50 minutes
    retry: 2
  });
};

/**
 * Hook for image upload with validation and progress tracking
 */
export const useImageUpload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      file,
      contentType,
      contentId,
      altText
    }: {
      file: File;
      contentType: 'user_profile' | 'question' | 'answer' | 'event';
      contentId: string;
      altText?: string;
    }) => {
      // Validate file
      const validationErrors = ImageValidator.validateFile(file);
      if (validationErrors.length > 0) {
        throw new ImageUploadError(validationErrors.join(', '), file);
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content_type', contentType);
      formData.append('content_id', contentId);
      if (altText) {
        formData.append('alt_text', altText);
      }
      
      // Use axiosInstance following the same pattern as other API calls
      // Note: FormData automatically sets Content-Type header for multipart/form-data
      const response = await axiosInstance.post('/api/v1/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['images-content', variables.contentType]
      });
      
      console.log('Image uploaded successfully:', data.image.id);
    },
    onError: (error) => {
      console.error('Image upload failed:', error);
    }
  });
};

/**
 * Hook for getting images for content
 */
export const useContentImages = (
  contentType: 'user_profile' | 'question' | 'answer' | 'event' | undefined,
  contentId: string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: ['images-content', contentType, contentId],
    queryFn: async () => {
      if (!contentType || !contentId) {
        throw new Error('Content type and content ID are required');
      }
      
      // Use axiosInstance following the same pattern as other API calls
      const response = await axiosInstance.get(`/api/v1/images/content/${contentType}/${contentId}`);
      
      return response.data;
    },
    enabled: enabled && !!contentType && !!contentId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

/**
 * Hook for deleting images
 */
export const useImageDelete = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (imageId: string) => {
      // Use axiosInstance following the same pattern as other API calls
      const response = await axiosInstance.delete(`/api/v1/images/${imageId}`);
      
      return response.data;
    },
    onSuccess: (data, imageId) => {
      // Remove from cache
      ImageCache.remove(imageId);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['images-content']
      });
      
      console.log('Image deleted successfully:', imageId);
    },
    onError: (error) => {
      console.error('Image deletion failed:', error);
    }
  });
};

/**
 * Hook for cache invalidation
 */
export const useImageCacheInvalidation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (imageId: string) => {
      // Use axiosInstance following the same pattern as other API calls
      const response = await axiosInstance.post(`/api/v1/images/${imageId}/invalidate-cache`);
      
      return response.data;
    },
    onSuccess: (data, imageId) => {
      // Invalidate local cache
      ImageCacheManager.invalidateImage(imageId, data.new_cache_version);
      
      console.log('Cache invalidated successfully:', imageId);
    },
    onError: (error) => {
      console.error('Cache invalidation failed:', error);
    }
  });
};