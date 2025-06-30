# Cloudflare R2 Image Integration for MeetBall Frontend

This document explains the complete integration of Cloudflare R2 image serving with presigned URLs into the MeetBall frontend application.

## 🎯 Overview

The image integration provides a complete solution for:
- **Direct CDN Access**: Images served directly from Cloudflare R2, reducing server load
- **Smart Caching**: Intelligent browser caching with cache invalidation
- **Presigned URLs**: Secure, time-limited access to images
- **Upload Management**: Drag-and-drop uploads with validation
- **Profile Pictures**: Enhanced user avatar system

## 📁 File Structure

```
src/
├── components/
│   ├── ImageDisplay.tsx          # Smart image display with presigned URLs
│   ├── ImageUpload.tsx           # Drag-and-drop upload component
│   ├── ImageGallery.tsx          # Multi-image gallery with bulk loading
│   ├── ProfileImageUpload.tsx    # Profile picture upload component
│   └── ProfilePageImageIntegration.tsx  # Integration examples
├── hooks/
│   └── useImageManager.ts        # Image management hooks
├── utils/
│   └── imageService.ts           # Core image utilities and cache
├── config/
│   ├── api.ts                    # Updated API configuration
│   └── environment.ts            # Environment configuration
└── .env.example                  # Environment variables template
```

## 🚀 Getting Started

### 1. Environment Setup

Copy the environment variables from `.env.example` to your `.env` file:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Image Service Configuration
VITE_ENABLE_IMAGE_SERVICE=true
VITE_IMAGE_CACHE_ENABLED=true
VITE_IMAGE_CACHE_DURATION=3600000
VITE_IMAGE_UPLOAD_MAX_SIZE=10485760
VITE_IMAGE_UPLOAD_QUALITY=85

# Feature Flags
VITE_ENABLE_IMAGE_UPLOAD=true
VITE_ENABLE_IMAGE_GALLERY=true
VITE_ENABLE_PROFILE_IMAGE_UPLOAD=true
```

### 2. API Client Generation

Regenerate the API client to include the new image endpoints:

```bash
cd frontend-orval
npm run generate-api
```

This will update the API client with the new image endpoints.

### 3. Update Dependencies

The integration uses existing dependencies, but make sure you have:
- `@tanstack/react-query` (already in package.json)
- `axios` (already in package.json)
- All shadcn/ui components (already in package.json)

## 🔧 Component Usage

### ImageDisplay - Smart Image Component

```tsx
import { ImageDisplay } from '../components/ImageDisplay';

// Basic usage
<ImageDisplay
  imageId="uuid-here"
  alt="Description"
  width={300}
  height={200}
/>

// With optimization
<ImageDisplay
  imageId="uuid-here"
  alt="Profile picture"
  optimization={{
    width: 400,
    height: 400,
    quality: 85,
    format: 'webp'
  }}
  contentType="user_profile"
/>
```

### ImageUpload - Upload Component

```tsx
import { ImageUpload } from '../components/ImageUpload';

<ImageUpload
  contentType="user_profile"
  contentId={userId}
  onUploadSuccess={(image) => console.log('Uploaded:', image.id)}
  onUploadError={(error) => console.error('Error:', error)}
  showPreview={true}
  showAltText={true}
/>
```

### ProfileImageUpload - Enhanced Avatar

```tsx
import { ProfileImageUpload } from '../components/ProfileImageUpload';

<ProfileImageUpload
  userId={user.id}
  currentImageId={user.profile_image_id}
  currentImageUrl={user.avatar} // Legacy LinkedIn URL
  userName={user.name}
  size="lg"
  showEditButton={true}
  onImageUpload={(imageId) => updateUserProfile({ profile_image_id: imageId })}
  editable={isOwnProfile}
/>
```

### ImageGallery - Multi-Image Display

```tsx
import { ImageGallery } from '../components/ImageGallery';

<ImageGallery
  contentType="question"
  contentIds={["uuid1", "uuid2", "uuid3"]}
  columns={3}
  showImageCount={true}
  onImageClick={(imageId) => openLightbox(imageId)}
/>
```

## 🎣 Hooks Usage

### useImageManager - Cache Management

```tsx
import { useImageManager } from '../hooks/useImageManager';

