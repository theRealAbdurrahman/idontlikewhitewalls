import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarIcon, MapPinIcon, UsersIcon, EuroIcon, ExternalLinkIcon, ShareIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAppStore } from "../stores/appStore";

/**
 * Event Details screen component
 */
export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, joinEvent, checkInEvent } = useAppStore();

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="px-4 py-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-black mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">This event doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/events")}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const handleJoinEvent = () => {
    joinEvent(event.id);
  };

  const handleCheckIn = () => {
    checkInEvent(event.id);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share event:", event.id);
  };

  return (
    <div className="px-4 py-6">
      {/* Event Image */}
      {event.image && (
        <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-3">
          <h1 className="text-2xl font-bold text-black flex-1 pr-4">
            {event.name}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="w-10 h-10 rounded-full"
          >
            <ShareIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Status Badge */}
        <Badge
          variant={event.isCheckedIn ? "default" : event.isJoined ? "secondary" : "outline"}
          className={`mb-4 ${
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

      {/* Event Info */}
      
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-black">
                {format(new Date(event.date), "EEEE, MMMM dd, yyyy")}
              </p>
              <p className="text-sm text-gray-600">
                {format(new Date(event.date), "HH:mm")}
                {event.endDate && ` - ${format(new Date(event.endDate), "HH:mm")}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPinIcon className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-black">{event.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UsersIcon className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-black">
                {event.attendeeCount} attending
                {event.maxAttendees && ` • ${event.maxAttendees} max`}
              </p>
            </div>
          </div>

          {event.price !== undefined && (
            <div className="flex items-center gap-3">
              <EuroIcon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-black">
                  {event.price === 0 ? "Free" : `€${event.price}`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="font-semibold text-lg text-black mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">{event.description}</p>
        </CardContent>
      </Card>

      {/* Tags */}
      {event.tags.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg text-black mb-3">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizer */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="font-semibold text-lg text-black mb-3">Organizer</h2>
          <p className="text-gray-700">{event.organizerName}</p>
          {event.website && (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => window.open(event.website, "_blank")}
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Visit Website
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="sticky bottom-4 bg-[#f0efeb]">
        <CardContent className="p-4">
        {event.isJoined ? (
          <div className="space-y-3">
            {!event.isCheckedIn && (
              <Button
                onClick={handleCheckIn}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
              >
                Check In to Event
              </Button>
            )}
            <Button
              onClick={() => navigate("/home")}
              variant="outline"
              className="w-full h-12"
            >
              View Event Questions
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleJoinEvent}
            className="w-full h-12 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
          >
            Join Event
          </Button>
        )}
        </CardContent>
      </Card>
    </div>
  );
};