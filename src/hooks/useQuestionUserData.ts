import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook to enhance questions with real user data
 * Uses the logged-in user's data for their own questions and fallback for others
 * Note: Backend now supports user lookups - ready for full user data integration
 */
export const useQuestionUserData = (questions: any[]) => {
  const { user: currentUser } = useAuthStore();

  return useMemo(() => {
    if (!questions) return [];

    return questions.map((question) => {
      // For now, if the question belongs to the current user, show their real data
      // Otherwise, show fallback data
      const isOwnQuestion = currentUser && question.authorId === currentUser.id;
      
      if (isOwnQuestion && currentUser) {
        return {
          ...question,
          authorName: question.is_anonymous ? "Anonymous" : currentUser.name,
          authorAvatar: question.is_anonymous ? undefined : (currentUser.avatar || currentUser.picture || currentUser.profile_picture),
        };
      }
      
      // For other users' questions, using fallback behavior
      // Backend now supports user lookups - can be enhanced to fetch real user data
      return {
        ...question,
        authorName: question.is_anonymous ? "Anonymous" : "Question Author",
        authorAvatar: question.is_anonymous ? undefined : "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      };
    });
  }, [questions, currentUser]);
};

/**
 * Enhanced version with full user lookup capability
 * Backend now supports user lookups - ready for implementation
 * Can be used when we want to fetch real user data for all question authors
 */
export const useQuestionUserDataWithLookup = (questions: any[]) => {
  const { user: currentUser } = useAuthStore();
  
  // Ready to implement: Add user lookup API calls here
  // const { data: usersData } = useReadUsersApiV1UsersGet(userIds);
  
  return useMemo(() => {
    if (!questions) return [];

    return questions.map((question) => {
      const isOwnQuestion = currentUser && question.authorId === currentUser.id;
      
      if (isOwnQuestion && currentUser) {
        return {
          ...question,
          authorName: question.is_anonymous ? "Anonymous" : currentUser.name,
          authorAvatar: question.is_anonymous ? undefined : (currentUser.avatar || currentUser.picture || currentUser.profile_picture),
        };
      }
      
      // Ready to implement: Look up user data from usersData based on question.authorId
      // const questionUser = usersData?.find(u => u.id === question.authorId);
      
      return {
        ...question,
        authorName: question.is_anonymous ? "Anonymous" : "Question Author",
        authorAvatar: question.is_anonymous ? undefined : "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      };
    });
  }, [questions, currentUser]);
};