const MyComponent = () => {
  const { 
    invalidateImage, 
    clearAllCache, 
    cacheStats,
    preloadImages 
  } = useImageManager();
  
  // Invalidate specific image
  const handleImageUpdate = (imageId: string) => {
    invalidateImage(imageId, 'new-version');
  };
  
  // Preload images for better UX
  useEffect(() => {
    preloadImages(['image1', 'image2', 'image3']);
  }, []);
  
  return (
    <div>
      <p>Cache: {cacheStats.totalItems} items</p>
      <button onClick={() => clearAllCache()}>Clear Cache</button>
    </div>
  );
};
```

### usePresignedUrl - Single Image URL

```tsx
import { usePresignedUrl } from '../hooks/useImageManager';

const MyComponent = ({ imageId }: { imageId: string }) => {
  const { data: urlData, isLoading, error } = usePresignedUrl(imageId, {
    expiresIn: 3600 // 1 hour
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading image</div>;
  
  return <img src={urlData?.presigned_url} alt="Image" />;
};
```

### useImageUpload - Upload with Progress

```tsx
import { useImageUpload } from '../hooks/useImageManager';

const UploadComponent = () => {
  const uploadMutation = useImageUpload();
  
  const handleFileSelect = (file: File) => {
    uploadMutation.mutate({
      file,
      contentType: 'question',
      contentId: 'question-uuid',
      altText: 'Optional description'
    }, {
      onSuccess: (data) => console.log('Upload success:', data),
      onError: (error) => console.error('Upload error:', error)
    });
  };
  
  return (
    <div>
      {uploadMutation.isPending && <div>Uploading...</div>}
      {uploadMutation.isError && <div>Error: {uploadMutation.error?.message}</div>}
      <input type="file" onChange={(e) => handleFileSelect(e.target.files?.[0]!)} />
    </div>
  );
};
```

## 🔄 Integration with Existing Components

### ProfilePage Integration

Replace the existing avatar section in `ProfilePage.tsx`:

```tsx
// Old avatar section (around line 772)
<Avatar className="w-20 h-20 ring-4 ring-gray-100">
  <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
  <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-100 to-gray-200">
    {profileUser.name[0]}
  </AvatarFallback>
</Avatar>

// New enhanced avatar with upload
<ProfileImageUpload
  userId={profileUser.id}
  currentImageId={profileUser.profile_image_id}
  currentImageUrl={profileUser.avatar}
  userName={profileUser.name}
  size="lg"
  showEditButton={isOwnProfile}
  onImageUpload={(imageId) => updateUserProfile({ profile_image_id: imageId })}
  editable={isOwnProfile}
/>
```

### QuestionCard Integration

Add image display to question cards:

```tsx
import { ContentImages } from '../components/ImageGallery';

// In QuestionCard component
<ContentImages
  contentType="question"
  contentId={question.id}
  maxImages={3}
  columns={3}
  className="mt-3"
/>
```

### Universal Avatar Replacement

Replace Avatar components throughout the app:

```tsx
// Old way
<Avatar className="w-8 h-8">
  <AvatarImage src={user.avatar} alt={user.name} />
  <AvatarFallback>{user.name[0]}</AvatarFallback>
</Avatar>

// New way
<UserProfileAvatar
  userId={user.id}
  userName={user.name}
  imageId={user.profile_image_id}
  imageUrl={user.avatar} // Backward compatibility
  size="sm"
/>
```

## 🎛️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_IMAGE_SERVICE` | `true` | Enable/disable image service |
| `VITE_IMAGE_CACHE_ENABLED` | `true` | Enable browser caching |
| `VITE_IMAGE_CACHE_DURATION` | `3600000` | Cache duration (ms) |
| `VITE_IMAGE_UPLOAD_MAX_SIZE` | `10485760` | Max upload size (bytes) |
| `VITE_IMAGE_UPLOAD_QUALITY` | `85` | Upload quality (1-100) |

### Feature Flags

Control feature availability with environment variables:

```tsx
import { isFeatureEnabled } from '../config/environment';

// Conditional rendering based on feature flags
{isFeatureEnabled('imageUpload') && (
  <ImageUpload contentType="question" contentId={questionId} />
)}

{isFeatureEnabled('profileImageUpload') && (
  <ProfileImageUpload userId={userId} userName={userName} />
)}
```

## 🔧 Cache Management

### Automatic Cache Management

The system automatically:
- Caches presigned URLs in localStorage
- Cleans expired entries every 5 minutes
- Invalidates cache on image updates
- Synchronizes across browser tabs

### Manual Cache Operations

```tsx
import { ImageCacheManager, ImageCache } from '../utils/imageService';

// Clear all cache
ImageCacheManager.clearAll();

// Invalidate specific image
ImageCacheManager.invalidateImage('image-id', 'new-version');

// Get cache statistics
const stats = ImageCache.getStats();
console.log(`Cache: ${stats.totalItems} items, ${stats.expiredCount} expired`);

// Clean expired entries
const cleaned = ImageCache.cleanExpired();
console.log(`Cleaned ${cleaned} expired entries`);
```

## 🚨 Error Handling

The system includes comprehensive error handling:

```tsx
// Upload errors
catch (error) {
  if (error instanceof ImageUploadError) {
    // Handle upload-specific errors
    console.error('Upload failed:', error.message);
  } else if (error instanceof ImageNotFoundError) {
    // Handle missing images
    console.error('Image not found:', error.message);
  } else {
    // Handle generic errors
    console.error('Unexpected error:', error);
  }
}

// Display errors
<ImageDisplay
  imageId="invalid-id"
  showErrorState={true}
  onError={(error) => console.error('Display error:', error)}
/>
```

## 📊 Performance Optimizations

### Image Optimization

```tsx
<ImageDisplay
  imageId="image-id"
  optimization={{
    width: 400,      // Resize to 400px width
    height: 400,     // Resize to 400px height
    quality: 85,     // 85% quality
    format: 'webp'   // Convert to WebP
  }}
/>
```

### Lazy Loading

```tsx
// Automatic lazy loading
<ImageDisplay imageId="image-id" loading="lazy" />

// Preload important images
const { preloadImages } = useImageManager();
useEffect(() => {
  preloadImages(['critical-image-1', 'critical-image-2']);
}, []);
```

### Bulk Operations

```tsx
// Load multiple images efficiently
<ImageGallery
  contentType="event"
  contentIds={eventIds} // Load images for multiple events at once
  columns={4}
/>
```

## 🔒 Security Features

- **Time-limited URLs**: Presigned URLs expire automatically
- **Permission validation**: Backend validates user permissions
- **File validation**: Comprehensive client and server-side validation
- **Rate limiting**: Prevents abuse with built-in rate limiting

## 🐛 Troubleshooting

### Common Issues

1. **Images not loading**
   - Check API endpoint configuration
   - Verify R2 credentials in backend
   - Check browser network tab for failed requests

2. **Cache not working**
   - Verify `VITE_IMAGE_CACHE_ENABLED=true`
   - Check localStorage is available
   - Clear browser cache and try again

3. **Upload failing**
   - Check file size limits
   - Verify supported file types
   - Check network connectivity

### Debug Mode

Enable debug logging:

```bash
# In .env
VITE_DEBUG_API_REQUESTS=true
VITE_DEBUG_IMAGE_CACHE=true
```

## 📈 Monitoring

Monitor cache performance:

```tsx
import { useImageManager } from '../hooks/useImageManager';

const CacheMonitor = () => {
  const { cacheStats } = useImageManager();
  
  return (
    <div>
      <p>Total items: {cacheStats.totalItems}</p>
      <p>Cache size: {(cacheStats.totalSizeBytes / 1024).toFixed(1)} KB</p>
      <p>Expired items: {cacheStats.expiredCount}</p>
    </div>
  );
};
```

## 🚀 Future Enhancements

Planned improvements:
- Image compression service integration
- Advanced image editing capabilities
- Batch upload functionality
- Image analytics and usage tracking
- PWA offline image support

---

## 📝 Migration Guide

### From LinkedIn URLs to R2 Images

1. **Backward Compatibility**: The system supports both old LinkedIn URLs and new R2 images
2. **Gradual Migration**: Users can upload new profile pictures while keeping old ones as fallback
3. **API Updates**: Update user models to include `profile_image_id` field
4. **Data Migration**: Optional script to migrate existing LinkedIn images to R2

### API Changes Required

1. **User Model**: Add `profile_image_id` field
2. **User Endpoints**: Update to handle image uploads
3. **Profile Updates**: Support updating profile images
4. **Image Permissions**: Validate user access to images

This integration provides a robust, scalable image system that enhances user experience while maintaining security and performance.