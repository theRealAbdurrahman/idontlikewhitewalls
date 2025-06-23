import React, { useState } from "react";
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
  BellIcon,
  LockIcon,
  PlusIcon
} from "lucide-react";
import { useCreateEventApiV1EventsPost } from "../api-client/api-client";
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
import { Badge } from "../components/ui/badge";
import { useAuthStore } from "../stores/authStore";
import { useToast } from "../hooks/use-toast";

/**
 * Form validation schema using Zod
 */
const eventFormSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters").max(100, "Event name too long"),
  startDateTime: z.string().min(1, "Start date and time is required"),
  endDateTime: z.string().min(1, "End date and time is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  location: z.string().min(3, "Location is required").max(200, "Location too long"),
  eventType: z.string().min(1, "Event type is required"),
  community: z.string().min(1, "Community selection is required"),
  bannerImage: z.string().optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional(),
  coHost: z.string().optional(),
  isPrivate: z.boolean().default(false),
  allowCrossTagging: z.boolean().default(false),
  enableNotifications: z.boolean().default(false),
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
  const { toast } = useToast();
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // API mutation
  const createEventMutation = useCreateEventApiV1EventsPost();

  // Form setup
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      startDateTime: "",
      endDateTime: "",
      description: "",
      location: "",
      eventType: "",
      community: "planet-earth",
      bannerImage: "",
      tags: [],
      coHost: "",
      isPrivate: false,
      allowCrossTagging: false,
      enableNotifications: false,
    },
  });

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
        google_maps_url: null, // TODO: Implement Google Maps integration
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

      // TODO: In a real app, you would also:
      // - Upload banner image if provided
      // - Create event tags
      // - Send invitations to co-hosts
      // - Handle private event PIN storage
      // - Set up community notifications

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
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-[#f0efeb] border-b border-gray-200">
        <div className="flex items-center gap-3">
          <BuildingIcon className="w-6 h-6 text-[#3ec6c6]" />
          <h1 className="text-lg font-semibold text-black">Create Event</h1>
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Event Details
                  </h2>

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
                        <FormDescription>
                          Google Maps integration coming soon
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Event Configuration */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    Event Configuration
                  </h2>

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
                            onClick={() => toast({ title: "Coming soon", description: "Community creation will be available soon." })}
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

              {/* Optional Information */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TagIcon className="w-5 h-5" />
                    Optional Information
                  </h2>

                  {/* Banner Image */}
                  <FormField
                    control={form.control}
                    name="bannerImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner Image</FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG up to 5MB (Coming soon)
                            </p>
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <EyeIcon className="w-5 h-5" />
                    Event Settings
                  </h2>

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

                  {/* Community Notifications */}
                  <FormField
                    control={form.control}
                    name="enableNotifications"
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Community Notifications</FormLabel>
                          <FormDescription>
                            Send push and email notifications to community
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
              <div className="sticky bottom-4 bg-[#f0efeb] p-4 rounded-xl shadow-lg border border-gray-200">
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