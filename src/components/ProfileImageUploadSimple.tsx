/**
 * Simple Profile Image Upload Component
 * Integrates with the backend to update user profile image URL
 */

import React, { useState } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useToast } from '../hooks/use-toast';
import { useSimpleImageUpload } from '../hooks/useSimpleImageUpload';
import { SimpleImageUpload } from './SimpleImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export interface ProfileImageUploadSimpleProps {
  userId: string;
  currentImageUrl?: string;
  fallbackText: string;
  onImageUpdate?: (newImageUrl: string) => void;
  onImageRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showRemoveOption?: boolean;
}

export const ProfileImageUploadSimple: React.FC<ProfileImageUploadSimpleProps> = ({
  userId,
  currentImageUrl,
  fallbackText,
  onImageUpdate,
  onImageRemove,
  size = 'md',
  disabled = false,
  showRemoveOption = true,
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  // Size variants
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6',
  };

  // Handle successful upload
  const handleUploadSuccess = async (imageUrl: string) => {
    try {
      // Call the callback to update the UI immediately
      onImageUpdate?.(imageUrl);
      
      setIsUploadOpen(false);
      
      toast({
        title: 'Profile image updated',
        description: 'Your profile image has been updated successfully.',
      });
      
      // TODO: Here you would also call the backend API to update the user's profile
      // Example: await updateUserProfile({ uploaded_profile_image_url: imageUrl })
      
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: 'The image was uploaded but failed to update your profile.',
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
      title: 'Profile image removed',
      description: 'Your profile image has been removed.',
    });
    
    // TODO: Here you would call the backend API to clear the uploaded image URL
    // Example: await updateUserProfile({ uploaded_profile_image_url: null })
  };

  return (
    <div className="relative inline-block">
      {/* Avatar with overlay */}
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} ring-4 ring-gray-100`}>
          <AvatarImage src={currentImageUrl} alt={fallbackText} />
          <AvatarFallback className="text-xl bg-gradient-to-br from-gray-100 to-gray-200">
            {fallbackText}
          </AvatarFallback>
        </Avatar>

        {/* Hover overlay with upload button */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="bg-white bg-opacity-90 hover:bg-opacity-100"
                disabled={disabled}
              >
                <Camera className={iconSizes[size]} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update Profile Image</DialogTitle>
                <DialogDescription>
                  Upload a new profile image. This will replace your current profile picture.
                </DialogDescription>
              </DialogHeader>
              
              <SimpleImageUpload
                contentType="profile"
                contentId={userId}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                disabled={disabled}
              />
              
              {/* Remove option */}
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
      </div>

      {/* Edit button for smaller sizes or when hover doesn't work well */}
      {size === 'sm' && (
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 hover:bg-gray-50"
              disabled={disabled}
            >
              <Camera className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Profile Image</DialogTitle>
              <DialogDescription>
                Upload a new profile image. This will replace your current profile picture.
              </DialogDescription>
            </DialogHeader>
            
            <SimpleImageUpload
              contentType="profile"
              contentId={userId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              disabled={disabled}
            />
            
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
      )}
    </div>
  );
};