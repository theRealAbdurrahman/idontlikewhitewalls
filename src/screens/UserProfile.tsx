import React from "react";
import { useParams } from "react-router-dom";
import { MessageCircleIcon, UserPlusIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

/**
 * User Profile screen component for viewing other users' profiles
 */
export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Mock user data - in a real app, this would be fetched based on the ID
  const user = {
    id: id || "user-456",
    name: "Stuart Wilson",
    email: "stuart@example.com",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
    bio: "Passionate entrepreneur and tech enthusiast. Always looking to connect with like-minded individuals and help others succeed.",
    title: "Senior Product Manager",
    company: "TechCorp",
    location: "Dublin, Ireland",
    connections: 342,
    meTooCount: 28,
    canHelpCount: 45,
    questionsCount: 12,
    verified: true,
    joinedAt: "2023-06-15T10:00:00Z",
    isConnected: false,
    mutualConnections: 15,
  };

  const handleSendMessage = () => {
    // TODO: Navigate to chat or create new conversation
    console.log("Send message to:", user.id);
  };

  const handleConnect = () => {
    // TODO: Send connection request
    console.log("Connect with:", user.id);
  };

  const stats = [
    { label: "Questions", value: user.questionsCount },
    { label: "Me Too", value: user.meTooCount },
    { label: "Can Help", value: user.canHelpCount },
    { label: "Connections", value: user.connections },
  ];

  return (
    <div className="px-4 py-6">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-black">{user.name}</h1>
                {user.verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              
              {user.title && user.company && (
                <p className="text-gray-600 text-sm mb-1">
                  {user.title} at {user.company}
                </p>
              )}
              
              {user.location && (
                <p className="text-gray-500 text-sm mb-2">{user.location}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{user.connections} connections</span>
                {user.mutualConnections > 0 && (
                  <span>• {user.mutualConnections} mutual</span>
                )}
              </div>
            </div>
          </div>
          
          {user.bio && (
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{user.bio}</p>
          )}

          {/* Action Buttons */}
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
              disabled={user.isConnected}
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              {user.isConnected ? "Connected" : "Connect"}
            </Button>
          </div>
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
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-black text-sm mb-1">
                Looking for content creator for shoe marketplace
              </h3>
              <p className="text-xs text-gray-600">2 days ago • 6 uplifts • 12 me too</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-black text-sm mb-1">
                Best practices for startup equity distribution?
              </h3>
              <p className="text-xs text-gray-600">1 week ago • 8 uplifts • 5 me too</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};