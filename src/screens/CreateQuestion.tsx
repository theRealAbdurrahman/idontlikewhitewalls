import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, ImageIcon, TagIcon } from "lucide-react";
import { useCreateQuestionApiV1QuestionsPost } from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { useAuthStore } from "../stores/authStore";

/**
 * Create Question screen component
 */
export const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Use API mutation for creating questions
  const createQuestionMutation = useCreateQuestionApiV1QuestionsPost();
  
  // COMMENTED OUT: Local state management for future reference
  // const { events, addQuestion } = useAppStore();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("no-event");
  const [visibility, setVisibility] = useState<"anyone" | "network" | "event">("anyone");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // COMMENTED OUT: Filter joined events - will need to be replaced with API data
  // const joinedEvents = events.filter(event => event.isJoined || event.isCheckedIn);

  const handleClose = () => {
    navigate(-1);
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      const newTag = currentTag.trim().startsWith("#") ? currentTag.trim() : `#${currentTag.trim()}`;
      setTags([...tags, newTag]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !user) {
      return;
    }

    setIsSubmitting(true);

    // COMMENTED OUT: Local question creation for future reference
    /*
    try {
      const selectedEventData = selectedEvent && selectedEvent !== "no-event" ? events.find(e => e.id === selectedEvent) : undefined;
      
      addQuestion({
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        eventId: selectedEvent !== "no-event" ? selectedEvent : undefined,
        eventName: selectedEventData?.name,
        title: title.trim(),
        description: description.trim(),
        tags,
        visibility,
        isAnonymous,
      });

      // Navigate back to home
      navigate("/home");
    } catch (error) {
      console.error("Failed to create question:", error);
    } finally {
      setIsSubmitting(false);
    }
    */
    
    // Use API to create question
    createQuestionMutation.mutate({
      data: {
        event_id: selectedEvent !== "no-event" ? selectedEvent : "", // Default to empty string if no event
        user_id: user.id,
        title: title.trim(),
        content: description.trim(),
        is_official: false,
        isAnonymous,
        is_featured: false,
      }
    }, {
      onSuccess: () => {
        console.log("Question created successfully");
        navigate("/home");
      },
      onError: (error) => {
        console.error("Failed to create question:", error);
        setIsSubmitting(false);
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  const isFormValid = title.trim().length > 0 && description.trim().length > 0 && !createQuestionMutation.isPending;

  return (
    <div className="bg-[#f0efeb] min-h-screen">
      {/* Header */}
      <header className="flex w-full h-[90px] items-center justify-between pt-10 pb-0 px-3.5 sticky top-0 bg-[#f0efeb] z-10">
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
          disabled={!isFormValid || isSubmitting}
          className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
        >
          {isSubmitting || createQuestionMutation.isPending ? "Posting..." : "Post"}
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
                  placeholder="What do you need help with?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more details about your question..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/1000 characters
                </p>
              </div>

              {/* Image Upload Placeholder */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-dashed border-2 border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                  onClick={() => console.log("Image upload")}
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
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent text-sm"
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!currentTag.trim() || tags.length >= 5}
                  className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white px-4 py-2 rounded-md text-sm"
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
                    {/* COMMENTED OUT: Event selection - will need to be replaced with API data */}
                    {/* {joinedEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))} */}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who can see this question?
                </label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anyone">Anyone on Meetball</SelectItem>
                    <SelectItem value="network">My network only</SelectItem>
                    <SelectItem value="event">Event attendees only</SelectItem>
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