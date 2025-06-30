/**
 * Simple integration example for ProfilePage with new image upload
 * Shows how to integrate ProfileImageUploadSimple with existing profile logic
 */

import React from 'react';
import { ProfileImageUploadSimple } from './ProfileImageUploadSimple';

export interface ProfilePageImageIntegrationProps {
  userId: string;
  currentLinkedInImage?: string;
  currentUploadedImage?: string;
  userName: string;
  onImageUpdate?: (imageUrl: string) => void;
  onImageRemove?: () => void;
  isOwnProfile?: boolean;
}

/**
 * This component shows how to integrate the simple image upload
 * with the existing ProfilePage logic
 */
export const ProfilePageImageIntegrationSimple: React.FC<ProfilePageImageIntegrationProps> = ({
  userId,
  currentLinkedInImage,
  currentUploadedImage,
  userName,
  onImageUpdate,
  onImageRemove,
  isOwnProfile = false,
}) => {
  
  // Determine which image to display (prioritize uploaded over LinkedIn)
  const displayImage = currentUploadedImage || currentLinkedInImage;
  
  // Get fallback text (first letter of name)
  const fallbackText = userName.charAt(0).toUpperCase();

  // Handle image upload success
  const handleImageUpdate = async (newImageUrl: string) => {
    // Call parent callback
    onImageUpdate?.(newImageUrl);
    
    // TODO: Call backend API to update user profile
    // Example implementation:
    /*
    try {
      await updateUserProfile(userId, {
        uploaded_profile_image_url: newImageUrl
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Handle error appropriately
    }
    */
  };

  // Handle image removal
  const handleImageRemove = async () => {
    // Call parent callback
    onImageRemove?.(");
    
    // TODO: Call backend API to clear uploaded image
    // Example implementation:
    /*
    try {
      await updateUserProfile(userId, {
        uploaded_profile_image_url: null
      });
    } catch (error) {
      console.error('Failed to remove image:', error);
      // Handle error appropriately
    }
    */
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Profile Image with Upload */}
      <ProfileImageUploadSimple
        userId={userId}
        currentImageUrl={displayImage}
        fallbackText={fallbackText}
        onImageUpdate={handleImageUpdate}
        onImageRemove={handleImageRemove}
        size="lg"
        disabled={!isOwnProfile}
        showRemoveOption={!!currentUploadedImage} // Only show remove if there's an uploaded image
      />
      
      {/* Profile Info */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">{userName}</h1>
        
        {/* Image Source Indicator */}
        <div className="text-sm text-gray-500 mt-1">
          {currentUploadedImage ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Custom profile image
            </span>
          ) : currentLinkedInImage ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              LinkedIn profile image
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Default avatar
            </span>
          )}
        </div>

        {/* Upload Hint for Own Profile */}
        {isOwnProfile && !currentUploadedImage && (
          <p className="text-xs text-gray-400 mt-2">
            {currentLinkedInImage 
              ? "Hover over your avatar to upload a custom image"
              : "Click to upload a profile image"
            }
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Example of how to use this in ProfilePage.tsx:
 * 
 * Replace the existing avatar section (around line 770-785) with:
 * 
 * <ProfilePageImageIntegrationSimple
 *   userId={profileUser.id}
 *   currentLinkedInImage={profileUser.profile_picture}
 *   currentUploadedImage={profileUser.uploaded_profile_image_url}
 *   userName={profileUser.name}
 *   onImageUpdate={(url) => {
 *     // Update local state
 *     setProfileUser(prev => prev ? { ...prev, uploaded_profile_image_url: url } : null);
 *     // Optionally refresh profile data
 *     refetchProfile();
 *   }}
 *   onImageRemove={() => {
 *     // Clear local state
 *     setProfileUser(prev => prev ? { ...prev, uploaded_profile_image_url: undefined } : null);
 *     // Optionally refresh profile data
 *     refetchProfile();
 *   }}
 *   isOwnProfile={isOwnProfile}
 * />
 */