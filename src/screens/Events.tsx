import React from "react";
import { CalendarIcon, MapPinIcon, UsersIcon, EuroIcon } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  useReadEventsApiV1EventsGet, 
  useCreateEventParticipantApiV1EventParticipantsPost 
} from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuthStore } from "../stores/authStore";
import { ParticipantRole, ParticipantStatus } from "../api-client/models";

/**
 * Events screen component displaying list of events
 */
export const Events: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Fetch events from API
  const { 
    data: eventsData, 
    isLoading: eventsLoading, 
    error: eventsError 
  } = useReadEventsApiV1EventsGet();
  
  // Mutation for joining events
  const joinEventMutation = useCreateEventParticipantApiV1EventParticipantsPost();

  // Transform API data to component format
  const events = React.useMemo(() => {
    if (!eventsData?.data) return [];
    
    return eventsData.data.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description || "",
      location: event.location || "",
      date: event.start_date,
      endDate: event.end_date,
      image: undefined, // API doesn't have image field yet
      organizerId: event.creator_id,
      organizerName: "Event Organizer", // Default for now
      attendeeCount: 0, // Will be populated from event participants
      isCheckedIn: false, // Will be determined from user's participation
      isJoined: false, // Will be determined from user's participation
      tags: [], // Default empty for now
      category: "General", // Default category
      website: undefined,
      maxAttendees: undefined,
      price: undefined,
      currency: "EUR",
      status: "upcoming" as const,
    }));
  }, [eventsData?.data]);

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleJoinEvent = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    
    if (!user) return;
    
    // COMMENTED OUT: Local state update for future reference
    // joinEvent(eventId);
    
    // Use API to join event
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
        // TODO: Refetch events or update local state
      },
      onError: (error) => {
        console.error("Failed to join event:", error);
      }
    });
  };

  const handleCheckIn = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    
    // COMMENTED OUT: Local state update for future reference
    // checkInEvent(eventId);
    
    // TODO: Implement check-in API call
    console.log("Check in called for event:", eventId, "- API integration needed");
  };

  // Handle loading and error states
  if (eventsLoading) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">Events</h1>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-2">Events</h1>
          <p className="text-red-500">Error loading events. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black mb-2">Events</h1>
        <p className="text-gray-600">Discover and join professional events</p>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Card
            key={event.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleEventClick(event.id)}
          >
            <CardContent className="p-4">
              {/* Event Image */}
              {event.image && (
                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Event Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-black mb-1">
                    {event.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {event.description}
                  </p>
                </div>
                
                {/* Status Badge */}
                <Badge
                  variant={event.isCheckedIn ? "default" : event.isJoined ? "secondary" : "outline"}
                  className={`ml-2 ${
                    event.isCheckedIn 
                      ? "bg-green-100 text-green-800" 
                      : event.isJoined 
                      ? "bg-blue-100 text-blue-800" 
                      : ""
                  }`}
                >
                  {event.isCheckedIn ? "Checked In" : event.isJoined ? "Joined" : "Available"}
                </Badge>
              </div>

              {/* Event Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{format(new Date(event.date), "MMM dd, yyyy • HH:mm")}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UsersIcon className="w-4 h-4" />
                    <span>{event.attendeeCount} attending</span>
                    {event.maxAttendees && (
                      <span>• {event.maxAttendees} max</span>
                    )}
                  </div>
                  
                  {event.price !== undefined && (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <EuroIcon className="w-4 h-4" />
                      <span>{event.price === 0 ? "Free" : `€${event.price}`}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {event.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {event.isJoined ? (
                  <>
                    {!event.isCheckedIn && (
                      <Button
                        onClick={(e) => handleCheckIn(e, event.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Check In
                      </Button>
                    )}
                    <Button
                      onClick={() => handleEventClick(event.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={(e) => handleJoinEvent(e, event.id)}
                      className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                    >
                      Join Event
                    </Button>
                    <Button
                      onClick={() => handleEventClick(event.id)}
                      variant="outline"
                    >
                      Details
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};