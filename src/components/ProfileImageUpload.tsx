/**
 * Profile image upload component specifically for user avatars
 * Integrated with the ProfilePage and designed for profile picture updates
 */

import React, { useState } from 'react';
import { EditIcon, CameraIcon, UploadIcon, UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ImageUpload } from './ImageUpload';
import { UserAvatar } from './ImageDisplay';
import { useImageManager } from '../hooks/useImageManager';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

interface ProfileImageUploadProps {
  userId: string;
  currentImageId?: string;
  currentImageUrl?: string; // Legacy URL from LinkedIn etc.
  userName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showEditButton?: boolean;
  onImageUpload?: (imageId: string) => void;
  editable?: boolean;
}

const sizeMap = {
  sm: { avatar: 'w-12 h-12', button: 'w-6 h-6', icon: 'w-3 h-3' },
  md: { avatar: 'w-16 h-16', button: 'w-8 h-8', icon: 'w-4 h-4' },
  lg: { avatar: 'w-20 h-20', button: 'w-8 h-8', icon: 'w-4 h-4' },
  xl: { avatar: 'w-24 h-24', button: 'w-10 h-10', icon: 'w-5 h-5' }
};

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  userId,
  currentImageId,
  currentImageUrl,
  userName,
  size = 'lg',
  className,
  showEditButton = true,
  onImageUpload,
  editable = true
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { invalidateContent } = useImageManager();
  const { toast } = useToast();

  const sizes = sizeMap[size];

  // Handle successful upload
  const handleUploadSuccess = (image: any) => {
    setUploadDialogOpen(false);
    onImageUpload?.(image.id);
    
    // Invalidate cache for user profile images
    invalidateContent('user_profile', userId);
    
    toast({
      title: "Profile picture updated",
      description: "Your profile picture has been successfully updated.",
    });
  };

  // Handle upload error
  const handleUploadError = (error: Error) => {
    toast({
      title: "Upload failed",
      description: error.message,
      variant: "destructive",
    });
  };

  // Avatar display component
  const AvatarDisplay = () => {
    if (currentImageId) {
      // Use new image system
      return (
        <UserAvatar
          userId={userId}
          imageId={currentImageId}
          name={userName}
          size={size}
          className={className}
        />
      );
    } else if (currentImageUrl) {
      // Use legacy URL (LinkedIn, etc.)
      return (
        <Avatar className={cn(sizes.avatar, "ring-4 ring-gray-100", className)}>
          <AvatarImage src={currentImageUrl} alt={userName} />
          <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-100 to-gray-200">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    } else {
      // Default fallback
      return (
        <Avatar className={cn(sizes.avatar, "ring-4 ring-gray-100", className)}>
          <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-100 to-gray-200">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    }
  };

  return (
    <div className="relative">
      <AvatarDisplay />
      
      {showEditButton && editable && (
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "absolute -bottom-2 -right-2 rounded-full bg-white border-2 border-gray-200 hover:bg-gray-50",
                sizes.button
              )}
            >
              <EditIcon className={sizes.icon} />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Profile Picture</DialogTitle>
              <DialogDescription>
                Upload a new profile picture. The image will be automatically resized and optimized.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current image preview */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <AvatarDisplay />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <CameraIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Upload component */}
              <ImageUpload
                contentType="user_profile"
                contentId={userId}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                maxFileSize={5 * 1024 * 1024} // 5MB for profile pictures
                showPreview={true}
                showAltText={false} // Not needed for profile pictures
                className="border-2 border-dashed border-gray-200 rounded-lg"
              />
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Recommended size: 400x400 pixels or larger</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Supported formats: JPG, PNG, WebP</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

/**
 * Simple profile image component for read-only contexts
 */
export const ProfileImage: React.FC<{
  userId: string;
  imageId?: string;
  imageUrl?: string;
  userName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}> = ({ 
  userId, 
  imageId, 
  imageUrl, 
  userName, 
  size = 'md', 
  className,
  onClick 
}) => {
  const sizes = sizeMap[size];

  if (imageId) {
    return (
      <UserAvatar
        userId={userId}
        imageId={imageId}
        name={userName}
        size={size}
        className={className}
        onClick={onClick}
      />
    );
  } else if (imageUrl) {
    return (
      <Avatar 
        className={cn(sizes.avatar, "ring-2 ring-gray-100", className)}
        onClick={onClick}
      >
        <AvatarImage src={imageUrl} alt={userName} />
        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  } else {
    return (
      <Avatar 
        className={cn(sizes.avatar, "ring-2 ring-gray-100", className)}
        onClick={onClick}
      >
        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  }
};

/**
 * Compact profile image upload for smaller contexts
 */
export const CompactProfileImageUpload: React.FC<{
  userId: string;
  currentImageId?: string;
  currentImageUrl?: string;
  userName: string;
  onImageUpload?: (imageId: string) => void;
  className?: string;
}> = ({ 
  userId, 
  currentImageId, 
  currentImageUrl, 
  userName, 
  onImageUpload,
  className 
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleUploadSuccess = (image: any) => {
    setUploadDialogOpen(false);
    onImageUpload?.(image.id);
    
    toast({
      title: "Profile picture updated",
      description: "Your profile picture has been successfully updated.",
    });
  };

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <UploadIcon className="w-4 h-4" />
          Change Picture
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>
        
        <ImageUpload
          contentType="user_profile"
          contentId={userId}
          onUploadSuccess={handleUploadSuccess}
          maxFileSize={5 * 1024 * 1024}
          showPreview={true}
          showAltText={false}
        />
      </DialogContent>
    </Dialog>
  );
};