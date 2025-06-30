/**
 * Integration example for ProfilePage with new image upload functionality
 * This shows how to integrate the ProfileImageUpload component into the existing ProfilePage
 */

import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { EditIcon } from 'lucide-react';
import { ProfileImageUpload, ProfileImage } from './ProfileImageUpload';
import { ContentImages } from './ImageGallery';

// This is an example of how to modify the ProfilePage component
// Replace the existing avatar section with this enhanced version

interface EnhancedProfileSectionProps {
  profileUser: {
    id: string;
    name: string;
    title?: string;
    company?: string;
    location?: string;
    avatar?: string; // Legacy LinkedIn URL
    verified: boolean;
    connectWith?: string[];
  };
  currentUserId?: string;
  isOwnProfile: boolean;
  onProfileUpdate?: (updates: any) => void;
}

export const EnhancedProfileSection: React.FC<EnhancedProfileSectionProps> = ({
  profileUser,
  currentUserId,
  isOwnProfile,
  onProfileUpdate
}) => {
  const [currentImageId, setCurrentImageId] = useState<string | undefined>(
    // This would come from the API response when we add image_id to user profile
    undefined
  );

  // Handle profile image upload
  const handleImageUpload = (imageId: string) => {
    setCurrentImageId(imageId);
    
    // Update the user profile with the new image ID
    // This would be an API call to update the user's profile_image_id
    onProfileUpdate?.({
      profile_image_id: imageId
    });
  };

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Enhanced avatar with upload capability */}
          <div className="relative">
            <ProfileImageUpload
              userId={profileUser.id}
              currentImageId={currentImageId}
              currentImageUrl={profileUser.avatar} // Legacy LinkedIn URL
              userName={profileUser.name}
              size="lg"
              showEditButton={isOwnProfile}
              onImageUpload={handleImageUpload}
              editable={isOwnProfile}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
              {profileUser.verified && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Verified
                </Badge>
              )}
            </div>

            {profileUser.title && profileUser.company && (
              <p className="text-gray-600 mb-1">
                {profileUser.title} at {profileUser.company}
              </p>
            )}

            {profileUser.location && (
              <p className="text-gray-500 text-sm mb-3">{profileUser.location}</p>
            )}

            {/* Connection Tags Section */}
            {profileUser.connectWith && profileUser.connectWith.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profileUser.connectWith.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Additional content images section for future use */}
        {isOwnProfile && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Profile Images</h3>
            <ContentImages
              contentType="user_profile"
              contentId={profileUser.id}
              maxImages={6}
              columns={3}
              showUploadButton={true}
              onUploadClick={() => {
                // Handle additional image uploads for profile gallery
                console.log('Upload additional profile images');
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Example of how to update the funky profile view as well
 */
export const EnhancedFunkyProfileSection: React.FC<EnhancedProfileSectionProps> = ({
  profileUser,
  currentUserId,
  isOwnProfile,
  onProfileUpdate
}) => {
  const [currentImageId, setCurrentImageId] = useState<string | undefined>(undefined);

  const handleImageUpload = (imageId: string) => {
    setCurrentImageId(imageId);
    onProfileUpdate?.({
      profile_image_id: imageId
    });
  };

  return (
    <Card className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl border-0 text-white">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Enhanced funky avatar */}
          <div className="relative">
            <ProfileImageUpload
              userId={profileUser.id}
              currentImageId={currentImageId}
              currentImageUrl={profileUser.avatar}
              userName={profileUser.name}
              size="xl"
              showEditButton={isOwnProfile}
              onImageUpload={handleImageUpload}
              editable={isOwnProfile}
              className="ring-white shadow-lg" // White ring for funky theme
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{profileUser.name}</h1>
              {profileUser.verified && (
                <Badge className="bg-white/20 text-white border-white/30">
                  ✨ Verified
                </Badge>
              )}
            </div>

            {profileUser.title && profileUser.company && (
              <p className="text-white/90 mb-1">
                {profileUser.title} at {profileUser.company}
              </p>
            )}

            {profileUser.location && (
              <p className="text-white/70 text-sm mb-3">{profileUser.location}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Simple avatar replacement for other parts of the app
 * Use this in places where you just need to display the user avatar
 */
export const UserProfileAvatar: React.FC<{
  userId: string;
  userName: string;
  imageId?: string;
  imageUrl?: string; // Legacy URL
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}> = ({ userId, userName, imageId, imageUrl, size = 'md', className, onClick }) => {
  return (
    <ProfileImage
      userId={userId}
      imageId={imageId}
      imageUrl={imageUrl}
      userName={userName}
      size={size}
      className={className}
      onClick={onClick}
    />
  );
};

/**
 * Example of integration instructions:
 * 
 * 1. In ProfilePage.tsx, replace the existing avatar section (around line 772) with:
 * 
 * ```tsx
 * <EnhancedProfileSection
 *   profileUser={profileUser}
 *   currentUserId={user?.id}
 *   isOwnProfile={user?.id === profileUser.id}
 *   onProfileUpdate={(updates) => {
 *     // API call to update user profile
 *     updateUserProfile(profileUser.id, updates);
 *   }}
 * />
 * ```
 * 
 * 2. In the funky profile view (around line 1001), replace with:
 * 
 * ```tsx
 * <EnhancedFunkyProfileSection
 *   profileUser={profileUser}
 *   currentUserId={user?.id}
 *   isOwnProfile={user?.id === profileUser.id}
 *   onProfileUpdate={(updates) => {
 *     updateUserProfile(profileUser.id, updates);
 *   }}
 * />
 * ```
 * 
 * 3. Throughout the app, replace Avatar components with UserProfileAvatar:
 * 
 * ```tsx
 * // Old way:
 * <Avatar className="w-8 h-8">
 *   <AvatarImage src={user.avatar} alt={user.name} />
 *   <AvatarFallback>{user.name[0]}</AvatarFallback>
 * </Avatar>
 * 
 * // New way:
 * <UserProfileAvatar
 *   userId={user.id}
 *   userName={user.name}
 *   imageId={user.profile_image_id}
 *   imageUrl={user.avatar} // Keep for backward compatibility
 *   size="sm"
 * />
 * ```
 * 
 * 4. Update the user profile API to include profile_image_id field
 * 5. Update the user update API to handle profile_image_id updates
 */