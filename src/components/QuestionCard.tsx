import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MoreVerticalIcon, BookmarkIcon, ArrowUpIcon } from "lucide-react";
import {
  useCreateInteractionApiV1InteractionsPost,
  useDeleteInteractionApiV1InteractionsInteractionIdDelete
} from "../api-client/api-client";
import { useCacheManager } from "../hooks/useCacheManager";
import { useQuestionInteractions } from "../hooks/useUserInteractions";
import { InteractionTarget, InteractionType } from "../api-client/models";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";
import { useToast } from "../hooks/use-toast";

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
  const { chatThreads, messages } = useAppStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { afterInteraction } = useCacheManager();

  // Local state for report modal
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [reportReasons, setReportReasons] = React.useState<string[]>([]);
  const [reportDetails, setReportDetails] = React.useState("");
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false);

  // API mutations for interactions
  const createInteractionMutation = useCreateInteractionApiV1InteractionsPost();
  const deleteInteractionMutation = useDeleteInteractionApiV1InteractionsInteractionIdDelete();

  // Get user's interactions for this question
  const {
    isUpvoted: userHasUpvoted,
    isMeToo: userHasMeToo,
    isBookmarked: userHasBookmarked,
    upvoteId,
    meTooId,
    bookmarkId,
    isLoading: interactionsLoading
  } = useQuestionInteractions(question.id);

  // Check if this is the current user's own question
  const isOwnQuestion = question.authorId === user?.id;

  /**
   * Handle report submission
   */
  const handleReportSubmit = async () => {
    if (reportReasons.length === 0) {
      toast({
        title: "Please select at least one reason",
        description: "You must select at least one reason for reporting this question.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReport(true);

    try {
      // Simulate API call to submit report
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("Report submitted:", {
        questionId: question.id,
        reasons: reportReasons,
        details: reportDetails.trim(),
        reportedBy: user?.id,
        timestamp: new Date().toISOString(),
      });

      // Reset form and close modal
      setReportReasons([]);
      setReportDetails("");
      setIsReportModalOpen(false);

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });

    } catch (error) {
      console.error("Failed to submit report:", error);
      toast({
        title: "Failed to submit report",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  /**
   * Handle checkbox change for report reasons
   */
  const handleReasonChange = (reason: string, checked: boolean) => {
    if (checked) {
      setReportReasons(prev => [...prev, reason]);
    } else {
      setReportReasons(prev => prev.filter(r => r !== reason));
    }
  };

  const handleUpvote = () => {
    // Don't allow interaction with own questions
    if (!user || isOwnQuestion || interactionsLoading) return;

    // Toggle upvote: delete if exists, create if doesn't
    if (userHasUpvoted && upvoteId) {
      // Delete existing upvote
      deleteInteractionMutation.mutate({
        interactionId: upvoteId
      }, {
        onSuccess: () => {
          console.log("Upvote removed successfully");
          afterInteraction(question.id);
          toast({
            title: "Upvote removed",
            description: "Your upvote has been removed.",
          });
        },
        onError: (error) => {
          console.error("Failed to remove upvote:", error);
          toast({
            title: "Failed to remove upvote",
            description: "Please try again. Check your connection.",
            variant: "destructive",
          });
        }
      });
    } else {
      // Create new upvote
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
          afterInteraction(question.id);
          toast({
            title: "Question uplifted!",
            description: "Your upvote has been recorded.",
          });
        },
        onError: (error) => {
          console.error("Failed to create upvote:", error);
          toast({
            title: "Failed to upvote",
            description: "Please try again. Check your connection.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleMeToo = () => {
    // Don't allow interaction with own questions
    if (!user || isOwnQuestion || interactionsLoading) return;

    // Toggle me too: delete if exists, create if doesn't
    if (userHasMeToo && meTooId) {
      // Delete existing me too
      deleteInteractionMutation.mutate({
        interactionId: meTooId
      }, {
        onSuccess: () => {
          console.log("Me too removed successfully");
          afterInteraction(question.id);
          toast({
            title: "Me too removed",
            description: "Your 'me too' has been removed.",
          });
        },
        onError: (error) => {
          console.error("Failed to remove me too:", error);
          toast({
            title: "Failed to remove 'me too'",
            description: "Please try again. Check your connection.",
            variant: "destructive",
          });
        }
      });
    } else {
      // Create new me too
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
          afterInteraction(question.id);
          toast({
            title: "Me too recorded!",
            description: "You've indicated you have the same question.",
          });
        },
        onError: (error) => {
          console.error("Failed to create me too:", error);
          toast({
            title: "Failed to record 'me too'",
            description: "Please try again. Check your connection.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleBookmark = () => {
    // Allow bookmarking own questions
    if (!user || interactionsLoading) return;

    // Toggle bookmark: delete if exists, create if doesn't
    if (userHasBookmarked && bookmarkId) {
      // Delete existing bookmark
      deleteInteractionMutation.mutate({
        interactionId: bookmarkId
      }, {
        onSuccess: () => {
          console.log("Bookmark removed successfully");
          afterInteraction(question.id);
          toast({
            title: "Bookmark removed",
            description: "Question removed from your bookmarks.",
          });
        },
        onError: (error) => {
          console.error("Failed to remove bookmark:", error);
          toast({
            title: "Failed to remove bookmark",
            description: "Please try again. Check your connection.",
            variant: "destructive",
          });
        }
      });
    } else {
      // Create new bookmark
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
          afterInteraction(question.id);
          toast({
            title: "Question bookmarked!",
            description: "Question saved to your bookmarks.",
          });
        },
        onError: (error) => {
          console.error("Failed to create bookmark:", error);
          toast({
            title: "Failed to bookmark",
            description: "Please try again. Check your connection.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleCanHelp = () => {
    // Don't allow offering help on own questions
    if (!user || !question || isOwnQuestion) return;

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
      navigate(`/profile/${question.authorId}`);
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
                onClick={(e) => {
                  e.stopPropagation(); // Prevent question click event
                  handleBookmark();
                }}
                className={`w-6 h-6 p-0 ${userHasBookmarked ? "text-yellow-500" : "text-gray-400"
                  }`}
              >
                <BookmarkIcon className="w-5 h-5" fill={userHasBookmarked ? "currentColor" : "none"} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent question click event
                  setIsReportModalOpen(true);
                }}
                className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600"
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
              onClick={(e) => {
                e.stopPropagation(); // Prevent question click event
                handleUpvote();
              }}
              disabled={createInteractionMutation.isPending || deleteInteractionMutation.isPending || isOwnQuestion || interactionsLoading}
              className={`h-[38px] px-3 py-[5px] rounded-[25px] border-2 border-[#f0efeb] bg-transparent transition-colors ${userHasUpvoted ? "bg-blue-50 border-blue-200 text-blue-600" : ""
                } ${isOwnQuestion ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ArrowUpIcon className={`w-4 h-4 mr-2 ${userHasUpvoted ? "text-blue-600" : ""}`} />
              <span className="font-medium text-sm">
                {question.upvotes}
              </span>
            </Button>

            {/* Me Too */}
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation(); // Prevent question click event
                handleMeToo();
              }}
              disabled={createInteractionMutation.isPending || deleteInteractionMutation.isPending || isOwnQuestion || interactionsLoading}
              className={`h-[38px] px-3 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0 transition-colors ${userHasMeToo ? "bg-orange-50 text-orange-600" : ""
                } ${isOwnQuestion ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <img
                src="/Metoo (1).svg"
                alt="Me too"
                className={`w-6 h-6 mr-1 ${userHasMeToo ? "filter-orange" : ""}`}
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
              disabled={createInteractionMutation.isPending || isOwnQuestion}
              className={`h-[38px] px-3 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0 hover:bg-green-50 hover:text-green-600 transition-colors ${isOwnQuestion ? "opacity-50 cursor-not-allowed" : ""
                }`}
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

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl m-auto">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Report Question</DialogTitle>
            <DialogDescription className="text-gray-600">
              Help us understand what's happening
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-4 space-y-4">
            {/* Reason Selection with Checkboxes */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">
                Why are you reporting this question? (Select all that apply) *
              </label>
              <div className="space-y-2">
                {[
                  "It's spam",
                  "Nudity or sexual activity",
                  "Hate speech or symbols",
                  "Violence or dangerous organizations",
                  "Bullying or harassment"
                ].map((reason) => (
                  <div key={reason} className="flex items-center space-x-3">
                    <Checkbox
                      id={`reason-${reason}`}
                      checked={reportReasons.includes(reason)}
                      onCheckedChange={(checked) => handleReasonChange(reason, checked as boolean)}
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <label
                      htmlFor={`reason-${reason}`}
                      className="text-sm text-gray-900 cursor-pointer flex-1"
                    >
                      {reason}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Additional details (optional)
              </label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Please provide any additional context that would help us understand the issue..."
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isSubmittingReport}
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-500">
                  {reportDetails.length}/500
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setReportReasons([]);
                setReportDetails("");
                setIsReportModalOpen(false);
              }}
              disabled={isSubmittingReport}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={reportReasons.length === 0 || isSubmittingReport}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              {isSubmittingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};