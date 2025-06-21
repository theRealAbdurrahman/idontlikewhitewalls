import React from "react";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { FilterBar } from "../components/FilterBar";
import { QuestionCard } from "../components/QuestionCard";
import { useAppStore } from "../stores/appStore";

/**
 * Home screen component displaying the main question feed
 */
export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { questions, activeFilters, sortBy } = useAppStore();

  // Filter questions based on active filters
  const filteredQuestions = React.useMemo(() => {
    let filtered = [...questions];

    // Apply event filters
    if (!activeFilters.includes("all")) {
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

  return (
    <>
      {/* Question Feed */}
      <div className="px-2.5 py-2.5">
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
      <div className="fixed w-full max-w-[390px] h-[97px] bottom-0 left-0 bg-[linear-gradient(180deg,rgba(240,239,235,0)_0%,rgba(240,239,235,1)_100%)] pointer-events-none" />
    </>
  );
};