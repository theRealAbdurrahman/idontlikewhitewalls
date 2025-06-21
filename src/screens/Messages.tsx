import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircleIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAppStore } from "../stores/appStore";

/**
 * Messages screen component displaying chat threads
 */
export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { chatThreads, markMessagesRead } = useAppStore();

  const handleThreadClick = (threadId: string) => {
    markMessagesRead(threadId);
    navigate(`/messages/${threadId}`);
  };

  if (chatThreads.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">Messages</h1>
          <p className="text-gray-600">Your conversations will appear here</p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <MessageCircleIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500 text-center">
            When you offer to help someone or someone offers to help you, 
            your conversations will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black mb-2">Messages</h1>
        <p className="text-gray-600">Your conversations</p>
      </div>

      <div className="space-y-2">
        {chatThreads.map((thread) => {
          const otherParticipantIndex = thread.participantNames.findIndex(name => name !== "You");
          const otherParticipantName = thread.participantNames[otherParticipantIndex] || "Unknown";
          const otherParticipantAvatar = thread.participantAvatars[otherParticipantIndex];
          
          return (
            <Card
              key={thread.id}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleThreadClick(thread.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={otherParticipantAvatar} alt={otherParticipantName} />
                    <AvatarFallback>{otherParticipantName[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-black truncate">
                        {otherParticipantName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {thread.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                        {thread.unreadCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-red-500 text-white text-xs h-5 min-w-[20px] px-1 rounded-full"
                          >
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Question Context */}
                    {thread.questionTitle && (
                      <p className="text-xs text-gray-500 mb-1 truncate">
                        Re: {thread.questionTitle}
                      </p>
                    )}

                    {/* Last Message */}
                    {thread.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {thread.lastMessage.senderId === "user-123" ? "You: " : ""}
                        {thread.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};