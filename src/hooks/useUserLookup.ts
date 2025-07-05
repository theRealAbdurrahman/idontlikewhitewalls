import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchUserProfile, UserProfile } from '../api-client/api-client';

/**
 * Hook to fetch a single user profile by ID
 * @param userId - The user ID to fetch
 * @param enabled - Whether the query should run (defaults to true if userId exists)
 */
export const useUserProfile = (userId: string | undefined, enabled?: boolean) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: enabled !== undefined ? enabled : !!userId,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (user not found) or 403 (access denied)
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch multiple user profiles by their IDs
 * Efficiently batches requests and handles caching
 * @param userIds - Array of user IDs to fetch
 */
export const useUserProfiles = (userIds: string[]) => {
  // Remove duplicates and filter out empty strings
  const uniqueUserIds = Array.from(new Set(userIds.filter(id => id && id.trim() !== '')));

  const queries = useQueries({
    queries: uniqueUserIds.map(userId => ({
      queryKey: ['user-profile', userId],
      queryFn: () => fetchUserProfile(userId),
      staleTime: 0, // Always consider data stale
      gcTime: 0, // Don't cache
      retry: (failureCount: number, error: any) => {
        // Don't retry on 404 (user not found) or 403 (access denied)
        if (error?.response?.status === 404 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
    })),
  });

  // Transform results into a lookup map for easy access
  const userLookup: Record<string, UserProfile | undefined> = {};
  const errors: Record<string, Error> = {};
  let isLoading = false;
  let hasErrors = false;

  uniqueUserIds.forEach((userId, index) => {
    const query = queries[index];
    if (query.isLoading) {
      isLoading = true;
    }
    if (query.error) {
      hasErrors = true;
      errors[userId] = query.error as Error;
    }
    if (query.data) {
      userLookup[userId] = query.data;
    }
  });

  return {
    /**
     * Lookup map: userId -> UserProfile
     * Returns undefined if user not found or still loading
     */
    users: userLookup,
    
    /**
     * Get user profile by ID with fallback
     * @param userId - The user ID to lookup
     * @returns UserProfile or null if not found
     */
    getUser: (userId: string): UserProfile | null => {
      return userLookup[userId] || null;
    },
    
    /**
     * Get display name for a user
     * @param userId - The user ID to lookup
     * @returns Formatted display name or fallback
     */
    getUserDisplayName: (userId: string): string => {
      const user = userLookup[userId];
      if (!user) return 'Unknown User';
      
      const firstName = user.first_name?.trim() || '';
      const lastName = user.last_name?.trim() || '';
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName) {
        return firstName;
      } else if (lastName) {
        return lastName;
      } else {
        return 'Unknown User';
      }
    },
    
    /**
     * Get profile picture URL for a user
     * @param userId - The user ID to lookup  
     * @returns Profile picture URL or null
     */
    getUserAvatar: (userId: string): string | null => {
      const user = userLookup[userId];
      return user?.profile_picture || null;
    },
    
    /**
     * Overall loading state - true if any user is loading
     */
    isLoading,
    
    /**
     * Whether any requests have errors (excluding 404s which are expected)
     */
    hasErrors,
    
    /**
     * Error lookup map: userId -> Error
     */
    errors,
  };
};

/**
 * Utility hook for fetching user data for questions
 * Handles anonymous users and provides formatted display data
 */
export const useQuestionUserLookup = (questions: Array<{ id: string; user_id: string; is_anonymous?: boolean }>) => {
  // Extract non-anonymous user IDs
  const userIds = questions
    .filter(q => !q.is_anonymous && q.user_id)
    .map(q => q.user_id);

  const { users, getUserDisplayName, getUserAvatar, isLoading, hasErrors } = useUserProfiles(userIds);

  /**
   * Get user data for a specific question
   */
  const getQuestionUserData = (question: { id: string; user_id: string; is_anonymous?: boolean }) => {
    if (question.is_anonymous) {
      return {
        displayName: 'Anonymous',
        avatarUrl: null,
        isAnonymous: true,
      };
    }

    return {
      displayName: getUserDisplayName(question.user_id),
      avatarUrl: getUserAvatar(question.user_id),
      isAnonymous: false,
    };
  };

  return {
    getQuestionUserData,
    isLoading,
    hasErrors,
    users,
  };
};