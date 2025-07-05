import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidUrl, normalizeWebUrl } from "../utils/urlValidation";
import { useSimpleImageUpload, ImageValidation } from "../hooks/useSimpleImageUpload";

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
  PencilIcon,
  PlusIcon,
  UploadIcon,
  SearchIcon,
  LinkIcon,
  Edit2Icon,
  FileTextIcon
} from "lucide-react";
import { useCreateEventApiV1EventsPost } from "../api-client/api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
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
import { LocationInput, LocationData } from "../components/ui/location-input";
import { ClickableInput } from "../components/ui/clickable-input";
import { ClickableSelect } from "../components/ui/clickable-select";
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
import { useAuth } from "../providers";
import { useAppStore } from "../stores/appStore";
import { useToast } from "../hooks/use-toast";
import { generateBestGeometricImage } from "../utils/geometricImageGenerator";

/**
 * Form validation schema using Zod
 */
const eventFormSchema = z.object({
  bannerImage: z.string().optional(),
  name: z.string().min(3, "Event name must be at least 3 characters").max(100, "Event name too long"),
  startDateTime: z.string().min(1, "Start date and time is required"),
  endDateTime: z.string().min(1, "End date and time is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  location: z.object({
    displayName: z.string().min(3, "Location is required").max(200, "Location too long"),
    input: z.string(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
    googleMapsUrl: z.string().optional(),
  }),
  eventUrl: z.string().optional().refine((val) => {
    return isValidUrl(val || '', {
      addProtocol: true,
      addWww: true,
      allowedProtocols: ['https:']
    });
  }, "Please enter a valid URL (e.g., meetball.fun, www.example.com)"),
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
  const { user } = useAuth();
  const { events } = useAppStore();
  const { toast } = useToast();

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBannerImage, setSelectedBannerImage] = useState<string>(generateBestGeometricImage(400, 400));
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isTagEventDialogOpen, setIsTagEventDialogOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [selectedTaggedEvents, setSelectedTaggedEvents] = useState<string[]>([]);

  // Local state for private toggle to avoid form.watch circular dependency
  const [isPrivateLocal, setIsPrivateLocal] = useState(false);
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API mutation
  const createEventMutation = useCreateEventApiV1EventsPost();
  const imageUploadMutation = useSimpleImageUpload();

  // Helper function to get next rounded hour and 2 hours later
  const getDefaultDates = () => {
    const now = new Date();
    const nextHour = new Date(now);

    // Round up to next whole hour
    // If we're at 5:10 AM, round up to 6:00 AM
    // If we're at 5:00 AM exactly, go to 6:00 AM  
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);

    const twoHoursLater = new Date(nextHour);
    twoHoursLater.setHours(nextHour.getHours() + 2);

    const formatDateTime = (date: Date) => {
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    };

    return {
      start: formatDateTime(nextHour),
      end: formatDateTime(twoHoursLater)
    };
  };

  const defaultDates = getDefaultDates();

  // Form setup
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      bannerImage: generateBestGeometricImage(400, 400),
      name: "",
      startDateTime: defaultDates.start,
      endDateTime: defaultDates.end,
      description: "",
      location: {
        displayName: "",
        input: "",
        coordinates: undefined,
        googleMapsUrl: undefined,
      },
      eventUrl: "",
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
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Use the hook's validation
      const validationErrors = ImageValidation.validateFile(file);
      if (validationErrors.length > 0) {
        toast({
          title: "Invalid file",
          description: validationErrors[0],
          variant: "destructive",
        });
        return;
      }

      setBannerImageFile(file);

      // Create preview URL for immediate feedback
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedBannerImage(result);
      };
      reader.readAsDataURL(file);

      // Upload to R2 in the background
      setIsUploadingImage(true);
      try {
        const uploadResult = await imageUploadMutation.mutateAsync({
          file,
          contentType: 'event',
          contentId: `temp-${Date.now()}`, // Temporary ID until event is created
        });

        if (uploadResult.image_url) {
          setUploadedImageUrl(uploadResult.image_url);
          form.setValue("bannerImage", uploadResult.image_url);
          
          toast({
            title: "Image uploaded",
            description: "Banner image has been uploaded successfully.",
          });
        }
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        // Keep the local preview even if upload fails
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  /**
   * Remove banner image
   */
  const removeBannerImage = () => {
    setSelectedBannerImage("");
    setBannerImageFile(null);
    setUploadedImageUrl("");
    form.setValue("bannerImage", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Generate 3-digit PIN when private event is enabled
   */
  const generatePin = useCallback(() => {
    const pin = Math.floor(100 + Math.random() * 900).toString();
    setGeneratedPin(pin);
    return pin;
  }, []);


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
      // Handle auto-generated image upload if needed
      let finalImageUrl = uploadedImageUrl;
      
      if (!uploadedImageUrl && selectedBannerImage && selectedBannerImage.startsWith('data:')) {
        toast({
          title: "Uploading banner image...",
          description: "Please wait while we upload your auto-generated banner.",
        });
        
        try {
          // Convert data URL to blob
          const response = await fetch(selectedBannerImage);
          const blob = await response.blob();
          
          // Create file from blob
          const file = new File([blob], `event-banner-${Date.now()}.svg`, { type: 'image/svg+xml' });
          
          // Upload to R2
          const uploadResult = await imageUploadMutation.mutateAsync({
            file,
            contentType: 'event',
            contentId: `auto-${Date.now()}`,
          });
          
          if (uploadResult.image_url) {
            finalImageUrl = uploadResult.image_url;
            setUploadedImageUrl(uploadResult.image_url);
          }
        } catch (uploadError) {
          console.error('Failed to upload auto-generated image:', uploadError);
          // Continue without image rather than failing the whole event creation
          toast({
            title: "Image upload failed",
            description: "Continuing without banner image.",
            variant: "destructive",
          });
        }
      }

      // Normalize URLs before sending to API (https-only)
      const normalizedEventUrl = data.eventUrl ?
        normalizeWebUrl(data.eventUrl) : null;

      // Prepare event data for API
      const eventData = {
        name: data.name,
        description: data.description,
        location: data.location.displayName,
        start_date: data.startDateTime,
        end_date: data.endDateTime,
        parent_event_id: null,
        creator_id: user.id,
        image_url: finalImageUrl || undefined, // Use final image URL (uploaded or user-provided)
      };

      // Log normalized URLs for debugging
      if (data.eventUrl && normalizedEventUrl !== data.eventUrl) {
        // console.log(`Normalized Event URL: "${data.eventUrl}" → "${normalizedEventUrl}"`);
      }
      if (data.location.googleMapsUrl) {
        // console.log(`Auto-generated Google Maps URL: ${data.location.googleMapsUrl}`);
      }

      // Create event via API
      const response = await createEventMutation.mutateAsync({
        data: eventData
      });

      // console.log("Event created successfully:", response);

      // Invalidate events cache using centralized cache manager


      // TODO: In a real app, you would also:
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
    <>
      {/* Pixelated Animation Styles */}
      <style>{`
        .pixelated-grid {
          background-image: 
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 8px 8px;
          animation: pixelate-wave 1.5s ease-in-out infinite;
        }
        
        @keyframes pixelate-wave {
          0%, 100% { 
            background-position: 0 0, 0 0;
            opacity: 0.3; 
          }
          50% { 
            background-position: 8px 8px, 8px 8px;
            opacity: 0.7; 
          }
        }
        
        .pixel-spinner {
          width: 16px;
          height: 16px;
          background: #3ec6c6;
          animation: pixel-spin 0.8s linear infinite;
        }
        
        @keyframes pixel-spin {
          0% { 
            clip-path: polygon(0% 0%, 100% 0%, 100% 25%, 0% 25%);
          }
          25% { 
            clip-path: polygon(75% 0%, 100% 0%, 100% 100%, 75% 100%);
          }
          50% { 
            clip-path: polygon(0% 75%, 100% 75%, 100% 100%, 0% 100%);
          }
          75% { 
            clip-path: polygon(0% 0%, 25% 0%, 25% 100%, 0% 100%);
          }
          100% { 
            clip-path: polygon(0% 0%, 100% 0%, 100% 25%, 0% 25%);
          }
        }
      `}</style>
      
      <div className="bg-[#f0efeb] min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-[#f0efeb]/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <BuildingIcon className="w-6 h-6 text-[#3ec6c6]" />
          <h1 className="text-base md:text-lg font-semibold text-black">
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
        <div className="max-w-2xl mx-auto p-4 pb-24">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Banner Image - Moved to top */}
              <div className="flex flex-col items-center space-y-3">
                <FormField
                  control={form.control}
                  name="bannerImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          {selectedBannerImage ? (
                            <div
                              className="relative group cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <img
                                src={selectedBannerImage}
                                alt="Event banner preview"
                                className="w-80 h-80 md:w-96 md:h-96 object-cover rounded-2xl transition-all duration-200 group-hover:brightness-75"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-2xl"></div>
                              {isUploadingImage && (
                                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                                  <div className="relative">
                                    {/* Pixelated Animation Background */}
                                    <div className="absolute inset-0 opacity-30">
                                      <div className="pixelated-grid w-64 h-16 mx-auto"></div>
                                    </div>
                                    
                                    {/* Main Upload Text */}
                                    <div className="relative z-10 text-white text-sm font-medium flex items-center gap-3 px-6 py-3 bg-black/40 rounded-lg backdrop-blur-sm">
                                      <div className="pixel-spinner"></div>
                                      Uploading...
                                    </div>
                                  </div>
                                </div>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                                className="absolute bottom-3 right-3 rounded-full w-10 h-10 p-0 bg-white/90 hover:bg-white group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-200"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer flex flex-col items-center justify-center"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <UploadIcon className="w-8 h-8 text-gray-400 mb-3" />
                              <p className="text-sm text-gray-600 mb-2">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG up to 5MB
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
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Spacer */}
              <div className="h-1"></div>

              {/* Event Name */}
              <Card className="rounded-2xl">
                <CardContent className="p-3 bg-white rounded-2xl">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      const [isEditMode, setIsEditMode] = React.useState(false);
                      const [inputValue, setInputValue] = React.useState(field.value);
                      const inputRef = React.useRef<HTMLInputElement>(null);

                      const handleEdit = () => {
                        if (isSubmitting) return;
                        setIsEditMode(true);
                        setInputValue(field.value);
                        setTimeout(() => inputRef.current?.focus(), 0);
                      };

                      const handleSave = () => {
                        setIsEditMode(false);
                        field.onChange(inputValue);
                      };

                      const handleKeyDown = (e: React.KeyboardEvent) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSave();
                        } else if (e.key === "Escape") {
                          setIsEditMode(false);
                          setInputValue(field.value);
                        }
                      };

                      React.useEffect(() => {
                        setInputValue(field.value);
                      }, [field.value]);

                      return (
                        <FormItem>
                          <FormControl>
                            <div
                              className={cn(
                                "px-6 py-3 text-center transition-all duration-200 rounded-md",
                                !isEditMode && "cursor-pointer hover:bg-gray-50"
                              )}
                              onClick={!isEditMode ? handleEdit : undefined}
                            >
                              {isEditMode ? (
                                <div className="relative">
                                  <Input
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleSave}
                                    placeholder=""
                                    disabled={isSubmitting}
                                    className="text-4xl md:text-5xl font-bold border-0 bg-transparent text-center p-0 relative z-10"
                                  />
                                  {!inputValue && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-4xl md:text-5xl font-bold text-gray-400">
                                      Event Name
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-4xl md:text-5xl font-bold text-gray-900">
                                  {field.value || (
                                    <span className="text-gray-400">Event Name</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </CardContent>
              </Card>

              {/* Spacer */}
              <div className="h-1"></div>

              {/* Choose Location */}
              <Card className="rounded-2xl">
                <CardContent className="px-6 py-3 bg-white rounded-2xl">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-3">
                          <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <FormControl className="flex-1">
                            <LocationInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Choose Location"
                              disabled={isSubmitting}
                              className="border-0 bg-white"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Spacer */}
              <div className="h-1"></div>

              {/* Date & Time */}
              <Card className="rounded-2xl">
                <CardContent className="px-6 py-3 bg-white rounded-2xl">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Date & Time Inputs */}
                    <div className="flex-1 space-y-4">
                      {/* Start Date & Time */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-16 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span className="text-sm text-gray-600">Start</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2 bg-gradient-to-r from-gray-100 to-transparent rounded-lg p-0.5">
                            <FormField
                              control={form.control}
                              name="startDateTime"
                              render={({ field }) => {
                                const dateValue = field.value ? field.value.split('T')[0] : '';
                                const timeValue = field.value ? field.value.split('T')[1] : '';

                                return (
                                  <>
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          type="date"
                                          value={dateValue}
                                          onChange={(e) => {
                                            const newDateTime = e.target.value + 'T' + (timeValue || '12:00');
                                            field.onChange(newDateTime);
                                          }}
                                          disabled={isSubmitting}
                                          className="border-0 bg-transparent px-4 py-3 text-base md:text-lg rounded-md [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                      </FormControl>
                                    </FormItem>
                                    <FormItem className="w-40">
                                      <FormControl>
                                        <Input
                                          type="time"
                                          value={timeValue}
                                          onChange={(e) => {
                                            const newDateTime = (dateValue || new Date().toISOString().split('T')[0]) + 'T' + e.target.value;
                                            field.onChange(newDateTime);
                                          }}
                                          disabled={isSubmitting}
                                          className="border-0 bg-transparent px-4 py-3 text-base md:text-lg rounded-md"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  </>
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visual connector line */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 flex justify-center">
                          <div className="w-0.5 h-8 bg-gray-300"></div>
                        </div>
                        <div className="flex-1"></div>
                      </div>

                      {/* End Date & Time */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-16 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span className="text-sm text-gray-600">End</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2 bg-gradient-to-r from-gray-100 to-transparent rounded-lg p-0.5">
                            <FormField
                              control={form.control}
                              name="endDateTime"
                              render={({ field }) => {
                                const dateValue = field.value ? field.value.split('T')[0] : '';
                                const timeValue = field.value ? field.value.split('T')[1] : '';

                                return (
                                  <>
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          type="date"
                                          value={dateValue}
                                          onChange={(e) => {
                                            const newDateTime = e.target.value + 'T' + (timeValue || '14:00');
                                            field.onChange(newDateTime);
                                          }}
                                          disabled={isSubmitting}
                                          className="border-0 bg-transparent px-4 py-3 text-base md:text-lg rounded-md [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                      </FormControl>
                                    </FormItem>
                                    <FormItem className="w-40">
                                      <FormControl>
                                        <Input
                                          type="time"
                                          value={timeValue}
                                          onChange={(e) => {
                                            const newDateTime = (dateValue || new Date().toISOString().split('T')[0]) + 'T' + e.target.value;
                                            field.onChange(newDateTime);
                                          }}
                                          disabled={isSubmitting}
                                          className="border-0 bg-transparent px-4 py-3 text-base md:text-lg rounded-md"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  </>
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Form Messages */}
                      <FormField
                        control={form.control}
                        name="startDateTime"
                        render={() => <FormMessage />}
                      />
                      <FormField
                        control={form.control}
                        name="endDateTime"
                        render={() => <FormMessage />}
                      />
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden lg:block w-px bg-gray-300 self-stretch"></div>

                    {/* Timezone Info */}
                    <div className="lg:w-36 flex lg:flex-col items-center lg:items-start justify-center lg:justify-center gap-2 lg:gap-1 pt-2 lg:pt-0">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                        <span className="font-medium">GMT+01:00</span>
                      </div>
                      <span className="text-sm text-gray-500">Lisbon</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="rounded-2xl">
                <CardContent className="p-3 bg-white rounded-2xl">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ClickableInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Add Description"
                            disabled={isSubmitting}
                            icon={<FileTextIcon />}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Spacer */}
              <div className="h-1"></div>

              {/* Event URL */}
              <Card className="rounded-2xl">
                <CardContent className="p-3 bg-white rounded-2xl">
                  <FormField
                    control={form.control}
                    name="eventUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ClickableInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="(Optional) Event URL"
                            disabled={isSubmitting}
                            icon={<LinkIcon />}
                            type="url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Spacer */}
              <div className="h-1"></div>

              {/* Event Configuration */}
              <Card className="rounded-2xl">
                <CardContent className="p-3 space-y-4 bg-white rounded-2xl">
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
                        <FormControl>
                          <ClickableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Event Type"
                            disabled={isSubmitting}
                            icon={<CalendarIcon />}
                            displayValue={eventTypes.find(type => type.toLowerCase().replace(" ", "-") === field.value)}
                          >
                            {eventTypes.map((type) => (
                              <SelectItem key={type} value={type.toLowerCase().replace(" ", "-")}>
                                {type}
                              </SelectItem>
                            ))}
                          </ClickableSelect>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Thin Spacer */}
                  <div className="h-0.5"></div>

                  {/* Community Selection */}
                  <FormField
                    control={form.control}
                    name="community"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ClickableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select community"
                            disabled={isSubmitting}
                            icon={<BuildingIcon />}
                            displayValue={communities.find(c => c.id === field.value)?.label}
                          >
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
                          </ClickableSelect>
                        </FormControl>
                        <FormDescription>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-sm text-[#3ec6c6] ml-8"
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

              {/* Spacer */}
              <div className="h-1"></div>

              {/* Tags and Related Events */}
              <Card className="rounded-2xl">
                <CardContent className="p-3 space-y-4 bg-white rounded-2xl">
                  {/* <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TagIcon className="w-5 h-5" />
                    Tags & Related Events
                  </h2> */}

                  {/* Tags */}
                  <FormItem>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Tags"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          disabled={isSubmitting || selectedTags.length >= 10}
                          className="flex-1 border border-gray-200 bg-white px-4 py-3 text-base md:text-lg"
                        />
                        <Button
                          type="button"
                          onClick={() => addTag(tagInput)}
                          disabled={!tagInput.trim() || selectedTags.length >= 10}
                          size="sm"
                          className="rounded-2xl px-6"
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
                              className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                              onClick={() => removeTag(tag)}
                              title="Click to remove tag"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormItem>

                  {/* Tag Other Events */}
                  <FormItem>
                    <div className="space-y-2">
                      <Dialog open={isTagEventDialogOpen} onOpenChange={setIsTagEventDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start border-0 bg-gradient-to-br from-gray-100 to-gray-50 px-4 py-3 text-base md:text-lg text-gray-600 shadow-sm"
                            disabled={isSubmitting || selectedTaggedEvents.length >= 5}
                          >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Tag Other Events (Max 5)
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
                  </FormItem>

                  {/* Co-Host */}
                  <FormField
                    control={form.control}
                    name="coHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ClickableInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Co-Hosts (Coming soon)"
                            disabled={true}
                            icon={<UsersIcon />}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Spacer */}
              <div className="h-1"></div>

              {/* Event Settings */}
              <Card className="rounded-2xl">
                <CardContent className="p-3 space-y-4 bg-white rounded-2xl">
                  {/* <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <EyeIcon className="w-5 h-5" />
                    Event Settings
                  </h2> */}

                  {/* Private Event */}
                  <div
                    className={isPrivateLocal
                      ? "flex items-start justify-between p-3 rounded-lg transition-all bg-yellow-50 border border-yellow-300 cursor-pointer"
                      : "flex items-start justify-between p-3 rounded-lg transition-all hover:bg-gray-50 border border-transparent cursor-pointer"
                    }
                    onClick={(e) => {
                      // Prevent toggling when clicking directly on the switch
                      if ((e.target as HTMLElement).closest('[role="switch"]')) {
                        return;
                      }
                      const newValue = !isPrivateLocal;
                      setIsPrivateLocal(newValue);
                      form.setValue("isPrivate", newValue);
                      
                      // Handle PIN generation
                      if (newValue) {
                        generatePin();
                      } else {
                        setGeneratedPin("");
                      }
                    }}
                  >
                    <div className="flex-1 cursor-pointer">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium leading-none cursor-pointer">Private Event</label>
                      </div>
                      {generatedPin && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-yellow-800">
                            Event PIN: <code className="bg-yellow-100 px-2 py-1 rounded font-mono text-xs">{generatedPin}</code>
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Share this PIN with invited attendees
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Custom toggle to avoid Radix Switch infinite loop */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isPrivateLocal}
                      disabled={isSubmitting}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-0.5
                        ${isPrivateLocal ? 'bg-blue-600' : 'bg-gray-200'}
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent container click
                        const newValue = !isPrivateLocal;
                        setIsPrivateLocal(newValue);
                        form.setValue("isPrivate", newValue);
                        
                        // Handle PIN generation
                        if (newValue) {
                          generatePin();
                        } else {
                          setGeneratedPin("");
                        }
                      }}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform
                          ${isPrivateLocal ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Allow Cross-tagging */}
                  <FormField
                    control={form.control}
                    name="allowCrossTagging"
                    render={({ field }) => (
                      <div 
                        className="flex items-start justify-between p-3 rounded-lg transition-all hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => {
                          // Prevent toggling when clicking directly on the switch
                          if ((e.target as HTMLElement).closest('[role="switch"]')) {
                            return;
                          }
                          field.onChange(!field.value);
                        }}
                      >
                        <div className="space-y-0.5 flex-1 cursor-pointer">
                          <FormLabel 
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              field.onChange(!field.value);
                            }}
                          >
                            Allow Event Cross-tagging
                          </FormLabel>
                          <FormDescription 
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              field.onChange(!field.value);
                            }}
                          >
                            Let attendees tag this event in their posts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={field.value}
                            disabled={isSubmitting}
                            className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-0.5
                              ${field.value ? 'bg-blue-600' : 'bg-gray-200'}
                              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent container click
                              field.onChange(!field.value);
                            }}
                          >
                            <span
                              className={`
                                inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform
                                ${field.value ? 'translate-x-6' : 'translate-x-1'}
                              `}
                            />
                          </button>
                        </FormControl>
                      </div>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Section */}
              <div className="fixed bottom-0 left-0 right-0 bg-[#f0efeb]/95 backdrop-blur-lg shadow-lg border-t border-gray-200">
                <div className="max-w-2xl mx-auto p-6">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1 rounded-2xl"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white rounded-2xl"
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
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
    </>
  );
};
