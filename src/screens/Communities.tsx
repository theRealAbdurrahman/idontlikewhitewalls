import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  BuildingIcon, 
  PlusIcon, 
  UsersIcon, 
  GlobeIcon, 
  LockIcon,
  CalendarIcon,
  MapPinIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuthStore } from "../stores/authStore";

/**
 * Mock community interface
 */
interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  country: string;
  countryFlag: string;
  logo?: string;
  memberCount: number;
  eventCount: number;
  isOpen: boolean;
  isJoined: boolean;
  createdAt: string;
  hostName: string;
}

/**
 * Mock communities data
 */
const mockCommunities: Community[] = [
  {
    id: "community-1",
    name: "Dublin Tech Community",
    description: "A vibrant community of tech enthusiasts, entrepreneurs, and professionals in Dublin. We organize regular meetups, workshops, and networking events.",
    location: "Dublin, Ireland",
    country: "Ireland",
    countryFlag: "🇮🇪",
    logo: "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1",
    memberCount: 1247,
    eventCount: 23,
    isOpen: true,
    isJoined: true,
    createdAt: "2024-01-15T10:00:00Z",
    hostName: "Tech Dublin",
  },
  {
    id: "community-2",
    name: "Lisbon Startup Hub",
    description: "Connecting entrepreneurs, investors, and startup enthusiasts in Lisbon. Join us for pitch nights, founder dinners, and exclusive events.",
    location: "Lisbon, Portugal",
    country: "Portugal",
    countryFlag: "🇵🇹",
    memberCount: 892,
    eventCount: 15,
    isOpen: true,
    isJoined: false,
    createdAt: "2024-02-20T10:00:00Z",
    hostName: "Startup Lisboa",
  },
  {
    id: "community-3",
    name: "Women in Tech Europe",
    description: "Empowering women in technology across Europe. Private community for networking, mentorship, and career growth.",
    location: "Europe",
    country: "Multi-Country",
    countryFlag: "🇪🇺",
    memberCount: 2156,
    eventCount: 8,
    isOpen: false,
    isJoined: true,
    createdAt: "2024-03-10T10:00:00Z",
    hostName: "WiT Europe",
  },
];

/**
 * Communities screen component displaying list of communities
 */
export const Communities: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleCreateCommunity = () => {
    navigate("/create-community");
  };

  const handleJoinCommunity = (communityId: string) => {
    // TODO: Implement join community API call
    console.log("Join community:", communityId);
  };

  const handleViewCommunity = (communityId: string) => {
    // TODO: Navigate to community details page
    console.log("View community:", communityId);
    navigate(`/communities/${communityId}`);
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center gap-2">
              <BuildingIcon className="w-6 h-6 text-[#3ec6c6]" />
              Communities
            </h1>
            <p className="text-gray-600 mt-1">Discover and join professional communities</p>
          </div>
          
          <Button
            onClick={handleCreateCommunity}
            className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <UsersIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">
                {mockCommunities.reduce((sum, c) => sum + c.memberCount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-blue-700">Total Members</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <BuildingIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{mockCommunities.length}</p>
              <p className="text-sm text-green-700">Communities</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <CalendarIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">
                {mockCommunities.reduce((sum, c) => sum + c.eventCount, 0)}
              </p>
              <p className="text-sm text-purple-700">Events</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Communities List */}
      <div className="space-y-4">
        {mockCommunities.map((community) => (
          <Card
            key={community.id}
            className="cursor-pointer hover:shadow-md transition-shadow bg-white"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Community Logo/Avatar */}
                <div className="flex-shrink-0">
                  {community.logo ? (
                    <img
                      src={community.logo}
                      alt={community.name}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <BuildingIcon className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Community Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-black truncate">
                          {community.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {community.isOpen ? (
                            <GlobeIcon className="w-4 h-4 text-green-600" title="Open Community" />
                          ) : (
                            <LockIcon className="w-4 h-4 text-orange-600" title="Closed Community" />
                          )}
                          {community.isJoined && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                              Joined
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{community.countryFlag}</span>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPinIcon className="w-3 h-3" />
                          <span>{community.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed mb-3 line-clamp-2">
                    {community.description}
                  </p>

                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        <span>{community.memberCount.toLocaleString()} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{community.eventCount} events</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCommunity(community.id);
                        }}
                      >
                        View
                      </Button>
                      
                      {!community.isJoined && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinCommunity(community.id);
                          }}
                          className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                        >
                          {community.isOpen ? "Join" : "Request"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (hidden since we have mock data) */}
      {mockCommunities.length === 0 && (
        <Card className="bg-white">
          <CardContent className="p-12 text-center">
            <BuildingIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No communities yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Be the first to create a community and start building connections with like-minded professionals.
            </p>
            <Button 
              onClick={handleCreateCommunity}
              className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Community
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success message for newly created communities */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-green-800 font-medium">
            Your communities will appear here once created
          </p>
        </div>
      </div>
    </div>
  );
};