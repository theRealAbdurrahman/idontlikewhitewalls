/**
 * Simple integration example for CreateEvent with new image upload
 * Shows how to integrate EventImageUploadSimple with the existing CreateEvent logic
 */

import React from 'react';
import { EventImageUploadSimple } from './EventImageUploadSimple';
import { generateBestGeometricImage } from '../utils/geometricImageGenerator';

export interface CreateEventImageIntegrationProps {
  eventId?: string; // Optional for new events
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string) => void;
  onImageGenerate?: () => void;
}

/**
 * This component shows how to integrate the simple image upload
 * with the CreateEvent page logic, including the geometric image generator
 */
export const CreateEventImageIntegrationSimple: React.FC<CreateEventImageIntegrationProps> = ({
  eventId,
  currentImageUrl,
  onImageUpdate,
  onImageGenerate,
}) => {
  
  // Handle image upload
  const handleImageUpdate = (newImageUrl: string) => {
    // Update the form field with the new image URL
    onImageUpdate(newImageUrl);
  };

  // Handle image removal
  const handleImageRemove = () => {
    // Clear the image URL in the form
    onImageUpdate('');
  };

  // Generate geometric image
  const handleGenerateImage = async () => {
    try {
      // Generate a new geometric image
      const generatedImageUrl = await generateBestGeometricImage();
      onImageUpdate(generatedImageUrl);
      onImageGenerate?.();
    } catch (error) {
      console.error('Failed to generate image:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image Upload Component */}
      <EventImageUploadSimple
        eventId={eventId || 'new-event'} // Use temporary ID for new events
        currentImageUrl={currentImageUrl}
        onImageUpdate={handleImageUpdate}
        onImageRemove={handleImageRemove}
        disabled={false}
        showRemoveOption={true}
        className="w-full"
      />

      {/* Alternative: Generate Geometric Image */}
      {!currentImageUrl && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">or</p>
          <button
            type="button"
            onClick={handleGenerateImage}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Generate a unique geometric pattern
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Integration Guide for CreateEvent.tsx:
 * 
 * 1. Import the component:
 *    import { CreateEventImageIntegrationSimple } from '../components/CreateEventImageIntegrationSimple';
 * 
 * 2. Replace the existing image section (around lines 350-430) with:
 * 
 * <FormField
 *   control={form.control}
 *   name="bannerImage"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>Event Banner Image</FormLabel>
 *       <FormControl>
 *         <CreateEventImageIntegrationSimple
 *           currentImageUrl={field.value}
 *           onImageUpdate={(url) => {
 *             field.onChange(url);
 *             // Optional: Show success message
 *           }}
 *         />
 *       </FormControl>
 *       <FormDescription>
 *         Upload an image to make your event more attractive
 *       </FormDescription>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 * 
 * 3. The form submission will automatically include the image_url from the bannerImage field
 * 
 * 4. For editing existing events, pass the eventId:
 *    <CreateEventImageIntegrationSimple
 *      eventId={existingEvent.id}
 *      currentImageUrl={existingEvent.image_url}
 *      ...
 *    />
 */