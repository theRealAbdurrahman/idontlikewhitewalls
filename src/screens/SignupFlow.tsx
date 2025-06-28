import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, PlusIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { StickyNote } from "../components/ui/sticky-note";
import { useToast } from "../hooks/use-toast";

/**
 * Interface for Step 1 data structure
 */
interface Step1Data {
  connectWith: string[];
  connectDetails: string;
  offerings: string;
}

/**
 * Interface for Step 2 data structure
 */
interface Step2Data {
  interests: string[];
}

/**
 * Interface for Step 3 data structure
 */
interface Step3Data {
  linkedinUrl: string;
}

/**
 * Interface for the complete signup flow data
 */
interface SignupFlowData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}

/**
 * Pre-defined connection preference labels - Updated with new categories
 */
const CONNECTION_LABELS = [
  "Technology & Product",
  "Business & Strategy", 
  "Creative & Design",
  "Finance & Investment",
  "Community & Impact"
] as const;

/**
 * Pre-defined interests beyond work with colors for sticky notes
 */
const INTEREST_OPTIONS = [
  { label: "Travel", color: "#FFE066" },
  { label: "Cooking", color: "#FF6B6B" },
  { label: "Photography", color: "#4ECDC4" },
  { label: "Music", color: "#95E1D3" },
  { label: "Sports", color: "#FFB347" },
  { label: "Reading", color: "#DDA0DD" },
  { label: "Gaming", color: "#87CEEB" },
  { label: "Art", color: "#F0E68C" },
  { label: "Fitness", color: "#98FB98" },
  { label: "Movies", color: "#FFA07A" },
  { label: "Nature", color: "#90EE90" },
  { label: "Technology", color: "#ADD8E6" },
  { label: "Fashion", color: "#FFB6C1" },
  { label: "Dancing", color: "#FFEFD5" },
  { label: "Writing", color: "#E6E6FA" },
] as const;
/**
 * Custom styles for animations and interactions
 */
