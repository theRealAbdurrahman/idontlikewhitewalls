import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CalendarIcon, 
  MapPinIcon, 
  ExternalLinkIcon, 
  ShareIcon,
  ArrowLeftIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  BookmarkIcon,
  KeyIcon
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useAppStore } from "../stores/appStore";
import { useAuth } from "../providers";
import { useToast } from "../hooks/use-toast";
import { openLocationInGoogleMaps } from "../utils/googleMaps";

/**
 * Custom styles for enhanced visual effects and animations
 */
const customStyles = `
  .event-header-blur {
    backdrop-filter: blur(20px);
    background: rgba(240, 239, 235, 0.95);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  
  .event-image-overlay {
    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%);
  }
  
  .event-action-button {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .event-action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
  }
  
  .event-action-button:active {
    transform: translateY(0);
  }
  
  .event-info-card {
    transition: all 0.2s ease-out;
  }
  
  .event-info-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
  }
  
  .event-status-live {
    animation: pulse-live 2s infinite;
  }
  
  @keyframes pulse-live {
    0%, 100% { 
      background-color: rgb(239 68 68);
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% { 
      background-color: rgb(220 38 38);
      box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    }
  }
  
  .event-tag {
    transition: all 0.15s ease-out;
  }
  
  .event-tag:hover {
    transform: scale(1.02);
    background-color: rgb(59 130 246);
    color: white;
  }
  
  .floating-action-section {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.95);
    border-top: 1px solid rgba(0,0,0,0.06);
  }
  
  .organizer-contact {
    transition: all 0.2s ease-out;
  }
  
  .organizer-contact:hover {
    background-color: rgb(243 244 246);
    transform: scale(1.02);
  }
  
  .invite-code-card {
    background: linear-gradient(135deg, #3ec6c6 0%, #2ea5a5 100%);
    color: white;
  }
  
  .invite-code-input {
    letter-spacing: 0.5em;
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 1.5rem;
  }
`;

/**
 * Enhanced EventDetails screen component with Figma-perfect design implementation
 */
