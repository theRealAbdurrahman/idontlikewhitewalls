import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeftIcon,
  SendIcon, 
  ImageIcon, 
  MoreVerticalIcon,
  MapPinIcon,
  MicIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { 
  useCreateInteractionApiV1InteractionsPost 
} from "../api-client/api-client";
import { useCacheManager } from "../hooks/useCacheManager";
import { InteractionTarget, InteractionType } from "../api-client/models";
import { useAppStore } from "../stores/appStore";
import { useAuthStore } from "../stores/authStore";

/**
 * Chat screen component for individual conversations
 */
export const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { chatThreads, messages, addMessage, setMessages, questions, incrementQuestionHelpCount } = useAppStore();
  const { afterInteraction } = useCacheManager();
  
  const [newMessage, setNewMessage] = useState("");
  const [isPublicVisible, setIsPublicVisible] = useState(true); // Default: ON
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API mutation for creating interactions
  const createInteractionMutation = useCreateInteractionApiV1InteractionsPost();

  // Get questionId from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const questionId = searchParams.get('questionId');
  
  // Determine the current thread ID and mode
  const currentThreadId = id || "";
  const question = questionId ? questions.find(q => q.id === questionId) : null;
  
  // Check if we're in initial offer help mode
  const threadMessages = messages[currentThreadId] || [];
  const hasActualMessages = threadMessages.some(msg => msg.type !== "preview" && msg.senderId === user?.id);
  const isInitialOfferHelpMode = !!questionId && !hasActualMessages;
  
  const thread = chatThreads.find(t => t.id === currentThreadId);

  /**
   * Load initial messages for this thread
   */
  useEffect(() => {
    // Load messages for this thread
    if (currentThreadId && threadMessages.length === 0 && isInitialOfferHelpMode && question && user) {
      // Create initial question preview message for offer help mode
      const questionPreviewMessage = {
        id: `preview-${questionId}`,
        senderId: question.authorId,
        receiverId: user.id,
        questionId: question.id,
        content: `Question Preview: ${question.title}\n\n${question.description}${question.tags.length > 0 ? `\n\n${question.tags.join(' ')}` : ''}`,
        createdAt: question.createdAt,
        isRead: true,
        type: "preview" as const,
        isPublicVisible: false,
      };
      
      setMessages(currentThreadId, [questionPreviewMessage]);
    } else if (currentThreadId && threadMessages.length === 0 && !isInitialOfferHelpMode) {
      // Load mock messages for existing chat threads
      if (thread) {
        const mockMessages = [
          {
            id: "msg-1",
            senderId: "user-789",
            receiverId: "user-123",
            questionId: thread?.questionId,
            content: "Hi! I saw your question about AI/ML algorithms. I'd be happy to help review your recommendation system.",
            createdAt: "2025-01-15T10:00:00Z",
            isRead: true,
            type: "text" as const,
          },
          {
            id: "msg-2",
            senderId: "user-123",
            receiverId: "user-789",
            content: "That would be amazing! Thank you so much. I've been working on this for weeks and could really use a fresh perspective.",
            createdAt: "2025-01-15T10:05:00Z",
            isRead: true,
            type: "text" as const,
          },
          {
            id: "msg-3",
            senderId: "user-789",
            receiverId: "user-123",
            content: "I'd be happy to help review your recommendation algorithm. I have 5 years of experience with ML systems and have built several recommendation engines for e-commerce platforms.",
            createdAt: "2025-01-15T12:00:00Z",
            isRead: false,
            type: "text" as const,
          },
        ];
        setMessages(currentThreadId, mockMessages);
      }
    }
  }, [currentThreadId, threadMessages.length, setMessages, isInitialOfferHelpMode, question, user, thread]);

  /**
   * Scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  /**
   * Handle sending message
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentThreadId || !user) return;

    setIsSubmitting(true);

    try {
      // Determine receiver ID
      let receiverId = "";
      if (isInitialOfferHelpMode && question) {
        receiverId = question.authorId;
      } else if (thread) {
        receiverId = thread.participants.find(p => p !== user.id) || "";
      }

      // Create the message with visibility info if in offer help mode
      const messageData = {
        senderId: user.id,
        receiverId,
        questionId: isInitialOfferHelpMode ? questionId : thread?.questionId,
        content: newMessage.trim(),
        isRead: false,
        type: "text" as const,
        ...(isInitialOfferHelpMode && { isPublicVisible }),
      };

      addMessage(currentThreadId, messageData);

      // If in initial offer help mode, handle visibility and transition
      if (isInitialOfferHelpMode && question) {
        // Record the help interaction in the backend if public visible
        if (isPublicVisible) {
          try {
            await createInteractionMutation.mutateAsync({
              data: {
                user_id: user.id,
                target_type: InteractionTarget.question,
                target_id: question.id,
                interaction_type: InteractionType.i_can_help,
              }
            });
            console.log("Help interaction recorded successfully");
            
            // Invalidate caches to refresh question data and counts
            afterInteraction(question.id);
          } catch (error) {
            console.error("Failed to record help interaction:", error);
            // Continue with the flow even if API fails
          }
        }
        
        // Increment help count if public visible
        if (isPublicVisible) {
          incrementQuestionHelpCount(question.id, true);
        }
        
        // Navigate to the same chat without question parameter to exit offer help mode
        navigate(`/chat/${currentThreadId}`, { replace: true });
      }

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      // TODO: Show error toast to user
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle key press for sending message
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handle back navigation
   */
  const handleBackClick = () => {
    navigate(-1);
  };

  // Handle edge cases
  if (!user) {
    return (
      <div className="bg-[var(--ColorYellow_primary_colorYellow_100)] min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-black mb-2">Login Required</h1>
            <p className="text-gray-600 mb-4">Please log in to access chat.</p>
            <Button onClick={() => navigate("/login")}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInitialOfferHelpMode && !question) {
    return (
      <div className="bg-[var(--ColorYellow_primary_colorYellow_100)] min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-black mb-2">Question Not Found</h1>
            <p className="text-gray-600 mb-4">This question may have been removed or doesn't exist.</p>
            <Button onClick={handleBackClick}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine participant info
  let otherParticipantName = "Unknown";
  let otherParticipantAvatar = "";
  
  if (isInitialOfferHelpMode && question) {
    otherParticipantName = question.isAnonymous ? "Anonymous" : question.authorName;
    otherParticipantAvatar = question.isAnonymous ? "" : question.authorAvatar || "";
  } else if (thread) {
    const otherParticipantIndex = thread.participantNames.findIndex(name => name !== "You");
    otherParticipantName = thread.participantNames[otherParticipantIndex] || "Unknown";
    otherParticipantAvatar = thread.participantAvatars[otherParticipantIndex] || "";
  }

  return (
    <div className="bg-[var(--ColorYellow_primary_colorYellow_100)] min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex w-full h-[90px] items-center justify-between pt-10 pb-0 px-3.5 sticky top-0 bg-[var(--ColorYellow_primary_colorYellow_100)] z-10 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          className="w-[35px] h-[35px] rounded-full p-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1 mx-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherParticipantAvatar} alt={otherParticipantName} />
            <AvatarFallback>{otherParticipantName[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="font-semibold text-black">{otherParticipantName}</h1>
            {(isInitialOfferHelpMode ? question?.title : thread?.questionTitle) && (
              <p className="text-xs text-gray-500 truncate">
                Re: {isInitialOfferHelpMode ? question?.title : thread?.questionTitle}
              </p>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-[35px] h-[35px] rounded-full p-0"
        >
          <MoreVerticalIcon className="w-5 h-5" />
        </Button>
      </header>

      {/* Question Context */}
      {(isInitialOfferHelpMode ? question?.title : thread?.questionTitle) && (
        <Card className="mx-4 mt-4 mb-2 bg-[#fbfbfb] border border-gray-200">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-3">Question context:</p>
            
            <div className="space-y-3">
              {/* Question Title */}
              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {isInitialOfferHelpMode ? question?.title : thread?.questionTitle}
              </h3>
              
              {/* Question Description - only show in initial offer help mode when we have full question data */}
              {isInitialOfferHelpMode && question?.description && (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {question.description}
                </p>
              )}
              
              {/* Question Tags - only show in initial offer help mode when we have full question data */}
              {isInitialOfferHelpMode && question?.tags && question.tags.length > 0 && (
                <div className="flex items-start gap-2 flex-wrap">
                  {question.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-[#5B5B5B]" 
                      style={{ 
                        fontFamily: 'Fira Sans, sans-serif', 
                        fontSize: '12px',
                        fontWeight: 'normal'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Question Image - only show in initial offer help mode when we have full question data */}
              {isInitialOfferHelpMode && question?.image && (
                <div className="relative h-32 w-full rounded-lg overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt="Question attachment"
                    src={question.image}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visibility Toggle Section - Only show in initial offer help mode */}
      {isInitialOfferHelpMode && (
        <div className="p-4 m-3 rounded-xl bg-[#FBFBFB] border border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-black mb-1">
                Show others you said "I can Help".
              </p>
              <p className="text-xs text-gray-600">
                Your message will always remain private.
              </p>
            </div>
            <Switch
              checked={isPublicVisible}
              onCheckedChange={setIsPublicVisible}
              className="data-[state=checked]:bg-[#34C759]"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <div className="space-y-4">
          {threadMessages.map((message) => {
            // Skip preview messages in display
            if (message.type === "preview") return null;
            
            const isOwnMessage = message.senderId === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${isOwnMessage ? "order-2" : "order-1"}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      isOwnMessage
                        ? "bg-[#3ec6c6] text-white rounded-br-md"
                        : "bg-[#fbfbfb] text-black rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  
                  <p className={`text-xs text-gray-500 mt-1 ${
                    isOwnMessage ? "text-right" : "text-left"
                  }`}>
                    {/* Show visibility status for the first user message in offer help mode */}
                    {isOwnMessage && message.isPublicVisible !== undefined && (
                      <span className="block text-xs text-gray-500 mb-1">
                        {message.isPublicVisible 
                          ? "Others can see you offered to help. Your message remains private."
                          : "Only the question author can see this."}
                      </span>
                    )}
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 bg-[#f0efeb] border-t border-gray-200">
        <div className="flex flex-col gap-2">
          {/* Text Input */}
          <div className="relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isInitialOfferHelpMode 
                ? `This is how I can help ${question?.isAnonymous ? 'them' : question?.authorName}...`
                : "Type a message..."}
              rows={1}
              className="w-full p-3 border border-gray-300 rounded-[25px] focus:outline-none focus:ring-2 focus:ring-[#5ae0e0] focus:border-transparent resize-none max-h-24 bg-[#fbfbfb]"
              style={{ minHeight: "44px" }}
            />
          </div>
          
          {/* Rich Input Icons and Send Button */}
          <div className="flex items-center justify-between px-2">
            <div className="flex gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="p-0 text-gray-500 hover:text-gray-700"
                onClick={() => console.log("Location sharing not implemented")}
              >
                <MapPinIcon className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="p-0 text-gray-500 hover:text-gray-700"
                onClick={() => console.log("Image upload not implemented")}
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="p-0 text-gray-500 hover:text-gray-700"
                onClick={() => console.log("Voice message not implemented")}
              >
                <MicIcon className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSubmitting}
              className="px-6 py-2 h-10 bg-[#ffb300] hover:bg-[#ffd580] text-black rounded-full font-medium disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : isInitialOfferHelpMode ? "Send" : (
                <>
                  <SendIcon className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};