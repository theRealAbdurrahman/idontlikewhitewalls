import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  XIcon, 
  ImageIcon, 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon,
  BuildingIcon,
  TagIcon,
  EyeIcon,
  LockIcon,
  PlusIcon,
  UploadIcon,
  SearchIcon,
  LinkIcon,
  Edit2Icon
} from "lucide-react";
import { useCreateEventApiV1EventsPost } from "../api-client/api-client";
import { useCacheManager } from "../hooks/useCacheManager";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";
import { useToast } from "../hooks/use-toast";

/**
 * Form validation schema using Zod
 */
const eventFormSchema = z.object({
  bannerImage: z.string().optional(),
  name: z.string().min(3, "Event name must be at least 3 characters").max(100, "Event name too long"),
  startDateTime: z.string().min(1, "Start date and time is required"),
  endDateTime: z.string().min(1, "End date and time is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  location: z.string().min(3, "Location is required").max(200, "Location too long"),
  eventUrl: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Please enter a valid URL"),
  googleMapsUrl: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Please enter a valid Google Maps URL"),
  eventType: z.string().min(1, "Event type is required"),
  community: z.string().min(1, "Community selection is required"),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
  taggedEvents: z.array(z.string()).max(5, "Maximum 5 events can be tagged").optional(),
  coHost: z.string().optional(),
  isPrivate: z.boolean().default(false),
  allowCrossTagging: z.boolean().default(false),
}).refine((data) => {
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endDateTime"],
});

type EventFormData = z.infer<typeof eventFormSchema>;

/**
 * Event types dropdown options
 */
const eventTypes = [
  "Conference",
  "Panel", 
  "Meetup",
  "Fireside Chat",
  "Walk",
  "Afterparty", 
  "Coworking Session",
  "Adventure",
  "Other"
];

/**
 * Community options
 */
const communities = [
  { id: "planet-earth", label: "Planet Earth - Open", type: "open" },
  { id: "lisbon", label: "Lisbon - Open", type: "open" },
  { id: "meetball", label: "Meetball - Private", type: "private" },
];

/**
 * CreateEvent screen component for creating new events
 */
export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events } = useAppStore();
  const { toast } = useToast();
  const { afterEventCreate } = useCacheManager();
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBannerImage, setSelectedBannerImage] = useState<string>("https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&dpr=1");
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isTagEventDialogOpen, setIsTagEventDialogOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [selectedTaggedEvents, setSelectedTaggedEvents] = useState<string[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API mutation
  const createEventMutation = useCreateEventApiV1EventsPost();

  // Form setup
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      bannerImage: "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&dpr=1",
      name: "",
      startDateTime: "",
      endDateTime: "",
      description: "",
      location: "",
      eventUrl: "",
      googleMapsUrl: "",
      eventType: "",
      community: "planet-earth",
      tags: [],
      taggedEvents: [],
      coHost: "",
      isPrivate: false,
      allowCrossTagging: false,
    },
  });

  // Watch the event name field for dynamic header updates
  const eventName = form.watch("name");

  /**
   * Handle image upload
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (PNG, JPG, etc.).",
          variant: "destructive",
        });
        return;
      }

      setBannerImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedBannerImage(result);
        form.setValue("bannerImage", result);
      };
      reader.readAsDataURL(file);

      toast({
        title: "Image uploaded",
        description: "Banner image has been added to your event.",
      });
    }
  };

  /**
   * Remove banner image
   */
  const removeBannerImage = () => {
    setSelectedBannerImage("");
    setBannerImageFile(null);
    form.setValue("bannerImage", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Generate 3-digit PIN when private event is enabled
   */
  const generatePin = () => {
    const pin = Math.floor(100 + Math.random() * 900).toString();
    setGeneratedPin(pin);
    return pin;
  };

  /**
   * Handle private event toggle
   */
  const handlePrivateToggle = (checked: boolean) => {
    form.setValue("isPrivate", checked);
    if (checked) {
      generatePin();
    } else {
      setGeneratedPin("");
    }
  };

  /**
   * Add tag functionality
   */
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < 10) {
      const newTags = [...selectedTags, trimmedTag];
      setSelectedTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };

  /**
   * Remove tag functionality
   */
  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue("tags", newTags);
  };

  /**
   * Handle tag input key press
   */
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  /**
   * Filter events for tagging
   */
  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) &&
    !selectedTaggedEvents.includes(event.id)
  );

  /**
   * Add tagged event
   */
  const addTaggedEvent = (eventId: string) => {
    if (selectedTaggedEvents.length < 5) {
      const newTaggedEvents = [...selectedTaggedEvents, eventId];
      setSelectedTaggedEvents(newTaggedEvents);
      form.setValue("taggedEvents", newTaggedEvents);
      setEventSearchQuery("");
    }
  };

  /**
   * Remove tagged event
   */
  const removeTaggedEvent = (eventId: string) => {
    const newTaggedEvents = selectedTaggedEvents.filter(id => id !== eventId);
    setSelectedTaggedEvents(newTaggedEvents);
    form.setValue("taggedEvents", newTaggedEvents);
  };

  /**
   * Get event name by ID
   */
  const getEventName = (eventId: string) => {
    return events.find(event => event.id === eventId)?.name || "Unknown Event";
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create an event.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare event data for API
      const eventData = {
        name: data.name,
        description: data.description,
        location: data.location,
        google_maps_url: data.googleMapsUrl || null,
        start_date: data.startDateTime,
        end_date: data.endDateTime,
        parent_event_id: null,
        creator_id: user.id,
      };

      // Create event via API
      const response = await createEventMutation.mutateAsync({
        data: eventData
      });

      console.log("Event created successfully:", response);

      // Invalidate events cache using centralized cache manager
      afterEventCreate(response.data?.id);

      // TODO: In a real app, you would also:
      // - Upload banner image to storage service
      // - Create event tags
      // - Create event relationships for tagged events
      // - Send invitations to co-hosts
      // - Handle private event PIN storage

      toast({
        title: "Event created!",
        description: `${data.name} has been created successfully.`,
      });

      // Navigate back to events or home
      navigate("/events");

    } catch (error: any) {
      console.error("Failed to create event:", error);
      
      let errorMessage = "Please check your connection and try again.";
      
      if (error?.response?.status === 400) {
        errorMessage = "Please check your event details and try again.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Please log in again to create your event.";
      } else if (error?.response?.status === 403) {
        errorMessage = "You don't have permission to create events.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error. Please try again in a moment.";
      }
      
      toast({
        title: "Failed to create event",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle closing the form
   */
  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="bg-[#f0efeb] min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-[#f0efeb]/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <BuildingIcon className="w-6 h-6 text-[#3ec6c6]" />
          <h1 className="text-lg font-semibold text-black">
            {eventName && eventName.trim() ? eventName : "Create Event"}
          </h1>
        </div>
        
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
      <div className="flex-1 overflow-y-auto pt-20">
        <div className="max-w-2xl mx-auto p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Banner Image - Moved to top */}
              <Card>
                <CardContent className="p-6 bg-[#FBFBFB] rounded-2xl">
                  {/* <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5" />
                    Event Banner
                  </h2> */}

                  <FormField
                    control={form.control}
                    name="bannerImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            {selectedBannerImage ? (
                              <div className="relative">
                                <img
                                  src={selectedBannerImage}
                                  alt="Event banner preview"
                                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={removeBannerImage}
                                  className="absolute top-2 right-2"
                                >
                                  <XIcon className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <UploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-600 mb-2">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                  PNG, JPG up to 5MB • Recommended: 1200x630px
                                </p>
                              </div>
                            )}
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={isSubmitting}
                            />
                            
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isSubmitting}
                              className="w-full"
                            >
                              <UploadIcon className="w-4 h-4 mr-2" />
                              {selectedBannerImage ? "Change Image" : "Upload Banner Image"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardContent className="p-6 space-y-4 bg-[#FBFBFB] rounded-2xl">
                  {/* <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Event Details
                  </h2> */}

                  {/* Event Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Dublin Tech Summit 2025"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time *</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date & Time *</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your event, what attendees can expect, and why they should join..."
                            className="min-h-[100px]"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="e.g., Trinity College Dublin, Dublin 2"
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Event URL */}
                  <FormField
                    control={form.control}
                    name="eventUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="e.g., https://yourevent.com"
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Optional: Link to your event website or registration page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Google Maps URL */}
                  <FormField
                    control={form.control}
                    name="googleMapsUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Maps URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="e.g., https://maps.app.goo.gl/eventlocation"
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Optional: Direct link to the event location on Google Maps
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Event Configuration */}
              <Card>
                <CardContent className="p-6 space-y-4 bg-[#FBFBFB] rounded-2xl">
                  {/* <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    Event Configuration
                  </h2> */}

                  {/* Event Type */}
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type} value={type.toLowerCase().replace(" ", "-")}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Community Selection */}
                  <FormField
                    control={form.control}
                    name="community"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select community" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {communities.map((community) => (
                              <SelectItem key={community.id} value={community.id}>
                                <div className="flex items-center gap-2">
                                  <span>{community.label}</span>
                                  {community.type === "private" && (
                                    <LockIcon className="w-3 h-3 text-gray-500" />
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-sm text-[#3ec6c6]"
                            onClick={() => navigate("/create-community")}
                          >
                            + Create New Community
                          </Button>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Tags and Related Events */}
              <Card>
                <CardContent className="p-6 space-y-4 bg-[#FBFBFB] rounded-2xl">
                  {/* <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TagIcon className="w-5 h-5" />
                    Tags & Related Events
                  </h2> */}

                  {/* Tags */}
                  <FormItem>
                    <FormLabel>Tags (Max 10)</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tags (press Enter or comma to add)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          disabled={isSubmitting || selectedTags.length >= 10}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => addTag(tagInput)}
                          disabled={!tagInput.trim() || selectedTags.length >= 10}
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                      
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 ml-1"
                                onClick={() => removeTag(tag)}
                              >
                                <XIcon className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Use tags to help people discover your event
                    </FormDescription>
                  </FormItem>

                  {/* Tag Other Events */}
                  <FormItem>
                    <FormLabel>Tag Other Events (Max 5)</FormLabel>
                    <div className="space-y-2">
                      <Dialog open={isTagEventDialogOpen} onOpenChange={setIsTagEventDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start"
                            disabled={isSubmitting || selectedTaggedEvents.length >= 5}
                          >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Tag related events
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Tag Related Events</DialogTitle>
                            <DialogDescription>
                              Connect your event with other related events in the community.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="relative">
                              <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <Input
                                placeholder="Search events..."
                                value={eventSearchQuery}
                                onChange={(e) => setEventSearchQuery(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {filteredEvents.length > 0 ? (
                                filteredEvents.slice(0, 10).map((event) => (
                                  <div
                                    key={event.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => addTaggedEvent(event.id)}
                                  >
                                    <div>
                                      <p className="font-medium text-sm">{event.name}</p>
                                      <p className="text-xs text-gray-500">{event.location}</p>
                                    </div>
                                    <PlusIcon className="w-4 h-4 text-[#3ec6c6]" />
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-gray-500 py-4">
                                  {eventSearchQuery ? "No events found" : "Start typing to search events"}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              type="button"
                              onClick={() => setIsTagEventDialogOpen(false)}
                            >
                              Done
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {selectedTaggedEvents.length > 0 && (
                        <div className="space-y-2">
                          {selectedTaggedEvents.map((eventId) => (
                            <div
                              key={eventId}
                              className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <span className="text-sm font-medium text-blue-900">
                                {getEventName(eventId)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTaggedEvent(eventId)}
                                className="h-auto w-auto p-1 text-blue-700 hover:text-red-600"
                              >
                                <XIcon className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Help attendees discover related events and build connections
                    </FormDescription>
                  </FormItem>

                  {/* Co-Host */}
                  <FormField
                    control={form.control}
                    name="coHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Co-Host</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Search and invite co-hosts (Coming soon)"
                            {...field}
                            disabled
                          />
                        </FormControl>
                        <FormDescription>
                          User search and invitation system coming soon
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Event Settings */}
              <Card>
                <CardContent className="p-6 space-y-4 bg-[#FBFBFB] rounded-2xl">
                  {/* <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <EyeIcon className="w-5 h-5" />
                    Event Settings
                  </h2> */}

                  {/* Private Event */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Private Event</FormLabel>
                      <FormDescription>
                        Generate a 3-digit PIN for exclusive access
                      </FormDescription>
                    </div>
                    <Switch
                      checked={form.watch("isPrivate")}
                      onCheckedChange={handlePrivateToggle}
                      disabled={isSubmitting}
                    />
                  </div>

                  {generatedPin && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">
                        Event PIN: <code className="bg-yellow-100 px-2 py-1 rounded font-mono">{generatedPin}</code>
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Share this PIN with invited attendees
                      </p>
                    </div>
                  )}

                  {/* Allow Cross-tagging */}
                  <FormField
                    control={form.control}
                    name="allowCrossTagging"
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Event Cross-tagging</FormLabel>
                          <FormDescription>
                            Let attendees tag this event in their posts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </div>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Section */}
              <div className="sticky bottom-4 bg-[#f0efeb]/95 backdrop-blur-lg p-4 rounded-xl shadow-lg border border-gray-200">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Event
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};