import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, ImageIcon, TagIcon, SparklesIcon, MessageCircleIcon } from "lucide-react";
import { useCreateQuestionApiV1QuestionsPost, useReadEventsApiV1EventsGet } from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../hooks/use-toast";

/**
 * Create Question screen component implementing the complete question composer
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
  const [selectedEvent, setSelectedEvent] = useState<string>("no-event");
  const [visibility, setVisibility] = useState<"anyone" | "network" | "event">("anyone");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform API events data for the component
  const events = React.useMemo(() => {
    if (!eventsData?.data) return [];
    
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
      isJoined: true, // For now, assume user can post to all events
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
   * Handle adding a new tag to the question
   */
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      const newTag = currentTag.trim().startsWith("#") ? currentTag.trim() : `#${currentTag.trim()}`;
      setTags([...tags, newTag]);
      setCurrentTag("");
    }
  };

  /**
   * Handle removing a tag from the question
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  /**
   * Handle key press for adding tags
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
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

    setIsSubmitting(true);

    try {
      // Create question using API
      await createQuestionMutation.mutateAsync({
        data: {
          event_id: selectedEvent !== "no-event" ? selectedEvent : "",
          user_id: user.id,
          title: title.trim(),
          content: description.trim() || title.trim(), // Use title as content if description is empty
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
      
      // Show error message based on network connectivity
      toast({
        title: "Couldn't post your question",
        description: "Couldn't post your question because of internet issues. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form validation - title is required, description is optional
  const isFormValid = title.trim().length > 0 && !createQuestionMutation.isPending && !isSubmitting;

  return (
    <div className="bg-[var(--ColorYellow_primary_colorYellow_100)] min-h-screen">
      {/* Header */}
      <header className="flex w-full h-[90px] items-center justify-between pt-10 pb-0 px-3.5 sticky top-0 bg-[var(--ColorYellow_primary_colorYellow_100)] z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="w-[35px] h-[35px] rounded-full p-0"
        >
          <XIcon className="w-5 h-5" />
        </Button>
        
        <h1 className="text-lg font-semibold text-black">Ask a Question</h1>
        
        <Button
          type="submit"
          form="question-form"
          disabled={!isFormValid}
          className="bg-[var(--ColorTurquoise_secondaryTurquoise_600)] hover:bg-[var(--ColorTurquoise_secondaryTurquoise_700)] text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </header>

      {/* Form */}
      <div className="px-4 py-6">
        <form id="question-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Main Question Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Question Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="I need help with..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ColorTurquoise_secondaryTurquoise_400)] focus:border-transparent"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what you need help with (optional)"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ColorTurquoise_secondaryTurquoise_400)] focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/1000 characters
                </p>
              </div>

              {/* Improve with AI Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border border-gray-300 text-gray-600 hover:text-gray-700 hover:border-gray-400"
                  >
                    <SparklesIcon className="w-5 h-5 mr-2" />
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

              {/* Image Upload Placeholder */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-dashed border-2 border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                  onClick={() => console.log("Image upload feature coming soon")}
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Add Image (Optional)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <TagIcon className="w-4 h-4 text-gray-600" />
                <label htmlFor="tags" className="text-sm font-medium text-gray-700">
                  Tags (Optional)
                </label>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ColorTurquoise_secondaryTurquoise_400)] focus:border-transparent text-sm"
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!currentTag.trim() || tags.length >= 5}
                  className="bg-[var(--ColorTurquoise_secondaryTurquoise_600)] hover:bg-[var(--ColorTurquoise_secondaryTurquoise_700)] text-white px-4 py-2 rounded-md text-sm"
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum 5 tags
              </p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Question Settings</h3>
              
              {/* Event Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Event (Optional)
                </label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-event">No specific event</SelectItem>
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
                {events.length === 0 && !eventsLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    No events available. Join events to post questions to them.
                  </p>
                )}
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who can see this question?
                </label>
                <Select value={visibility} onValueChange={(value: "anyone" | "network" | "event") => setVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anyone">Public (visible in all feeds)</SelectItem>
                    <SelectItem value="network">My network (only visible to known contacts)</SelectItem>
                    <SelectItem value="event">This event only (visible only while the event is active)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="anonymous" className="text-sm font-medium text-gray-700">
                    Post anonymously
                  </label>
                  <p className="text-xs text-gray-500">
                    Your name won't be shown with this question
                  </p>
                </div>
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};