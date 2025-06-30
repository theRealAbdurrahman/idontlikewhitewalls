import React, { useState, useMemo } from "react";
import { CalendarIcon, MapPinIcon, UsersIcon, BookmarkIcon, PlusIcon } from "lucide-react";
import { format, isAfter, isBefore, parseISO, isToday, isTomorrow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  useReadEventsApiV1EventsGet, 
  useCreateEventParticipantApiV1EventParticipantsPost 
} from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../providers";
import { useToast } from "../hooks/use-toast";
import { ParticipantRole, ParticipantStatus } from "../api-client/models";
import { openLocationInGoogleMaps } from "../utils/googleMaps";

/**
 * Event interface with banner image support
 */
interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  endDate?: string;
  bannerImage?: string;
  organizerId: string;
  organizerName: string;
  attendeeCount: number;
  isCheckedIn: boolean;
  isJoined: boolean;
  tags: string[];
  category: string;
  website?: string;
  maxAttendees?: number;
  price?: number;
  currency?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  communityName?: string;
  isBookmarked?: boolean; // TODO: Add to main Event interface in appStore
}

/**
 * Custom styles for animations and hover effects
 */
const customStyles = `
  .event-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .event-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
  }
  
  .event-image {
    transition: transform 0.3s ease-out;
  }
  
  .event-card:hover .event-image {
    transform: scale(1.05);
  }
  
  .bookmark-button {
    transition: all 0.2s ease-out;
  }
  
  .bookmark-button:hover {
    transform: scale(1.1);
  }
  
  .loading-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

/**
 * Events screen component displaying simplified event cards
 */
export const Events: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Local state for bookmarks (TODO: Move to appStore)
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(new Set());
  
  // Fetch events from API
  const { 
    data: eventsData, 
    isLoading: eventsLoading, 
    error: eventsError 
  } = useReadEventsApiV1EventsGet();
  
  // Mutation for joining events
  const joinEventMutation = useCreateEventParticipantApiV1EventParticipantsPost();

  // Mock event data with banner images and communities (fallback if API fails)
  const mockEvents: Event[] = [
    {
      id: "event-1",
      name: "The Summeet 2025",
      description: "The ultimate tech conference bringing together innovators, entrepreneurs, and thought leaders from around the world.",
      location: "Dublin Convention Centre",
      date: "2025-03-15T09:00:00Z",
      endDate: "2025-03-17T18:00:00Z",
      bannerImage: "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
      organizerId: "organizer-1",
      organizerName: "Tech Events Ireland",
      attendeeCount: 1250,
      isCheckedIn: true,
      isJoined: true,
      tags: ["#Tech", "#Innovation", "#Networking"],
      category: "Technology",
      website: "https://summeet2025.com",
      maxAttendees: 1500,
      price: 299,
      currency: "EUR",
      status: "upcoming",
      communityName: "Dublin Tech Community",
      isBookmarked: false,
    },
    {
      id: "event-2",
      name: "Dublin Tech Summit",
      description: "Exploring the latest trends in AI, blockchain, and fintech.",
      location: "Trinity College Dublin",
      date: "2025-02-20T10:00:00Z",
      endDate: "2025-02-20T17:00:00Z",
      bannerImage: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
      organizerId: "organizer-2",
      organizerName: "Dublin Tech Community",
      attendeeCount: 480,
      isCheckedIn: false,
      isJoined: true,
      tags: ["#AI", "#Blockchain", "#Fintech"],
      category: "Technology",
      maxAttendees: 500,
      price: 150,
      currency: "EUR",
      status: "upcoming",
      communityName: "Dublin Tech Community",
      isBookmarked: true,
    },
    {
      id: "event-3",
      name: "Startup Pitch Night",
      description: "Local entrepreneurs pitch their innovative ideas to investors and the community.",
      location: "NDRC Dublin",
      date: "2025-02-10T19:00:00Z",
      endDate: "2025-02-10T22:00:00Z",
      bannerImage: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
      organizerId: "organizer-3",
      organizerName: "Dublin Startup Hub",
      attendeeCount: 120,
      isCheckedIn: false,
      isJoined: false,
      tags: ["#Startup", "#Entrepreneurship", "#Pitch"],
      category: "Business",
      maxAttendees: 150,
      price: 0,
      currency: "EUR",
      status: "upcoming",
      communityName: "Dublin Startup Hub",
      isBookmarked: false,
    },
    {
      id: "event-4",
      name: "Women in Tech Meetup",
      description: "Empowering women in technology through networking and knowledge sharing.",
      location: "Google Dublin",
      date: "2025-01-25T18:30:00Z",
      endDate: "2025-01-25T21:00:00Z",
      bannerImage: "https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
      organizerId: "organizer-4",
      organizerName: "Women in Tech Dublin",
      attendeeCount: 85,
      isCheckedIn: false,
      isJoined: true,
      tags: ["#WomenInTech", "#Diversity", "#Networking"],
      category: "Professional",
      maxAttendees: 100,
      price: 0,
      currency: "EUR",
      status: "ongoing",
      communityName: "Women in Tech Dublin",
      isBookmarked: false,
    },
    {
      id: "event-5", 
      name: "DevOps Dublin Meetup",
      description: "Monthly meetup for DevOps engineers and cloud infrastructure enthusiasts.",
      location: "Microsoft Ireland",
      date: "2025-01-10T18:00:00Z",
      endDate: "2025-01-10T20:30:00Z",
      bannerImage: "https://images.pexels.com/photos/574077/pexels-photo-574077.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1",
      organizerId: "organizer-5",
      organizerName: "DevOps Dublin",
      attendeeCount: 95,
      isCheckedIn: false,
      isJoined: false,
      tags: ["#DevOps", "#Cloud", "#Infrastructure"],
      category: "Technology",
      maxAttendees: 120,
      price: 0,
      currency: "EUR",
      status: "completed",
      communityName: "DevOps Dublin",
      isBookmarked: false,
    },
  ];

  // Transform API data to component format or use mock data
  const events = useMemo(() => {
    if (eventsData?.data && eventsData.data.length > 0) {
      return eventsData.data.map((event, index) => ({
        id: event.id,
        name: event.name,
        description: event.description || "",
        location: event.location || "",
        date: event.start_date,
        endDate: event.end_date,
        bannerImage: `https://cdn.discordapp.com/attachments/1379799133451325582/1389316221626749019/Unicorn_Summit.png?ex=68642d0f&is=6862db8f&hm=c8ec879be7aa03620d11396bbe662cca85b072c6035171f9942bcc3cd8707c0c&`,
        organizerId: event.creator_id,
        organizerName: "Event Organizer",
        attendeeCount: Math.floor(Math.random() * 500) + 50,
        isCheckedIn: false,
        isJoined: Math.random() > 0.5,
        tags: [],
        category: "General",
        status: "upcoming" as const,
        communityName: ["Dublin Tech Community", "Lisbon Startup Hub", "Women in Tech Europe"][index % 3],
        isBookmarked: bookmarkedEvents.has(event.id),
      }));
    }
    return mockEvents.map(event => ({
      ...event,
      isBookmarked: bookmarkedEvents.has(event.id)
    }));
  }, [eventsData?.data, bookmarkedEvents]);

  /**
   * Determine event status based on dates
   */
  const getEventStatus = (event: Event): "ongoing" | "upcoming" | "completed" => {
    const now = new Date();
    const startDate = parseISO(event.date);
    const endDate = event.endDate ? parseISO(event.endDate) : startDate;
    
    if (isBefore(now, startDate)) {
      return "upcoming";
    } else if (isAfter(now, endDate)) {
      return "completed";  
    } else {
      return "ongoing";
    }
  };

  /**
   * Format event date and time according to specific rules:
   * - Today: "Today at HH:MM"
   * - Tomorrow: "Tomorrow at HH:MM"
   * - Other dates: "DD MMM at HH:MM"
   */
  const formatEventDateTime = (startDate: string) => {
    const start = parseISO(startDate);
    const time = format(start, 'HH:mm'); // 24-hour format
    
    if (isToday(start)) {
      return `Today at ${time}`;
    } else if (isTomorrow(start)) {
      return `Tomorrow at ${time}`;
    } else {
      const date = format(start, 'dd MMM'); // DD MMM format
      return `${date} at ${time}`;
    }
  };

  /**
   * Handle bookmark toggle
   */
  const handleBookmarkToggle = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    
    const newBookmarkedEvents = new Set(bookmarkedEvents);
    if (bookmarkedEvents.has(eventId)) {
      newBookmarkedEvents.delete(eventId);
      toast({
        title: "Removed from bookmarks",
        description: "Event removed from your bookmarks.",
      });
    } else {
      newBookmarkedEvents.add(eventId);
      toast({
        title: "Added to bookmarks", 
        description: "Event added to your bookmarks.",
      });
    }
    setBookmarkedEvents(newBookmarkedEvents);
    
    // TODO: Integrate with appStore.toggleEventBookmark(eventId)
  };

  /**
   * Handle event card click
   */
  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };
  
  /**
   * Handle creating new event
   */
  const handleCreateEvent = () => {
    navigate("/create-event");
  };

  /**
   * Handle join event
   */
  const handleJoinEvent = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    
    if (!user) return;
    
    joinEventMutation.mutate({
      data: {
        event_id: eventId,
        user_id: user.id,
        role: ParticipantRole.attendee,
        status: ParticipantStatus.confirmed,
      }
    }, {
      onSuccess: () => {
        console.log("Successfully joined event:", eventId);
        toast({
          title: "Joined event!",
          description: "You're now registered for this event.",
        });
      },
      onError: (error) => {
        console.error("Failed to join event:", error);
        toast({
          title: "Failed to join event",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  /**
   * Handle check-in toggle
   */
  const handleCheckIn = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    
    // TODO: Implement check-in API call
    console.log("Toggle check-in for event:", eventId);
    toast({
      title: "Checked in!",
      description: "Welcome to the event!",
    });
  };

  /**
   * Loading state component
   */
  const LoadingCard = () => (
    <Card className="event-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="flex h-32">
          <div className="w-1/4 loading-skeleton"></div>
          <div className="flex-1 p-4 space-y-3">
            <div className="loading-skeleton h-4 w-3/4 rounded"></div>
            <div className="loading-skeleton h-3 w-1/2 rounded"></div>
            <div className="loading-skeleton h-3 w-2/3 rounded"></div>
            <div className="loading-skeleton h-3 w-1/3 rounded"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <style>{customStyles}</style>
      <div className="px-4 py-6">

        {/* Loading State */}
        {eventsLoading && (
          <div className="space-y-4">
            {Array.from({ length: 6 }, (_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {eventsError && (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to load events
              </h3>
              <p className="text-gray-600 mb-6">
                There was a problem loading events. Please try again.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!eventsLoading && !eventsError && events.length === 0 && (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-600 mb-6">
                Check back later for new events.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Simplified Events List */}
        {!eventsLoading && !eventsError && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => {
              const eventStatus = getEventStatus(event);
              
              return (
                <Card
                  key={event.id}
                  className="event-card bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer overflow-hidden relative"
                  onClick={() => handleEventClick(event.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex h-32 relative">
                      {/* Event Image - 33% width */}
                      <div className="w-1/3 min-w-[120px] relative overflow-hidden bg-gray-100">
                        <img
                          src={event.bannerImage || `https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1`}
                          alt={event.name}
                          className="event-image w-full h-full object-cover"
                        />
                      </div>

                      {/* Event Content - 67% width */}
                      <div className="flex-1 p-4 relative">
                        <div className="flex flex-col justify-between h-full">
                          {/* Top Section */}
                          <div>
                            {/* Community Name */}
                            {event.communityName && (
                              <p className="text-xs text-[#3ec6c6] font-semibold mb-1 truncate">
                                {event.communityName}
                              </p>
                            )}
                            
                            {/* Event Name */}
                            <h3 className="font-bold text-base text-black mb-2 line-clamp-2 leading-tight pr-8">
                              {event.name}
                            </h3>

                            {/* Simplified Date & Time */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <span className="font-medium">
                                {formatEventDateTime(event.date)}
                              </span>
                            </div>
                            
                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent event card navigation
                                  openLocationInGoogleMaps(event.location);
                                }}
                                className="line-clamp-2 leading-tight hover:text-blue-600 transition-colors text-left cursor-pointer underline-offset-2 hover:underline"
                                title="Click to open in Google Maps"
                              >
                                {event.location}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Bookmark Button - Top Right */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleBookmarkToggle(e, event.id)}
                          className={`bookmark-button absolute top-2 right-2 w-8 h-8 p-0 rounded-full ${
                            event.isBookmarked 
                              ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100" 
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <BookmarkIcon 
                            className="w-4 h-4" 
                            fill={event.isBookmarked ? "currentColor" : "none"} 
                          />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      <Button
        onClick={handleCreateEvent}
        className="w-[50px] h-[50px] fixed bottom-[103px] right-[30px] bg-[#FFCA28] hover:bg-[#e6b324] rounded-full shadow-[0px_4px_8px_#00000040] p-0 flex items-center justify-center z-20 transition-all duration-200 hover:scale-105"
        aria-label="Create new event"
      >
        <PlusIcon className="w-[22px] h-[22px] text-black" />
      </Button>
    </>
  );
};