import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeftIcon,
  UserPlusIcon,
  MessageCircleIcon,
  ExternalLinkIcon,
  LinkedinIcon,
  InstagramIcon,
  EditIcon,
  PlusIcon,
  HashIcon,
  TrashIcon,
  EditIcon as Edit2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShareIcon,
  MoreVerticalIcon,
  HandshakeIcon,
  FileTextIcon,
  LinkIcon,
  GridIcon,
  Link2
} from "lucide-react";
import {
  useUserProfile,
  UserProfile as ApiUserProfile
} from "../api-client/api-client";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { StickyNote } from "../components/ui/sticky-note";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";
import { useToast } from "../hooks/use-toast";

/**
 * Interface for user profile data used in the component
 */
interface UserProfile {
  id: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  connectDetails?: string;
  avatar?: string;
  website?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  verified: boolean;
  isConnected: boolean;
  mutualConnections: number;
  joinedAt: string;
  profileVersion: "standard" | "funky";
  virtues?: string[];
}

/**
 * Interface for private notes
 */
interface PrivateNote {
  id: string;
  content: string;
  hashtags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Profile view types for swipeable interface
 */
type ProfileViewType = "standard" | "funky";

/**
 * Props for the CollapsibleText component
 */
interface CollapsibleTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  showIndicator?: boolean;
}

/**
 * CollapsibleText component that shows limited lines initially and expands on click
 */
