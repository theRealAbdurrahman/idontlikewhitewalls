import { useQueryClient } from '@tanstack/react-query';
import { createCacheManager, cacheUtils, CacheManager } from '../utils/cacheInvalidation';

/**
 * Hook to get cache manager instance with utilities
 * Provides both the full CacheManager class and quick utility functions
 */
export const useCacheManager = () => {
  const queryClient = useQueryClient();
  const cacheManager = createCacheManager(queryClient);

  return {
    // Full cache manager for complex invalidations
    cache: cacheManager,
    
    // Quick utility functions for common patterns
    afterInteraction: (questionId: string) => 
      cacheUtils.afterInteraction(queryClient, questionId),
    
    afterQuestionCreate: (eventId?: string) => 
      cacheUtils.afterQuestionCreate(queryClient, eventId),
    
    afterUserUpdate: (userId: string) => 
      cacheUtils.afterUserUpdate(queryClient, userId),
    
    afterEventUpdate: (eventId: string) => 
      cacheUtils.afterEventUpdate(queryClient, eventId),
    
    afterEventCreate: (eventId?: string) => 
      cacheUtils.afterEventCreate(queryClient, eventId),
  };
};