import { useMemo, useCallback } from 'react';
import { useReadInteractionsApiV1InteractionsGet } from '../api-client/api-client';
import { InteractionRead, InteractionType } from '../api-client/models';

/**
 * Interface for interaction counts
 */
export interface InteractionCounts {
    /** Total uplifts (upvotes) for this target */
    upvotes: number;
    /** Total "me too" interactions for this target */
    meTooCount: number;
    /** Total "I can help" interactions for this target */
    canHelpCount: number;
    /** Total bookmarks for this target */
    bookmarkCount: number;
    /** Total views for this target */
    viewCount: number;
}

/**
 * Interface for all interaction counts across all targets
 */
export interface AllInteractionCounts {
    /** Map of target_id -> interaction counts */
    counts: Map<string, InteractionCounts>;
    /** Get counts for a specific target */
    getCountsForTarget: (targetId: string) => InteractionCounts;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: any;
}

/**
 * Interface for user interaction statistics
 */
export interface UserInteractionStats {
    /** Number of questions this user has upvoted */
    upvotesGiven: number;
    /** Number of "me too" interactions this user has made */
    meTooGiven: number;
    /** Number of "I can help" interactions this user has made */
    canHelpGiven: number;
    /** Number of bookmarks this user has made */
    bookmarksGiven: number;
    /** Number of upvotes this user has received (across all their content) */
    upvotesReceived: number;
    /** Number of "me too" interactions this user has received */
    meTooReceived: number;
    /** Number of "I can help" interactions this user has received */
    canHelpReceived: number;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: any;
}

/**
 * Hook to calculate interaction counts from the interactions API
 * Provides aggregated counts for all targets (questions, events, etc.)
 */
export const useInteractionCounts = (): AllInteractionCounts => {
    // Fetch all interactions - will be aggregated client-side
    const {
        data: interactionsResponse,
        isLoading,
        error
    } = useReadInteractionsApiV1InteractionsGet({
        limit: 10000 // Get a large number to avoid pagination issues
    });

    // Process interactions into counts lookup
    const countsLookup = useMemo(() => {
        if (!interactionsResponse?.data?.data) {
            return new Map<string, InteractionCounts>();
        }

        // Handle both API response formats (direct array or nested data)
        const interactions: InteractionRead[] = Array.isArray(interactionsResponse.data)
            ? interactionsResponse.data
            : interactionsResponse.data.data || [];

        // Build counts map: target_id -> counts
        const countsMap = new Map<string, InteractionCounts>();

        interactions.forEach(interaction => {
            const { target_id, interaction_type } = interaction;

            if (!countsMap.has(target_id)) {
                countsMap.set(target_id, {
                    upvotes: 0,
                    meTooCount: 0,
                    canHelpCount: 0,
                    bookmarkCount: 0,
                    viewCount: 0,
                });
            }

            const counts = countsMap.get(target_id)!;

            // Increment the appropriate counter
            switch (interaction_type) {
                case InteractionType.uplift:
                    counts.upvotes++;
                    break;
                case InteractionType.me_too:
                    counts.meTooCount++;
                    break;
                case InteractionType.i_can_help:
                    counts.canHelpCount++;
                    break;
                case InteractionType.bookmark:
                    counts.bookmarkCount++;
                    break;
                case InteractionType.view:
                    counts.viewCount++;
                    break;
            }
        });

        return countsMap;
    }, [interactionsResponse?.data]);

    // Helper function to get counts for a specific target
    const getCountsForTarget = useCallback((targetId: string): InteractionCounts => {
        return countsLookup.get(targetId) || {
            upvotes: 0,
            meTooCount: 0,
            canHelpCount: 0,
            bookmarkCount: 0,
            viewCount: 0,
        };
    }, [countsLookup]);

    return {
        counts: countsLookup,
        getCountsForTarget,
        isLoading,
        error
    };
};

// function that returns randowm whole number from 5 to 16 


/**
 * Hook to get interaction counts for a specific question
 * Provides question-specific interaction counts
 */
export const useQuestionCounts = (questionId: string): InteractionCounts & { isLoading: boolean; error: any } => {
    const { getCountsForTarget, isLoading, error } = useInteractionCounts();

    const counts = useMemo(() => {
        return getCountsForTarget(questionId);
    }, [getCountsForTarget, questionId]);

    return {
        ...counts,
        isLoading,
        error
    };
};

/**
 * Hook to get interaction counts for multiple questions
 * Efficiently provides counts for multiple targets
 */
export const useMultipleQuestionCounts = (questionIds: string[]) => {
    const { getCountsForTarget, isLoading, error } = useInteractionCounts();

    // Memoize the string array to prevent unnecessary re-renders
    const memoizedQuestionIds = useMemo(() => questionIds, [questionIds.join(',')]);

    const multipleCounts = useMemo(() => {
        const result: Record<string, InteractionCounts> = {};
        memoizedQuestionIds.forEach(questionId => {
            result[questionId] = getCountsForTarget(questionId);
        });
        return result;
    }, [getCountsForTarget, memoizedQuestionIds]);

    return {
        counts: multipleCounts,
        isLoading,
        error
    };
};

/**
 * Hook to get interaction statistics for a specific user
 * Calculates both interactions given by the user and received by the user
 */
export const useUserInteractionStats = (userId: string): UserInteractionStats => {
    const { isLoading, error } = useInteractionCounts();

    // Fetch all interactions to calculate user stats
    const {
        data: interactionsResponse,
        isLoading: rawInteractionsLoading,
        error: rawInteractionsError
    } = useReadInteractionsApiV1InteractionsGet({
        limit: 10000 // Get a large number to avoid pagination issues
    });

    const userStats = useMemo(() => {
        if (!userId || !interactionsResponse?.data?.data) {
            return {
                upvotesGiven: 0,
                meTooGiven: 0,
                canHelpGiven: 0,
                bookmarksGiven: 0,
                upvotesReceived: 0,
                meTooReceived: 0,
                canHelpReceived: 0,
            };
        }

        // Handle both API response formats (direct array or nested data)
        const interactions: InteractionRead[] = Array.isArray(interactionsResponse.data)
            ? interactionsResponse.data
            : interactionsResponse.data.data || [];

        // For interactions given by this user
        const interactionsGiven = interactions.filter(
            interaction => interaction.user_id === userId
        );

        // For interactions received by this user, we need to know which targets belong to this user
        // This is more complex and would typically require additional API calls to get user's questions/content
        // For now, we'll focus on interactions given

        const stats = {
            upvotesGiven: 0,
            meTooGiven: 0,
            canHelpGiven: 0,
            bookmarksGiven: 0,
            upvotesReceived: 0, // TODO: Implement when we have user's content mapping
            meTooReceived: 0,   // TODO: Implement when we have user's content mapping
            canHelpReceived: 0, // TODO: Implement when we have user's content mapping
        };

        // Count interactions given by this user
        interactionsGiven.forEach(interaction => {
            switch (interaction.interaction_type) {
                case InteractionType.uplift:
                    stats.upvotesGiven++;
                    break;
                case InteractionType.me_too:
                    stats.meTooGiven++;
                    break;
                case InteractionType.i_can_help:
                    stats.canHelpGiven++;
                    break;
                case InteractionType.bookmark:
                    stats.bookmarksGiven++;
                    break;
            }
        });

        return stats;
    }, [userId, interactionsResponse?.data]);

    return {
        ...userStats,
        isLoading: isLoading || rawInteractionsLoading,
        error: error || rawInteractionsError
    };
};
