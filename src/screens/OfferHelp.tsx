import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon, 
  SendIcon, 
  ImageIcon, 
  MicIcon, 
  MapPinIcon,
  CalendarIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { useAppStore } from "../stores/appStore";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../hooks/use-toast";
import { Message } from "../stores/appStore";

/**
 * Interface for help message with visibility toggle - extends base Message
 */
interface HelpMessage extends Message {
  isPublicVisible: boolean; // Whether others can see this user offered help
}

/**
 * OfferHelp screen component for private messaging when offering help
 */
export const OfferHelp: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { questions, chatThreads, messages, addMessage, setMessages } = useAppStore();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState("");
  const [isPublicVisible, setIsPublicVisible] = useState(true); // Default: ON
  const [isLoading, setIsLoading] = useState(false);
  const [hasAlreadyOfferedHelp, setHasAlreadyOfferedHelp] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find the question
  const question = questions.find(q => q.id === questionId);
  
  // Create thread ID for this help conversation
  const threadId = `help-${questionId}-${user?.id}`;
  const threadMessages = messages[threadId] || [];

  /**
   * Scroll to bottom of messages
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  /**
   * Initialize the conversation with question preview
   */
  useEffect(() => {
    if (question && user && threadMessages.length === 0) {
      // Create initial question preview message
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
      
      setMessages(threadId, [questionPreviewMessage]);
    }
  }, [question, user, threadId, threadMessages.length, setMessages]);

  /**
   * Check if user has already offered help
   */
  useEffect(() => {
    // TODO: Check with backend if user has already sent a help message for this question
    // For now, check if there are non-preview messages from this user
    const userMessages = threadMessages.filter(
      msg => msg.senderId === user?.id && msg.type !== "preview"
    );
    setHasAlreadyOfferedHelp(userMessages.length > 0);
  }, [threadMessages, user?.id]);

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * Handle sending help message
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !question || !user || isLoading) return;

    setIsLoading(true);

    try {
      // Create help message with visibility toggle
      const helpMessage: HelpMessage = {
        id: `help-${Date.now()}`,
        senderId: user.id,
        receiverId: question.authorId,
        questionId: question.id,
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
        type: "text",
        isPublicVisible: isPublicVisible,
      };

      // Add message to local state
      addMessage(threadId, helpMessage);

      // TODO: Send to backend API
      // await createHelpMessageApiCall(helpMessage);

      // TODO: If isPublicVisible is true, increment the "I can help" counter
      // await updateQuestionHelpCountApiCall(question.id, user.id, isPublicVisible);

      // Update UI state
      setNewMessage("");
      setHasAlreadyOfferedHelp(true);

      // Show success feedback
      toast({
        title: "Message sent!",
        description: `Your help offer has been sent to ${question.authorName}.`,
      });

      // Navigate to regular chat after sending
      setTimeout(() => {
        navigate(`/messages/${threadId}`);
      }, 1000);

    } catch (error) {
      console.error("Failed to send help message:", error);
      toast({
        title: "Message failed to send",
        description: "We lost you for a bit and the message couldn't be sent. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  // Handle edge cases
  if (!question) {
    return (
      <div className="bg-[#f0efeb] min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-black mb-2">
              Question Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              This question has been resolved and, or, is no longer active.
            </p>
            <Button onClick={handleBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#f0efeb] min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-black mb-2">
              Login Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please log in to offer help on this question.
            </p>
            <Button onClick={() => navigate("/login")}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-[#f0efeb] min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex w-full h-[90px] items-center justify-between pt-10 pb-0 px-3.5 sticky top-0 bg-[#f0efeb] z-10 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="w-[35px] h-[35px] rounded-full p-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        
        <h1 className="text-lg font-semibold text-black">
          I can help
        </h1>
        
        <div className="w-[35px]" />
      </header>

      {/* Question Preview Card */}
      <Card className="mx-4 mt-4 mb-2 border-l-4 border-l-[var(--ColorTurquoise_secondaryTurquoise_600)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={question.isAnonymous ? undefined : question.authorAvatar} 
                alt={question.isAnonymous ? "Anonymous" : question.authorName} 
              />
              <AvatarFallback>
                {question.isAnonymous ? "?" : question.authorName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-semibold text-black text-sm mb-1">
                {question.isAnonymous ? "Anonymous" : question.authorName}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                {question.eventName && (
                  <>
                    <span>{question.eventName}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-black text-sm leading-tight">
              {question.title}
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              {question.description}
            </p>
            
            {question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {question.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="text-xs text-[var(--ColorTurquoise_secondaryTurquoise_700)] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <div className="space-y-4">
          {threadMessages
            .filter(msg => msg.type !== "preview" && msg.senderId === user.id)
            .map((message) => (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%]">
                  <div className="bg-[var(--ColorTurquoise_secondaryTurquoise_600)] text-white p-3 rounded-2xl rounded-br-md">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {/* Show visibility status under sent message */}
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">
                      {(message as HelpMessage).isPublicVisible 
                        ? "Others can see you offered to help. Your message will remain private."
                        : "Only the question author can see this."}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Section */}
      {!hasAlreadyOfferedHelp && (
        <div className="p-4 bg-[#f0efeb] border-t border-gray-200">
          {/* Visibility Toggle */}
          <div className="mb-4 p-3 bg-white rounded-lg">
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
                className="data-[state=checked]:bg-[var(--ColorTurquoise_secondaryTurquoise_600)]"
              />
            </div>
          </div>
          
          {/* Message Composer */}
          <div className="flex flex-col gap-2">
            {/* Text Input */}
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`This is how I can help ${question.isAnonymous ? 'them' : question.authorName}...`}
                rows={1}
                className="w-full p-3 pr-12 border border-gray-300 rounded-[25px] focus:outline-none focus:ring-2 focus:ring-[var(--ColorTurquoise_secondaryTurquoise_600)] focus:border-transparent resize-none max-h-24 bg-white"
                style={{ minHeight: "44px" }}
                disabled={isLoading}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="absolute right-2 bottom-2 w-8 h-8 bg-[var(--ColorYellow_primary_colorYellow_800)] hover:bg-[var(--ColorYellow_primary_colorYellow_900)] text-black rounded-full p-0 disabled:opacity-50"
              >
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Rich Input Icons */}
            <div className="flex gap-4 px-2">
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
          </div>
        </div>
      )}
      
      {/* Already Offered Help Message */}
      {hasAlreadyOfferedHelp && (
        <div className="p-4 bg-[#f0efeb] border-t border-gray-200">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-sm text-gray-600">
                You've already offered to help with this question. 
                {question.authorName} will receive your message and can respond to start a conversation.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};