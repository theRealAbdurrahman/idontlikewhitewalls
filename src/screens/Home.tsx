import React from "react";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReadQuestionsApiV1QuestionsGet } from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { FilterBar } from "../components/FilterBar";
import { QuestionCard } from "../components/QuestionCard";
import { useAppStore } from "../stores/appStore"; 
import { useAuthStore } from "../stores/authStore";

/**
 * Home screen component displaying the main question feed
 */
export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeFilters, sortBy } = useAppStore();
  
  // Fetch questions from API
  const { 
    data: questionsData, 
    isLoading: questionsLoading, 
    error: questionsError 
  } = useReadQuestionsApiV1QuestionsGet();

  // Transform API data to component format
  const questions = React.useMemo(() => {
    if (!questionsData?.data) return [];
    console.log("Questions Data:", questionsData.data);
    
    return questionsData.data.map((question) => ({
      id: question.id,
      authorId: question.user_id,
      authorName: question.is_anonymous ? "Anonymous" : "Question Author",
      authorAvatar: question.is_anonymous ? undefined : "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      eventId: question.event_id,
      eventName: undefined, // Will need to be populated from events data
      title: question.title,
      description: question.content,
      image: undefined,
      tags: [], // Default empty for now
      createdAt: question.created_at || new Date().toISOString(),
      visibility: "anyone" as const,
      isAnonymous: question.is_anonymous || false,
      upvotes: 0, // Will be calculated from interactions
      meTooCount: 0, // Will be calculated from interactions  
      canHelpCount: 0, // Will be calculated from interactions
      isUpvoted: false, // Will be determined from user's interactions
      isMeToo: false, // Will be determined from user's interactions
      isBookmarked: false, // Will be determined from user's interactions
      replies: 0, // Default for now
    }));
  }, [questionsData?.data]);

  // Filter questions based on active filters
  const filteredQuestions = React.useMemo(() => {
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

  // Handle loading and error states
  if (questionsLoading) {
    return (
      <div className="px-2.5 py-2.5">
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500 text-base">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="px-2.5 py-2.5">
        <div className="flex items-center justify-center py-8">
          <p className="text-red-500 text-base">Error loading questions. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Question Feed */}
      <div className="px-2.5 py-3">
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
      <div className="fixed w-full  h-[97px] bottom-0 left-0 bg-[linear-gradient(180deg,rgba(240,239,235,0)_0%,rgba(240,239,235,1)_100%)] pointer-events-none" />
    </>
  );
};