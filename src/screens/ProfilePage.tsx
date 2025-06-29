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
  HandIcon
} from "lucide-react";
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
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";
import { useToast } from "../hooks/use-toast";

/**
 * Interface for user profile data
 */
interface UserProfile {
  id: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
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
  connectDetails?: string; // Added connectDetails field
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
 * Interface for CollapsibleText component props
 */
interface CollapsibleTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  showIndicator?: boolean;
}

/**
 * CollapsibleText component for handling long text content
 */
const CollapsibleText: React.FC<CollapsibleTextProps> = ({ 
  text, 
  maxLines = 4, 
  className = "",
  showIndicator = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const measuringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current && measuringRef.current) {
        const fullHeight = measuringRef.current.scrollHeight;
        const lineHeight = parseInt(window.getComputedStyle(measuringRef.current).lineHeight);
        const maxHeight = lineHeight * maxLines;
        setShouldTruncate(fullHeight > maxHeight);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text, maxLines]);

  const handleToggle = () => {
    if (shouldTruncate) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={className}>
      {/* Hidden measuring element */}
      <div
        ref={measuringRef}
        className="absolute invisible h-0 overflow-hidden"
        style={{ width: textRef.current?.clientWidth || 'auto' }}
        aria-hidden="true"
      >
        {text}
      </div>

      {/* Visible text content */}
      <div
        ref={textRef}
        className={`leading-relaxed transition-all duration-300 ${
          shouldTruncate && !isExpanded
            ? `overflow-hidden text-ellipsis`
            : ''
        } ${shouldTruncate ? 'cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2' : ''}`}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: shouldTruncate && !isExpanded ? maxLines : 'unset',
          WebkitBoxOrient: 'vertical',
          overflow: shouldTruncate && !isExpanded ? 'hidden' : 'visible',
        }}
        onClick={handleToggle}
        role={shouldTruncate ? "button" : undefined}
        tabIndex={shouldTruncate ? 0 : undefined}
        onKeyPress={(e) => {
          if (shouldTruncate && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={shouldTruncate ? isExpanded : undefined}
        aria-label={shouldTruncate ? `${isExpanded ? 'Collapse' : 'Expand'} text content` : undefined}
      >
        {text}
      </div>

      {/* Show more/less indicator */}
      {shouldTruncate && showIndicator && (
        <button
          onClick={handleToggle}
          className="mt-2 text-sm text-[#3ec6c6] hover:text-[#2ea5a5] flex items-center gap-1 font-medium transition-colors duration-200"
          aria-label={isExpanded ? 'Show less text' : 'Show more text'}
        >
          {isExpanded ? (
            <>
              Show less
              <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              Show more
              <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
};

/**
 * Interface for IconButton component props
 */
interface IconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "linkedin";
  ariaLabel: string;
}

/**
 * IconButton component with tooltip functionality
 */
const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  tooltip, 
  onClick, 
  disabled = false, 
  variant = "default",
  ariaLabel 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 200);
    setTooltipTimer(timer);
  };

  const handleMouseLeave = () => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
      setTooltipTimer(null);
    }
    setShowTooltip(false);
  };

  const handleFocus = () => {
    if (!disabled) {
      setShowTooltip(true);
    }
  };

  const handleBlur = () => {
    setShowTooltip(false);
  };

  const getButtonStyles = () => {
    const baseStyles = "w-10 h-10 rounded-full p-0 transition-all duration-200 ease-in-out relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFE066]";
    
    switch (variant) {
      case "primary":
        return `${baseStyles} bg-[#FFE066] text-gray-800 hover:bg-[#FFD700] hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`;
      case "linkedin":
        return `${baseStyles} bg-[#F5F5F5] text-[#0077b5] hover:bg-[#0077b5] hover:text-white hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`;
      default:
        return `${baseStyles} bg-[#F5F5F5] text-gray-600 hover:bg-[#FFE066] hover:text-gray-800 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`;
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onClick}
        disabled={disabled}
        className={getButtonStyles()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        aria-describedby={showTooltip ? `tooltip-${ariaLabel.replace(/\s+/g, '-')}` : undefined}
      >
        {icon}
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div
          id={`tooltip-${ariaLabel.replace(/\s+/g, '-')}`}
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded border-radius-4 shadow-lg whitespace-nowrap z-50 pointer-events-none"
          style={{ 
            background: '#333333',
            borderRadius: '4px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {tooltip}
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #333333'
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Custom styles for animations and transitions
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
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
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
`;

/**
 * ProfilePage component for viewing user profiles
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
  const [loading, setLoading] = useState(true);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<PrivateNote | null>(null);
  
  // Refs for scroll behavior
  const headerRef = useRef<HTMLDivElement>(null);
  const profileSectionRef = useRef<HTMLDivElement>(null);

  /**
   * Load user profile data
   */
  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      
      try {
        // Simulate API call - in real app, fetch from backend
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock user profiles based on ID
        const mockProfiles: Record<string, UserProfile> = {
          "user-789": {
            id: "user-789",
            name: "Sara Timóteo",
            title: "Content Creator & Social Media Strategist",
            company: "Creative Studios",
            location: "Lisbon, Portugal",
            bio: "Passionate about creating engaging content that connects brands with their audience. Specializing in visual storytelling and community building.",
            avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
            website: "https://saratimoteo.com",
            linkedinUrl: "https://linkedin.com/in/saratimoteo",
            verified: true,
            isConnected: false,
            mutualConnections: 12,
            joinedAt: "2024-03-15T10:00:00Z",
            profileVersion: "standard",
            connectDetails: "I'm a passionate content creator with over 5 years of experience in social media strategy and visual storytelling. I specialize in helping brands connect with their audience through authentic, engaging content that drives real results.\n\nMy expertise spans across multiple platforms including Instagram, TikTok, LinkedIn, and YouTube. I've worked with both emerging startups and established brands to develop their digital presence and create content that resonates with their target audience.\n\nWhat sets me apart is my ability to blend creativity with data-driven insights. I don't just create beautiful content – I create content that performs. I'm always staying ahead of the latest trends and platform updates to ensure my clients' content strategy remains fresh and effective.\n\nI'm particularly passionate about empowering other creators and small businesses to tell their stories authentically. I believe that everyone has a unique voice worth sharing, and I love helping people find and amplify theirs.\n\nWhen I'm not creating content, you can find me exploring Lisbon's vibrant neighborhoods, experimenting with new photography techniques, or hosting creative workshops for aspiring content creators."
          },
          "user-101": {
            id: "user-101",
            name: "Adrian Silva",
            company: "Funky Digital",
            location: "Porto, Portugal",
            bio: "🎨 Digital artist mixing reality with dreams ✨ Creating weird and wonderful experiences that make people smile 🌈",
            avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
            instagramUrl: "https://instagram.com/adriansilva",
            tiktokUrl: "https://tiktok.com/@adriansilva",
            verified: true,
            isConnected: true,
            mutualConnections: 8,
            joinedAt: "2024-01-20T10:00:00Z",
            profileVersion: "funky",
            virtues: ["Creative", "Innovative", "Collaborative", "Authentic", "Creative", "Innovative", "Collaborative", "Authentic", "Creative", "Innovative", "Collaborative", "Authentic"],
            connectDetails: "Hey there! I'm Adrian, and I live in the magical intersection between art and technology. By day, I'm a digital artist and creative director at Funky Digital, where I get to play with pixels, code, and imagination to create experiences that hopefully make people's days a little brighter.\n\nI'm totally obsessed with pushing the boundaries of what's possible in digital art. Whether it's experimenting with AI-generated visuals, creating interactive installations, or just making weird GIFs that somehow end up going viral, I'm always looking for new ways to surprise and delight people.\n\nWhat really gets me excited is collaborative projects. There's something magical about bringing together different perspectives and skills to create something none of us could have made alone. I've worked with musicians, writers, developers, and even scientists to create art that tells stories in unexpected ways."
          },
        };
        
        const profile = mockProfiles[id || ""] || {
          id: id || "unknown",
          name: "User Not Found",
          bio: "This user profile could not be loaded.",
          verified: false,
          isConnected: false,
          mutualConnections: 0,
          joinedAt: new Date().toISOString(),
          profileVersion: "standard" as const,
        };
        
        setProfileUser(profile);
        
        // Load user's questions
        const userQuestionsList = questions.filter(q => q.authorId === id);
        setUserQuestions(userQuestionsList);
        
        // Load private notes from localStorage
        const notesKey = `profile-notes-${currentUser?.id}-${id}`;
        const savedNotes = localStorage.getItem(notesKey);
        if (savedNotes) {
          setPrivateNotes(JSON.parse(savedNotes));
        }
        
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast({
          title: "Failed to load profile",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProfileData();
    }
  }, [id, questions, currentUser?.id, toast]);

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

  const handleLinkedInClick = () => {
    if (profileUser?.linkedinUrl) {
      window.open(profileUser.linkedinUrl, '_blank');
    }
  };

  const handleWebsiteClick = () => {
    if (profileUser?.website) {
      window.open(profileUser.website, '_blank');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0efeb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3ec6c6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!profileUser || profileUser.name === "User Not Found") {
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
            <Button 
              onClick={handleBack}
              className="w-full bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
            >
              Go Back
            </Button>
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
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
            isHeaderCollapsed 
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
                <span className="font-semibold text-gray-900 truncate">
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

        {/* Profile Section */}
        <div ref={profileSectionRef} className="pt-20 px-4 pb-6">
          {profileUser.profileVersion === "standard" ? (
            // Standard Profile Layout
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
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>{profileUser.mutualConnections} mutual connections</span>
                      <span>• Joined {formatDistanceToNow(new Date(profileUser.joinedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                
                {/* Minimalistic Action Buttons */}
                <div className="flex items-center gap-4 mb-6">
                  <IconButton
                    icon={<MessageCircleIcon className="w-5 h-5" />}
                    tooltip="Send Message"
                    onClick={handleMessage}
                    variant="primary"
                    ariaLabel="Send message to user"
                  />
                  
                  <IconButton
                    icon={<HandIcon className="w-5 h-5" />}
                    tooltip={profileUser.isConnected ? "Connected" : "Send Connection Request"}
                    onClick={handleConnect}
                    disabled={profileUser.isConnected}
                    ariaLabel={profileUser.isConnected ? "Already connected" : "Send connection request"}
                  />
                  
                  {profileUser.linkedinUrl && (
                    <IconButton
                      icon={<LinkedinIcon className="w-5 h-5" />}
                      tooltip="View LinkedIn Profile"
                      onClick={handleLinkedInClick}
                      variant="linkedin"
                      ariaLabel="Open LinkedIn profile"
                    />
                  )}
                  
                  {profileUser.website && (
                    <IconButton
                      icon={<ExternalLinkIcon className="w-5 h-5" />}
                      tooltip="Visit Website"
                      onClick={handleWebsiteClick}
                      ariaLabel="Open personal website"
                    />
                  )}
                </div>
                
                {/* Bio with Collapsible Text */}
                {(profileUser.connectDetails || profileUser.bio) && (
                  <CollapsibleText 
                    text={profileUser.connectDetails || profileUser.bio || "Hi there! I'm excited to connect with others who share my interests in technology and innovation. Let's collaborate and create something amazing together."}
                    className="text-gray-700 leading-relaxed"
                    maxLines={4}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            // Funky Profile Layout
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
                  <p className="text-purple-600 font-semibold mb-4">What lights you up outside of work?</p>
                  
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
                  
                  {/* Bio with Collapsible Text */}
                  {(profileUser.connectDetails || profileUser.bio) && (
                    <div className="mb-6">
                      <CollapsibleText 
                        text={profileUser.connectDetails || profileUser.bio || "Hi there! I'm excited to connect with others who share my interests in technology and innovation. Let's collaborate and create something amazing together."}
                        className="text-gray-700 leading-relaxed"
                        maxLines={4}
                      />
                    </div>
                  )}
                  
                  {/* Virtue Tags using StickyNote */}
                  {profileUser.virtues && profileUser.virtues.length > 0 && (
                    <div className="flex justify-center gap-4 flex-wrap">
                      {profileUser.virtues.map((virtue, index) => (
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
                    onClick={handleMessage}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <MessageCircleIcon className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  
                  <Button
                    onClick={handleConnect}
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
          )}
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
                <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
    </>
  );
};