import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook to enhance questions with real user data
 * Currently uses the logged-in user's data for all questions as a temporary solution
 * TODO: Replace with actual user lookup API calls when backend supports user joins
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
      
      // For other users' questions, we need to either:
      // 1. Keep the current fallback behavior
      // 2. Or implement a user lookup mechanism
      // For now, keeping fallback but making it more obvious it's a placeholder
      return {
        ...question,
        authorName: question.is_anonymous ? "Anonymous" : "Question Author",
        authorAvatar: question.is_anonymous ? undefined : "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      };
    });
  }, [questions, currentUser]);
};

/**
 * Enhanced version that will be used when backend supports user lookups
 * TODO: Implement when backend API includes user data in question responses
 */
export const useQuestionUserDataWithLookup = (questions: any[]) => {
  const { user: currentUser } = useAuthStore();
  
  // TODO: Add user lookup API calls here
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
      
      // TODO: Look up user data from usersData based on question.authorId
      // const questionUser = usersData?.find(u => u.id === question.authorId);
      
      return {
        ...question,
        authorName: question.is_anonymous ? "Anonymous" : "Question Author",
        authorAvatar: question.is_anonymous ? undefined : "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      };
    });
  }, [questions, currentUser]);
};