export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, joinEvent, checkInEvent, setActiveFilters } = useAppStore();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [isInviteCodeDialogOpen, setIsInviteCodeDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState("");

  const event = events.find(e => e.id === id);

  // Initialize attendee count and bookmark status
  useEffect(() => {
    if (event) {
      setAttendeeCount(event.attendeeCount || 0);
      // TODO: In real app, fetch bookmark status from API
      setIsBookmarked(Math.random() > 0.7); // Mock random bookmark status
    }
  }, [event]);

  /**
   * Determine event status based on dates
   */
  const getEventStatus = () => {
    if (!event) return "upcoming";
    
    const now = new Date();
    const startDate = parseISO(event.date);
    const endDate = event.endDate ? parseISO(event.endDate) : startDate;
    
    if (isBefore(now, startDate)) {
      return "upcoming";
    } else if (isAfter(now, endDate)) {
      return "completed";
    } else {
      return "live";
    }
  };

  /**
   * Format event date and time for display
   */
  const formatEventDateTime = () => {
    if (!event) return "";
    
    const start = parseISO(event.date);
    const end = event.endDate ? parseISO(event.endDate) : null;
    
    if (end && format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      // Same day event
      return {
        date: format(start, 'EEEE, MMMM dd, yyyy'),
        time: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
        duration: `${Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))} hours`
      };
    } else if (end) {
      // Multi-day event
      return {
        date: `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`,
        time: format(start, 'h:mm a'),
        duration: `${Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))} days`
      };
    } else {
      // Single point in time
      return {
        date: format(start, 'EEEE, MMMM dd, yyyy'),
        time: format(start, 'h:mm a'),
        duration: "1 hour" // Default duration
      };
    }
  };

  /**
   * Handle navigation actions
   */
  const handleBack = () => {
    navigate(-1);
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.name,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Event link has been copied to your clipboard.",
    });
  };

  /**
   * Handle event actions
   */
  const handleJoinEvent = async () => {
    if (!event || !user) return;
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      joinEvent(event.id);
      setAttendeeCount(prev => prev + 1);
      
      // toast({
      //   title: "Joined event!",
      //   description: `You're now registered for ${event.name}.`,
      // });
    } catch (error) {
      toast({
        title: "Failed to join event",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (skipDialog = false) => {
    if (!event || !user) return;
    
    // Check if event is private and we haven't validated the code yet
    const isPrivateEvent = event.maxAttendees === 50; // Mock: events with 50 max attendees are private
    
    if (isPrivateEvent && !skipDialog) {
      // Show invite code dialog for private events
      setIsInviteCodeDialogOpen(true);
      setInviteCodeError("");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      checkInEvent(event.id);
      
      // toast({
      //   title: "Checked in!",
      //   description: `Welcome to ${event.name}!`,
      // });
      
      // Update the event state to mark as checked in
      checkInEvent(event.id);
      
      // Close dialog if it was open
      if (isInviteCodeDialogOpen) {
        setIsInviteCodeDialogOpen(false);
        setInviteCode("");
        setInviteCodeError("");
      }
      
      // Seamless redirection: set event filter and navigate to home
      setActiveFilters([event.id]);
      navigate("/home");
    } catch (error) {
      toast({
        title: "Failed to check in",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // toast({
    //   title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
    //   description: isBookmarked 
    //     ? "Event removed from your bookmarks."
    //     : "Event added to your bookmarks.",
    // });
  };

  const handleViewQuestions = () => {
    navigate("/home", { state: { filterByEvent: event?.id } });
  };

  /**
   * Handle invite code submission
   */
  const handleInviteCodeSubmit = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 3) {
      setInviteCodeError("Please enter a valid 3-digit invite code.");
      return;
    }

    setIsValidatingCode(true);
    setInviteCodeError("");

    try {
      // Simulate API call to validate invite code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock validation - accept "123" as valid code for this event
      const storedInviteCode = "123"; // In real app, this would come from the event data
      
      if (inviteCode === storedInviteCode) {
        // Code is correct, proceed with check-in
        await handleCheckIn(true); // Skip dialog since we're already validating
      } else {
        // Code is incorrect, show error and allow retry
        setInviteCodeError("Invalid invite code. Please check your code and try again.");
      }
    } catch (error) {
      setInviteCodeError("Validation failed. Please try again.");
    } finally {
      setIsValidatingCode(false);
    }
  };

  /**
   * Handle request access for private events
   */
  const handleRequestAccess = () => {
    setIsInviteCodeDialogOpen(false);
    setInviteCode("");
    setInviteCodeError("");
    
    toast({
      title: "Access request sent",
      description: "The event organizer has been notified of your request.",
    });
  };
  /**
   * Handle invite code input - only allow numbers and limit to 3 digits
   */
  const handleInviteCodeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 3);
    setInviteCode(numericValue);
    // Clear error when user starts typing
    if (inviteCodeError) {
      setInviteCodeError("");
    }
  };

  // Handle edge cases
  if (!event) {
    return (
      <div className="min-h-screen bg-[#f0efeb] flex items-center justify-center p-6">
        <Card className="w-full max-w-md event-info-card">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Event not found
            </h2>
            <p className="text-gray-600 mb-6">
              This event doesn't exist or has been removed.
            </p>
            <Button 
              onClick={handleBack}
              className="w-full bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white event-action-button"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventStatus = getEventStatus();
  const dateTimeInfo = formatEventDateTime();

  return (
    <>
      <style>{customStyles}</style>
      <div className="bg-[#f0efeb] min-h-screen">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 z-40 event-header-blur shadow-sm">
          <div className="flex items-center justify-between h-20 px-4 pt-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="w-10 h-10 rounded-full hover:bg-gray-100/80 transition-all duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </Button>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900 truncate px-4">
                {event.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleBookmark}
                className={`w-10 h-10 rounded-full transition-all duration-200 ${
                  isBookmarked 
                    ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100" 
                    : "text-gray-600 hover:bg-gray-100/80"
                }`}
              >
                <BookmarkIcon 
                  className="w-5 h-5" 
                  fill={isBookmarked ? "currentColor" : "none"} 
                />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="w-10 h-10 rounded-full text-gray-600 hover:bg-gray-100/80 transition-all duration-200"
              >
                <ShareIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Event Banner Image */}
        <div >
          <div className="flex justify-center items-center p-6">
            <div className="relative w-80 h-80 overflow-hidden rounded-2xl shadow-lg">
            <img
                src={event.bannerImage || event.image || "https://cdn.discordapp.com/attachments/1379799133451325582/1389316221626749019/Unicorn_Summit.png?ex=68642d0f&is=6862db8f&hm=c8ec879be7aa03620d11396bbe662cca85b072c6035171f9942bcc3cd8707c0c&"}
              alt={event.name}
              className="w-full h-full object-cover rounded-2xl"
            />
            <div className="event-image-overlay absolute inset-0 rounded-2xl"></div>
            </div>
          </div>
        </div>

        {/* Event Content */}
        <div className="px-4 py-6 space-y-6 pb-32">
          {/* Event Header Info - Modified: Removed star rating, expanded event name */}
          <Card className="event-info-card bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                {/* Event name now takes full width */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2 w-full">
                    {event.name}
                  </h1>
                  {event.organizerName && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <BuildingIcon className="w-4 h-4" />
                      <span>{event.organizerName}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date, Time & Location */}
          <Card className="event-info-card bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{dateTimeInfo.date}</p>
                    <p className="text-gray-600 text-sm mt-1">{dateTimeInfo.time}</p>
                  </div>
                </div>


                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => openLocationInGoogleMaps(event.location)}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left cursor-pointer underline-offset-2 hover:underline"
                      title="Click to open in Google Maps"
                    >
                      {event.location}
                    </button>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 mt-1"
                      onClick={() => openLocationInGoogleMaps(event.location)}
                    >
                      <MapPinIcon className="w-3 h-3 mr-1" />
                      View on Google Maps
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enter Invite Code Section - NEW */}
                          <Dialog open={isInviteCodeDialogOpen} onOpenChange={setIsInviteCodeDialogOpen}>
                  {/* <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-200"
                    >
                      Enter Code
                    </Button>
                  </DialogTrigger> */}
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <KeyIcon className="w-5 h-5 text-[#3ec6c6]" />
                        Enter Invite Code
                      </DialogTitle>
                      <DialogDescription>
                        Enter your 3-digit invite code to access exclusive event features and content.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6">
                      <Input
                        value={inviteCode}
                        onChange={(e) => handleInviteCodeChange(e.target.value)}
                        placeholder="123"
                        className="invite-code-input text-center text-2xl font-bold h-16 border-2 border-gray-300 focus:border-[#3ec6c6]"
                        maxLength={3}
                        disabled={isValidatingCode}
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Enter the 3-digit code provided by the event organizer
                      </p>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsInviteCodeDialogOpen(false);
                          setInviteCode("");
                        }}
                        disabled={isValidatingCode}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInviteCodeSubmit}
                        disabled={inviteCode.length !== 3 || isValidatingCode}
                        className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                      >
                        {isValidatingCode ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Validating...
                          </>
                        ) : (
                          "Submit Code"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

          {/* About Event */}
          <Card className="event-info-card bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </CardContent>
          </Card>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <Card className="event-info-card bg-white rounded-2xl border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="event-tag px-3 py-1 text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organizer Info */}
          <Card className="event-info-card bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <BuildingIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{event.organizerName}</p>
                    <p className="text-sm text-gray-600">Event Organizer</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="organizer-contact w-10 h-10 rounded-full"
                  >
                    <MailIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="organizer-contact w-10 h-10 rounded-full"
                  >
                    <PhoneIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {event.website && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => window.open(event.website, "_blank")}
                >
                  <ExternalLinkIcon className="w-4 h-4 mr-2" />
                  Visit Organizer Website
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Floating Action Buttons - Modified: Removed "Preview Event Q&A" button */}
        <div className="fixed bottom-0 left-0 right-0 floating-action-section shadow-lg">
          <div className="p-6">
            {event.isJoined ? (
              <div className="space-y-3">
                {!event.isCheckedIn && eventStatus === "live" && (
                  <Button
                    onClick={handleCheckIn}
                    disabled={isLoading}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl event-action-button"
                  >
                    {isLoading ? "Checking in..." : "Check In"}
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleViewQuestions}
                    variant="outline"
                    className="h-12 font-semibold rounded-xl event-action-button border-2 border-gray-200 hover:border-[#3ec6c6] hover:text-[#3ec6c6]"
                  >
                    Event Q&A
                  </Button>
                  
                  <Button
                    onClick={() => navigate("/messages")}
                    variant="outline"
                    className="h-12 font-semibold rounded-xl event-action-button border-2 border-gray-200 hover:border-[#3ec6c6] hover:text-[#3ec6c6]"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => handleCheckIn()}
                  disabled={isLoading}
                  className="w-full h-14 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white text-lg font-semibold rounded-xl event-action-button"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Joining...
                    </div>
                  ) : (
                    `Check in`
                  )}
                </Button>
                
                {/* Check In Button for Joined Users */}
                {event.isJoined && !event.isCheckedIn && eventStatus === "live" && (
                  <Button
                    onClick={() => handleCheckIn()}
                    disabled={isLoading}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl event-action-button"
                  >
                    {isLoading ? "Checking in..." : "Check In"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
        {/* Invite Code Dialog */}
        <Dialog open={isInviteCodeDialogOpen} onOpenChange={setIsInviteCodeDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyIcon className="w-5 h-5 text-[#3ec6c6]" />
                Private Event Access
              </DialogTitle>
              <DialogDescription>
                This is a private event. Enter your 3-digit invite code to check in, or request access from the organizer.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <Input
                value={inviteCode}
                onChange={(e) => handleInviteCodeChange(e.target.value)}
                placeholder="123"
                className="invite-code-input text-center text-2xl font-bold h-16 border-2 border-gray-300 focus:border-[#3ec6c6]"
                maxLength={3}
                disabled={isValidatingCode}
              />
              {inviteCodeError && (
                <p className="text-sm text-red-600 text-center mt-2">
                  {inviteCodeError}
                </p>
              )}
              <p className="text-xs text-gray-500 text-center mt-2">
                Enter the 3-digit code provided by the event organizer
              </p>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleRequestAccess}
                disabled={isValidatingCode}
                className="flex-1"
              >
                Request Access
              </Button>
              <Button
                onClick={handleInviteCodeSubmit}
                disabled={inviteCode.length !== 3 || isValidatingCode}
                className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white flex-1"
              >
                {isValidatingCode ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Validating...
                  </>
                ) : (
                  "Check In"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
};