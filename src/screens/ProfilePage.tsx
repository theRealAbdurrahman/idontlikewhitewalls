import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon,
  MoreVerticalIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PlusIcon,
  MessageCircleIcon,
  UserPlusIcon,
  ExternalLinkIcon
} from "lucide-react";
import { useUserProfile } from "../api-client/api-client";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../hooks/use-toast";

/**
 * LinkedIn icon component
 */
const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

/**
 * Custom styles for the profile page
 */
const customStyles = `
  .profile-header-blur {
    backdrop-filter: blur(20px);
    background: rgba(240, 239, 235, 0.95);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  
  .action-button {
    transition: all 0.2s ease-in-out;
    border: 1px solid #E0E0E0;
    background: transparent;
  }
  
  .action-button:hover {
    background: #F5F5F5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .action-button-icon {
    color: #424242;
  }
  
  .profile-content {
    animation: fadeInUp 0.4s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/**
 * ProfilePage component for viewing user profiles
 */
export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();

  // Local state
  const [isConnected, setIsConnected] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch user profile data
  const {
    data: userProfile,
    isLoading,
    error
  } = useUserProfile(id, {
    enabled: !!id,
  });

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * Handle add note action
   */
  const handleAddNote = () => {
    setIsAddingNote(true);
    toast({
      title: "Add Note",
      description: "Note functionality coming soon!",
    });
  };

  /**
   * Handle message action
   */
  const handleMessage = () => {
    if (!userProfile) return;
    
    // TODO: Navigate to chat or create new conversation
    console.log("Send message to:", userProfile.id);
    toast({
      title: "Message",
      description: "Messaging functionality coming soon!",
    });
  };

  /**
   * Handle connect action
   */
  const handleConnect = () => {
    if (!userProfile) return;
    
    setIsConnected(!isConnected);
    toast({
      title: isConnected ? "Disconnected" : "Connected",
      description: isConnected 
        ? `You are no longer connected with ${userProfile.first_name}`
        : `Connection request sent to ${userProfile.first_name}`,
    });
  };

  /**
   * Handle LinkedIn profile action
   */
  const handleLinkedIn = () => {
    if (!userProfile?.linkedin_url) {
      toast({
        title: "LinkedIn not available",
        description: "This user hasn't added their LinkedIn profile.",
        variant: "destructive",
      });
      return;
    }
    
    window.open(userProfile.linkedin_url, "_blank", "noopener,noreferrer");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[#f0efeb] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#3ec6c6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !userProfile) {
    return (
      <div className="bg-[#f0efeb] min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Profile not found
            </h2>
            <p className="text-gray-600 mb-6">
              This user profile may have been removed or doesn't exist.
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

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <TooltipProvider>
      <style>{customStyles}</style>
      <div className="bg-[#f0efeb] min-h-screen">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 profile-header-blur shadow-sm">
          <div className="flex items-center justify-between h-20 px-4 pt-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="w-10 h-10 rounded-full hover:bg-gray-100/80 transition-all duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </Button>
            
            <h1 className="text-lg font-semibold text-gray-900">
              {isOwnProfile ? "My Profile" : "Profile"}
            </h1>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full hover:bg-gray-100/80 transition-all duration-200"
            >
              <MoreVerticalIcon className="w-5 h-5 text-gray-700" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="profile-content pt-20 px-4 py-6 space-y-6">
          {/* Profile Header */}
          <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="w-20 h-20 ring-4 ring-gray-100">
                  <AvatarImage 
                    src={userProfile.profile_picture || "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"} 
                    alt={`${userProfile.first_name} ${userProfile.last_name}`} 
                  />
                  <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-gray-100 to-gray-200">
                    {userProfile.first_name[0]}{userProfile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {userProfile.first_name} {userProfile.last_name}
                    </h1>
                    {userProfile.is_active && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  {userProfile.title && (
                    <p className="text-gray-600 text-base mb-1">{userProfile.title}</p>
                  )}
                  
                  <p className="text-gray-500 text-sm">{userProfile.email}</p>
                  
                  {userProfile.created_at && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        Joined {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {userProfile.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">{userProfile.bio}</p>
                </div>
              )}

              {/* Action Buttons - Updated with correct order and icons */}
              {!isOwnProfile && (
                <div className="flex items-center gap-4">
                  {/* Add Note Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddNote}
                        className="action-button h-10 px-4 rounded-full flex items-center gap-2"
                        variant="outline"
                      >
                        <PlusIcon className="action-button-icon w-4 h-4" />
                        <span className="text-sm font-medium text-gray-700">add note</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-sm px-3 py-2 rounded">
                      Add a private note about this person
                    </TooltipContent>
                  </Tooltip>

                  {/* Message Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleMessage}
                        className="action-button w-10 h-10 rounded-full p-0"
                        variant="outline"
                      >
                        <MessageCircleIcon className="action-button-icon w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-sm px-3 py-2 rounded">
                      Send a message
                    </TooltipContent>
                  </Tooltip>

                  {/* Connect Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleConnect}
                        className="action-button w-10 h-10 rounded-full p-0"
                        variant="outline"
                      >
                        <UserPlusIcon className="action-button-icon w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-sm px-3 py-2 rounded">
                      {isConnected ? "Disconnect" : "Connect"}
                    </TooltipContent>
                  </Tooltip>

                  {/* LinkedIn Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleLinkedIn}
                        className="action-button w-10 h-10 rounded-full p-0"
                        variant="outline"
                        disabled={!userProfile.linkedin_url}
                      >
                        <LinkedinIcon className="action-button-icon w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white text-sm px-3 py-2 rounded">
                      View LinkedIn profile
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Profile Information */}
          <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">User ID</span>
                  <span className="text-gray-900 font-mono text-sm">{userProfile.id}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Account Status</span>
                  <Badge 
                    variant={userProfile.is_active ? "default" : "secondary"}
                    className={userProfile.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                  >
                    {userProfile.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                {userProfile.last_active_at && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Last Active</span>
                    <span className="text-gray-900">
                      {new Date(userProfile.last_active_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {userProfile.linkedin_url && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">LinkedIn</span>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-blue-600 hover:text-blue-800"
                      onClick={handleLinkedIn}
                    >
                      <ExternalLinkIcon className="w-3 h-3 mr-1" />
                      View Profile
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};