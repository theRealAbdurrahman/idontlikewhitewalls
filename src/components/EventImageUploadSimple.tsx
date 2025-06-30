/**
 * Simple Event Image Upload Component
 * For uploading and managing event images
 */

import React, { useState } from 'react';
import { ImageIcon, Upload, Trash2, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { SimpleImageUpload } from './SimpleImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export interface EventImageUploadSimpleProps {
  eventId: string;
  currentImageUrl?: string;
  onImageUpdate?: (newImageUrl: string) => void;
  onImageRemove?: () => void;
  disabled?: boolean;
  showRemoveOption?: boolean;
  className?: string;
}

export const EventImageUploadSimple: React.FC<EventImageUploadSimpleProps> = ({
  eventId,
  currentImageUrl,
  onImageUpdate,
  onImageRemove,
  disabled = false,
  showRemoveOption = true,
  className = '',
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  // Handle successful upload
  const handleUploadSuccess = async (imageUrl: string) => {
    try {
      // Call the callback to update the UI immediately
      onImageUpdate?.(imageUrl);
      
      setIsUploadOpen(false);
      
      toast({
        title: 'Event image updated',
        description: 'The event image has been updated successfully.',
      });
      
      // TODO: Here you would call the backend API to update the event
      // Example: await updateEvent(eventId, { image_url: imageUrl })
      
    } catch (error) {
      toast({
        title: 'Failed to update event',
        description: 'The image was uploaded but failed to update the event.',
        variant: 'destructive',
      });
    }
  };

  // Handle upload error
  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload failed',
      description: error,
      variant: 'destructive',
    });
  };

  // Handle remove image
  const handleRemoveImage = () => {
    onImageRemove?.();
    
    toast({
      title: 'Event image removed',
      description: 'The event image has been removed.',
    });
    
    // TODO: Here you would call the backend API to clear the image URL
    // Example: await updateEvent(eventId, { image_url: "" })
  };

  return (
    <div className={className}>
      {currentImageUrl ? (
        // Show current image with edit/remove options
        <Card className="relative group overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={currentImageUrl}
                alt="Event"
                className="w-full h-48 object-cover"
              />
              
              {/* Overlay with action buttons */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white bg-opacity-90 hover:bg-opacity-100"
                      disabled={disabled}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                {showRemoveOption && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveImage}
                    disabled={disabled}
                    className="bg-red-600 bg-opacity-90 hover:bg-opacity-100"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show upload placeholder
        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Add Event Image
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload an image to make your event more attractive
              </p>
              
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button disabled={disabled}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentImageUrl ? 'Change Event Image' : 'Add Event Image'}
            </DialogTitle>
            <DialogDescription>
              Upload an image for your event. This will help attract more participants.
            </DialogDescription>
          </DialogHeader>
          
          <SimpleImageUpload
            contentType="event"
            contentId={eventId}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            disabled={disabled}
          />
          
          {/* Remove option for existing image */}
          {showRemoveOption && currentImageUrl && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={disabled}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Current Image
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};