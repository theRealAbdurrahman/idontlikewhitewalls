import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SendIcon, ImageIcon, MoreVerticalIcon } from "lucide-react";
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

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  if (!thread || !user) {
    return (
      <div className="px-4 py-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-black mb-2">Chat Not Found</h1>
          <p className="text-gray-600 mb-4">This conversation doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/messages")}>
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  const otherParticipantIndex = thread.participantNames.findIndex(name => name !== "You");
  const otherParticipantName = thread.participantNames[otherParticipantIndex] || "Unknown";
  const otherParticipantAvatar = thread.participantAvatars[otherParticipantIndex];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !id) return;

    addMessage(id, {
      senderId: user.id,
      receiverId: thread.participants.find(p => p !== user.id) || "",
      questionId: thread.questionId,
      content: newMessage.trim(),
      isRead: false,
      type: "text",
    });

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-[#f0efeb] min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex w-full h-[90px] items-center justify-between pt-10 pb-0 px-3.5 sticky top-0 bg-[#f0efeb] z-10 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
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
          className="w-10 h-10 rounded-full"
        >
          <MoreVerticalIcon className="w-5 h-5" />
        </Button>
      </header>

      {/* Question Context */}
      {thread.questionTitle && (
        <Card className="mx-4 mt-4 mb-2">
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
                        ? "bg-[#3ec6c6] text-white rounded-br-md"
                        : "bg-white text-black rounded-bl-md shadow-sm"
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
      <div className="p-4 bg-[#f0efeb] border-t border-gray-200">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full flex-shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full p-3 pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent resize-none max-h-24"
              style={{ minHeight: "44px" }}
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="absolute right-2 bottom-2 w-8 h-8 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white rounded-full p-0 disabled:opacity-50"
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};