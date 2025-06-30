import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  MoreVerticalIcon,
  ArrowLeftIcon,
  BookmarkIcon, 
  ArrowUpIcon,
  MessageCircleIcon,
  HandIcon,
  UsersIcon,
  FlagIcon 
} from "lucide-react";
import { 
  useCreateInteractionApiV1InteractionsPost, 
  useDeleteInteractionApiV1InteractionsInteractionIdDelete 
} from "../api-client/api-client";
import { InteractionTarget, InteractionType } from "../api-client/models";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useAuth } from "../providers";
import { useAppStore } from "../stores/appStore";

/**
 * Interface for users who interacted with the question
 */
interface QuestionInteraction {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  interactionType: "me_too" | "can_help";
  isPublicVisible: boolean;
  allowsContact: boolean;
  isConnected: boolean;
  labels: string[];
  createdAt: string;
}

/**
 * Custom styles for enhanced visual effects
 */
const customStyles = `
  .filter-orange {
    filter: brightness(0) saturate(100%) invert(63%) sepia(38%) saturate(5084%) hue-rotate(6deg) brightness(101%) contrast(103%);
  }
  
  .gradient-fade {
    background: linear-gradient(180deg, rgba(240,239,235,0) 0%, rgba(240,239,235,1) 100%);
  }
  
  .interaction-card {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .interaction-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .action-button {
    transition: all 0.15s ease-out;
  }
  
  .action-button:hover {
    transform: scale(1.02);
  }
  
  .action-button:active {
    transform: scale(0.98);
  }
  
  .sticky-tabs {
    backdrop-filter: blur(20px);
    background: rgba(240, 239, 235, 0.95);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  
  .question-content-shadow {
    box-shadow: 0 2px 16px rgba(0,0,0,0.04);
  }
`;

/**
 * QuestionDetails screen component with pixel-perfect design implementation
 */
