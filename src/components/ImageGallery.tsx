/**
 * Image gallery component with bulk presigned URL fetching
 * Optimized for displaying multiple images efficiently
 */

import React, { useState, useMemo } from 'react';
import { ImageIcon, AlertCircleIcon, ZoomInIcon, XIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent } from './ui/dialog';
import { Badge } from './ui/badge';
import { ImageDisplay } from './ImageDisplay';
import { 
  useBulkPresignedUrls, 
  useContentImages 
} from '../hooks/useImageManager';
import { cn } from '../lib/utils';

interface ImageGalleryProps {
  contentType: 'user_profile' | 'question' | 'answer' | 'event';
  contentIds: string[];
  className?: string;
  imageClassName?: string;
  columns?: number;
  maxImagesPerContent?: number;
  showImageCount?: boolean;
  showAltText?: boolean;
  aspectRatio?: string;
  onImageClick?: (imageId: string, imageData: any) => void;
  showLightbox?: boolean;
}

interface ImageData {
  id: string;
  content_id: string;
  alt_text?: string;
  original_filename: string;
  content_type: string;
  file_size: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  contentType,
  contentIds,
  className,
  imageClassName,
  columns = 3,
  maxImagesPerContent = 5,
  showImageCount = false,
  showAltText = false,
  aspectRatio = '1/1',
  onImageClick,
  showLightbox = true
}) => {
  const [lightboxImage, setLightboxImage] = useState<{
    imageId: string;
    alt?: string;
  } | null>(null);

  // Fetch bulk presigned URLs for efficient loading
  const {
    data: presignedData,
    isLoading: presignedLoading,
    error: presignedError
  } = useBulkPresignedUrls(contentType, contentIds, {
    expiresIn: 3600,
    enabled: contentIds.length > 0
  });

  // Process and organize images by content
  const organizedImages = useMemo(() => {
    if (!presignedData?.urls) return {};

    const organized: Record<string, any[]> = {};
    
    presignedData.urls.forEach((urlData) => {
      // Group by content_id (this would need to be included in the API response)
      // For now, we'll organize by the image_id
      const contentId = urlData.image_id; // This should be content_id from the API
      
      if (!organized[contentId]) {
        organized[contentId] = [];
      }
      
      if (organized[contentId].length < maxImagesPerContent) {
        organized[contentId].push({
          id: urlData.image_id,
          presigned_url: urlData.presigned_url,
          expires_at: urlData.expires_at,
          cache_version: urlData.cache_version
        });
      }
    });

    return organized;
  }, [presignedData, maxImagesPerContent]);

  // Handle image click
  const handleImageClick = (imageId: string, imageData: any) => {
    if (onImageClick) {
      onImageClick(imageId, imageData);
    } else if (showLightbox) {
      setLightboxImage({
        imageId,
        alt: imageData.alt_text || imageData.original_filename
      });
    }
  };

  // Calculate grid columns CSS
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '0.5rem'
  };

  // Show loading state
  if (presignedLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm">Loading images...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (presignedError) {
    return (
      <Card className={cn("border-destructive/20", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-5 w-5" />
              <span className="text-sm">Failed to load images</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (!presignedData?.urls || presignedData.urls.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">No images available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalImages = presignedData.urls.length;
  const failedCount = presignedData.failed_image_ids?.length || 0;

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Header with image count */}
        {showImageCount && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {totalImages} image{totalImages !== 1 ? 's' : ''}
            </Badge>
            {failedCount > 0 && (
              <Badge variant="destructive">
                {failedCount} failed to load
              </Badge>
            )}
          </div>
        )}

        {/* Images grid */}
        <div style={gridStyle}>
          {presignedData.urls.map((urlData, index) => (
            <div
              key={urlData.image_id}
              className="relative group"
              style={{ aspectRatio }}
            >
              <ImageDisplay
                imageId={urlData.image_id}
                className={cn("w-full h-full", imageClassName)}
                contentType={contentType}
                objectFit="cover"
                onClick={() => handleImageClick(urlData.image_id, urlData)}
                showLoadingState={true}
                showErrorState={true}
              />
              
              {/* Hover overlay */}
              {showLightbox && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleImageClick(urlData.image_id, urlData)}
                  >
                    <ZoomInIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Alt text overlay */}
              {showAltText && urlData.alt_text && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {urlData.alt_text}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Failed images notice */}
        {failedCount > 0 && (
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircleIcon className="h-4 w-4" />
                <span>
                  {failedCount} image{failedCount !== 1 ? 's' : ''} failed to load
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lightbox modal */}
      {lightboxImage && (
        <Dialog 
          open={!!lightboxImage} 
          onOpenChange={() => setLightboxImage(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 z-10 h-8 w-8"
                onClick={() => setLightboxImage(null)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              
              <ImageDisplay
                imageId={lightboxImage.imageId}
                alt={lightboxImage.alt}
                className="w-full h-auto max-h-[85vh]"
                objectFit="contain"
                showLoadingState={true}
                showErrorState={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

/**
 * Simple image grid for common use cases
 */
export const SimpleImageGrid: React.FC<{
  imageIds: string[];
  columns?: number;
  aspectRatio?: string;
  className?: string;
  onImageClick?: (imageId: string) => void;
}> = ({ 
  imageIds, 
  columns = 3, 
  aspectRatio = '1/1', 
  className,
  onImageClick 
}) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '0.5rem'
  };

  return (
    <div className={cn("", className)} style={gridStyle}>
      {imageIds.map((imageId) => (
        <div key={imageId} style={{ aspectRatio }}>
          <ImageDisplay
            imageId={imageId}
            className="w-full h-full"
            objectFit="cover"
            onClick={() => onImageClick?.(imageId)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Content images component for showing images associated with specific content
 */
export const ContentImages: React.FC<{
  contentType: 'user_profile' | 'question' | 'answer' | 'event';
  contentId: string;
  maxImages?: number;
  columns?: number;
  className?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}> = ({ 
  contentType, 
  contentId, 
  maxImages = 4, 
  columns = 2, 
  className,
  showUploadButton = false,
  onUploadClick 
}) => {
  const { data: images, isLoading, error } = useContentImages(
    contentType, 
    contentId, 
    { enabled: !!contentId }
  );

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span className="text-sm">Loading images...</span>
        </div>
      </div>
    );
  }

  if (error || !images) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircleIcon className="h-4 w-4" />
          <span className="text-sm">No images found</span>
        </div>
      </div>
    );
  }

  const displayImages = images.slice(0, maxImages);
  const hasMore = images.length > maxImages;

  return (
    <div className={cn("", className)}>
      <SimpleImageGrid
        imageIds={displayImages.map((img: any) => img.id)}
        columns={columns}
        aspectRatio="4/3"
      />
      
      {hasMore && (
        <div className="mt-2 text-center">
          <Badge variant="secondary">
            +{images.length - maxImages} more
          </Badge>
        </div>
      )}
      
      {showUploadButton && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={onUploadClick}
        >
          Add Image
        </Button>
      )}
    </div>
  );
};