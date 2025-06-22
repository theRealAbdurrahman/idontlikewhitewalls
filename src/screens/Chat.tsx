import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useAppStore } from "../stores/appStore";
import { useAuthStore } from "../stores/authStore";

/**
 * Chat screen component for individual conversations
 */
export const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chatThreads, messages, addMessage, setMessages } = useAppStore();
  
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const thread = chatThreads.find(t => t.id === id);
  const threadMessages = messages[id || ""] || [];

  /**
   * Load initial messages for this thread
   */
  useEffect(() => {
    // Load messages for this thread (mock data)
    if (id && threadMessages.length === 0) {
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
      setMessages(id, mockMessages);
    }
  }, [id, threadMessages.length, setMessages, thread?.questionId]);

  /**
   * Scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  /**
   * Handle sending message
   */
  const handleSendMessage = () => {
    if (!newMessage.trim() || !id) return;

    addMessage(id, {
      senderId: user?.id || "user-123",
      receiverId: thread?.participants.find(p => p !== user?.id) || "",
      questionId: thread?.questionId,
      content: newMessage.trim(),
      isRead: false,
      type: "text",
    });

    setNewMessage("");
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
  if (!thread || !user) {
    return (
      <div className="bg-[var(--ColorYellow_primary_colorYellow_100)] min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-black mb-2">Chat Not Found</h1>
            <p className="text-gray-600 mb-4">This conversation doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/messages")}>
              Back to Messages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const otherParticipantIndex = thread.participantNames.findIndex(name => name !== "You");
  const otherParticipantName = thread.participantNames[otherParticipantIndex] || "Unknown";
  const otherParticipantAvatar = thread.participantAvatars[otherParticipantIndex];

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
            {thread.questionTitle && (
              <p className="text-xs text-gray-500 truncate">
                Re: {thread.questionTitle}
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
      {thread.questionTitle && (
        <Card className="mx-4 mt-4 mb-2 bg-[var(--ColorYellow_primary_colorYellow_50)]">
          <CardContent className="p-3">
            <p className="text-sm text-gray-600 mb-1">Question context:</p>
            <p className="text-sm font-medium text-black">{thread.questionTitle}</p>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <div className="space-y-4">
          {threadMessages.map((message) => {
            const isOwnMessage = message.senderId === user.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${isOwnMessage ? "order-2" : "order-1"}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      isOwnMessage
                        ? "bg-[var(--ColorTurquoise_secondaryTurquoise_600)] text-white rounded-br-md"
                        : "bg-[var(--ColorYellow_primary_colorYellow_50)] text-black rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  
                  <p className={`text-xs text-gray-500 mt-1 ${
                    isOwnMessage ? "text-right" : "text-left"
                  }`}>
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
      <div className="p-4 bg-[var(--ColorYellow_primary_colorYellow_100)] border-t border-gray-200">
        <div className="flex flex-col gap-2">
          {/* Text Input */}
          <div className="relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full p-3 border border-gray-300 rounded-[25px] focus:outline-none focus:ring-2 focus:ring-[var(--ColorTurquoise_secondaryTurquoise_600)] focus:border-transparent resize-none max-h-24 bg-[var(--ColorYellow_primary_colorYellow_50)]"
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
              disabled={!newMessage.trim()}
              className="px-6 py-2 h-10 bg-[var(--ColorYellow_primary_colorYellow_900)] hover:bg-[var(--ColorYellow_primary_colorYellow_800)] text-black rounded-full font-medium disabled:opacity-50"
            >
              <SendIcon className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};