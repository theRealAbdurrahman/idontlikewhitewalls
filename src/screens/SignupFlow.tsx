import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, PlusIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
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
 * Interface for the complete signup flow data
 */
interface SignupFlowData {
  step1: Step1Data;
  // Future steps can be added here
  step2?: any;
  step3?: any;
}

/**
 * Pre-defined connection preference labels
 */
const CONNECTION_LABELS = [
  "Coaching",
  "Finance", 
  "Career Upgrade",
  "Mental Health"
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
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
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
        
        {/* Pre-defined Labels */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
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
          </div>
          
          {/* Add Custom Label */}
          {isAddingCustom ? (
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
                className="bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white px-3"
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
          ) : (
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
        
        {/* Details Textarea */}
        <div className="space-y-2">
          <Textarea
            value={data.connectDetails}
            onChange={(e) => onDataChange({ ...data, connectDetails: e.target.value })}
            placeholder="Add details or tags"
            className="min-h-[100px] resize-none text-sm leading-relaxed focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
            maxLength={500}
            aria-label="Additional details for connection preferences"
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">
              {data.connectDetails.length}/500
            </span>
          </div>
        </div>
      </div>

      {/* Question 2: What can you offer? */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 leading-tight">
          What unique insights, expertise, connections or resources can you offer to support others?
        </h2>
        
        <div className="space-y-2">
          <Textarea
            value={data.offerings}
            onChange={(e) => onDataChange({ ...data, offerings: e.target.value })}
            placeholder="Add details or tags"
            className="min-h-[100px] resize-none text-sm leading-relaxed focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
            maxLength={500}
            aria-label="What you can offer to support others"
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-500">
              {data.offerings.length}/500
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-4 pt-4">
        <p className="text-sm text-gray-500 text-center">
          This will not appear on your public profile
        </p>
        
        <Button
          type="submit"
          onClick={handleSubmit}
          className="next-button w-full h-12 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white text-base font-semibold rounded-xl"
          aria-label="Continue to next step"
        >
          Next
        </Button>
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
    <div className="flex items-center justify-center space-x-2 mb-6">
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
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupFlowData>({
    step1: {
      connectWith: [],
      connectDetails: "",
      offerings: ""
    }
  });

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
   * Handle navigation to next step
   */
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      toast({
        title: "Progress saved",
        description: "Your information has been saved.",
      });
    } else {
      // Complete signup flow
      handleComplete();
    }
  };

  /**
   * Handle skipping the signup flow
   */
  const handleSkip = () => {
    toast({
      title: "Signup skipped",
      description: "You can complete this later in your profile settings.",
    });
    navigate("/home");
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
        <div className="pt-20 px-4 py-6">
          <div className="max-w-2xl mx-auto">
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
                  <div className="form-container text-center py-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Step 2 Coming Soon
                    </h2>
                    <p className="text-gray-600 mb-6">
                      This step is under development.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                
                {currentStep === 3 && (
                  <div className="form-container text-center py-12">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Step 3 Coming Soon
                    </h2>
                    <p className="text-gray-600 mb-6">
                      This step is under development.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleComplete}
                        className="flex-1 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white"
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};