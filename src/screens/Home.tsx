import React, { useMemo } from "react";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReadQuestionsApiV1QuestionsGet } from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { QuestionCard } from "../components/QuestionCard";
import { useAppStore } from "../stores/appStore";
import { QuestionRead } from '../api-client/models/questionRead';
import { EnvDebug } from '../components/EnvDebug';
import { useAuth } from "../providers";

/**
 * Home screen component displaying the main question feed
 */
export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { activeFilters, sortBy } = useAppStore();
  const { isAuthenticated, user: currentUser } = useAuth();

  // Fetch questions from API with real-time polling
  const {
    data: questionsData,
    isLoading: questionsLoading,
    error: questionsError
  } = useReadQuestionsApiV1QuestionsGet(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
    refetchIntervalInBackground: false, // Only poll when tab is active
  });

  // Get raw questions data from API
  const rawQuestions = useMemo(() => {
    if (!questionsData?.data) return [];

    // Create a safe wrapper function to handle the type mismatch
    function ensureQuestionArray(data: any): QuestionRead[] {
      // Check if data is an array
      if (Array.isArray(data)) {
        return data as QuestionRead[];
      }
      // Check if data has a data property that is an array
      else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return data.data as QuestionRead[];
      }
      // Return empty array as fallback
      return [];
    }

    return ensureQuestionArray(questionsData.data);
  }, [questionsData?.data]);

  /**
   * Get user display data for a question
   * This is more efficient than useQuestionUserLookup as it doesn't fetch external user profiles
   */
  const getQuestionUserData = (question: QuestionRead) => {
    // Handle anonymous questions
    if (question.is_anonymous) {
      return {
        displayName: 'Anonymous',
        avatarUrl: null,
        isAnonymous: true,
      };
    }
    const isCurrentUserQuestion = currentUser && question.user_id === currentUser.id;
    // Handle current user's own questions
    if (currentUser) {
      const firstName = question.user.full_name?.split(' ')[0] || '';
      const lastName = question.user.full_name?.split(' ').slice(1).join(' ') || '';
      const displayName = `${firstName} ${lastName}`.trim() || 'You';

      return {
        displayName,
        avatarUrl: isCurrentUserQuestion ? currentUser.profile_picture : null,
        isAnonymous: false,
      };
    }

    // For other users, use a fallback display name
    // We could fetch their profiles later if needed, but for the feed view this is sufficient
    return {
      displayName: 'User', // Simple fallback - could be enhanced later
      avatarUrl: null,
      isAnonymous: false,
    };
  };

  // Transform API data to component format with real user data
  const questions = useMemo(() => {
    if (!rawQuestions.length) return [];

    return rawQuestions.map((question) => {
      const userData = getQuestionUserData(question);

      return {
        id: question.id,
        authorId: question.user_id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl || undefined,
        eventId: question.event_id,
        eventName: undefined, // Will need to be populated from events data
        title: question.title,
        description: question.content,
        image: undefined,
        tags: [], // Default empty for now
        createdAt: question.created_at || new Date().toISOString(),
        visibility: "anyone" as const,
        isAnonymous: question.is_anonymous || false,
        upvotes: question.uplifts_count || 0,
        meTooCount: question.me_too_count || 0,
        canHelpCount: question.i_can_help_count || 0,
        isUpvoted: false, // Will be determined from user's interactions
        isMeToo: false, // Will be determined from user's interactions
        isBookmarked: false, // Will be determined from user's interactions
        replies: 0, // Default for now
      };
    });
  }, [rawQuestions, currentUser]);

  // Filter questions based on active filters
  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    // Apply event filters
    if (!activeFilters.includes("meetverse")) {
      filtered = filtered.filter(question =>
        question.eventId && activeFilters.includes(question.eventId)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "most_uplifted":
        filtered.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "most_helpers":
        filtered.sort((a, b) => b.canHelpCount - a.canHelpCount);
        break;
      case "most_relatable":
        filtered.sort((a, b) => b.meTooCount - a.meTooCount);
        break;
      case "bookmarked":
        filtered = filtered.filter(question => question.isBookmarked);
        break;
      case "latest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [questions, activeFilters, sortBy]);

  const handleCreateQuestion = () => {
    navigate("/create-question");
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p className="text-gray-500 text-base">Please login to view questions</p>
        </div>
      </div>
    );
  }

  // Handle loading and error states
  if (questionsLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p className="text-gray-500 text-base">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <p className="text-red-500 text-base">Error loading questions. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>

      {/* Question Feed - Centered with max-width */}
      <div className="w-full max-w-2xl mx-auto px-4 py-3">
        <div className="flex flex-col gap-[15px]">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-base">
                {sortBy === "bookmarked"
                  ? "No bookmarked questions yet"
                  : "No questions match your current filters"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleCreateQuestion}
        className="w-[50px] h-[50px] fixed bottom-[103px] right-[30px] bg-[#3ec6c6] hover:bg-[#2ea5a5] rounded-full shadow-[0px_4px_8px_#00000040] p-0 flex items-center justify-center z-20"
      >
        <PlusIcon className="w-[22px] h-[22px] text-white" />
      </Button>

      {/* Bottom Gradient */}
      <div className="fixed w-full h-[97px] bottom-0 left-0 bg-[linear-gradient(180deg,rgba(240,239,235,0)_0%,rgba(240,239,235,1)_100%)] pointer-events-none" />
    </>
  );
};