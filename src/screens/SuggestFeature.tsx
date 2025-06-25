import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon,
  SendIcon, 
  MicIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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
    box-shadow: 0 4px 12px rgba(255, 179, 0, 0.3);
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

        {/* Content */}
        <div className="flex-1 pt-20 px-4 py-6">
          {/* Welcome Message Card */}
          <Card className="mb-6 bg-white rounded-2xl border-none shadow-sm">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  Meetball is built by people like you.
                </h2>
                <h3 className="text-lg font-semibold text-gray-900">
                  If you've got an idea, let us know :)
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your idea and suggestion will be shared with our team internally only.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Example Suggestions */}
          <div className="space-y-3 mb-6">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-blue-900 font-medium text-sm mb-1">PavitraST</p>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      I would like to be able to check-in to the conference using this app, directly when at the event. Not sure how you can do this but will be very helpful
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <p className="text-green-800 text-sm leading-relaxed">
                  Thank you so much! If you have any more ideas, feel free to share them with us here!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Message Input Section */}
        <div className="p-4 bg-[#f0efeb] border-t border-gray-200">
          <div className="flex items-end gap-3">
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder="Share your idea"
                className="message-input w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent resize-none bg-white"
                style={{ 
                  minHeight: "52px",
                  maxHeight: "120px"
                }}
                disabled={isSubmitting}
              />
            </div>
            
            {/* Voice Recording Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceRecording}
              className={`voice-button w-12 h-12 rounded-full p-0 ${
                isRecording 
                  ? "bg-red-100 text-red-600 hover:bg-red-200" 
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              disabled={isSubmitting}
            >
              <MicIcon className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSubmitting}
              className="send-button px-6 py-3 h-12 bg-[#ffb300] hover:bg-[#ffd580] text-black rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <SendIcon className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          
          {/* Recording Status */}
          {isRecording && (
            <div className="mt-3 flex items-center justify-center">
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