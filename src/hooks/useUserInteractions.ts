import { useMemo } from 'react';
import { useReadInteractionsApiV1InteractionsGet } from '../api-client/api-client';
import { InteractionRead, InteractionType } from '../api-client/models';
import { useAuth } from '../providers';

/**
 * Interface for user interaction lookup
 */
export interface UserInteractionLookup {
  /** Map of target_id -> interaction_type -> interaction_id */
  interactions: Map<string, Map<string, string>>;
  /** Check if user has specific interaction on target */
  hasInteraction: (targetId: string, interactionType: InteractionType) => boolean;
  /** Get interaction ID for deletion */
  getInteractionId: (targetId: string, interactionType: InteractionType) => string | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: any;
}

/**
 * Custom hook to manage user interactions with lookup capabilities
 * Provides efficient access to user's interactions for toggle functionality
 */
export const useUserInteractions = (): UserInteractionLookup => {
  const { user } = useAuth();
  
  // Fetch all interactions - will be filtered client-side due to API limitations
  const { 
    data: interactionsResponse, 
    isLoading, 
    error 
  } = useReadInteractionsApiV1InteractionsGet({
    limit: 1000 // Get a large number to avoid pagination issues
  });

  // Process interactions into efficient lookup structure
  const interactionLookup = useMemo(() => {
    if (!user || !interactionsResponse?.data?.data) {
      return new Map<string, Map<string, string>>();
    }

    // Handle both API response formats (direct array or nested data)
    const interactions: InteractionRead[] = Array.isArray(interactionsResponse.data) 
      ? interactionsResponse.data 
      : interactionsResponse.data.data || [];

    // Filter to current user's interactions only
    const userInteractions = interactions.filter(
      interaction => interaction.user_id === user.id
    );

    // Build nested lookup map: target_id -> interaction_type -> interaction_id
    const lookup = new Map<string, Map<string, string>>();

    userInteractions.forEach(interaction => {
      const { target_id, interaction_type, id } = interaction;
      
      if (!lookup.has(target_id)) {
        lookup.set(target_id, new Map<string, string>());
      }
      
      lookup.get(target_id)!.set(interaction_type, id);
    });

    return lookup;
  }, [user, interactionsResponse?.data]);

  // Helper functions for easy interaction checking
  const hasInteraction = (targetId: string, interactionType: InteractionType): boolean => {
    return interactionLookup.get(targetId)?.has(interactionType) ?? false;
  };

  const getInteractionId = (targetId: string, interactionType: InteractionType): string | undefined => {
    return interactionLookup.get(targetId)?.get(interactionType);
  };

  return {
    interactions: interactionLookup,
    hasInteraction,
    getInteractionId,
    isLoading,
    error
  };
};

/**
 * Helper hook specifically for question interactions
 * Provides question-specific interaction utilities
 */
export const useQuestionInteractions = (questionId: string) => {
  const { hasInteraction, getInteractionId, isLoading, error } = useUserInteractions();

  return {
    // Interaction state checks
    isUpvoted: hasInteraction(questionId, InteractionType.uplift),
    isMeToo: hasInteraction(questionId, InteractionType.me_too),
    isBookmarked: hasInteraction(questionId, InteractionType.bookmark),
    canHelp: hasInteraction(questionId, InteractionType.i_can_help),
    
    // Interaction ID getters for deletion
    upvoteId: getInteractionId(questionId, InteractionType.uplift),
    meTooId: getInteractionId(questionId, InteractionType.me_too),
    bookmarkId: getInteractionId(questionId, InteractionType.bookmark),
    canHelpId: getInteractionId(questionId, InteractionType.i_can_help),
    
    // Loading/error states
    isLoading,
    error
  };
};