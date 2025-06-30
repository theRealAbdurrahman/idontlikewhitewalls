/**
 * Smart image display component with presigned URL management and caching
 * Integrated with Cloudflare R2 and shadcn/ui components
 */

import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { usePresignedUrl, useImageManager } from '../hooks/useImageManager';
import { ImageCache, ImageUrlUtils } from '../utils/imageService';
import { cn } from '../lib/utils';

interface ImageDisplayProps {
  imageId: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  fallbackSrc?: string;
  contentType?: 'user_profile' | 'question' | 'answer' | 'event';
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  aspectRatio?: string;
  showLoadingState?: boolean;
  showErrorState?: boolean;
  onError?: (error: Error) => void;
  onLoad?: () => void;
  onClick?: () => void;
  optimization?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageId,
  alt = '',
  className,
  width,
  height,
  fallbackSrc,
  contentType,
  objectFit = 'cover',
  aspectRatio,
  showLoadingState = true,
  showErrorState = true,
  onError,
  onLoad,
  onClick,
  optimization
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cacheVersion, setCacheVersion] = useState('1');
  const imageRef = useRef<HTMLImageElement>(null);
  const { invalidateImage } = useImageManager();

  // Check cache first, then fetch if needed
  const cachedData = ImageCache.get(imageId);
  const { 
    data: presignedData, 
    error: fetchError, 
    isLoading,
    refetch 
  } = usePresignedUrl(imageId, {
    enabled: !cachedData && !imageError,
    expiresIn: 3600
  });

  // Use cached data if available, otherwise use fetched data
  const imageData = cachedData || presignedData;

  // Handle cache version updates for invalidation
  useEffect(() => {
    const handleCacheInvalidation = (event: CustomEvent) => {
      if (event.detail.imageId === imageId) {
        const newCacheVersion = event.detail.cacheVersion;
        setCacheVersion(newCacheVersion);
        setImageError(false);
        setImageLoaded(false);
        
        // Refetch with new cache version
        refetch();
      }
    };

    window.addEventListener('image-cache-invalidate', handleCacheInvalidation as EventListener);
    return () => {
      window.removeEventListener('image-cache-invalidate', handleCacheInvalidation as EventListener);
    };
  }, [imageId, refetch]);

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    onError?.(new Error(`Failed to load image: ${imageId}`));
  };

  // Retry loading
  const handleRetry = () => {
    setImageError(false);
    setImageLoaded(false);
    refetch();
  };

  // Get optimized URL if optimization options are provided
  const getImageUrl = () => {
    if (!imageData?.presigned_url) return null;
    
    if (optimization) {
      return ImageUrlUtils.getOptimizedUrl(imageData.presigned_url, optimization);
    }
    
    return imageData.presigned_url;
  };

  const imageUrl = getImageUrl();
  const shouldShowFallback = imageError || (!imageUrl && !isLoading);
  const finalFallbackSrc = fallbackSrc || ImageUrlUtils.getFallbackUrl(contentType);

  // Loading state
  if (isLoading && !cachedData && showLoadingState) {
    return (
      <Card className={cn("overflow-hidden", className)} style={{ width, height, aspectRatio }}>
        <CardContent className="p-0 h-full flex items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-xs">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if ((fetchError || imageError) && showErrorState) {
    return (
      <Card className={cn("overflow-hidden border-destructive/20", className)} style={{ width, height, aspectRatio }}>
        <CardContent className="p-0 h-full flex items-center justify-center bg-destructive/5">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircleIcon className="h-8 w-8" />
            <span className="text-xs text-center">Failed to load</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="h-6 px-2 text-xs"
            >
              <RefreshCwIcon className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback image
  if (shouldShowFallback) {
    return (
      <Card className={cn("overflow-hidden", className)} style={{ width, height, aspectRatio }}>
        <CardContent className="p-0 h-full">
          <img
            src={finalFallbackSrc}
            alt={alt || 'Image not available'}
            className={cn(
              "w-full h-full transition-opacity duration-200",
              `object-${objectFit}`,
              onClick && "cursor-pointer"
            )}
            style={{ objectFit }}
            onClick={onClick}
            onLoad={handleImageLoad}
          />
        </CardContent>
      </Card>
    );
  }

  // Main image display
  if (imageUrl) {
    return (
      <Card className={cn("overflow-hidden", className)} style={{ width, height, aspectRatio }}>
        <CardContent className="p-0 h-full relative">
          {/* Loading overlay */}
          {!imageLoaded && showLoadingState && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-xs">Loading...</span>
              </div>
            </div>
          )}
          
          {/* Main image */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt={alt}
            className={cn(
              "w-full h-full transition-opacity duration-200",
              `object-${objectFit}`,
              onClick && "cursor-pointer",
              !imageLoaded && "opacity-0"
            )}
            style={{ objectFit }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={onClick}
            loading="lazy"
          />
        </CardContent>
      </Card>
    );
  }

  // Placeholder when no image data
  return (
    <Card className={cn("overflow-hidden", className)} style={{ width, height, aspectRatio }}>
      <CardContent className="p-0 h-full flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
          <span className="text-xs">No image</span>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Simplified image component for common use cases
 */
export const SimpleImage: React.FC<{
  imageId: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  rounded?: boolean;
  onClick?: () => void;
}> = ({ 
  imageId, 
  alt, 
  size = 'md', 
  className, 
  rounded = true,
  onClick 
}) => {
  const sizeMap = {
    sm: { width: 40, height: 40 },
    md: { width: 80, height: 80 },
    lg: { width: 120, height: 120 },
    xl: { width: 200, height: 200 }
  };

  const dimensions = sizeMap[size];

  return (
    <ImageDisplay
      imageId={imageId}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      className={cn(
        rounded && "rounded-full overflow-hidden",
        className
      )}
      objectFit="cover"
      onClick={onClick}
      showLoadingState={false}
      showErrorState={false}
    />
  );
};

/**
 * Avatar component specifically for user profile images
 */
export const UserAvatar: React.FC<{
  userId: string;
  imageId?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}> = ({ 
  userId, 
  imageId, 
  name, 
  size = 'md', 
  className,
  onClick 
}) => {
  if (!imageId) {
    // Use existing Avatar component as fallback
    const sizeMap = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12'
    };

    return (
      <div 
        className={cn(
          "rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium",
          sizeMap[size],
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        {name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <SimpleImage
      imageId={imageId}
      alt={name ? `${name}'s avatar` : 'User avatar'}
      size={size}
      className={className}
      onClick={onClick}
    />
  );
};