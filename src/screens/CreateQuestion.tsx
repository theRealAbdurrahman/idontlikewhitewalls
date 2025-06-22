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
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);

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
   * Get display text for selected visibility option
   */
  const getVisibilityText = () => {
    switch (visibility) {
      case "anyone":
        return "Public";
      case "network":
        return "My network";
      case "event":
        return "This event only";
      default:
        return "Public";
    }
  };

  /**
   * Handle form submission to create a new question
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !user) {
      toast({
        title: "Missing information",
        description: "Please enter a question title and make sure you're logged in.",
        variant: "destructive",
      });
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

    // Validation: check title length
    if (title.trim().length < 10) {
      toast({
        title: "Title too short",
        description: "Please provide a more descriptive title (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create questions for each selected event
      const questionPromises = selectedEvents.map(async (eventId) => {
        return createQuestionMutation.mutateAsync({
          data: {
            event_id: eventId,
            user_id: user.id,
            title: title.trim(),
            content: description.trim() || title.trim(),
            is_official: false,
            is_anonymous: isAnonymous,
            is_featured: false,
          }
        });
      });
      
      // Wait for all questions to be created
      const createdQuestions = await Promise.all(questionPromises);
      
      console.log("Questions created successfully:", createdQuestions);

      // Show success message
      toast({
        title: "Question posted!",
        description: `Your question has been posted to ${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}.`,
      });

      // Navigate back to home
      navigate("/home");
    } catch (error: any) {
      console.error("Failed to create question:", error);
      
      // Handle specific error types
      let errorMessage = "Please check your connection and try again.";
      
      if (error?.response?.status === 400) {
        errorMessage = "Please check your question details and try again.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Please log in again to post your question.";
      } else if (error?.response?.status === 403) {
        errorMessage = "You don't have permission to post to this event.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your connection and try again.";
      }
      
      toast({
        title: "Failed to post question",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation - title is required
  const isFormValid = 
    title.trim().length >= 10 && 
    selectedEvents.length > 0 && 
    !createQuestionMutation.isPending && 
    !isSubmitting;

  return (
    <div className="bg-[#fbfbfb] min-h-screen flex flex-col">
      {/* Sticky Header - FIXED LAYOUT */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-[#fbfbfb] border-b border-gray-200">
        {/* Left Side - Events Dropdown ONLY */}
        <DropdownMenu open={isEventsDropdownOpen} onOpenChange={setIsEventsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 rounded-full border-gray-300 bg-white hover:bg-gray-50 font-medium text-gray-900"
            >
              <span className="truncate max-w-[200px]">
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
                  className="w-full bg-[#3ec6c6] hover:bg-[#3999a8] text-white"
                >
                  Save Selection ({selectedEvents.length})
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Right Side - Close Button ONLY */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="w-8 h-8 p-0 text-gray-600 hover:text-gray-900"
        >
          <XIcon className="w-5 h-5" />
        </Button>
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
                disabled={isSubmitting}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {title.length}/200 characters {title.trim().length < 10 && title.length > 0 && "(minimum 10)"}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="flex-1">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what you need help with (optional)"
                className="w-full h-40 text-base placeholder-gray-400 border-none bg-transparent focus:outline-none resize-none leading-relaxed"
                maxLength={1000}
                disabled={isSubmitting}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {description.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-4 py-4 border-t border-gray-200 bg-[#fbfbfb]">
            {/* Visibility Selection */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">Visibility:</span>
              <DropdownMenu open={isVisibilityDropdownOpen} onOpenChange={setIsVisibilityDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-gray-300 bg-white hover:bg-gray-50 font-medium text-gray-900"
                    disabled={isSubmitting}
                  >
                    <span>{getVisibilityText()}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 p-2" align="start">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setVisibility("anyone");
                        setIsVisibilityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                        visibility === "anyone" ? "bg-[#f0eee4] text-gray-900 font-medium" : "text-gray-700"
                      }`}
                    >
                      Public
                    </button>
                    <button
                      onClick={() => {
                        setVisibility("network");
                        setIsVisibilityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                        visibility === "network" ? "bg-[#f0eee4] text-gray-900 font-medium" : "text-gray-700"
                      }`}
                    >
                      My network
                    </button>
                    <button
                      onClick={() => {
                        setVisibility("event");
                        setIsVisibilityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 ${
                        visibility === "event" ? "bg-[#f0eee4] text-gray-900 font-medium" : "text-gray-700"
                      }`}
                    >
                      This event only
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-[var(--ColorTurquoise_secondaryTurquoise_600)]"
                  disabled={isSubmitting}
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Post anonymously</span>
                  <p className="text-xs text-gray-600">Your name won't be shown with this question</p>
                </div>
              </label>
            </div>

            {/* Action Buttons Row - FIXED LAYOUT */}
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
                      <SparklesIcon className="w-5 h-5 text-[#3ec6c6]" />
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
                      className="w-full bg-[#3ec6c6] hover:bg-[#3999a8] text-white"
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

              {/* Right Side - Media Buttons + Post Button */}
              <div className="flex items-center gap-3">
                {/* Media Buttons */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 p-0 text-gray-500 hover:text-gray-700"
                  onClick={() => console.log("Image upload feature coming soon")}
                  disabled={isSubmitting}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 p-0 text-gray-500 hover:text-gray-700"
                  onClick={() => console.log("Voice input feature coming soon")}
                  disabled={isSubmitting}
                >
                  <MicIcon className="w-5 h-5" />
                </Button>

                {/* Post Button - MOVED TO BOTTOM */}
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="bg-[#ffb300] hover:bg-[#ffd580] text-black px-6 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};