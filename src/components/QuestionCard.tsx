import React from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreVerticalIcon, BookmarkIcon, ArrowUpIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
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
  const { toggleUpvote, toggleMeToo, toggleBookmark } = useAppStore();

  const handleUpvote = () => {
    toggleUpvote(question.id);
  };

  const handleMeToo = () => {
    toggleMeToo(question.id);
  };

  const handleBookmark = () => {
    toggleBookmark(question.id);
  };

  const handleCanHelp = () => {
    // TODO: Navigate to messaging or show help modal
    console.log("Can help clicked for question:", question.id);
  };

  // Format the time ago
  const timeAgo = formatDistanceToNow(new Date(question.createdAt), { addSuffix: true });

  return (
    <>
      <style>{customStyles}</style>
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
          <div className="flex items-center justify-between gap">
            {/* Upvote */}
            <Button
              variant="outline"
              onClick={handleUpvote}
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
              onClick={handleCanHelp}
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