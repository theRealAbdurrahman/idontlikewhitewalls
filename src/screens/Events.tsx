import React, { useState, useMemo } from "react";
import { CalendarIcon, MapPinIcon, UsersIcon, EuroIcon, ClockIcon, FilterIcon } from "lucide-react";
import { format, isAfter, isBefore, isToday, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  useReadEventsApiV1EventsGet, 
  useCreateEventParticipantApiV1EventParticipantsPost 
} from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuthStore } from "../stores/authStore";
import { ParticipantRole, ParticipantStatus } from "../api-client/models";

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
  communityName?: string; // Added community name
}

/**
 * Sort options for events
 */
const sortOptions = [
  { value: "date", label: "By Date" },
  { value: "name", label: "By Name" },
  { value: "attendees", label: "By Attendees" },
  { value: "recently-added", label: "Recently Added" },
];

/**
 * Filter options for events
 */
const filterOptions = [
  { value: "all", label: "All Events" },
  { value: "ongoing", label: "Ongoing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "joined", label: "Joined" },
  { value: "past", label: "Past Events" },
];

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
  
  .checkin-toggle {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.9);
  }
  
  .event-status-ongoing {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
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
 * Events screen component displaying compact horizontal event cards
 */
export const Events: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Local state
  const [sortBy, setSortBy] = useState("date");
  const [filterBy, setFilterBy] = useState("all");
  
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
        bannerImage: `https://images.pexels.com/photos/${[1181533, 159711, 3183150, 3182773, 574077][index % 5]}/pexels-photo-${[1181533, 159711, 3183150, 3182773, 574077][index % 5]}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1`,
        organizerId: event.creator_id,
        organizerName: "Event Organizer",
        attendeeCount: Math.floor(Math.random() * 500) + 50,
        isCheckedIn: false,
        isJoined: Math.random() > 0.5,
        tags: [],
        category: "General",
        status: "upcoming" as const,
        communityName: ["Dublin Tech Community", "Lisbon Startup Hub", "Women in Tech Europe"][index % 3],
      }));
    }
    return mockEvents;
  }, [eventsData?.data]);

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
   * Filter and sort events
   */
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];
    const now = new Date();

    // Apply filters
    switch (filterBy) {
      case "ongoing":
        filtered = filtered.filter(event => getEventStatus(event) === "ongoing");
        break;
      case "upcoming":
        filtered = filtered.filter(event => getEventStatus(event) === "upcoming");
        break;
      case "joined":
        filtered = filtered.filter(event => event.isJoined);
        break;
      case "past":
        filtered = filtered.filter(event => getEventStatus(event) === "completed");
        break;
      default:
        // For "all", hide past events by default
        filtered = filtered.filter(event => getEventStatus(event) !== "completed");
    }

    // Apply sorting
    switch (sortBy) {
      case "date":
        // Sort by: ongoing first, then upcoming by date, then completed by date
        filtered.sort((a, b) => {
          const statusA = getEventStatus(a);
          const statusB = getEventStatus(b);
          
          if (statusA === statusB) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          
          // Priority: ongoing > upcoming > completed
          const statusPriority = { ongoing: 0, upcoming: 1, completed: 2 };
          return statusPriority[statusA] - statusPriority[statusB];
        });
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "attendees":
        filtered.sort((a, b) => b.attendeeCount - a.attendeeCount);
        break;
      case "recently-added":
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
    }

    return filtered;
  }, [events, filterBy, sortBy]);

  /**
   * Format date and time for display
   */
  const formatEventDateTime = (startDate: string, endDate?: string) => {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : null;
    
    if (end && format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      // Same day event
      return `${format(start, 'MMM dd, yyyy')} • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else if (end) {
      // Multi-day event
      return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
    } else {
      // Single point in time
      return `${format(start, 'MMM dd, yyyy')} • ${format(start, 'h:mm a')}`;
    }
  };

  /**
   * Handle event card click
   */
  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
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
      },
      onError: (error) => {
        console.error("Failed to join event:", error);
      }
    });
  };

  /**
   * Handle check-in toggle
   */
  const handleCheckIn = (e: React.MouseEvent, eventId: string, currentStatus: boolean) => {
    e.stopPropagation();
    
    // TODO: Implement check-in API call
    console.log("Toggle check-in for event:", eventId, "current status:", currentStatus);
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-[#3ec6c6]" />
                Events
              </h1>
              <p className="text-gray-600 mt-1">Discover and join professional events</p>
            </div>
            
            <Badge variant="secondary" className="bg-[#3ec6c6]/10 text-[#3ec6c6] font-semibold px-4 py-2">
              {filteredAndSortedEvents.length} Events
            </Badge>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <FilterIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
        {!eventsLoading && !eventsError && filteredAndSortedEvents.length === 0 && (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filterBy === "past" ? "No past events found" : 
                 filterBy === "joined" ? "You haven't joined any events yet" :
                 "No events found"}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterBy === "past" ? "There are no completed events to show." :
                 filterBy === "joined" ? "Join some events to see them here." :
                 "Try adjusting your filters or check back later for new events."}
              </p>
              {filterBy !== "all" && (
                <Button 
                  onClick={() => setFilterBy("all")}
                  variant="outline"
                  className="mb-4"
                >
                  Show All Events
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Compact Events List */}
        {!eventsLoading && !eventsError && filteredAndSortedEvents.length > 0 && (
          <div className="space-y-4">
            {filteredAndSortedEvents.map((event) => {
              const eventStatus = getEventStatus(event);
              
              return (
                <Card
                  key={event.id}
                  className="event-card bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer overflow-hidden relative"
                  onClick={() => handleEventClick(event.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex h-32">
                      {/* Event Image - 33% width */}
                      <div className="w-1/3 min-w-[120px] relative overflow-hidden bg-gray-100">
                        <img
                          src={event.bannerImage || `https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1`}
                          alt={event.name}
                          className="event-image w-full h-full object-cover transition-transform duration-300"
                        />
                        
                        {/* Status Badge - positioned on image */}
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={`text-xs px-2 py-1 font-semibold ${
                              eventStatus === "ongoing" 
                                ? "bg-green-500 text-white event-status-ongoing" 
                                : eventStatus === "upcoming"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-500 text-white"
                            }`}
                          >
                            {eventStatus === "ongoing" && "• LIVE"}
                            {eventStatus === "upcoming" && "UPCOMING"}
                            {eventStatus === "completed" && "COMPLETED"}
                          </Badge>
                        </div>

                        {/* Price Badge - positioned on image */}
                        {event.price !== undefined && (
                          <div className="absolute bottom-2 left-2">
                            <Badge
                              className={`text-xs font-semibold ${
                                event.price === 0 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-white text-gray-800"
                              }`}
                            >
                              {event.price === 0 ? "Free" : `€${event.price}`}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Event Content - 67% width */}
                      <div className="flex-1 p-4 relative">
                        {/* Check-in Toggle - positioned in top right */}
                        {event.isJoined && eventStatus !== "completed" && (
                          <div className="absolute top-2 right-2">
                            <div 
                              className="checkin-toggle rounded-full px-3 py-1 shadow-md backdrop-blur-sm"
                              onClick={(e) => handleCheckIn(e, event.id, event.isCheckedIn)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-800">
                                  Check-in
                                </span>
                                <Switch
                                  checked={event.isCheckedIn}
                                  className="scale-75"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col justify-between h-full pr-16">
                          {/* Top Section */}
                          <div>
                            {/* Community Name */}
                            {event.communityName && (
                              <p className="text-xs text-[#3ec6c6] font-semibold mb-1 truncate">
                                {event.communityName}
                              </p>
                            )}
                            
                            {/* Event Name */}
                            <h3 className="font-bold text-base text-black mb-2 line-clamp-2 leading-tight">
                              {event.name}
                            </h3>

                            {/* Date & Time */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <ClockIcon className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium truncate">
                                {formatEventDateTime(event.date, event.endDate)}
                              </span>
                            </div>
                            
                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>

                          {/* Bottom Section - Action Buttons */}
                          <div className="flex gap-2 mt-2">
                            {event.isJoined ? (
                              <>
                                {!event.isCheckedIn && eventStatus !== "completed" && (
                                  <Button
                                    onClick={(e) => handleCheckIn(e, event.id, event.isCheckedIn)}
                                    className="text-xs px-3 py-1 h-7 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Check In
                                  </Button>
                                )}
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event.id);
                                  }}
                                  variant="outline"
                                  className="text-xs px-3 py-1 h-7"
                                >
                                  Details
                                </Button>
                              </>
                            ) : eventStatus === "completed" ? (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event.id);
                                }}
                                variant="outline"
                                className="text-xs px-3 py-1 h-7"
                              >
                                View Details
                              </Button>
                            ) : (
                              <>
                                <Button
                                  onClick={(e) => handleJoinEvent(e, event.id)}
                                  className="text-xs px-3 py-1 h-7 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                                  disabled={joinEventMutation.isPending}
                                >
                                  {joinEventMutation.isPending ? "Joining..." : "Join"}
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event.id);
                                  }}
                                  variant="outline"
                                  className="text-xs px-3 py-1 h-7"
                                >
                                  Details
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};