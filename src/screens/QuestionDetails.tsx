import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  MoreVerticalIcon, 
  BookmarkIcon, 
  ArrowUpIcon,
  MessageCircleIcon,
  HandIcon,
  UsersIcon 
} from "lucide-react";
import { 
  useCreateInteractionApiV1InteractionsPost, 
  useDeleteInteractionApiV1InteractionsInteractionIdDelete 
} from "../api-client/api-client";
import { InteractionTarget, InteractionType } from "../api-client/models";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "@/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/tabs";
import { useAuthStore } from "../stores/authStore";
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
  isPublicVisible: boolean; // For "can_help" interactions
  allowsContact: boolean;
  isConnected: boolean;
  labels: string[]; // e.g., ["#WeMet", "#Remember"]
  createdAt: string;
}

/**
 * Custom styles for SVG icon color filtering
 */
const customStyles = `
  .filter-orange {
    filter: brightness(0) saturate(100%) invert(63%) sepia(38%) saturate(5084%) hue-rotate(6deg) brightness(101%) contrast(103%);
  }
`;

/**
 * QuestionDetails screen component for viewing full question content and interactions
 */
export const QuestionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { questions, chatThreads } = useAppStore();
  
  // Local state
  const [activeTab, setActiveTab] = useState<"me_too" | "can_help">("me_too");
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  
  // Refs for sticky functionality
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsPlaceholderRef = useRef<HTMLDivElement>(null);
  
  // API mutations for interactions
  const createInteractionMutation = useCreateInteractionApiV1InteractionsPost();
  const deleteInteractionMutation = useDeleteInteractionApiV1InteractionsInteractionIdDelete();

  // Find the question
  const question = questions.find(q => q.id === id);

  // Mock interaction data - in a real app, this would come from the API
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
      userName: "Adrian",
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
      userName: "Eric M",
      userAvatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
      interactionType: "can_help",
      isPublicVisible: true,
      allowsContact: false, // This user doesn't allow contact
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

  // Count of private help offers (users who selected isPublicVisible: false)
  const privateHelpCount = 3; // Mock data

  // Filter interactions by type
  const meTooInteractions = mockInteractions.filter(
    interaction => interaction.interactionType === "me_too"
  );
  
  const canHelpInteractions = mockInteractions.filter(
    interaction => interaction.interactionType === "can_help" && interaction.isPublicVisible
  );

  /**
   * Handle scroll to make tabs sticky
   */
  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current && tabsPlaceholderRef.current) {
        const tabsTop = tabsPlaceholderRef.current.getBoundingClientRect().top;
        const shouldBeSticky = tabsTop <= 90; // Account for header height
        
        if (shouldBeSticky !== isTabsSticky) {
          setIsTabsSticky(shouldBeSticky);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTabsSticky]);

  /**
   * Handle interaction buttons (same logic as QuestionCard)
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
          interaction_type: InteractionType.mee_too,
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
    
    // Check if there's already a chat thread between the user and question author
    const existingThread = chatThreads.find(thread => 
      thread.participants.includes(user.id) && 
      thread.participants.includes(question.authorId) &&
      thread.questionId === question.id
    );
    
    if (existingThread) {
      navigate(`/chat/${existingThread.id}`);
    } else {
      navigate(`/offer-help/${question.id}`);
    }
  };

  /**
   * Handle user profile navigation
   */
  const handleUserProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  /**
   * Handle chat navigation
   */
  const handleChatClick = (interaction: QuestionInteraction) => {
    if (!user || !question) return;
    
    // Check if there's already a chat thread
    const existingThread = chatThreads.find(thread => 
      thread.participants.includes(user.id) && 
      thread.participants.includes(interaction.userId)
    );
    
    if (existingThread) {
      navigate(`/chat/${existingThread.id}`);
    } else {
      // Create new chat thread - in a real app, this would be an API call
      const newThreadId = `thread-${Date.now()}`;
      navigate(`/chat/${newThreadId}`);
    }
  };

  /**
   * Render user interaction item
   */
  const renderUserInteraction = (interaction: QuestionInteraction) => (
    <div 
      key={interaction.id}
      className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
    >
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer"
        onClick={() => handleUserProfileClick(interaction.userId)}
      >
        <Avatar className="w-12 h-12">
          <AvatarImage src={interaction.userAvatar} alt={interaction.userName} />
          <AvatarFallback>{interaction.userName[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-black">{interaction.userName}</span>
            {interaction.labels.map((label, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="text-xs bg-transparent border-gray-300 text-gray-600"
              >
                {label}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      {/* Chat icon - only show if user allows contact */}
      {interaction.allowsContact && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleChatClick(interaction)}
          className="w-10 h-10 rounded-full text-[#3ec6c6] hover:bg-[#3ec6c6] hover:text-white"
        >
          <MessageCircleIcon className="w-5 h-5" />
        </Button>
      )}
    </div>
  );

  // Handle edge cases
  if (!question) {
    return (
      <div className="px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-black mb-2">
              Question not available
            </h2>
            <p className="text-gray-600 mb-4">
              It may have been removed.
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format the time ago
  const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true });

  return (
    <>
      <style>{customStyles}</style>
      <div className="bg-[#f0efeb] min-h-screen">
        {/* Question Content */}
        <div className="px-4 py-6">
          <Card className="w-full bg-neutral-50 rounded-[20px] border-none shadow-sm">
            <CardContent className="p-5 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-[35px] h-[35px]">
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
                    <span className="font-medium text-[#484848] text-base">
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
              <div className="flex items-center justify-between gap-2">
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
                  <HandIcon className={`w-4 h-4 mr-2 ${question.isMeToo ? "text-orange-600" : ""}`} />
                  <span className="font-normal text-sm mr-1">Me too</span>
                  <span className="font-medium text-sm">{question.meTooCount}</span>
                </Button>

                {/* I Can Help */}
                <Button
                  variant="outline"
                  onClick={handleCanHelp}
                  disabled={createInteractionMutation.isPending}
                  className="h-[38px] px-3 py-[5px] rounded-[25px] bg-white shadow-[0px_2px_4px_#0000001a] border-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                >
                  <UsersIcon className="w-4 h-4 mr-2" />
                  <span className="font-normal text-sm mr-1">I can help</span>
                  <span className="font-medium text-sm">{question.canHelpCount}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs placeholder for sticky positioning */}
        <div ref={tabsPlaceholderRef} className="h-0" />

        {/* Tabs - becomes sticky */}
        <div 
          ref={tabsRef}
          className={`${
            isTabsSticky 
              ? 'fixed top-[90px] left-0 right-0 z-20 bg-[#f0efeb] shadow-sm' 
              : 'relative'
          } transition-all duration-200`}
        >
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "me_too" | "can_help")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-white mx-4 rounded-lg">
              <TabsTrigger 
                value="me_too" 
                className="flex items-center gap-2 data-[state=active]:bg-[#F9DF8E]"
              >
                <HandIcon className="w-4 h-4" />
                Me too {meTooInteractions.length}
              </TabsTrigger>
              <TabsTrigger 
                value="can_help"
                className="flex items-center gap-2 data-[state=active]:bg-[#F9DF8E]"
              >
                <UsersIcon className="w-4 h-4" />
                I can help {canHelpInteractions.length + privateHelpCount}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content based on active tab */}
        <div className="px-4 pb-6">
          <Card className="mt-4">
            <CardContent className="p-0">
              {activeTab === "me_too" && (
                <div>
                  {meTooInteractions.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {meTooInteractions.map(renderUserInteraction)}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <HandIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        It only takes one person to show up. For{" "}
                        <span className="font-medium">
                          {question.isAnonymous ? "them" : question.authorName}
                        </span>
                        , that might be you.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "can_help" && (
                <div>
                  {canHelpInteractions.length > 0 || privateHelpCount > 0 ? (
                    <div>
                      {canHelpInteractions.length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {canHelpInteractions.map(renderUserInteraction)}
                        </div>
                      )}
                      
                      {/* Private help offers message */}
                      {privateHelpCount > 0 && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                          <p className="text-sm text-gray-600 text-center">
                            and <span className="font-medium">{privateHelpCount} others</span> who reached out privately
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        It only takes one person to show up. For{" "}
                        <span className="font-medium">
                          {question.isAnonymous ? "them" : question.authorName}
                        </span>
                        , that might be you.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Suggest a feature section */}
        <div className="px-4 pb-6">
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl">✨</span>
            </div>
            <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
              Suggest a feature
            </button>
          </div>
        </div>
      </div>
    </>
  );
};