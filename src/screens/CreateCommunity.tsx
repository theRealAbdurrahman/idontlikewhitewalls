import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidUrl, normalizeWebUrl } from "../utils/urlValidation";
import { 
  XIcon, 
  MapPinIcon, 
  BuildingIcon,
  LinkIcon,
  UploadIcon,
  SearchIcon,
  GlobeIcon,
  LockIcon,
  PlusIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useAuth } from "../providers";
import { useToast } from "../hooks/use-toast";

/**
 * Form validation schema using Zod
 */
const communityFormSchema = z.object({
  logo: z.string().optional(),
  name: z.string().min(3, "Community name must be at least 3 characters").max(100, "Community name too long"),
  country: z.string().min(1, "Country is required"),
  location: z.string().min(3, "Location is required").max(200, "Location too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  communityUrl: z.string().optional().refine((val) => {
    return isValidUrl(val || '', {
      addProtocol: true,
      addWww: true,
      allowedProtocols: ['https:']
    });
  }, "Please enter a valid URL (e.g., meetball.fun, www.example.com)"),
  manager: z.string().min(1, "Manager is required"),
  coHost: z.string().optional(),
  isOpen: z.boolean().default(true),
});

type CommunityFormData = z.infer<typeof communityFormSchema>;

/**
 * Country data with flags (Europe first)
 */
const countries = [
  // European countries first
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  // Other countries
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
];

/**
 * CreateCommunity screen component for creating new communities
 */
export const CreateCommunity: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form setup
  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      logo: "",
      name: "",
      country: "",
      location: "",
      description: "",
      communityUrl: "",
      manager: user?.full_name || "",
      coHost: "",
      isOpen: true,
    },
  });

  // Watch form fields for validation
  const watchedFields = form.watch(["name", "country", "location", "description"]);
  const isFormValid = watchedFields.every(field => field && field.trim().length > 0) && 
                     form.formState.isValid && 
                     !isSubmitting;

  /**
   * Handle logo upload
   */
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (2MB limit for logos)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a logo under 2MB.",
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

      setLogoFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedLogo(result);
        form.setValue("logo", result);
      };
      reader.readAsDataURL(file);

      toast({
        title: "Logo uploaded",
        description: "Community logo has been added.",
      });
    }
  };

  /**
   * Remove logo
   */
  const removeLogo = () => {
    setSelectedLogo("");
    setLogoFile(null);
    form.setValue("logo", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Filter countries based on search
   */
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  /**
   * Select country
   */
  const selectCountry = (countryCode: string) => {
    form.setValue("country", countryCode);
    setIsCountryDialogOpen(false);
    setCountrySearchQuery("");
  };

  /**
   * Get selected country info
   */
  const getSelectedCountry = () => {
    const countryCode = form.watch("country");
    return countries.find(country => country.code === countryCode);
  };

  /**
   * Handle form submission
   */
  const onSubmit = async (data: CommunityFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a community.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalize URL before processing
      const normalizedCommunityUrl = data.communityUrl ? 
        normalizeWebUrl(data.communityUrl) : null;

      // Simulate API call for community creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real app, you would:
      // - Upload logo to storage service
      // - Create community record in database
      // - Set up initial permissions and settings
      // - Send notifications to relevant users

      // Log normalized URL for debugging
      if (data.communityUrl && normalizedCommunityUrl !== data.communityUrl) {
        // console.log(`Normalized Community URL: "${data.communityUrl}" → "${normalizedCommunityUrl}"`);
      }

      // console.log("Community created:", {
      //   ...data,
      //   communityUrl: normalizedCommunityUrl,
      //   createdBy: user.id,
      //   createdAt: new Date().toISOString(),
      //   memberCount: 1, // Creator is first member
      //   logoUrl: selectedLogo,
      // });

      toast({
        title: "Your community has been created!",
        description: `${data.name} is now live and ready for members.`,
      });

      // Navigate to communities screen
      navigate("/communities");

    } catch (error: any) {
      console.error("Failed to create community:", error);
      
      toast({
        title: "Failed to create community",
        description: "Please check your connection and try again.",
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

  const selectedCountry = getSelectedCountry();

  return (
    <div className="bg-[#f0efeb] min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-[#f0efeb]/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <BuildingIcon className="w-6 h-6 text-[#3ec6c6]" />
          <h1 className="text-lg font-semibold text-black">
            Create a new community
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
              {/* Community Logo */}
              <Card>
                <CardContent className="p-6 bg-[#FBFBFB] rounded-2xl">
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex justify-center">
                              {selectedLogo ? (
                                <div className="relative">
                                  <img
                                    src={selectedLogo}
                                    alt="Community logo preview"
                                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={removeLogo}
                                    className="absolute -top-2 -right-2 w-8 h-8 p-0 rounded-full"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div 
                                  className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-600">
                                    Add Logo
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
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
                              {selectedLogo ? "Change Logo" : "Upload Logo"}
                            </Button>
                            
                            <p className="text-xs text-gray-500 text-center">
                              PNG, JPG up to 2MB • Square images work best
                            </p>
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
                  {/* Community Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Dublin Tech Community"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Country Selection */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <div>
                            <Dialog open={isCountryDialogOpen} onOpenChange={setIsCountryDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full justify-start"
                                  disabled={isSubmitting}
                                >
                                  {selectedCountry ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{selectedCountry.flag}</span>
                                      <span>{selectedCountry.name}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-gray-500">
                                      <GlobeIcon className="w-4 h-4" />
                                      <span>Select country</span>
                                    </div>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Select Country</DialogTitle>
                                  <DialogDescription>
                                    Choose the primary country for your community.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="relative">
                                    <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                      placeholder="Search countries..."
                                      value={countrySearchQuery}
                                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                                      className="pl-10"
                                    />
                                  </div>
                                  
                                  <div className="max-h-80 overflow-y-auto space-y-1">
                                    {filteredCountries.map((country) => (
                                      <Button
                                        key={country.code}
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start h-auto p-3"
                                        onClick={() => selectCountry(country.code)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="text-lg">{country.flag}</span>
                                          <span>{country.name}</span>
                                        </div>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
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
                              placeholder="e.g., Dublin, Ireland"
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

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your community, its purpose, and what members can expect..."
                            className="min-h-[100px]"
                            maxLength={1000}
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value.length}/1000 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Community URL */}
                  <FormField
                    control={form.control}
                    name="communityUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community URL</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="e.g., https://yourcommunity.com"
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Optional: Link to your community website or social media
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Community Manager */}
                  <FormField
                    control={form.control}
                    name="manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community Manager</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormDescription>
                          You will be the primary manager of this community
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Co-Host */}
                  <FormField
                    control={form.control}
                    name="coHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Co-Host</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Search and invite co-hosts (Coming soon)"
                            {...field}
                            disabled
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Add a co-host to help manage this community
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Community Settings */}
              <Card>
                <CardContent className="p-6 space-y-4 bg-[#FBFBFB] rounded-2xl">
                  {/* Open/Closed Community */}
                  <FormField
                    control={form.control}
                    name="isOpen"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {field.value ? (
                              <GlobeIcon className="w-4 h-4 text-green-600" />
                            ) : (
                              <LockIcon className="w-4 h-4 text-orange-600" />
                            )}
                            <FormLabel className="font-semibold">
                              {field.value ? "Open Community" : "Closed Community"}
                            </FormLabel>
                          </div>
                          <FormDescription className="text-sm">
                            {field.value 
                              ? "Anyone can create events for this community"
                              : "Only hosts can create events for this community"
                            }
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                            className="data-[state=checked]:bg-green-500"
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
                    disabled={!isFormValid}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create community
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