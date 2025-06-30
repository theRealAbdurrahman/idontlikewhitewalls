import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageCircleIcon, UserPlusIcon, ArrowLeftIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useUserProfile } from "../api-client/api-client";
import { useAuth } from "../providers";
import { useToast } from "../hooks/use-toast";

/**
 * User Profile screen component for viewing other users' profiles
 */
export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Fetch user profile from API
  const {
    data: userProfileData,
    isLoading: profileLoading,
    error: profileError
  } = useUserProfile(id);

  // Check if this is the current user's own profile
  const isOwnProfile = userProfileData?.id === currentUser?.id;

  const handleSendMessage = () => {
    if (!userProfileData) return;

    // Navigate to chat or create new conversation
    navigate(`/chat/user-${userProfileData.id}`);
  };

  const handleConnect = () => {
    if (!userProfileData) return;

    // TODO: Send connection request
    console.log("Connect with:", userProfileData.id);
    toast({
      title: "Connection request sent",
      description: `Your request to connect with ${userProfileData.first_name} has been sent.`,
    });
  };

  // Transform user data for display
  const displayName = userProfileData ?
    `${userProfileData.first_name || ''} ${userProfileData.last_name || ''}`.trim() || 'Unknown User' :
    'Unknown User';

  // Create stats from available data (some will be placeholders until we have interaction counts)
  const stats = userProfileData ? [
    { label: "Questions", value: 0 }, // TODO: Get from API when available
    { label: "Me Too", value: 0 }, // TODO: Get from API when available  
    { label: "Can Help", value: 0 }, // TODO: Get from API when available
    { label: "Connections", value: 0 }, // TODO: Get from API when available
  ] : [];

  // Loading state
  if (profileLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load profile</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  // User not found state
  if (!userProfileData) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-gray-500 mb-4">User not found</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={userProfileData.profile_picture || undefined} alt={displayName} />
              <AvatarFallback className="text-xl">{displayName[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-black">{displayName}</h1>
                {userProfileData.is_active && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    Active
                  </Badge>
                )}
              </div>

              {userProfileData.title && (
                <p className="text-gray-600 text-sm mb-1">
                  {userProfileData.title}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>0 connections</span> {/* TODO: Get from API when available */}
              </div>
            </div>
          </div>

          {userProfileData.bio && (
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{userProfileData.bio}</p>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-3">
              <Button
                onClick={handleSendMessage}
                className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
              >
                <MessageCircleIcon className="w-4 h-4 mr-2" />
                Message
              </Button>

              <Button
                onClick={handleConnect}
                variant="outline"
                className="flex-1"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Connect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg text-black mb-4">Activity</h2>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold text-black">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Questions */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-lg text-black mb-4">Recent Questions</h2>
          <div className="space-y-3">
            {/* Placeholder for questions - TODO: Fetch user's questions from API */}
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No questions available</p>
              <p className="text-gray-400 text-xs mt-1">Questions from this user will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};