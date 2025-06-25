import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MoreVerticalIcon, BookmarkIcon, ArrowUpIcon } from "lucide-react";
import { 
  useCreateInteractionApiV1InteractionsPost, 
  useDeleteInteractionApiV1InteractionsInteractionIdDelete 
} from "../api-client/api-client";
import { InteractionTarget, InteractionType } from "../api-client/models";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";

/**
 * Custom styles for SVG icon color filtering
 */
const customStyles = `
  .filter-orange {
    filter: brightness(0) saturate(100%) invert(63%) sepia(38%) saturate(5084%) hue-rotate(6deg) brightness(101%) contrast(103%);
  }
`;

/**
 * Question interface from the store
 */
interface Question {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  eventId?: string;
  eventName?: string;
  title: string;
  description: string;
  image?: string;
  tags: string[];
  createdAt: string;
  visibility: "anyone" | "network" | "event";
  isAnonymous: boolean;
  upvotes: number;
  meTooCount: number;
  canHelpCount: number;
  isUpvoted: boolean;
  isMeToo: boolean;
  isBookmarked: boolean;
  replies: number;
}

/**
 * Question card props
 */
interface QuestionCardProps {
  question: Question;
}

/**
 * Question card component displaying individual questions in the feed
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { user } = useAuthStore();
  const { chatThreads } = useAppStore();
  const navigate = useNavigate();
  
  // API mutations for interactions
  const createInteractionMutation = useCreateInteractionApiV1InteractionsPost();
  const deleteInteractionMutation = useDeleteInteractionApiV1InteractionsInteractionIdDelete();
  
  // COMMENTED OUT: Local state management for future reference
  // const { toggleUpvote, toggleMeToo, toggleBookmark } = useAppStore();

  const handleUpvote = () => {
    if (!user) return;
    
    // COMMENTED OUT: Local state update for future reference
    // toggleUpvote(question.id);
    
    // Use API to toggle upvote
    if (question.isUpvoted) {
      // TODO: Need to track interaction IDs to delete specific interactions
      console.log("Delete upvote interaction for question:", question.id);
    } else {
      createInteractionMutation.mutate({
        data: {
          user_id: user.id,
          target_type: InteractionTarget.question,
          target_id: question.id,
          interaction_type: InteractionType.uplift,
        }
      }, {
        onSuccess: () => {
          console.log("Upvote created successfully");
          // TODO: Refetch questions or update local state
        },
        onError: (error) => {
          console.error("Failed to create upvote:", error);
        }
      });
    }
  };

  const handleMeToo = () => {
    if (!user) return;
    
    // COMMENTED OUT: Local state update for future reference
    // toggleMeToo(question.id);
    
    // Use API to toggle me too
    if (question.isMeToo) {
      // TODO: Need to track interaction IDs to delete specific interactions
      console.log("Delete me too interaction for question:", question.id);
    } else {
      createInteractionMutation.mutate({
        data: {
          user_id: user.id,
          target_type: InteractionTarget.question,
          target_id: question.id,
          interaction_type: InteractionType.mee_too,
        }
      }, {
        onSuccess: () => {
          console.log("Me too created successfully");
          // TODO: Refetch questions or update local state
        },
        onError: (error) => {
          console.error("Failed to create me too:", error);
        }
      });
    }
  };

  const handleBookmark = () => {
    if (!user) return;
    
    // COMMENTED OUT: Local state update for future reference
    // toggleBookmark(question.id);
    
    // Use API to toggle bookmark
    if (question.isBookmarked) {
      // TODO: Need to track interaction IDs to delete specific interactions
      console.log("Delete bookmark interaction for question:", question.id);
    } else {
      createInteractionMutation.mutate({
        data: {
          user_id: user.id,
          target_type: InteractionTarget.question,
          target_id: question.id,
          interaction_type: InteractionType.bookmark,
        }
      }, {
        onSuccess: () => {
          console.log("Bookmark created successfully");
          // TODO: Refetch questions or update local state
        },
        onError: (error) => {
          console.error("Failed to create bookmark:", error);
        }
      });
    }
  };

  const handleCanHelp = () => {
    if (!user || !question) return;
    if (event) {
      event.stopPropagation();
    }
    
    if (!user) return;
    
    // Generate thread ID for this help conversation
    const threadId = `help-${question.id}-${user.id}`;
    
    // Check if there's already a thread with messages (not just preview)
    const existingThread = chatThreads.find(thread => thread.id === threadId);
    const threadMessages = messages[threadId] || [];
    const hasActualMessages = threadMessages.some(msg => msg.type !== "preview" && msg.senderId === user.id);
    
    if (existingThread && hasActualMessages) {
      // Navigate to existing chat thread without question parameter
      navigate(`/chat/${threadId}`);
    } else {
      // Navigate to chat with question parameter to trigger offer help mode
      navigate(`/chat/${threadId}?questionId=${question.id}`);
    }
  };

  // Format the time ago
  const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true });

  /**
   * Handle clicking on the question content area
   */
  const handleQuestionClick = () => {
    navigate(`/questions/${question.id}`);
  };

  /**
   * Handle clicking on the author's profile
   */
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent question click event
    if (!question.isAnonymous) {
      navigate(`/user/${question.authorId}`);
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <Card className="w-full bg-neutral-50 rounded-[20px] border-none shadow-sm">
        <CardContent className="p-5 space-y-5 cursor-pointer" onClick={handleQuestionClick}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar 
                className={`w-[35px] h-[35px] ${!question.isAnonymous ? 'cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all' : ''}`}
                onClick={handleAuthorClick}
              >
                <AvatarImage
                  src={question.isAnonymous ? undefined : question.authorAvatar}
                  alt={question.isAnonymous ? "Anonymous" : question.authorName}
                  className="object-cover"
                />
                <AvatarFallback>
                  {question.isAnonymous ? "?" : question.authorName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <span 
                  className={`font-medium text-[#484848] text-base ${!question.isAnonymous ? 'cursor-pointer hover:text-gray-600 transition-colors' : ''}`}
                  onClick={handleAuthorClick}
                >
                  {question.isAnonymous ? "Anonymous" : question.authorName}
                </span>
                <div className="flex items-center gap-1 text-xs text-[#ababab]">
                  {question.eventName && (
                    <>
                      <span>{question.eventName}</span>
                      <span>•</span>
                      <span>{timeAgo}</span>
                    </>
                  )}
                  {!question.eventName && (
                    <span>{timeAgo}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                className={`w-6 h-6 p-0 ${
                  question.isBookmarked ? "text-yellow-500" : "text-gray-400"
                }`}
              >
                <BookmarkIcon className="w-5 h-5" fill={question.isBookmarked ? "currentColor" : "none"} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 p-0 text-gray-400"
              >
                <MoreVerticalIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2.5">
            <div className="space-y-2">
              <h2 className="font-semibold text-black text-base leading-tight">
                {question.title}
              </h2>
              <p className="text-black text-sm leading-relaxed">
                {question.description}
              </p>
            </div>

            {/* Tags */}
            {question.tags.length > 0 && (
              <div className="flex items-start gap-2 flex-wrap">
                {question.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-transparent border-0 p-0 font-medium text-[#5b5b5b] text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Image */}
            {question.image && (
              <div className="relative h-[160px] w-full rounded-lg overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Question attachment"
                  src={question.image}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap">
            {/* Upvote */}
            <Button
              variant="outline"
              onClick={handleUpvote}
              disabled={createInteractionMutation.isPending}
              className={`h-[38px] px-3 py-[5px] rounded-[25px] border-2 border-[#f0efeb] bg-transparent transition-colors ${
                question.isUpvoted ? "bg-blue-50 border-blue-200 text-blue-600" : ""
              }`}
            >
              <ArrowUpIcon className={`w-4 h-4 mr-2 ${question.isUpvoted ? "text-blue-600" : ""}`} />
              <span className="font-medium text-sm">
                {question.upvotes}
              </span>
            </Button>

            {/* Me Too */}
            <Button
              variant="outline"
              onClick={handleMeToo}
              disabled={createInteractionMutation.isPending}
              className={`h-[38px] px-3 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0 transition-colors ${
                question.isMeToo ? "bg-orange-50 text-orange-600" : ""
              }`}
            >
              <img 
                src="/Metoo (1).svg" 
                alt="Me too" 
                className={`w-6 h-6 mr-1 ${question.isMeToo ? "filter-orange" : ""}`} 
              />
              <span className="font-normal text-sm mr-1">Me too</span>
              <span className="font-medium text-sm">{question.meTooCount}</span>
            </Button>

            {/* I Can Help */}
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click event
                handleCanHelp();
              }}
              disabled={createInteractionMutation.isPending}
              className="h-[38px] px-3 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0 hover:bg-green-50 hover:text-green-600 transition-colors"
            >
              <img 
                src="/I Can Help.svg" 
                alt="I can help" 
                className="w-6 h-6 mr-1" 
              />
              <span className="font-normal text-sm mr-1">I can help</span>
              <span className="font-medium text-sm">{question.canHelpCount}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};