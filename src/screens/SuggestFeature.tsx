import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon,
  MicIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";

/**
 * Custom styles for the suggest feature interface
 */
const customStyles = `
  .suggest-feature-header {
    backdrop-filter: blur(20px);
    background: rgba(240, 239, 235, 0.95);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  
  .message-input {
    transition: all 0.2s ease-out;
  }
  
  .message-input:focus {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  
  .voice-button {
    transition: all 0.2s ease-out;
  }
  
  .voice-button:hover {
    transform: scale(1.05);
  }
  
  .voice-button:active {
    transform: scale(0.95);
  }
  
  .send-button {
    transition: all 0.2s ease-out;
  }
  
  .send-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
  }
  
  .chat-input-container {
    background: rgba(240, 239, 235, 0.95);
    backdrop-filter: blur(20px);
  }
`;

/**
 * SuggestFeature screen component for users to submit feature requests
 */
export const SuggestFeature: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Local state
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * Handle message submission
   */
  const handleSendMessage = async () => {
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call to submit feature request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Feature suggestion submitted:", {
        message: message.trim(),
        timestamp: new Date().toISOString(),
        userId: "user-123", // Would come from auth context
      });
      
      toast({
        title: "Thank you for your suggestion!",
        description: "Your idea has been shared with our team internally.",
      });
      
      // Clear the message and navigate back
      setMessage("");
      setTimeout(() => {
        navigate(-1);
      }, 1500);
      
    } catch (error) {
      console.error("Failed to submit feature suggestion:", error);
      toast({
        title: "Failed to send suggestion",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle voice recording toggle
   */
  const handleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      toast({
        title: "Voice recording stopped",
        description: "Voice-to-text feature coming soon!",
      });
    } else {
      // Start recording
      setIsRecording(true);
      toast({
        title: "Voice recording started",
        description: "Voice-to-text feature coming soon!",
      });
      
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        setIsRecording(false);
      }, 5000);
    }
  };

  /**
   * Handle key press for sending message
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Auto-resize textarea based on content
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <div className="bg-[#f0efeb] min-h-screen flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 suggest-feature-header shadow-sm">
          <div className="flex items-center justify-between h-20 px-4 pt-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="w-10 h-10 rounded-full hover:bg-gray-100/80 transition-all duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </Button>
            
            <h1 className="text-lg font-semibold text-gray-900">
              Request a feature
            </h1>
            
            <div className="w-10" />
          </div>
        </header>

        {/* Chat Content - Default Empty State */}
        <div className="flex-1 pt-20 px-4 py-6 flex flex-col justify-center">
          {/* Welcome Message - Left Aligned */}
          <div className="w-full" style={{ marginBottom: '8px' }}>
            <div className="bg-white rounded-3xl p-6 shadow-sm" style={{ maxWidth: 'calc(90% - 20px)' }}>
              <h2 
                className="mb-3 leading-tight"
                style={{ 
                  fontSize: '14px', 
                  color: '#000000',
                  fontWeight: '600'
                }}
              >
                Meetball is built by people like you. If you've got an idea, let us know :)
              </h2>
              <p 
                className="leading-relaxed"
                style={{ 
                  fontSize: '12px', 
                  color: '#000000'
                }}
              >
                Your idea and suggestion will be shared with our team internally only.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Input Section - Fixed at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 chat-input-container" style={{ paddingBottom: '50px', paddingTop: '16px', paddingLeft: '20px', paddingRight: '20px' }}>
          <div className="flex flex-col gap-2">
            {/* Text Input */}
            <div className="w-full relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder="Share your idea"
                className="message-input w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                style={{ 
                  minHeight: "38px",
                  maxHeight: "120px",
                  fontSize: message.trim() ? '12px' : '12px',
                  color: message.trim() ? '#000000' : '#8F8F8F',
                  borderRadius: '10px'
                }}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Voice Recording and Send Buttons */}
            <div className="flex items-center justify-between">
              {/* Voice Recording Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceRecording}
                className={`voice-button w-10 h-10 rounded-full p-0 ${
                  isRecording 
                    ? "bg-red-100 text-red-600 hover:bg-red-200" 
                    : "text-black hover:bg-gray-100 hover:text-black"
                }`}
                disabled={isSubmitting}
              >
                <MicIcon className={`w-8 h-8 ${isRecording ? "animate-pulse" : ""}`} />
              </Button>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSubmitting}
                className="send-button px-6 py-3 h-12 text-white rounded-3xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FFCA28' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
          
          {/* Recording Status */}
          {isRecording && (
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-full text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Recording... (Voice-to-text coming soon!)
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};