const CollapsibleText: React.FC<CollapsibleTextProps> = ({
  text,
  maxLines = 4,
  className = "",
  showIndicator = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const measuringRef = useRef<HTMLDivElement>(null);

  /**
   * Check if text needs truncation by comparing full height vs limited height
   */
  useEffect(() => {
    const checkTruncation = () => {
      if (!textRef.current || !measuringRef.current) return;

      const fullHeight = measuringRef.current.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(measuringRef.current).lineHeight, 10);
      const maxHeight = lineHeight * maxLines;

      setNeedsTruncation(fullHeight > maxHeight);
    };

    // Check truncation after component mounts and text changes
    checkTruncation();

    // Also check on window resize in case layout changes
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text, maxLines]);

  /**
   * Toggle expanded state
   */
  const handleToggle = () => {
    if (needsTruncation) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="collapsible-text-container">
      {/* Hidden measuring element to determine full height */}
      <div
        ref={measuringRef}
        className={`collapsible-text-measuring ${className}`}
        aria-hidden="true"
      >
        {text}
      </div>

      {/* Visible text element */}
      <div
        ref={textRef}
        className={`collapsible-text ${className} ${needsTruncation ? 'truncatable' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
        onClick={handleToggle}
        style={{
          cursor: needsTruncation ? 'pointer' : 'default',
          '--max-lines': maxLines
        } as React.CSSProperties}
      >
        {text}

        {/* Expand/Collapse Indicator */}
        {needsTruncation && showIndicator && (
          <div className="collapsible-text-indicator">
            {isExpanded ? (
              <div className="indicator-content">
                <span className="indicator-text">Show less</span>
                <ChevronUpIcon className="indicator-icon" />
              </div>
            ) : (
              <div className="indicator-content">
                <span className="indicator-text">Show more</span>
                <ChevronDownIcon className="indicator-icon" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Custom styles for animations, transitions, swipe functionality, and collapsible text
 */
const customStyles = `
  .profile-collapse {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .note-card {
    transition: all 0.2s ease-out;
  }
  
  .note-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .virtue-tag {
    animation: float 3s ease-in-out infinite;
  }
  
  .virtue-tag:nth-child(2) {
    animation-delay: -1s;
  }
  
  .virtue-tag:nth-child(3) {
    animation-delay: -2s;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-5px) rotate(1deg); }
  }
  
  .profile-header-sticky {
    backdrop-filter: blur(20px);
    background: rgba(240, 239, 235, 0.95);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  
  .social-icon {
    transition: all 0.2s ease-out;
  }
  
  .social-icon:hover {
    transform: scale(1.1);
  }

  /* Swipeable profile section styles */
  .swipeable-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    touch-action: pan-y pinch-zoom;
  }
  
  .swipeable-content {
    display: flex;
    width: 200%;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .swipeable-content.swiping {
    transition: none;
  }
  
  .profile-view {
    width: 50%;
    flex-shrink: 0;
  }
  
  .profile-indicators {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
    margin-bottom: 8px;
  }
  
  .profile-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #d1d5db;
    transition: all 0.2s ease-out;
    cursor: pointer;
  }
  
  .profile-indicator.active {
    background-color: #3ec6c6;
    transform: scale(1.2);
  }
  
  .profile-indicator:hover {
    background-color: #9ca3af;
  }
  
  .profile-indicator.active:hover {
    background-color: #2ea5a5;
  }
  
  .swipe-nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease-out;
    z-index: 10;
    opacity: 0.7;
  }
  
  .swipe-nav-button:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .swipe-nav-button.left {
    left: 12px;
  }
  
  .swipe-nav-button.right {
    right: 12px;
  }
  
  /* Hide nav buttons on mobile to prioritize touch gestures */
  @media (max-width: 768px) {
    .swipe-nav-button {
      display: none;
    }
  }
  
  .profile-view-label {
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 500;
  }

  /* Collapsible text component styles */
  .collapsible-text-container {
    position: relative;
  }
  
  .collapsible-text-measuring {
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: 100%;
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.6;
  }
  
  .collapsible-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.6;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .collapsible-text.truncatable {
    user-select: none;
  }
  
  .collapsible-text.truncatable:hover {
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    padding: 8px;
    margin: -8px;
    margin-top: 16px;
  }
  
  .collapsible-text.collapsed.truncatable {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--max-lines);
    overflow: hidden;
    max-height: calc(1.6em * var(--max-lines));
  }
  
  .collapsible-text.expanded {
    display: block;
    max-height: none;
    overflow: visible;
  }
  
  .collapsible-text-indicator {
    display: inline-flex;
    align-items: center;
    margin-top: 8px;
    padding: 4px 8px;
    border-radius: 20px;
    background-color: rgba(62, 198, 198, 0.1);
    color: #3ec6c6;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease-out;
    cursor: pointer;
    border: 1px solid rgba(62, 198, 198, 0.2);
  }
  
  .collapsible-text-indicator:hover {
    background-color: rgba(62, 198, 198, 0.15);
    border-color: rgba(62, 198, 198, 0.3);
    transform: translateY(-1px);
  }
  
  .indicator-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .indicator-text {
    font-size: 12px;
    font-weight: 500;
  }
  
  .indicator-icon {
    width: 14px;
    height: 14px;
    transition: transform 0.2s ease-out;
  }
  
  .collapsible-text.expanded .indicator-icon {
    transform: rotate(180deg);
  }

  /* Base connect details text styling to preserve line breaks */
  .connect-details-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.6;
  }
  
  .profile-content-shadow {
    box-shadow: 0 2px 16px rgba(0,0,0,0.04);
  }
  
  .action-button-tooltip {
    background: #333333;
    color: white;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 4px;
    position: relative;
  }
  
  .action-button-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border-width: 4px;
    border-style: solid;
    border-color: #333333 transparent transparent transparent;
  }
  
  .minimalist-action-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    border: 1px solid #E0E0E0;
    color: #424242;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }
  
  .minimalist-action-button:hover {
    background: #F5F5F5;
    transform: translateY(-0.5px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .minimalist-action-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px #FFE066;
  }
  
  .minimalist-action-button.primary {
    background: #FFE066;
    border-color: #FFE066;
    color: #424242;
  }
  
  .minimalist-action-button.primary:hover {
    background: #FFD93D;
    border-color: #FFD93D;
  }
  
  .minimalist-action-button.linkedin {
    color: #0077b5;
  }
  
  .minimalist-action-button.linkedin:hover {
    background: #E7F3FF;
    border-color: #0077b5;
  }
`;

/**
 * Default placeholder text for connectDetails when not available
 */
const DEFAULT_CONNECT_DETAILS = "Hi there! I'm excited to connect with others who share my interests in technology and innovation. Let's collaborate and create something amazing together. Hi there! I'm excited to connect with others who share my interests in technology and innovation. Let's collaborate and create something amazing together. Hi there! I'm excited to connect with others who share my interests in technology and innovation. Let's collaborate and create something amazing together.";

/**
 * Transform API UserProfile to component UserProfile interface
 * Now uses bio field as connectDetails from signup step 2
 */
const transformApiUserToProfile = (apiUser: ApiUserProfile): UserProfile => {
  return {
    id: apiUser.id,
    name: `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim() || 'Unknown User',
    title: apiUser.title || undefined,
    company: undefined, // Not available in API yet
    location: undefined, // Not available in API yet  
    // Use bio field as connectDetails from signup step 2
    connectDetails: apiUser.connectDetails && apiUser.connectDetails.trim() ? apiUser.connectDetails : DEFAULT_CONNECT_DETAILS,
    avatar: apiUser.profile_picture || undefined,
    website: undefined, // Not available in API yet
    linkedinUrl: apiUser.linkedin_url || undefined,
    instagramUrl: undefined, // Not available in API yet
    tiktokUrl: undefined, // Not available in API yet
    verified: false, // Default value - could be enhanced later
    isConnected: false, // Default value - would need connection status API
    mutualConnections: Math.floor(Math.random() * 20), // Mock value for now
    joinedAt: apiUser.created_at,
    profileVersion: "standard" as const, // Default profile version
    virtues: ["Creative", "Innovative", "Collaborative", "Authentic", "Empathetic", "Visionary"], // Mock virtues for funky profile
  };
};

