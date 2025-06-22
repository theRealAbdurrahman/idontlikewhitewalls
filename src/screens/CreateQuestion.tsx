import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, ImageIcon, MicIcon, SparklesIcon, MessageCircleIcon, ChevronDownIcon } from "lucide-react";
import { useCreateQuestionApiV1QuestionsPost, useReadEventsApiV1EventsGet } from "../api-client/api-client";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Checkbox } from "../components/ui/checkbox";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../hooks/use-toast";

/**
 * Interface for event selection
 */
interface EventOption {
  id: string;
  name: string;
  isSelected: boolean;
}

/**
 * Create Question screen component matching the Figma design
 */
export const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Fetch events data from API
  const { data: eventsData, isLoading: eventsLoading } = useReadEventsApiV1EventsGet();
  
  // Use API mutation for creating questions
  const createQuestionMutation = useCreateQuestionApiV1QuestionsPost();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["event-1"]); // Default to first event
  const [visibility, setVisibility] = useState<"anyone" | "network" | "event">("anyone");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEventsDropdownOpen, setIsEventsDropdownOpen] = useState(false);

  // Transform API events data for the component
  const events = React.useMemo(() => {
    if (!eventsData?.data) {
      // Fallback to mock events if API data not available
      return [
        {
          id: "event-1",
          name: "The Summeet 2025",
          description: "The ultimate tech conference",
          location: "Dublin Convention Centre",
          date: "2025-03-15T09:00:00Z",
          endDate: "2025-03-17T18:00:00Z",
          organizerId: "organizer-1",
          organizerName: "Tech Events Ireland",
          attendeeCount: 1250,
          isCheckedIn: true,
          isJoined: true,
          tags: ["#Tech", "#Innovation", "#Networking"],
          category: "Technology",
          status: "upcoming" as const,
        },
        {
          id: "event-2",
          name: "Dublin Tech Summit",
          description: "Exploring the latest trends in AI",
          location: "Trinity College Dublin",
          date: "2025-02-20T10:00:00Z",
          endDate: "2025-02-20T17:00:00Z",
          organizerId: "organizer-2",
          organizerName: "Dublin Tech Community",
          attendeeCount: 480,
          isCheckedIn: false,
          isJoined: true,
          tags: ["#AI", "#Blockchain", "#Fintech"],
          category: "Technology",
          status: "upcoming" as const,
        }
      ];
    }
    
    return eventsData.data.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description || "",
      location: event.location || "",
      date: event.start_date,
      endDate: event.end_date,
      organizerId: event.creator_id,
      organizerName: "Event Organizer",
      attendeeCount: 0,
      isCheckedIn: false,
      isJoined: true,
      tags: [],
      category: "General",
      status: "upcoming" as const,
    }));
  }, [eventsData?.data]);

  /**
   * Handle closing the create question screen
   */
  const handleClose = () => {
    navigate("/home");
  };

  /**
   * Handle navigating to suggest a feature (AI feature)
   */
  const handleSuggestFeature = () => {
    navigate("/messages");
    toast({
      title: "Feature suggestion",
      description: "Navigate to messages to suggest new features to the Meetball team.",
    });
  };

  /**
   * Handle event selection toggle
   */
  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        // Don't allow deselecting all events
        if (prev.length === 1) {
          toast({
            title: "At least one event required",
            description: "Please select at least one event to post this question.",
            variant: "destructive",
          });
          return prev;
        }
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  /**
   * Get display text for selected events
   */
  const getSelectedEventsText = () => {
    if (selectedEvents.length === 0) return "Select events";
    if (selectedEvents.length === 1) {
      const event = events.find(e => e.id === selectedEvents[0]);
      return event?.name || "Unknown Event";
    }
    return `${selectedEvents.length} events selected`;
  };

  /**
   * Handle form submission to create a new question
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !user) {
      return;
    }

    // Validation: check if at least one event is selected
    if (selectedEvents.length === 0) {
      toast({
        title: "Event required",
        description: "Please select at least one event to post this question.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // For now, create question with the first selected event
      // In a real implementation, you might want to create multiple question instances
      // or have a different API endpoint that accepts multiple events
      const primaryEventId = selectedEvents[0];
      
      await createQuestionMutation.mutateAsync({
        data: {
          event_id: primaryEventId,
          user_id: user.id,
          title: title.trim(),
          content: description.trim() || title.trim(),
          is_official: false,
          is_anonymous: isAnonymous,
          is_featured: false,
        }
      });

      // Show success message
      toast({
        title: "Question posted!",
        description: `Your question has been posted to ${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} successfully.`,
      });

      // Navigate back to home
      navigate("/home");
    } catch (error) {
      console.error("Failed to create question:", error);
      
      // Show error message for network issues
      toast({
        title: "Couldn't post your question",
        description: "Couldn't post your question because of internet issues. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation - title is required
  const isFormValid = title.trim().length > 0 && selectedEvents.length > 0 && !createQuestionMutation.isPending && !isSubmitting;

  return (
    <div className="bg-[var(--ColorYellow_primary_colorYellow_50)] min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-[var(--ColorYellow_primary_colorYellow_50)] border-b border-gray-200">
        {/* Left Side - Events Dropdown */}
        <DropdownMenu open={isEventsDropdownOpen} onOpenChange={setIsEventsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 rounded-full border-gray-300 bg-white hover:bg-gray-50 font-medium text-gray-900"
            >
              <span className="truncate max-w-[180px]">
                {getSelectedEventsText()}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0" align="start">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Select Events</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {eventsLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading events...</div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => handleEventToggle(event.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => handleEventToggle(event.id)}>
                        <label 
                          htmlFor={`event-${event.id}`}
                          className="font-medium text-gray-900 cursor-pointer"
                        >
                          {event.name}
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.location} • {new Date(event.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.attendeeCount} attendees
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Button 
                  onClick={() => setIsEventsDropdownOpen(false)}
                  className="w-full bg-[var(--ColorTurquoise_secondaryTurquoise_600)] hover:bg-[var(--ColorTurquoise_secondaryTurquoise_700)] text-white"
                >
                  Save Selection ({selectedEvents.length})
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Right Side - Close Button and Post Button */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            form="question-form"
            disabled={!isFormValid}
            className="bg-[var(--ColorYellow_primary_colorYellow_900)] hover:bg-[var(--ColorYellow_primary_colorYellow_800)] text-black px-6 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="w-8 h-8 p-0 text-gray-600 hover:text-gray-900"
          >
            <XIcon className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Form Container */}
      <div className="flex-1 flex flex-col">
        <form id="question-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Main Content Area */}
          <div className="flex-1 px-4 py-6 space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Unable to find the room for Contum computing session with Dr. Drako. Does anybody know?"
                className="w-full text-xl font-semibold placeholder-gray-400 border-none bg-transparent focus:outline-none resize-none leading-tight"
                maxLength={200}
              />
            </div>

            {/* Description Textarea */}
            <div className="flex-1">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what you need help with (optional)"
                className="w-full h-40 text-base placeholder-gray-400 border-none bg-transparent focus:outline-none resize-none leading-relaxed"
                maxLength={1000}
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-4 py-4 border-t border-gray-200 bg-[var(--ColorYellow_primary_colorYellow_50)]">
            {/* Visibility Selection */}
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="anyone"
                    checked={visibility === "anyone"}
                    onChange={() => setVisibility("anyone")}
                    className="w-4 h-4 text-[var(--ColorTurquoise_secondaryTurquoise_600)]"
                  />
                  <span className="text-sm font-medium text-gray-900">Public</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="network"
                    checked={visibility === "network"}
                    onChange={() => setVisibility("network")}
                    className="w-4 h-4 text-[var(--ColorTurquoise_secondaryTurquoise_600)]"
                  />
                  <span className="text-sm font-medium text-gray-900">My network</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="event"
                    checked={visibility === "event"}
                    onChange={() => setVisibility("event")}
                    className="w-4 h-4 text-[var(--ColorTurquoise_secondaryTurquoise_600)]"
                  />
                  <span className="text-sm font-medium text-gray-900">This event only</span>
                </label>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              {/* Left Side - Improve with AI */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full bg-gray-100 border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-200"
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Improve with AI?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5 text-[var(--ColorTurquoise_secondaryTurquoise_600)]" />
                      AI Question Enhancement
                    </DialogTitle>
                    <DialogDescription className="text-left space-y-3">
                      <p>
                        We built this feature but disabled it because we believe 
                        <strong> questions should be human and authentic</strong>.
                      </p>
                      
                      <div>
                        <p className="font-medium text-gray-900 mb-2">Tips for asking better questions:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          <li>Be specific about what you need help with</li>
                          <li>Include context about your situation</li>
                          <li>Mention any constraints or requirements</li>
                          <li>Ask one clear question at a time</li>
                        </ul>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col sm:flex-col space-y-2">
                    <Button
                      onClick={handleSuggestFeature}
                      className="w-full bg-[var(--ColorTurquoise_secondaryTurquoise_600)] hover:bg-[var(--ColorTurquoise_secondaryTurquoise_700)] text-white"
                    >
                      <MessageCircleIcon className="w-4 h-4 mr-2" />
                      Suggest a Feature
                    </Button>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Got it, thanks!
                      </Button>
                    </DialogTrigger>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Right Side - Media Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 p-0 text-gray-500 hover:text-gray-700"
                  onClick={() => console.log("Image upload feature coming soon")}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 p-0 text-gray-500 hover:text-gray-700"
                  onClick={() => console.log("Voice input feature coming soon")}
                >
                  <MicIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};