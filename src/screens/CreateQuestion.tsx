import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, ImageIcon, MicIcon, SparklesIcon, MessageCircleIcon, ChevronDownIcon } from "lucide-react";
import { useCreateQuestionApiV1QuestionsPost, useReadEventsApiV1EventsGet } from "../api-client/api-client";
import { useCacheManager } from "../hooks/useCacheManager";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
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
  const { afterQuestionCreate } = useCacheManager();
  
  // Fetch events data from API
  const { data: eventsData, isLoading: eventsLoading } = useReadEventsApiV1EventsGet();
  
  // Use API mutation for creating questions
  const createQuestionMutation = useCreateQuestionApiV1QuestionsPost();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]); // No default selection
  const [visibility, setVisibility] = useState<"anyone" | "network" | "event">("anyone");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tempVisibility, setTempVisibility] = useState<"anyone" | "network" | "event">("anyone");
  const [tempIsAnonymous, setTempIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEventsDropdownOpen, setIsEventsDropdownOpen] = useState(false);
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);
  
  // Custom styles for the sticky header
  const headerStyles = `
    .create-question-header {
      backdrop-filter: blur(20px);
      background: rgba(251, 251, 251, 0.95);
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
  `;

  // Transform API events data for the component
  const events = React.useMemo(() => {
    // Handle API response format mismatch (backend returns array, client expects {data: array})
    const getEventsArray = (data: any) => {
      // Check if data is an array (actual backend format)
      if (Array.isArray(data)) {
        return data;
      }
      // Check if data has a data property that is an array (expected format)
      else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return data.data;
      }
      // Return null if no valid data
      return null;
    };

    const eventsArray = getEventsArray(eventsData?.data);
    
    if (!eventsArray) {
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
    
    return eventsArray.map((event) => ({
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
      return event?.name || "Meetverse";
    }
    return `${selectedEvents.length} events selected`;
  };

  /**
   * Get display text for selected visibility option
   */
  const getVisibilityText = () => {
    switch (visibility) {
      case "anyone":
        return isAnonymous ? "Anonymous - Anyone can help" : "Anyone can help";
      case "network":
        return isAnonymous ? "Anonymous - My network" : "My network";
      case "event":
        return isAnonymous ? "Anonymous - This event only" : "This event only";
      default:
        return isAnonymous ? "Anonymous - Anyone can help" : "Anyone can help";
    }
  };

  /**
   * Handle opening visibility dropdown
   */
  const handleOpenVisibilityDropdown = () => {
    setTempVisibility(visibility);
    setTempIsAnonymous(isAnonymous);
    setIsVisibilityDropdownOpen(true);
  };

  /**
   * Handle saving visibility settings
   */
  const handleSaveVisibility = () => {
    setVisibility(tempVisibility);
    setIsAnonymous(tempIsAnonymous);
    setIsVisibilityDropdownOpen(false);
  };

  /**
   * Handle canceling visibility changes
   */
  const handleCancelVisibility = () => {
    setTempVisibility(visibility);
    setTempIsAnonymous(isAnonymous);
    setIsVisibilityDropdownOpen(false);
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

    // Validation: check if at least one valid event is selected
    const validSelectedEvents = selectedEvents.filter(eventId => eventId && eventId.trim() !== '');
    if (validSelectedEvents.length === 0) {
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
      // Create questions for each valid selected event
      const questionPromises = validSelectedEvents.map(async (eventId) => {
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

      // Invalidate caches using centralized cache manager
      // Pass event ID if questions are event-specific
      const eventId = validSelectedEvents.length === 1 ? validSelectedEvents[0] : undefined;
      afterQuestionCreate(eventId);

      // Show success message
      toast({
        title: "Question posted!",
        description: `Your question has been posted to ${validSelectedEvents.length} event${validSelectedEvents.length > 1 ? 's' : ''}.`,
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
    title.trim().length >= 3 && 
    selectedEvents.length > 0 && 
    !createQuestionMutation.isPending && 
    !isSubmitting;

  return (
    <div className="bg-[#fbfbfb] min-h-screen flex flex-col">
      {/* Inject custom styles */}
      <style>{headerStyles}</style>
      
      {/* Sticky Header with Backdrop Blur */}
      <header className="sticky top-0 z-50 create-question-header">
        <div className="flex items-center justify-between px-4 py-4">
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
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
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
              <div className="mt-4 pt-3">
                <Button 
                  onClick={() => setIsEventsDropdownOpen(false)}
                  className="w-full bg-[#3ec6c6] hover:bg-[#3999a8] text-white"
                >
                  Save Selection
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
                placeholder="I need help with..."
                className="w-full text-xl font-semibold placeholder-gray-400 border-none bg-transparent focus:outline-none resize-none leading-tight"
                maxLength={200}
                disabled={isSubmitting}
              />
            </div>

            {/* Description Textarea */}
            <div className="flex-1 pb-32">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what you need help with (optional)
 #tags"
                className="w-full h-40 text-base placeholder-gray-400 border-none bg-transparent focus:outline-none resize-none leading-relaxed"
                maxLength={1000}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Fixed Action Buttons Section */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#fbfbfb]/95 backdrop-blur-lg shadow-lg pb-safe">
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            {/* Visibility Selection */}
            <div className="flex items-center gap-3">
              <Dialog open={isVisibilityDropdownOpen} onOpenChange={setIsVisibilityDropdownOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleOpenVisibilityDropdown}
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-gray-300 bg-white hover:bg-gray-50 font-medium text-gray-900"
                    disabled={isSubmitting}
                  >
                    <span>{getVisibilityText()}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-40px)] max-w-none rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-left">Who can see and help with this question?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    
                    {/* Visibility Options with Radio Buttons */}
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value="anyone"
                          checked={tempVisibility === "anyone"}
                          onChange={(e) => setTempVisibility(e.target.value as "anyone")}
                          className="mt-1 w-4 h-4 text-[#3ec6c6] border-gray-300 focus:ring-[#3ec6c6]"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">Anyone can help</div>
                          <div className="text-xs text-gray-500 leading-tight mt-1">
                            Visible everywhere - on your profile, in feeds etc
                          </div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value="network"
                          checked={tempVisibility === "network"}
                          onChange={(e) => setTempVisibility(e.target.value as "network")}
                          className="mt-1 w-4 h-4 text-[#3ec6c6] border-gray-300 focus:ring-[#3ec6c6]"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">My network</div>
                          <div className="text-xs text-gray-500 leading-tight mt-1">
                            Shows in selected event feeds, your personal networks' feeds, communities you belong to and on your profile
                          </div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value="event"
                          checked={tempVisibility === "event"}
                          onChange={(e) => setTempVisibility(e.target.value as "event")}
                          className="mt-1 w-4 h-4 text-[#3ec6c6] border-gray-300 focus:ring-[#3ec6c6]"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">This event only</div>
                          <div className="text-xs text-gray-500 leading-tight mt-1">
                            Appears in the event feed now and disappears from your profile when the event ends
                          </div>
                        </div>
                      </label>
                    </div>
                    
                    {/* Anonymous Toggle */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">Post anonymously</div>
                          <div className="text-xs text-gray-500 leading-tight">
                            <div>• Your identity is hidden</div>
                            <div>• The question will not appear on your profile</div>
                            <div>• Only users who interact 'I can help' will see who has asked</div>
                            <div>• Use this when you want help without being in the spotlight</div>
                          </div>
                        </div>
                        <Switch
                          checked={tempIsAnonymous}
                          onCheckedChange={setTempIsAnonymous}
                          className="ml-4"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCancelVisibility}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveVisibility}
                      className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                <DialogContent className="w-[calc(100vw-40px)] max-w-none rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      Why there is no AI, yet
                    </DialogTitle>
                    <DialogDescription className="text-left space-y-4 text-sm leading-relaxed">
                      <p>
                        We built a feature to help you improve your questions with AI, but then we paused.
                      </p>
                      <p>
                        We realized that raw, human questions, even if imperfect, are often more powerful, relatable and real. So for now, we're choosing authenticity over polish.
                      </p>
                      <p>
                        Still, not everyone finds it easy to ask for help. If you'd like a gentle assist, to express yourself more clearly, or just fix grammar, let us know.
                      </p>
                      <p className="font-medium">
                        We're listening.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex-col sm:flex-col space-y-3">
                    <Button
                      onClick={() => {
                        // TODO: Implement tips modal or navigation
                        toast({
                          title: "Tips coming soon!",
                          description: "We're working on a comprehensive guide for asking great questions.",
                        });
                      }}
                      className="w-full bg-[#FFCA28] hover:bg-[#e6b324] text-[#262626]"
                    >
                      Tips: How to ask a good question
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/suggest-feature");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <MessageCircleIcon className="w-4 h-4 mr-2" />
                      Suggest a feature
                    </Button>
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
                  className="bg-[#FFCA28] hover:bg-[#e6b324] text-black px-6 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ml-2"
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
          </div>
        </form>
      </div>
    </div>
  );
};