/**
 * Utility function to safely render connectDetails with proper line breaks
 * @param connectDetails - The connectDetails text from the user profile
 * @returns The text to display, with fallback to default placeholder
 */
const renderConnectDetails = (connectDetails?: string): string => {
  // Handle undefined, null, or empty strings
  if (!connectDetails || connectDetails.trim() === '') {
    return DEFAULT_CONNECT_DETAILS;
  }

  // Return the connectDetails as-is to preserve original formatting
  return connectDetails.trim();
};

/**
 * Swipeable Profile Section Component
 */
interface SwipeableProfileProps {
  profileUser: UserProfile;
  currentProfileView: ProfileViewType;
  onProfileViewChange: (view: ProfileViewType) => void;
  onConnect: () => void;
  onMessage: () => void;
  setIsAddNoteOpen: (isOpen: boolean) => void;
}

const SwipeableProfile: React.FC<SwipeableProfileProps> = ({
  profileUser,
  currentProfileView,
  onProfileViewChange,
  onConnect,
  onMessage,
  setIsAddNoteOpen
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const { toast } = useToast();

  /**
   * Handle touch start for swipe gestures
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);

    if (contentRef.current) {
      contentRef.current.classList.add('swiping');
    }
  };

  /**
   * Handle touch move for swipe gestures
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    setCurrentX(e.touches[0].clientX);
    const deltaX = e.touches[0].clientX - startX;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const maxTranslate = containerWidth * 0.3; // Limit swipe distance

    // Calculate new translate position
    let newTranslateX = deltaX;
    if (currentProfileView === "funky") {
      newTranslateX = -containerWidth + deltaX;
    }

    // Apply resistance at boundaries
    if (newTranslateX > maxTranslate) {
      newTranslateX = maxTranslate;
    } else if (newTranslateX < -containerWidth - maxTranslate) {
      newTranslateX = -containerWidth - maxTranslate;
    }

    setTranslateX(newTranslateX);
  };

  /**
   * Handle touch end to complete or cancel swipe
   */
  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (contentRef.current) {
      contentRef.current.classList.remove('swiping');
    }

    const deltaX = currentX - startX;
    const threshold = 50; // Minimum swipe distance to trigger change

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentProfileView === "funky") {
        // Swipe right - go to standard
        onProfileViewChange("standard");
      } else if (deltaX < 0 && currentProfileView === "standard") {
        // Swipe left - go to funky
        onProfileViewChange("funky");
      }
    }

    // Reset translate position
    setTranslateX(0);
  };

  /**
   * Handle mouse events for desktop swipe simulation
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);

    if (contentRef.current) {
      contentRef.current.classList.add('swiping');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setCurrentX(e.clientX);
    const deltaX = e.clientX - startX;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const maxTranslate = containerWidth * 0.3;

    let newTranslateX = deltaX;
    if (currentProfileView === "funky") {
      newTranslateX = -containerWidth + deltaX;
    }

    if (newTranslateX > maxTranslate) {
      newTranslateX = maxTranslate;
    } else if (newTranslateX < -containerWidth - maxTranslate) {
      newTranslateX = -containerWidth - maxTranslate;
    }

    setTranslateX(newTranslateX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (contentRef.current) {
      contentRef.current.classList.remove('swiping');
    }

    const deltaX = currentX - startX;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentProfileView === "funky") {
        onProfileViewChange("standard");
      } else if (deltaX < 0 && currentProfileView === "standard") {
        onProfileViewChange("funky");
      }
    }

    setTranslateX(0);
  };

  /**
   * Calculate transform position based on current view
   */
  const getTransformValue = () => {
    const baseTransform = currentProfileView === "standard" ? 0 : -50;
    const swipeOffset = isDragging ? (translateX / (containerRef.current?.offsetWidth || 1)) * 50 : 0;
    return `translateX(${baseTransform + swipeOffset}%)`;
  };

  const handleLinkedInProfile = () => {
    if (profileUser.linkedinUrl) {
      window.open(profileUser.linkedinUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "LinkedIn profile not available",
        description: "This user hasn't linked their LinkedIn profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-4 pb-6">

      <div
        ref={containerRef}
        className="swipeable-container relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Navigation buttons for desktop */}
        <button
          className="swipe-nav-button left"
          onClick={() => onProfileViewChange("standard")}
          disabled={currentProfileView === "standard"}
          style={{ opacity: currentProfileView === "standard" ? 0.3 : 0.7 }}
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>

        <button
          className="swipe-nav-button right"
          onClick={() => onProfileViewChange("funky")}
          disabled={currentProfileView === "funky"}
          style={{ opacity: currentProfileView === "funky" ? 0.3 : 0.7 }}
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>

        <div
          ref={contentRef}
          className="swipeable-content"
          style={{ transform: getTransformValue() }}
        >
          {/* Standard Profile View */}
          <div className="profile-view">
            <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20 ring-4 ring-gray-100">
                      <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-100 to-gray-200">
                        {profileUser.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-gray-200 hover:bg-gray-50"
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                      {profileUser.verified && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {profileUser.title && profileUser.company && (
                      <p className="text-gray-600 mb-1">
                        {profileUser.title} at {profileUser.company}
                      </p>
                    )}

                    {profileUser.location && (
                      <p className="text-gray-500 text-sm mb-3">{profileUser.location}</p>
                    )}
                    {/* TODO: add the virtues and tags here */}

                  </div>
                </div>

                {/* Action Buttons - Enhanced with minimalistic design */}
                <div className="flex justify-center gap-4 mt-6">
                  <TooltipProvider>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddNoteOpen(true)}
                          className="label-button flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 border-dashed"
                          aria-label="Add custom connection preference"
                        >
                          <PlusIcon className="w-4 h-4" /> add note
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="action-button-tooltip">
                        add note
                      </TooltipContent>
                    </Tooltip>
                    {/* Message Button */}
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onMessage}
                          className="minimalist-action-button primary"
                          aria-label="Send message"
                        >
                          <MessageCircleIcon className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="action-button-tooltip">
                        Message
                      </TooltipContent>
                    </Tooltip>

                    {/* Connect Button */}
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onConnect}
                          className="minimalist-action-button"
                          aria-label="Connect with user"
                        >
                          <UserPlusIcon className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="action-button-tooltip">
                        Connect
                      </TooltipContent>
                    </Tooltip>

                    {/* LinkedIn Profile Button */}
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleLinkedInProfile}
                          className="minimalist-action-button linkedin"
                          aria-label="View LinkedIn profile"
                          disabled={!profileUser.linkedinUrl}
                        >
                          <LinkedinIcon className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="action-button-tooltip">
                        LinkedIn Profile
                      </TooltipContent>
                    </Tooltip>

                  </TooltipProvider>
                </div>

                {/* CollapsibleText Section - Updated to use CollapsibleText component */}
                <CollapsibleText
                  text={renderConnectDetails(profileUser.connectDetails)}
                  maxLines={4}
                  className="connect-details-text text-gray-700 leading-relaxed mt-4"
                  showIndicator={false}
                />

                {/* Additional Information Section with Second CollapsibleText */}
                <div className="space-y-2 mt-6">
                  <h3 className="text-sm font-semibold text-gray-900">Professional Background</h3>
                  <CollapsibleText
                    text="I'm a passionate product manager with over 8 years of experience in the tech industry. I've led cross-functional teams to deliver innovative solutions that have impacted millions of users. My expertise spans product strategy, user experience design, data analytics, and agile development methodologies. I'm particularly interested in emerging technologies like AI and machine learning, and how they can be leveraged to create more personalized and efficient user experiences. I believe in building products that not only solve real problems but also delight users and drive business growth."
                    maxLines={3}
                    className="text-gray-700 text-sm leading-relaxed"
                    showIndicator={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funky Profile View */}
          <div className="profile-view">
            <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-2xl border-2 border-dashed border-purple-200 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="w-24 h-24 ring-4 ring-white shadow-lg">
                      <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {profileUser.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                      ✨
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">{profileUser.name}</h1>
                  {/* <p className="text-purple-600 font-semibold mb-4">What lights you up outside of work?</p> */}

                  {/* Social Media Links */}
                  <div className="flex justify-center gap-3 mb-6">
                    {profileUser.instagramUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(profileUser.instagramUrl, '_blank')}
                        className="social-icon text-pink-600 hover:bg-pink-50 border-pink-200"
                      >
                        <InstagramIcon className="w-5 h-5" />
                      </Button>
                    )}
                    {profileUser.tiktokUrl && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(profileUser.tiktokUrl, '_blank')}
                        className="social-icon text-black hover:bg-gray-50"
                      >
                        <span className="font-bold text-sm">TT</span>
                      </Button>
                    )}
                  </div>

                  {/* CollapsibleText for Funky Profile - Also updated to use CollapsibleText component */}
                  <div className="mb-6">
                    {/* <CollapsibleText
                      text={renderConnectDetails(profileUser.connectDetails)}
                      maxLines={4}
                      className="connect-details-text text-gray-700 leading-relaxed"
                      showIndicator={false}
                    /> */}
                  </div>

                  {/* Virtue Tags using StickyNote */}
                  {profileUser.virtues && profileUser.virtues.length > 0 && (
                    <div className="flex justify-center gap-4 flex-wrap mb-6">
                      {profileUser.virtues.slice(0, 6).map((virtue, index) => (
                        <div key={virtue} className={`virtue-tag`}>
                          <StickyNote
                            content={virtue}
                            backgroundColor={
                              index % 4 === 0 ? "#FFE066" :
                                index % 4 === 1 ? "#FF6B6B" :
                                  index % 4 === 2 ? "#4ECDC4" : "#95E1D3"
                            }
                            width={80}
                            height={60}
                            rotation={index % 2 === 0 ? 5 : -5}
                            className="text-xs font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={onMessage}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <MessageCircleIcon className="w-4 h-4 mr-2" />
                    Message
                  </Button>

                  <Button
                    onClick={onConnect}
                    variant="outline"
                    className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                    disabled={profileUser.isConnected}
                  >
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    {profileUser.isConnected ? "Connected" : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile View Indicators */}
      <div className="profile-indicators">
        <div
          className={`profile-indicator ${currentProfileView === "standard" ? "active" : ""}`}
          onClick={() => onProfileViewChange("standard")}
          aria-label="Switch to professional profile view"
        />
        <div
          className={`profile-indicator ${currentProfileView === "funky" ? "active" : ""}`}
          onClick={() => onProfileViewChange("funky")}
          aria-label="Switch to personal profile view"
        />
      </div>
    </div>
  );
};

/**
 * ProfilePage component for viewing user profiles with dedicated API integration
 */
export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { questions } = useAppStore();
  const { toast } = useToast();

  // Local state
  const [activeTab, setActiveTab] = useState<"questions" | "notes">("questions");
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [userQuestions, setUserQuestions] = useState<any[]>([]);
  const [privateNotes, setPrivateNotes] = useState<PrivateNote[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<PrivateNote | null>(null);

  // New state for swipeable profile views
  const [currentProfileView, setCurrentProfileView] = useState<ProfileViewType>("standard");

  // Refs for scroll behavior
  const headerRef = useRef<HTMLDivElement>(null);
  const profileSectionRef = useRef<HTMLDivElement>(null);

  // Fetch user profile from API using the new dedicated hook (React Query v5 compatible)
  const {
    data: userProfileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useUserProfile(id);

  /**
   * Handle success and error cases using useEffect (React Query v5 pattern)
   */
  useEffect(() => {
    if (userProfileData) {
      console.log("✅ User profile loaded successfully:", userProfileData);
    }
  }, [userProfileData]);

  useEffect(() => {
    if (profileError) {
      console.error("❌ Failed to load user profile:", profileError);
    }
  }, [profileError]);

  /**
   * Load and transform user profile data from API
   */
  useEffect(() => {
    if (!id) {
      console.error("❌ No user ID provided in URL params");
      return;
    }

    if (profileLoading) {
      console.log("🔄 Loading user profile from API...");
      return;
    }

    if (profileError) {
      console.error("❌ Error loading user profile:", profileError);
      // Error is handled by the error state below
      return;
    }

    if (userProfileData) {
      console.log("📋 Transforming API user profile data:", userProfileData);

      // Transform API user data to our profile format
      const transformedProfile = transformApiUserToProfile(userProfileData);
      setProfileUser(transformedProfile);

      // Load user's questions
      const userQuestionsList = questions.filter(q => q.authorId === id);
      setUserQuestions(userQuestionsList);

      // Load private notes from localStorage
      if (currentUser?.id) {
        const notesKey = `profile-notes-${currentUser.id}-${id}`;
        const savedNotes = localStorage.getItem(notesKey);
        if (savedNotes) {
          try {
            setPrivateNotes(JSON.parse(savedNotes));
          } catch (error) {
            console.error("❌ Error parsing saved notes:", error);
          }
        }
      }
    }
  }, [id, userProfileData, profileLoading, profileError, questions, currentUser?.id]);

  /**
   * Handle scroll for profile collapse effect
   */
  useEffect(() => {
    const handleScroll = () => {
      if (profileSectionRef.current) {
        const profileTop = profileSectionRef.current.getBoundingClientRect().top;
        const shouldCollapse = profileTop <= 100;

        if (shouldCollapse !== isHeaderCollapsed) {
          setIsHeaderCollapsed(shouldCollapse);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHeaderCollapsed]);

  /**
   * Save notes to localStorage
   */
  const saveNotesToStorage = (notes: PrivateNote[]) => {
    if (!currentUser?.id || !id) return;
    const notesKey = `profile-notes-${currentUser.id}-${id}`;
    localStorage.setItem(notesKey, JSON.stringify(notes));
    setPrivateNotes(notes);
  };

  /**
   * Add new note
   */
  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const hashtags = newNoteContent.match(/#[\w]+/g) || [];
    const newNote: PrivateNote = {
      id: `note-${Date.now()}`,
      content: newNoteContent.trim(),
      hashtags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...privateNotes];
    saveNotesToStorage(updatedNotes);

    setNewNoteContent("");
    setIsAddNoteOpen(false);

    toast({
      title: "Note added",
      description: "Your private note has been saved.",
    });
  };

  /**
   * Edit existing note
   */
  const handleEditNote = () => {
    if (!editingNote || !newNoteContent.trim()) return;

    const hashtags = newNoteContent.match(/#[\w]+/g) || [];
    const updatedNotes = privateNotes.map(note =>
      note.id === editingNote.id
        ? {
          ...note,
          content: newNoteContent.trim(),
          hashtags,
          updatedAt: new Date().toISOString(),
        }
        : note
    );

    saveNotesToStorage(updatedNotes);

    setNewNoteContent("");
    setEditingNote(null);
    setIsEditNoteOpen(false);

    toast({
      title: "Note updated",
      description: "Your private note has been updated.",
    });
  };

  /**
   * Delete note
   */
  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = privateNotes.filter(note => note.id !== noteId);
    saveNotesToStorage(updatedNotes);

    toast({
      title: "Note deleted",
      description: "Your private note has been removed.",
    });
  };

  /**
   * Handle navigation actions
   */
  const handleBack = () => {
    navigate(-1);
  };

  const handleConnect = () => {
    if (!profileUser) return;

    // TODO: Implement connection API call
    console.log("Connect with user:", profileUser.id);

    toast({
      title: "Connection request sent",
      description: `Your request to connect with ${profileUser.name} has been sent.`,
    });
  };

  const handleMessage = () => {
    if (!profileUser) return;

    // TODO: Navigate to chat with user
    console.log("Message user:", profileUser.id);
    navigate("/messages");
  };

  const handleWeMet = () => {
    if (!profileUser) return;

    // Add automatic note about meeting
    const metNote: PrivateNote = {
      id: `note-${Date.now()}`,
      content: `We met at an event! ${new Date().toLocaleDateString()} #WeMet #Remember`,
      hashtags: ["#WeMet", "#Remember"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [metNote, ...privateNotes];
    saveNotesToStorage(updatedNotes);

    toast({
      title: "Added to notes",
      description: "Marked that you met this person.",
    });
  };

  const handleRemember = () => {
    setActiveTab("notes");
    setIsAddNoteOpen(true);
  };

  const handleRetry = () => {
    console.log("🔄 Retrying profile fetch...");
    refetchProfile();
  };

  /**
   * Handle profile view change
   */
  const handleProfileViewChange = (view: ProfileViewType) => {
    setCurrentProfileView(view);
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#f0efeb] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-[#3ec6c6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading profile...
            </h2>
            <p className="text-gray-600">
              Fetching user data from the server.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (profileError) {
    const errorMessage = profileError.message || 'Unknown error occurred';
    const isNotFound = errorMessage.includes('not found');
    const isAccessDenied = errorMessage.includes('Access denied');
    const isConnectionError = errorMessage.includes('internet') || errorMessage.includes('network');

    return (
      <div className="min-h-screen bg-[#f0efeb] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isNotFound ? 'bg-gray-100' : 'bg-red-100'
              }`}>
              <UserPlusIcon className={`w-8 h-8 ${isNotFound ? 'text-gray-400' : 'text-red-500'
                }`} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isNotFound ? 'Profile not found' :
                isAccessDenied ? 'Access denied' :
                  isConnectionError ? 'Connection error' :
                    'Failed to load profile'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isNotFound ? 'This user profile doesn\'t exist or has been removed.' :
                isAccessDenied ? 'You don\'t have permission to view this profile.' :
                  isConnectionError ? 'Please check your internet connection and try again.' :
                    'There was an error loading the profile. Please try again.'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              {!isNotFound && !isAccessDenied && (
                <Button
                  onClick={handleRetry}
                  className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile not found state (shouldn't happen with new API, but keeping as fallback)
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#f0efeb] flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlusIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Profile not found
            </h2>
            <p className="text-gray-600 mb-6">
              This user profile doesn't exist or has been removed.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
              >
                Go Back
              </Button>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="bg-[#f0efeb] min-h-screen">
        {/* Header with profile collapse behavior */}
        <header
          ref={headerRef}
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isHeaderCollapsed
            ? 'profile-header-sticky h-16 shadow-sm'
            : 'bg-[#f0efeb] h-20'
            }`}
        >
          <div className="flex items-center justify-between h-full px-4 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="w-10 h-10 rounded-full hover:bg-gray-100/80"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>

            {/* Collapsed header shows profile name and action buttons */}
            {isHeaderCollapsed && (
              <div className="flex items-center gap-3 flex-1 mx-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                  <AvatarFallback>{profileUser.name[0]}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-gray-900 truncate max-w-[90px]">
                  {profileUser.name}
                </span>
              </div>
            )}

            {/* Action buttons in header */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleWeMet}
                size="sm"
                variant="outline"
                className="px-3 py-1 h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                We Met
              </Button>
              <Button
                onClick={handleRemember}
                size="sm"
                variant="outline"
                className="px-3 py-1 h-8 text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
              >
                Remember
              </Button>
            </div>
          </div>
        </header>

        {/* Swipeable Profile Section */}
        <div ref={profileSectionRef} className="pt-20">
          <SwipeableProfile
            profileUser={profileUser}
            currentProfileView={currentProfileView}
            onProfileViewChange={handleProfileViewChange}
            onConnect={handleConnect}
            onMessage={handleMessage}
            setIsAddNoteOpen={setIsAddNoteOpen}
          />
        </div>

        {/* Tabbed Content */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "questions" | "notes")}>
            <TabsList className="grid w-full grid-cols-2 bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
              <TabsTrigger
                value="questions"
                className="data-[state=active]:bg-[#F9DF8E] data-[state=active]:text-gray-900 font-semibold"
              >
                Questions ({userQuestions.length})
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-[#F9DF8E] data-[state=active]:text-gray-900 font-semibold"
              >
                Notes ({privateNotes.length})
              </TabsTrigger>
            </TabsList>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-4">
              {userQuestions.length > 0 ? (
                userQuestions.map((question) => (
                  <Card key={question.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-4">
                          {question.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          {question.isBookmarked && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                              Bookmarked
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {question.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                        <div className="flex items-center gap-3">
                          <span>{question.upvotes} uplifts</span>
                          <span>{question.meTooCount} me too</span>
                          <span>{question.canHelpCount} can help</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white rounded-xl border border-gray-100">
                  <CardContent className="p-12 text-center">
                    <MessageCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No questions yet</h3>
                    <p className="text-gray-600">
                      This user hasn't posted any questions yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsAddNoteOpen(true)} size="sm" className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>

              {privateNotes.length > 0 ? (
                privateNotes.map((note) => (
                  <Card key={note.id} className="note-card bg-white rounded-xl border border-gray-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-gray-900 text-sm leading-relaxed flex-1 pr-4">
                          {note.content}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8"
                            onClick={() => {
                              setEditingNote(note);
                              setNewNoteContent(note.content);
                              setIsEditNoteOpen(true);
                            }}
                          >
                            <Edit2Icon className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <TrashIcon className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {note.hashtags.map((hashtag, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                              {hashtag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white rounded-xl border border-gray-100">
                  <CardContent className="p-12 text-center">
                    <HashIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">No notes yet</h3>
                    <p className="text-gray-600 mb-4">
                      Add a personal note or tag to remember this person.
                    </p>
                    <Button
                      onClick={() => setIsAddNoteOpen(true)}
                      variant="outline"
                    >
                      Add First Note
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Note Dialog */}
        <Dialog open={isEditNoteOpen} onOpenChange={setIsEditNoteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>
                Update your note about {profileUser.name}.
              </DialogDescription>
            </DialogHeader>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Edit your note... #hashtags"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] resize-none"
              maxLength={500}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditNoteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditNote} disabled={!newNoteContent.trim()}>
                Update Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bottom padding */}
        <div className="h-8" />
      </div>

      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Private Note</DialogTitle>
            <DialogDescription>
              Add a personal note about {profileUser.name}. Use hashtags to organize your thoughts.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Remember something about this person... #hashtags"
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] resize-none"
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};