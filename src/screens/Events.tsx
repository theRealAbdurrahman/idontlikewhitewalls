import React from "react";
import { CalendarIcon, MapPinIcon, UsersIcon, EuroIcon } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAppStore } from "../stores/appStore";

/**
 * Events screen component displaying list of events
 */
export const Events: React.FC = () => {
  const navigate = useNavigate();
  const { events, joinEvent, checkInEvent } = useAppStore();

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const handleJoinEvent = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    joinEvent(eventId);
  };

  const handleCheckIn = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    checkInEvent(eventId);
  };

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