export const QuestionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { questions, chatThreads, messages } = useAppStore();
  
  // Local state
  const [activeTab, setActiveTab] = useState<"me_too" | "can_help">("me_too");
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  // Refs for sticky functionality
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsPlaceholderRef = useRef<HTMLDivElement>(null);
  
  // API mutations for interactions
  const createInteractionMutation = useCreateInteractionApiV1InteractionsPost();
  const deleteInteractionMutation = useDeleteInteractionApiV1InteractionsInteractionIdDelete();

  // Find the question
  const question = questions.find(q => q.id === id);

  // Check if this is the current user's own question
  const isOwnQuestion = question?.authorId === user?.id;
  // Enhanced mock interaction data
  const mockInteractions: QuestionInteraction[] = [
    {
      id: "int-1",
      userId: "user-789",
      userName: "Sara Timóteo",
      userAvatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      interactionType: "me_too",
      isPublicVisible: true,
      allowsContact: true,
      isConnected: false,
      labels: ["#Remember", "#WeMet"],
      createdAt: "2025-01-15T11:30:00Z",
    },
    {
      id: "int-2", 
      userId: "user-101",
      userName: "Adrian Silva",
      userAvatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      interactionType: "me_too",
      isPublicVisible: true,
      allowsContact: true,
      isConnected: false,
      labels: ["#Remember", "#WeMet"],
      createdAt: "2025-01-15T10:45:00Z",
    },
    {
      id: "int-3",
      userId: "user-202",
      userName: "André Duarte",
      userAvatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      interactionType: "can_help",
      isPublicVisible: true,
      allowsContact: true,
      isConnected: false,
      labels: ["#Remember", "#WeMet"],
      createdAt: "2025-01-15T09:20:00Z",
    },
    {
      id: "int-4",
      userId: "user-303",
      userName: "Eric Martinez",
      userAvatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      interactionType: "can_help",
      isPublicVisible: true,
      allowsContact: false,
      isConnected: false,
      labels: ["#Remember", "#WeMet"],
      createdAt: "2025-01-15T08:15:00Z",
    },
    {
      id: "int-5",
      userId: "user-404",
      userName: "Luis Roquette Valdez",
      userAvatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      interactionType: "can_help",
      isPublicVisible: true,
      allowsContact: true,
      isConnected: true,
      labels: ["#Remember", "#WeMet"],
      createdAt: "2025-01-15T07:30:00Z",
    },
  ];

  // Count of private help offers
  const privateHelpCount = 3;

  // Filter interactions by type
  const meTooInteractions = mockInteractions.filter(
    interaction => interaction.interactionType === "me_too"
  );
  
  const canHelpInteractions = mockInteractions.filter(
    interaction => interaction.interactionType === "can_help" && interaction.isPublicVisible
  );

  /**
   * Enhanced scroll handling for sticky tabs
   */
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current && tabsPlaceholderRef.current) {
        const tabsTop = tabsPlaceholderRef.current.getBoundingClientRect().top;
        const shouldBeSticky = tabsTop <= 100; // Account for header height + padding
        
        if (shouldBeSticky !== isTabsSticky) {
          setIsTabsSticky(shouldBeSticky);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTabsSticky]);

  /**
   * Handle back navigation
   */
  const handleBackClick = () => {
    navigate(-1);
  };

  /**
   * Handle report submission
   */
  const handleReportSubmit = async () => {
    if (!reportText.trim()) return;
    
    setIsSubmittingReport(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Report submitted:", {
        questionId: question?.id,
        reportText: reportText.trim(),
        reportedBy: user?.id,
        timestamp: new Date().toISOString(),
      });
      
      setReportText("");
      setIsReportDialogOpen(false);
      
      // TODO: Show toast notification instead of alert
      alert("Report submitted successfully. Thank you for helping keep our community safe.");
      
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  /**
   * Enhanced interaction handlers with animations
   */
  const handleUpvote = () => {
    if (!user || !question) return;
    
    if (question.isUpvoted) {
      console.log("Delete upvote interaction for question:", question.id);
    } else {
      createInteractionMutation.mutate({
        data: {
          user_id: user.id,
          target_type: InteractionTarget.question,
          target_id: question.id,
          interaction_type: InteractionType.uplift,
        }
      });
    }
  };

  const handleMeToo = () => {
    if (!user || !question) return;
    
    if (question.isMeToo) {
      console.log("Delete me too interaction for question:", question.id);
    } else {
      createInteractionMutation.mutate({
        data: {
          user_id: user.id,
          target_type: InteractionTarget.question,
          target_id: question.id,
          interaction_type: InteractionType.me_too,
        }
      });
    }
  };

  const handleBookmark = () => {
    if (!user || !question) return;
    
    if (question.isBookmarked) {
      console.log("Delete bookmark interaction for question:", question.id);
    } else {
      createInteractionMutation.mutate({
        data: {
          user_id: user.id,
          target_type: InteractionTarget.question,
          target_id: question.id,
          interaction_type: InteractionType.bookmark,
        }
      });
    }
  };

  const handleCanHelp = () => {
    if (!user || !question) return;
    
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

  /**
   * Handle user interactions
   */
  const handleUserProfileClick = (userId: string) => {
    console.log("User profile clicked:", userId);

    navigate(`/profile/${userId}`);
  };

  const handleChatClick = (interaction: QuestionInteraction) => {
    if (!user || !question) return;
    
    const existingThread = chatThreads.find(thread => 
      thread.participants.includes(user.id) && 
      thread.participants.includes(interaction.userId)
    );
    
    if (existingThread) {
      navigate(`/chat/${existingThread.id}`);
    } else {
      const newThreadId = `thread-${Date.now()}`;
      navigate(`/chat/${newThreadId}`);
    }
  };
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent question click event
    if (!question?.isAnonymous) {
      navigate(`/profile/${question?.authorId}`);
    }
  };

  /**
   * Enhanced user interaction item renderer
   */
  const renderUserInteraction = (interaction: QuestionInteraction) => (
    <div 
      key={interaction.id}
      className="interaction-card flex items-center justify-between p-4 hover:bg-gray-50/80 transition-all duration-200 ease-out border-b border-gray-100/50 last:border-b-0"
    >
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer group"
        onClick={() => handleUserProfileClick(interaction.userId)}
      >
        <div className="relative">
          <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-gray-200 transition-all duration-200" onClick={handleAuthorClick}
          >
            <AvatarImage src={interaction.userAvatar} alt={interaction.userName} />
            <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200">
              {interaction.userName[0]}
            </AvatarFallback>
          </Avatar>
          {interaction.isConnected && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
              {interaction.userName}
            </span>
            {interaction.labels.map((label, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="text-xs bg-blue-50 border-blue-200 text-blue-700 px-2 py-0.5"
              >
                {label}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      {/* Enhanced chat button */}
      {interaction.allowsContact && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleChatClick(interaction)}
          className="w-10 h-10 rounded-full text-[#3ec6c6] hover:bg-[#3ec6c6]/10 hover:text-[#2ea5a5] transition-all duration-200 hover:scale-105"
        >
          <MessageCircleIcon className="w-5 h-5" />
        </Button>
      )}
    </div>
  );

  // Handle edge cases
  if (!question) {
    return (
      <div className="min-h-screen bg-[#f0efeb] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircleIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Question not found
            </h2>
            <p className="text-gray-600 mb-6">
              This question may have been removed or doesn't exist.
            </p>
            <Button 
              onClick={handleBackClick}
              className="w-full bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true });

  return (
    <>
      <style>{customStyles}</style>
      <div className="bg-[#f0efeb] min-h-screen">
        {/* Enhanced Header with better shadows and typography */}
        <header className="fixed top-0 left-0 right-0 z-40 flex w-full h-[100px] items-center justify-between pt-12 pb-4 px-4 bg-[#f0efeb]/95 backdrop-blur-lg border-b border-gray-200/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="w-10 h-10 rounded-full p-0 hover:bg-gray-100/80 transition-all duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
          </Button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBookmark}
              className={`w-10 h-10 rounded-full p-0 transition-all duration-200 ${
                question?.isBookmarked 
                  ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100" 
                  : "text-gray-600 hover:bg-gray-100/80"
              }`}
            >
              <BookmarkIcon className="w-5 h-5" fill={question?.isBookmarked ? "currentColor" : "none"} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full p-0 text-gray-600 hover:bg-gray-100/80 transition-all duration-200"
                >
                  <MoreVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-lg border-gray-200">
                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    >
                      <FlagIcon className="w-4 h-4 mr-2" />
                      Report Question
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4">
                      <DialogTitle className="text-xl font-semibold">Report Question</DialogTitle>
                      <DialogDescription className="text-gray-600 leading-relaxed">
                        Help us maintain a safe and respectful community. Please provide details about why you're reporting this question.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="px-6 pb-4">
                      <textarea
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        placeholder="Please describe the issue with this question..."
                        className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent resize-none text-sm leading-relaxed"
                        maxLength={500}
                        disabled={isSubmittingReport}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          Be specific and constructive in your feedback
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {reportText.length}/500
                        </span>
                      </div>
                    </div>
                    
                    <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReportText("");
                          setIsReportDialogOpen(false);
                        }}
                        disabled={isSubmittingReport}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleReportSubmit}
                        disabled={!reportText.trim() || isSubmittingReport}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Enhanced Question Content with better spacing and shadows */}
        <div className="question-details-card pt-[100px]">
          <Card className="w-full bg-white border-none question-content-shadow">
            <CardContent className="pt-[20px] px-4 pb-4 space-y-[10px]">
              {/* Enhanced Header with better typography */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-10 h-10 ring-2 ring-gray-100" onClick={handleAuthorClick}>
                    <AvatarImage
                      src={question.isAnonymous ? undefined : (question.authorAvatar || "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1")}
                      alt={question.isAnonymous ? "Anonymous" : question.authorName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-semibold">
                      {question.isAnonymous ? "?" : question.authorName[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-base" style={{ fontSize: '16px' }}>
                      {question.isAnonymous ? "Anonymous" : question.authorName}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-500" style={{ fontSize: '12px' }}>
                      {question.eventName && (
                        <>
                          <span className="font-medium">{question.eventName}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Content with better typography and spacing */}
              <div className="space-y-[10px]">
                <div className="space-y-[10px]">
                  <h1 className="font-semibold text-gray-900 text-lg leading-tight">
                    {question.title}
                  </h1>
                  <p className="text-gray-700 text-base leading-relaxed">
                    {question.description}
                  </p>
                </div>

                {/* Tags with specific styling */}
                <div className="flex items-start gap-2 flex-wrap">
                  <span 
                    className="text-[#5B5B5B]" 
                    style={{ 
                      fontFamily: 'Fira Sans, sans-serif', 
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}
                  >
                    #Tech
                  </span>
                  <span 
                    className="text-[#5B5B5B]" 
                    style={{ 
                      fontFamily: 'Fira Sans, sans-serif', 
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}
                  >
                    #AI
                  </span>
                  <span 
                    className="text-[#5B5B5B]" 
                    style={{ 
                      fontFamily: 'Fira Sans, sans-serif', 
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}
                  >
                    #BuildInPublic
                  </span>
                </div>

                {/* Enhanced Image with better aspect ratio and shadows */}
                {question.image && (
                  <div className="relative h-64 w-full rounded-xl overflow-hidden shadow-md">
                    <img
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      alt="Question attachment"
                      src={question.image}
                    />
                  </div>
                )}
              </div>
                {/* Action Buttons - Only show for other users' questions */}
                {!isOwnQuestion && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {/* Upvote */}
                    <Button
                      variant="outline"
                      onClick={handleUpvote}
                      disabled={createInteractionMutation.isPending}
                      className={`action-button h-[38px] px-3 py-[5px] rounded-[25px] border-2 border-[#f0efeb] bg-transparent transition-colors ${
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
                      className={`action-button h-[38px] px-3 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0 transition-colors ${
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
                      onClick={handleCanHelp}
                      disabled={createInteractionMutation.isPending}
                      className="action-button h-[38px] px-3 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0 hover:bg-green-50 hover:text-green-600 transition-colors"
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
                )}

            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs with better sticky behavior and design */}
        <div ref={tabsPlaceholderRef} className="h-0" />

        <div 
          ref={tabsRef}
          className={`${
            isTabsSticky 
              ? 'fixed top-[100px] left-0 right-0 z-30 sticky-tabs shadow-sm' 
              : 'relative bg-[#f0efeb] px-4'
          } transition-all duration-300 pt-[10px]`}
        >
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "me_too" | "can_help")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 bg-white rounded-[50px] shadow-sm border border-gray-100 p-1" style={{ marginLeft: '20px', marginRight: '20px', width: 'calc(100% - 40px)', margin: '0 auto' }}>
              <TabsTrigger 
                value="me_too" 
                className="flex items-center justify-center data-[state=active]:bg-[#F9DF8E] data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-[50px] font-semibold transition-all duration-200"
                style={{ fontSize: 'min(14px, 3.5vw)', gap: '10px' }}
              >
                <img 
                  src="/Metoo (1).svg" 
                  alt="Me too" 
                  className="w-8 h-8" 
                  style={{ 
                    width: activeTab === "me_too" ? "16.16px" : "16px", 
                    height: activeTab === "me_too" ? "16.16px" : "16px" 
                  }} 
                />
                <span>Me too</span>
                <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700 text-xs px-2">
                  {meTooInteractions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="can_help"
                className="flex items-center justify-center data-[state=active]:bg-[#F9DF8E] data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-[50px] font-semibold transition-all duration-200"
                style={{ fontSize: 'min(14px, 3.5vw)', gap: '10px' }}
              >
                <img 
                  src="/I Can Help.svg" 
                  alt="I can help" 
                  className="w-4 h-4" 
                  style={{ 
                    width: activeTab === "can_help" ? "16.16px" : "16px", 
                    height: activeTab === "can_help" ? "16.16px" : "16px" 
                  }} 
                />
                <span>I can help</span>
                <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700 text-xs px-2">
                  {canHelpInteractions.length + privateHelpCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Enhanced Content with better empty states and animations */}
        <div className="pb-[30px]">
          <div className="mt-4 bg-white overflow-hidden">
            <CardContent className="p-0">
              {activeTab === "me_too" && (
                <div>
                  {/* Display 4 rows of people who clicked "Me too" */}
                  <div>
                    {/* Row 1 - Sara Timóteo with #Remember tag */}
                    <div className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="Sara Timóteo" />
                          <AvatarFallback>ST</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Sara Timóteo</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #Remember
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>

                    {/* Row 2 - Adrian Silva with #WeMet tag */}
                    <div className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="Adrian Silva" />
                          <AvatarFallback>AS</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Adrian Silva</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #WeMet
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>

                    {/* Row 3 - André Duarte with #Remember #WeMet tags */}
                    <div className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="André Duarte" />
                          <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">André Duarte</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #Remember #WeMet
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>

                    {/* Row 4 - Eric Martinez with #Remember tag */}
                    <div className="flex items-center justify-between py-3.5 px-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="Eric Martinez" />
                          <AvatarFallback>EM</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Eric Martinez</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #Remember
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "can_help" && (
                <div>
                  {canHelpInteractions.length > 0 ? (
                    <div>
                    {/* Row 1 - Luis Roquette Valdez with #Remember tag */}
                    <div className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="Luis Roquette Valdez" />
                          <AvatarFallback>LV</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Luis Roquette Valdez</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #Remember
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>

                    {/* Row 2 - Maria Santos with #WeMet tag */}
                    <div className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="Maria Santos" />
                          <AvatarFallback>MS</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Maria Santos</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #WeMet
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>

                    {/* Row 3 - João Silva with #Remember #WeMet tags */}
                    <div className="flex items-center justify-between py-3.5 px-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="João Silva" />
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">João Silva</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #Remember #WeMet
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>

                    {/* Row 4 - Ana Costa with #Remember tag */}
                    <div className="flex items-center justify-between py-3.5 px-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src="https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1" alt="Ana Costa" />
                          <AvatarFallback>AC</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Ana Costa</div>
                          <div 
                            className="text-[#5B5B5B]" 
                            style={{ 
                              fontFamily: 'Fira Sans, sans-serif', 
                              fontSize: '12px',
                              fontWeight: 'normal'
                            }}
                          >
                            #Remember
                          </div>
                        </div>
                      </div>
                      <img 
                        src="/message-question.svg" 
                        alt="Message" 
                        className="w-5 h-5 cursor-pointer" 
                      />
                    </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UsersIcon className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Be the first to help</h3>
                      <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                        It only takes one person to show up. For{" "}
                        <span className="font-semibold text-gray-900">
                          {question.isAnonymous ? "them" : question.authorName}
                        </span>
                        , that might be you.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        </div>

        {/* Suggest a Feature Section */}
        <div className="flex flex-col items-center justify-center pb-[50px]">
          <Button
            onClick={() => navigate("/suggest-feature")}
            variant="ghost"
            className="flex flex-col items-center justify-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <img 
              src="/Icon_suggest a feature.png" 
              alt="Suggest a feature" 
              className="w-6 h-6 mb-[5px]" 
            />
            <span 
              className="text-[#404040]"
              style={{ 
                fontFamily: 'Livvic, sans-serif', 
                fontSize: '14px'
              }}
            >
              Suggest a feature
            </span>
          </Button>
        </div>
      </div>
    </>
  );
};