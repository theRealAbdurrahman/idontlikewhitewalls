import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  MessageCircleIcon, 
  UserPlusIcon,
  ShareIcon,
  MoreVerticalIcon,
  LinkedinIcon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

/**
 * Profile Page component for viewing user profiles with interactive features
 * Includes collapsible header, note-taking, and social actions
 */
export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management for UI interactions
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>("");
  const [hasMetUser, setHasMetUser] = useState<boolean>(false);
  const [isRemembered, setIsRemembered] = useState<boolean>(false);
  
  // Ref for header scroll detection
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock user data - in a real app, this would be fetched based on the ID
  const profileUser = {
    id: id || "user-123",
    name: "Alex Johnson",
    email: "alex@example.com",
    avatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
    bio: "Passionate entrepreneur and tech enthusiast. Always looking to connect with like-minded individuals and help others succeed in their ventures.",
    title: "Senior Product Manager",
    company: "TechCorp",
    location: "San Francisco, CA",
    connections: 425,
    meTooCount: 32,
    canHelpCount: 58,
    questionsCount: 15,
    verified: true,
    joinedAt: "2023-03-15T10:00:00Z",
    isConnected: false,
    mutualConnections: 23,
  };

  /**
   * Handle scroll detection for header collapse
   */
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollTop = scrollRef.current.scrollTop;
        setIsHeaderCollapsed(scrollTop > 100);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  /**
   * Navigate back to previous page
   */
  const handleBack = (): void => {
    navigate(-1);
  };

  /**
   * Handle "We Met" action
   */
  const handleWeMet = (): void => {
    setHasMetUser(!hasMetUser);
    // TODO: API call to update meeting status
    console.log("We Met status:", !hasMetUser);
  };

  /**
   * Handle "Remember" action
   */
  const handleRemember = (): void => {
    setIsRemembered(!isRemembered);
    // TODO: API call to update remember status
    console.log("Remember status:", !isRemembered);
  };

  /**
   * Handle sending a message
   */
  const handleSendMessage = (): void => {
    // TODO: Navigate to chat or create new conversation
    console.log("Send message to:", profileUser.id);
    navigate(`/messages/${profileUser.id}`);
  };

  /**
   * Handle connection request
   */
  const handleConnect = (): void => {
    // TODO: Send connection request
    console.log("Connect with:", profileUser.id);
  };

  /**
   * Save note about the user
   */
  const handleSaveNote = (): void => {
    if (noteText.trim()) {
      // TODO: API call to save note
      console.log("Saving note:", noteText);
      setIsAddNoteOpen(false);
      setNoteText("");
    }
  };

  /**
   * Handle sharing profile
   */
  const handleShare = (): void => {
    // TODO: Implement share functionality
    console.log("Share profile:", profileUser.id);
  };

  const stats = [
    { label: "Questions", value: profileUser.questionsCount },
    { label: "Me Too", value: profileUser.meTooCount },
    { label: "Can Help", value: profileUser.canHelpCount },
    { label: "Connections", value: profileUser.connections },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isHeaderCollapsed
            ? 'bg-white h-16 shadow-sm border-b'
            : 'bg-[#f0efeb] h-20'
        }`}
      >
        <div className="h-full flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="w-8 h-8"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>

          {/* Add Note Button */}
          <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="group flex items-center gap-2"
                aria-label="Add Note about this person"
              >
                <PlusIcon className="w-4 h-4 text-[#FFE066] group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium text-gray-700">add note</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Note About {profileUser.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Write your note here..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNote} disabled={!noteText.trim()}>
                    Save Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Collapsed header shows profile name and action buttons */}
          {isHeaderCollapsed && (
            <div className="flex items-center gap-3 flex-1 mx-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                <AvatarFallback>{profileUser.name[0]}</AvatarFallback>
              </Avatar>
              <h2 className="text-sm font-semibold text-gray-900">{profileUser.name}</h2>
            </div>
          )}

          {/* Action buttons in header */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleWeMet}
              size="sm"
              variant="outline"
              className={`px-3 py-1 h-8 text-xs ${
                hasMetUser 
                  ? 'bg-blue-100 border-blue-300 text-blue-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {hasMetUser ? 'Met ✓' : 'We Met'}
            </Button>
            <Button
              onClick={handleRemember}
              size="sm"
              variant="outline"
              className={`px-3 py-1 h-8 text-xs ${
                isRemembered 
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-800' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              {isRemembered ? 'Remembered ✓' : 'Remember'}
            </Button>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div ref={scrollRef} className="pt-20 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                  <AvatarFallback className="text-xl">{profileUser.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-black">{profileUser.name}</h1>
                    {profileUser.verified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {profileUser.title && profileUser.company && (
                    <p className="text-gray-600 text-sm mb-1">
                      {profileUser.title} at {profileUser.company}
                    </p>
                  )}
                  
                  {profileUser.location && (
                    <p className="text-gray-500 text-sm mb-2">{profileUser.location}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{profileUser.connections} connections</span>
                    {profileUser.mutualConnections > 0 && (
                      <span>• {profileUser.mutualConnections} mutual</span>
                    )}
                  </div>
                </div>

                {/* More actions button */}
                <Button variant="ghost" size="icon" onClick={handleShare}>
                  <ShareIcon className="w-4 h-4" />
                </Button>
              </div>
              
              {profileUser.bio && (
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{profileUser.bio}</p>
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
                  disabled={profileUser.isConnected}
                >
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  {profileUser.isConnected ? "Connected" : "Connect"}
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

                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-black text-sm mb-1">
                    Anyone have experience with React Native vs Flutter?
                  </h3>
                  <p className="text-xs text-gray-600">3 days ago • 4 uplifts • 8 me too</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};