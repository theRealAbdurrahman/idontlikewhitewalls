import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized cache invalidation utility
 * Reduces boilerplate and ensures consistent cache management across the app
 */

export interface CacheInvalidationOptions {
  /** Specific question ID to invalidate interactions for */
  questionId?: string;
  /** Specific event ID to invalidate data for */
  eventId?: string;
  /** Specific user ID to invalidate data for */
  userId?: string;
  /** Whether to force refetch immediately (default: false) */
  exact?: boolean;
}

/**
 * Cache invalidation utility class
 */
export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate all question-related caches
   * Use after: creating, updating, or deleting questions
   */
  invalidateQuestions(options: CacheInvalidationOptions = {}) {
    this.queryClient.invalidateQueries({ 
      queryKey: ['questions'],
      exact: options.exact
    });
    
    // Also invalidate specific question if provided
    if (options.questionId) {
      this.queryClient.invalidateQueries({ 
        queryKey: ['questions', options.questionId],
        exact: options.exact 
      });
    }
  }

  /**
   * Invalidate all interaction-related caches
   * Use after: creating, updating, or deleting interactions (upvote, me too, bookmark, etc.)
   */
  invalidateInteractions(options: CacheInvalidationOptions = {}) {
    this.queryClient.invalidateQueries({ 
      queryKey: ['interactions'],
      exact: options.exact 
    });
    
    // Invalidate specific question interactions if provided
    if (options.questionId) {
      this.queryClient.invalidateQueries({ 
        queryKey: ['interactions', { target_id: options.questionId }],
        exact: options.exact 
      });
    }
    
    // Invalidate specific user interactions if provided
    if (options.userId) {
      this.queryClient.invalidateQueries({ 
        queryKey: ['interactions', { user_id: options.userId }],
        exact: options.exact 
      });
    }
  }

  /**
   * Invalidate all event-related caches
   * Use after: creating, updating, or deleting events
   */
  invalidateEvents(options: CacheInvalidationOptions = {}) {
    this.queryClient.invalidateQueries({ 
      queryKey: ['events'],
      exact: options.exact 
    });
    
    // Also invalidate specific event if provided
    if (options.eventId) {
      this.queryClient.invalidateQueries({ 
        queryKey: ['events', options.eventId],
        exact: options.exact 
      });
    }
  }

  /**
   * Invalidate all user-related caches
   * Use after: updating user profiles, user data changes
   */
  invalidateUsers(options: CacheInvalidationOptions = {}) {
    this.queryClient.invalidateQueries({ 
      queryKey: ['users'],
      exact: options.exact 
    });
    
    // Also invalidate specific user if provided
    if (options.userId) {
      this.queryClient.invalidateQueries({ 
        queryKey: ['users', options.userId],
        exact: options.exact 
      });
    }
  }

  /**
   * Comprehensive invalidation after question interactions
   * Use after: upvote, me too, bookmark, can help interactions
   */
  invalidateQuestionInteractions(questionId: string, options: CacheInvalidationOptions = {}) {
    this.invalidateQuestions({ ...options, questionId });
    this.invalidateInteractions({ ...options, questionId });
  }

  /**
   * Comprehensive invalidation after question creation/editing
   * Use after: creating new questions, editing questions
   */
  invalidateQuestionData(questionId?: string, options: CacheInvalidationOptions = {}) {
    this.invalidateQuestions({ ...options, questionId });
    this.invalidateInteractions(options);
    
    // If it's an event-specific question, also invalidate events
    if (options.eventId) {
      this.invalidateEvents({ ...options, eventId: options.eventId });
    }
  }

  /**
   * Complete cache refresh - use sparingly
   * Use after: major data changes, user login/logout
   */
  invalidateAll(options: CacheInvalidationOptions = {}) {
    this.invalidateQuestions(options);
    this.invalidateInteractions(options);
    this.invalidateEvents(options);
    this.invalidateUsers(options);
  }
}

/**
 * Hook to get cache manager instance
 * Usage: const cache = useCacheManager();
 */
export const createCacheManager = (queryClient: QueryClient): CacheManager => {
  return new CacheManager(queryClient);
};

/**
 * Direct utility functions for common patterns
 * Use these for simple one-off invalidations
 */
export const cacheUtils = {
  /**
   * Quick invalidation after interaction (upvote, me too, bookmark)
   */
  afterInteraction: (queryClient: QueryClient, questionId: string) => {
    const cache = createCacheManager(queryClient);
    cache.invalidateQuestionInteractions(questionId);
  },

  /**
   * Quick invalidation after question creation
   */
  afterQuestionCreate: (queryClient: QueryClient, eventId?: string) => {
    const cache = createCacheManager(queryClient);
    cache.invalidateQuestionData(undefined, { eventId });
  },

  /**
   * Quick invalidation after user profile update
   */
  afterUserUpdate: (queryClient: QueryClient, userId: string) => {
    const cache = createCacheManager(queryClient);
    cache.invalidateUsers({ userId });
    cache.invalidateQuestions(); // User data might show in questions
  },

  /**
   * Quick invalidation after event changes
   */
  afterEventUpdate: (queryClient: QueryClient, eventId: string) => {
    const cache = createCacheManager(queryClient);
    cache.invalidateEvents({ eventId });
    cache.invalidateQuestions(); // Event data might show in questions
  },
};

/**
 * Typed invalidation presets for common scenarios
 */
export const CachePresets = {
  /** After creating an interaction (upvote, me too, bookmark) */
  INTERACTION_CREATED: 'interaction_created',
  /** After creating a new question */
  QUESTION_CREATED: 'question_created',
  /** After updating a question */
  QUESTION_UPDATED: 'question_updated',
  /** After creating an event */
  EVENT_CREATED: 'event_created',
  /** After updating user profile */
  USER_UPDATED: 'user_updated',
  /** After major data changes */
  FULL_REFRESH: 'full_refresh',
} as const;

export type CachePreset = typeof CachePresets[keyof typeof CachePresets];