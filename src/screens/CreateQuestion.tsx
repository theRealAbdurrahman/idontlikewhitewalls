import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, ImageIcon, MicIcon, SparklesIcon, MessageCircleIcon } from "lucide-react";
import { useCreateQuestionApiV1QuestionsPost, useReadEventsApiV1EventsGet } from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../hooks/use-toast";

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
  const [selectedEvent, setSelectedEvent] = useState<string>("event-1"); // Default to first event
  const [visibility, setVisibility] = useState<"anyone" | "network" | "event">("anyone");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform API events data for the component
  const events = React.useMemo(() => {
    if (!eventsData?.data) {
      // Fallback to mock event if API data not available
      return [{
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
      }];
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
    navigate(-1);
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
   * Handle form submission to create a new question
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !user) {
      return;
    }

    // Validation: check if event is selected when required
    if (visibility === "event" && (!selectedEvent || selectedEvent === "no-event")) {
      toast({
        title: "Event required",
        description: "Please select at least one event to post this question.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create question using API
      await createQuestionMutation.mutateAsync({
        data: {
          event_id: selectedEvent && selectedEvent !== "no-event" ? selectedEvent : events[0]?.id || "",
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
        description: "Your question has been posted successfully and is now visible to the community.",
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
  const isFormValid = title.trim().length > 0 && !createQuestionMutation.isPending && !isSubmitting;

  return (
    <div className="bg-[var(--ColorYellow_primary_colorYellow_50)] min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[var(--ColorYellow_primary_colorYellow_50)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="w-8 h-8 p-0"
        >
          <XIcon className="w-5 h-5" />
        </Button>
        
        <Button
          type="submit"
          form="question-form"
          disabled={!isFormValid}
          className="bg-[var(--ColorYellow_primary_colorYellow_900)] hover:bg-[var(--ColorYellow_primary_colorYellow_800)] text-black px-6 py-2 rounded-full text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </header>

      {/* Form Container */}
      <div className="flex-1 flex flex-col">
        <form id="question-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Event Selection */}
          <div className="px-4 py-3 border-b border-gray-200">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-full border-none bg-transparent p-0 h-auto text-left font-medium text-gray-900">
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {eventsLoading ? (
                  <SelectItem value="loading" disabled>Loading events...</SelectItem>
                ) : (
                  events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 px-4 py-4 space-y-4">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="I need help with..."
                className="w-full text-lg font-medium placeholder-gray-500 border-none bg-transparent focus:outline-none resize-none"
                maxLength={200}
              />
            </div>

            {/* Description Textarea */}
            <div className="flex-1">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what you need help with (optional)"
                className="w-full h-48 text-base placeholder-gray-400 border-none bg-transparent focus:outline-none resize-none"
                maxLength={1000}
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="px-4 py-4 space-y-4">
            {/* Visibility Selection */}
            <div>
              <Select value={visibility} onValueChange={(value: "anyone" | "network" | "event") => setVisibility(value)}>
                <SelectTrigger className="w-full border-none bg-transparent p-0 h-auto text-left">
                  <SelectValue>
                    <span className="font-medium text-gray-900">
                      {visibility === "anyone" && "Public"}
                      {visibility === "network" && "My network"}
                      {visibility === "event" && "This event only"}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">Public (visible in all feeds)</SelectItem>
                  <SelectItem value="network">My network (only visible to known contacts)</SelectItem>
                  <SelectItem value="event">This event only (visible only while the event is active)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              {/* Left Side - Improve with AI */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full bg-gray-100 border-gray-300 text-gray-700 px-4 py-2 text-sm"
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