import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon, 
  EuroIcon, 
  ExternalLinkIcon, 
  ShareIcon,
  ArrowLeftIcon,
  ClockIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  HeartIcon,
  StarIcon
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAppStore } from "../stores/appStore";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../hooks/use-toast";

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
`;

/**
 * Enhanced EventDetails screen component with Figma-perfect design implementation
 */
export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, joinEvent, checkInEvent } = useAppStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);

  const event = events.find(e => e.id === id);

  // Initialize attendee count and favorite status
  useEffect(() => {
    if (event) {
      setAttendeeCount(event.attendeeCount || 0);
      // TODO: In real app, fetch favorite status from API
      setIsFavorited(Math.random() > 0.7); // Mock random favorite status
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
      
      toast({
        title: "Joined event!",
        description: `You're now registered for ${event.name}.`,
      });
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

  const handleCheckIn = async () => {
    if (!event || !user) return;
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      checkInEvent(event.id);
      
      toast({
        title: "Checked in!",
        description: `Welcome to ${event.name}!`,
      });
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

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: isFavorited 
        ? "Event removed from your favorites."
        : "Event added to your favorites.",
    });
  };

  const handleViewQuestions = () => {
    navigate("/home", { state: { filterByEvent: event?.id } });
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
                onClick={handleToggleFavorite}
                className={`w-10 h-10 rounded-full transition-all duration-200 ${
                  isFavorited 
                    ? "text-red-500 bg-red-50 hover:bg-red-100" 
                    : "text-gray-600 hover:bg-gray-100/80"
                }`}
              >
                <HeartIcon 
                  className="w-5 h-5" 
                  fill={isFavorited ? "currentColor" : "none"} 
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
        <div className="pt-20">
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={event.bannerImage || event.image || "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=1"}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="event-image-overlay absolute inset-0"></div>
            
            {/* Event Status Badge */}
            <div className="absolute top-4 left-4">
              <Badge
                className={`text-xs font-semibold px-3 py-1 ${
                  eventStatus === "live" 
                    ? "bg-red-500 text-white event-status-live" 
                    : eventStatus === "upcoming"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-500 text-white"
                }`}
              >
                {eventStatus === "live" && "• LIVE NOW"}
                {eventStatus === "upcoming" && "UPCOMING"}
                {eventStatus === "completed" && "COMPLETED"}
              </Badge>
            </div>

            {/* Price Badge */}
            {event.price !== undefined && (
              <div className="absolute top-4 right-4">
                <Badge
                  className={`text-sm font-semibold px-4 py-2 ${
                    event.price === 0 
                      ? "bg-green-500 text-white" 
                      : "bg-white text-gray-900"
                  }`}
                >
                  {event.price === 0 ? "FREE" : `€${event.price}`}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Event Content */}
        <div className="px-4 py-6 space-y-6 pb-32">
          {/* Event Header Info */}
          <Card className="event-info-card bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                    {event.name}
                  </h1>
                  {event.organizerName && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <BuildingIcon className="w-4 h-4" />
                      <span>Hosted by {event.organizerName}</span>
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold text-gray-700">4.8</span>
                  <span className="text-sm text-gray-500">(124)</span>
                </div>
              </div>
              
              {/* Attendee Count */}
              <div className="flex items-center gap-2 text-gray-600">
                <UsersIcon className="w-5 h-5" />
                <span className="font-medium">
                  {attendeeCount.toLocaleString()} attending
                  {event.maxAttendees && ` • ${event.maxAttendees.toLocaleString()} max`}
                </span>
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
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Duration</p>
                    <p className="text-gray-600 text-sm mt-1">{dateTimeInfo.duration}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{event.location}</p>
                    {event.website && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 mt-1"
                        onClick={() => window.open(event.website, "_blank")}
                      >
                        <ExternalLinkIcon className="w-3 h-3 mr-1" />
                        View on Maps
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

        {/* Floating Action Buttons */}
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
                    {isLoading ? "Checking in..." : "Check In Now"}
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
                  onClick={handleJoinEvent}
                  disabled={isLoading}
                  className="w-full h-14 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white text-lg font-semibold rounded-xl event-action-button"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Joining...
                    </div>
                  ) : (
                    `Join Event${event.price && event.price > 0 ? ` • €${event.price}` : ""}`
                  )}
                </Button>
                
                <Button
                  onClick={handleViewQuestions}
                  variant="outline"
                  className="w-full h-12 font-semibold rounded-xl event-action-button border-2 border-gray-200 hover:border-[#3ec6c6] hover:text-[#3ec6c6]"
                >
                  Preview Event Q&A
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};