const customStyles = `
  .signup-header {
    backdrop-filter: blur(20px);
    background: rgba(240, 239, 235, 0.95);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  
  .label-button {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .label-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .label-button:active {
    transform: translateY(0);
  }
  
  .progress-step {
    transition: all 0.3s ease-out;
  }
  
  .progress-step.active {
    background-color: #3ec6c6;
    transform: scale(1.1);
  }
  
  .form-container {
    animation: slideInUp 0.4s ease-out;
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .custom-input-container {
    transition: all 0.2s ease-out;
  }
  
  .custom-input-container:focus-within {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(62, 198, 198, 0.15);
  }
  
  .next-button {
    transition: all 0.2s ease-out;
  }
  
  .next-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(62, 198, 198, 0.3);
  }
  
  .interest-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    justify-items: center;
  }
  
  .interest-note {
    cursor: pointer;
    transition: all 0.2s ease-out;
  }
  
  .interest-note:hover {
    transform: scale(1.05) rotate(0deg) !important;
    z-index: 10;
  }
  
  .interest-note.selected {
    z-index: 5;
  }
  
  .custom-interest-input {
    animation: fadeInScale 0.3s ease-out;
  }
  
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

/**
 * Step 1 Component - Connection Preferences
 */
interface Step1Props {
  data: Step1Data;
  onDataChange: (data: Step1Data) => void;
  onNext: () => void;
  onSkip: () => void;
}

const Step1: React.FC<Step1Props> = ({ data, onDataChange, onNext, onSkip }) => {
  const [customLabel, setCustomLabel] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  /**
   * Handle toggling connection preference labels
   */
  const handleLabelToggle = (label: string) => {
    const updatedLabels = data.connectWith.includes(label)
      ? data.connectWith.filter(l => l !== label)
      : [...data.connectWith, label];
    
    onDataChange({
      ...data,
      connectWith: updatedLabels
    });
  };

  /**
   * Handle adding custom label
   */
  const handleAddCustomLabel = () => {
    if (customLabel.trim() && !data.connectWith.includes(customLabel.trim())) {
      onDataChange({
        ...data,
        connectWith: [...data.connectWith, customLabel.trim()]
      });
      setCustomLabel("");
      setIsAddingCustom(false);
    }
  };

  /**
   * Handle removing custom label
   */
  const handleRemoveLabel = (label: string) => {
    onDataChange({
      ...data,
      connectWith: data.connectWith.filter(l => l !== label)
    });
  };

  /**
   * Handle key press for custom label input
   */
  const handleCustomLabelKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomLabel();
    } else if (e.key === "Escape") {
      setIsAddingCustom(false);
      setCustomLabel("");
    }
  };

  return (
    <div className="form-container space-y-8">
      {/* Question 1: Who would you like to connect with? */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 leading-tight">
          Who would you like to connect with?
        </h2>
        
        {/* Pre-defined Labels + Custom Labels + Add Custom Button - All in same row */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {/* Pre-defined Labels */}
            {CONNECTION_LABELS.map((label) => (
              <Button
                key={label}
                type="button"
                variant={data.connectWith.includes(label) ? "default" : "outline"}
                onClick={() => handleLabelToggle(label)}
                className={`label-button px-4 py-2 rounded-full text-sm font-medium ${
                  data.connectWith.includes(label)
                    ? "bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white border-[#3ec6c6]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                aria-pressed={data.connectWith.includes(label)}
                aria-label={`Toggle ${label} connection preference`}
              >
                {label}
              </Button>
            ))}
            
            {/* Custom Labels */}
            {data.connectWith
              .filter(label => !CONNECTION_LABELS.includes(label as any))
              .map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="label-button px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100 flex items-center gap-2"
                >
                  {label}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLabel(label)}
                    className="w-4 h-4 p-0 hover:bg-blue-200 rounded-full"
                    aria-label={`Remove ${label} label`}
                  >
                    <XIcon className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}

            {/* Add Custom Label Button - Now inline with other labels */}
            {!isAddingCustom && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingCustom(true)}
                className="label-button flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 border-dashed"
                aria-label="Add custom connection preference"
              >
                <PlusIcon className="w-4 h-4" />
                Add custom
              </Button>
            )}
          </div>
          
          {/* Custom Label Input Form - Only shows when adding */}
          {isAddingCustom && (
            <div className="custom-input-container flex gap-2 max-w-xs">
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyPress={handleCustomLabelKeyPress}
                placeholder="Enter custom label"
                className="flex-1 text-sm"
                maxLength={30}
                autoFocus
                aria-label="Custom connection preference label"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomLabel}
                disabled={!customLabel.trim()}
                className="bg-[#FFCA28] hover:bg-[#e6b324] text-black px-3"
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingCustom(false);
                  setCustomLabel("");
                }}
                className="px-3"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        {/* Details Textarea - Updated placeholder and removed length restrictions */}
        <div className="space-y-2">
          <Textarea
            value={data.connectDetails}
            onChange={(e) => onDataChange({ ...data, connectDetails: e.target.value })}
            placeholder="Describe what you do professionally and what you're passionate about in your work. How would you want someone to introduce you at an event?"
            className="min-h-[125px] resize-none text-sm leading-relaxed focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
            aria-label="Professional description and introduction"
          />
        </div>
      </div>

      {/* Question 2: I can help others with... - Updated question text */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 leading-tight">
          I can help others with...
        </h2>
        
        <div className="space-y-2">
          <Textarea
            value={data.offerings}
            onChange={(e) => onDataChange({ ...data, offerings: e.target.value })}
            placeholder="What unique insights, expertise, connections, or resources can you offer to support others? Think beyond just your job title: What problems do you love solving?"
            className="min-h-[145px] resize-none text-sm leading-relaxed focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
            aria-label="What you can offer to support others"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Step 2 Component - Interests Beyond Work
 */
interface Step2Props {
  data: Step2Data;
  onDataChange: (data: Step2Data) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2: React.FC<Step2Props> = ({ data, onDataChange, onNext, onBack }) => {
  const [customInterest, setCustomInterest] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  /**
   * Handle toggling interest selection
   */
  const handleInterestToggle = (interest: string) => {
    const updatedInterests = data.interests.includes(interest)
      ? data.interests.filter(i => i !== interest)
      : [...data.interests, interest];
    
    onDataChange({
      ...data,
      interests: updatedInterests
    });
  };

  /**
   * Handle adding custom interest
   */
  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !data.interests.includes(customInterest.trim())) {
      onDataChange({
        ...data,
        interests: [...data.interests, customInterest.trim()]
      });
      setCustomInterest("");
      setIsAddingCustom(false);
    }
  };

  /**
   * Handle removing custom interest
   */
  const handleRemoveInterest = (interest: string) => {
    onDataChange({
      ...data,
      interests: data.interests.filter(i => i !== interest)
    });
  };

  /**
   * Handle key press for custom interest input
   */
  const handleCustomInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomInterest();
    } else if (e.key === "Escape") {
      setIsAddingCustom(false);
      setCustomInterest("");
    }
  };

  /**
   * Get color for interest (predefined or random for custom)
   */
  const getInterestColor = (interest: string): string => {
    const predefined = INTEREST_OPTIONS.find(option => option.label === interest);
    if (predefined) return predefined.color;
    
    // Generate consistent color for custom interests based on string hash
    const colors = ["#FFE066", "#FF6B6B", "#4ECDC4", "#95E1D3", "#FFB347", "#DDA0DD"];
    let hash = 0;
    for (let i = 0; i < interest.length; i++) {
      hash = interest.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  /**
   * Get rotation for sticky note (random but consistent)
   */
  const getRotation = (interest: string): number => {
    let hash = 0;
    for (let i = 0; i < interest.length; i++) {
      hash = interest.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 21) - 10; // Random rotation between -10 and 10 degrees
  };

  return (
    <div className="form-container space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          What lights you up outside of work?
        </h2>
        <p className="text-gray-600 text-base">
          Select your interests to help others connect with you on a personal level
        </p>
      </div>

      {/* Interests Grid */}
      <div className="space-y-6">
        <div className="interest-grid">
          {INTEREST_OPTIONS.map((option) => {
            const isSelected = data.interests.includes(option.label);
            return (
              <div
                key={option.label}
                className={`interest-note ${isSelected ? 'selected' : ''}`}
                onClick={() => handleInterestToggle(option.label)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleInterestToggle(option.label);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`Toggle ${option.label} interest`}
              >
                  <div 
                    className={`transition-all duration-200 ${
                      isSelected 
                        ? 'transform scale-110' 
                        : ''
                    }`}
                    style={{
                      transform: `scale(${isSelected ? 1.1 : 1}) rotate(${getRotation(option.label)}deg)`,
                      filter: isSelected 
                        ? 'drop-shadow(0 8px 25px rgba(0,0,0,0.15))' 
                        : 'none'
                    }}
                  >
                    <StickyNote
                      content={option.label}
                      backgroundColor={option.color}
                      width={100}
                      height={80}
                      rotation={0} // Rotation is now handled by parent
                      className={`text-sm font-semibold ${
                        isSelected ? 'ring-4 ring-[#3ec6c6] ring-opacity-50' : ''
                      }`}
                    />
                  </div>
              </div>
            );
          })}
        </div>

        {/* Custom Interests */}
        {data.interests
          .filter(interest => !INTEREST_OPTIONS.some(option => option.label === interest))
          .length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              Your Custom Interests
            </h3>
            <div className="interest-grid">
              {data.interests
                .filter(interest => !INTEREST_OPTIONS.some(option => option.label === interest))
                .map((interest) => (
                  <div
                    key={interest}
                    className="interest-note selected relative"
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${interest} custom interest`}
                  >
                    <div 
                      className="transition-all duration-200 transform scale-110"
                      style={{
                        transform: `scale(1.1) rotate(${getRotation(interest)}deg)`,
                        filter: 'drop-shadow(0 8px 25px rgba(0,0,0,0.15))'
                      }}
                    >
                      <StickyNote
                        content={interest}
                        backgroundColor={getInterestColor(interest)}
                        width={100}
                        height={80}
                        rotation={0} // Rotation is now handled by parent
                        className="text-sm font-semibold ring-4 ring-[#3ec6c6] ring-opacity-50"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveInterest(interest)}
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
                      aria-label={`Remove ${interest} interest`}
                    >
                      <XIcon className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Add Custom Interest */}
        <div className="flex justify-center">
          {isAddingCustom ? (
            <div className="custom-interest-input flex gap-2 max-w-xs">
              <Input
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyPress={handleCustomInterestKeyPress}
                placeholder="Enter your interest"
                className="flex-1 text-sm"
                maxLength={20}
                autoFocus
                aria-label="Custom interest"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomInterest}
                disabled={!customInterest.trim()}
                className="bg-[#FFCA28] hover:bg-[#e6b324] text-black px-3"
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingCustom(false);
                  setCustomInterest("");
                }}
                className="px-3"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingCustom(true)}
              className="label-button flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-white text-gray-700 border-gray-300 hover:bg-gray-50 border-dashed"
              aria-label="Add custom interest"
            >
              <PlusIcon className="w-4 h-4" />
              Add your own
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Step 3 Component - LinkedIn Profile
 */
interface Step3Props {
  data: Step3Data;
  onDataChange: (data: Step3Data) => void;
  onComplete: () => void;
  onBack: () => void;
}

const Step3: React.FC<Step3Props> = ({ data, onDataChange, onComplete, onBack }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [username, setUsername] = useState("");

  /**
   * Validate LinkedIn URL format
   */
  const validateLinkedInUrl = (url: string): { isValid: boolean; error?: string; username?: string } => {
    if (!url.trim()) {
      return { isValid: true }; // Empty is valid (optional field)
    }

    // Common LinkedIn URL patterns
    const patterns = [
      /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/,
      /^(www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/,
      /^linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const extractedUsername = match[2] || match[1];
        return { 
          isValid: true, 
          username: extractedUsername 
        };
      }
    }

    return { 
      isValid: false, 
      error: "Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/your-profile)" 
    };
  };

  /**
   * Normalize LinkedIn URL
   */
  const normalizeLinkedInUrl = (url: string): string => {
    if (!url.trim()) return "";
    
    let normalizedUrl = url.trim();
    
    // Add protocol if missing
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Add www if missing
    if (normalizedUrl.startsWith('https://linkedin.com')) {
      normalizedUrl = normalizedUrl.replace('https://linkedin.com', 'https://www.linkedin.com');
    }
    
    // Remove trailing slash
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    return normalizedUrl;
  };

  /**
   * Handle URL input change with debounced validation
   */
  const handleUrlChange = (url: string) => {
    onDataChange({ ...data, linkedinUrl: url });
    
    // Clear previous states
    setValidationError("");
    setIsValid(false);
    setUsername("");
    
    if (!url.trim()) {
      return; // Empty is valid
    }

    setIsValidating(true);
    
    // Debounced validation
    const timeoutId = setTimeout(() => {
      const validation = validateLinkedInUrl(url);
      
      if (validation.isValid) {
        setIsValid(true);
        setUsername(validation.username || "");
        // Auto-normalize the URL
        const normalizedUrl = normalizeLinkedInUrl(url);
        if (normalizedUrl !== url) {
          onDataChange({ ...data, linkedinUrl: normalizedUrl });
        }
      } else {
        setValidationError(validation.error || "Invalid URL format");
      }
      
      setIsValidating(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="form-container space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0077b5] to-[#005582] rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          Connect Your LinkedIn Profile
        </h2>
        <p className="text-gray-600 text-base max-w-md mx-auto">
          Adding your LinkedIn profile helps others connect with you professionally (optional)
        </p>
      </div>

      {/* LinkedIn URL Input */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-900">
              LinkedIn Profile URL
            </label>
            <div className="relative">
              <Input
                id="linkedin-url"
                type="url"
                value={data.linkedinUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.linkedin.com/in/your-profile"
                className={`text-sm leading-relaxed pr-10 ${
                  validationError 
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                    : isValid 
                    ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                    : "focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
                }`}
                aria-describedby={validationError ? "linkedin-error" : undefined}
                aria-invalid={!!validationError}
              />
              
              {/* Loading/Status Icon */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isValidating && (
                  <div className="w-4 h-4 border-2 border-[#3ec6c6] border-t-transparent rounded-full animate-spin"></div>
                )}
                {!isValidating && isValid && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {!isValidating && validationError && (
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            
            {/* Error Message */}
            {validationError && (
              <p id="linkedin-error" className="text-sm text-red-600" role="alert">
                {validationError}
              </p>
            )}
            
            {/* Success Message with Username */}
            {isValid && username && (
              <p className="text-sm text-green-600">
                ✓ Valid LinkedIn profile: <span className="font-medium">@{username}</span>
              </p>
            )}
          </div>
          
          {/* Help Text */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Accepted formats:
            </p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>https://www.linkedin.com/in/your-profile</li>
              <li>linkedin.com/in/your-profile</li>
              <li>www.linkedin.com/in/your-profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Progress Indicator Component
 */
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center space-x-2 my-6">
      <span className="text-sm font-medium text-gray-600">
        Step {currentStep} of {totalSteps}
      </span>
      <div className="flex space-x-2 ml-4">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`progress-step w-2 h-2 rounded-full transition-all duration-300 ${
              index < currentStep
                ? "bg-[#3ec6c6]"
                : index === currentStep - 1
                ? "bg-[#3ec6c6] scale-110"
                : "bg-gray-300"
            }`}
            aria-label={`Step ${index + 1} ${
              index < currentStep ? "completed" : index === currentStep - 1 ? "current" : "upcoming"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Main Signup Flow Component
 */
export const SignupFlow: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Ref for scrolling to top of form
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  // State for step 3 validation
  const [step3Validation, setStep3Validation] = useState({
    isValidating: false,
    validationError: "",
    isValid: false
  });
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupFlowData>({
    step1: {
      connectWith: [],
      connectDetails: "",
      offerings: ""
    },
    step2: {
      interests: []
    },
    step3: {
      linkedinUrl: ""
    }
  });

  /**
   * Scroll to top when step changes
   */
  useEffect(() => {
    // Scroll to top of form container when step changes
    if (formContainerRef.current) {
      formContainerRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback: scroll to top of page
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    }
  }, [currentStep]);

  /**
   * Handle step 1 data changes
   */
  const handleStep1DataChange = (data: Step1Data) => {
    setSignupData(prev => ({
      ...prev,
      step1: data
    }));
  };

  /**
   * Handle step 3 data changes
   */
  const handleStep3DataChange = (data: Step3Data) => {
    setSignupData(prev => ({
      ...prev,
      step3: data
    }));
  };

  /**
   * Handle step 2 data changes
   */
  const handleStep2DataChange = (data: Step2Data) => {
    setSignupData(prev => ({
      ...prev,
      step2: data
    }));
  };
  /**
   * Validate LinkedIn URL for step 3
   */
  const validateLinkedInUrl = (url: string): { isValid: boolean; error?: string } => {
    if (!url.trim()) {
      return { isValid: true }; // Empty is valid (optional field)
    }

    // Common LinkedIn URL patterns
    const patterns = [
      /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/,
      /^(www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/,
      /^linkedin\.com\/in\/([a-zA-Z0-9\-]+)\/?$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { isValid: true };
      }
    }

    return { 
      isValid: false, 
      error: "Please enter a valid LinkedIn profile URL" 
    };
  };

  /**
   * Handle navigation to next step
   */
  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 3) {
      // Validate LinkedIn URL before completing
      if (signupData.step3.linkedinUrl.trim()) {
        const validation = validateLinkedInUrl(signupData.step3.linkedinUrl);
        if (!validation.isValid) {
          toast({
            title: "Invalid LinkedIn URL",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }
      }
      // Complete signup flow
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Handle navigation to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  /**
   * Handle skipping the signup flow
   */
  const handleSkip = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Skip to home
      navigate("/home");
    }
  };

  /**
   * Handle completing the signup flow
   */
  const handleComplete = () => {
    // TODO: Submit data to backend
    console.log("Signup flow completed:", signupData);
    
    toast({
      title: "Welcome to Meetball!",
      description: "Your profile has been set up successfully.",
    });
    
    navigate("/home");
  };

  /**
   * Handle closing/exiting the flow
   */
  const handleClose = () => {
    navigate("/home");
  };

  /**
   * Get the appropriate button text and state for current step
   */
  const getButtonConfig = () => {
    switch (currentStep) {
      case 1:
        return {
          showBack: false,
          nextText: "Next",
          nextDisabled: false,
          footerNote: "This will not appear on your public profile"
        };
      case 2:
        return {
          showBack: true,
          nextText: "Next",
          nextDisabled: false,
          footerNote: `Selected: ${signupData.step2.interests.length} interest${signupData.step2.interests.length !== 1 ? 's' : ''}`
        };
      case 3:
        return {
          showBack: true,
          nextText: "Complete Setup",
          nextDisabled: step3Validation.isValidating,
          footerNote: "This helps others find and connect with you professionally"
        };
      default:
        return {
          showBack: false,
          nextText: "Next",
          nextDisabled: false,
          footerNote: ""
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <>
      <style>{customStyles}</style>
      <div className="bg-[#f0efeb] min-h-screen">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 signup-header shadow-sm">
          <div className="flex items-center justify-between h-20 px-4 pt-8">
            <div className="w-16" />
            
            <h1 className="text-lg font-semibold text-gray-900">
              Complete Your Profile
            </h1>
            
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm px-4"
              aria-label="Skip signup flow"
            >
              Skip
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="pt-20 px-4 py-6 pb-32">
          <div ref={formContainerRef} className="max-w-2xl mx-auto">
            {/* Progress Indicator */}
            <ProgressIndicator currentStep={currentStep} totalSteps={3} />

            {/* Form Container */}
            <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                {currentStep === 1 && (
                  <Step1
                    data={signupData.step1}
                    onDataChange={handleStep1DataChange}
                    onNext={handleNext}
                    onSkip={handleSkip}
                  />
                )}
                
                {currentStep === 2 && (
                  <Step2
                    data={signupData.step2}
                    onDataChange={handleStep2DataChange}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                
                {currentStep === 3 && (
                  <Step3
                    data={signupData.step3}
                    onDataChange={handleStep3DataChange}
                    onComplete={handleComplete}
                    onBack={handleBack}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fixed Footer with Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            {/* Footer Note */}
            {buttonConfig.footerNote && (
              <p className="text-sm text-gray-500 text-center">
                {buttonConfig.footerNote}
              </p>
            )}
            
            {/* Navigation Buttons */}
            <div className={`flex gap-3 ${buttonConfig.showBack ? '' : 'justify-center'}`}>
              {buttonConfig.showBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 text-base font-semibold rounded-xl"
                  aria-label="Go back to previous step"
                >
                  Back
                </Button>
              )}
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={buttonConfig.nextDisabled}
                className={`next-button h-12 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  buttonConfig.showBack ? 'flex-1' : 'w-full max-w-xs'
                } ${
                  currentStep === 3 
                    ? "bg-[#0077b5] hover:bg-[#005582] text-white" 
                    : "bg-[#FFCA28] hover:bg-[#e6b324] text-black"
                }`}
                aria-label={currentStep === 3 ? "Complete signup" : "Continue to next step"}
              >
                {buttonConfig.nextText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};