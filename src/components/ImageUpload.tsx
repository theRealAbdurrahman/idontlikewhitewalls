/**
 * Image upload component with drag-and-drop and validation
 * Integrated with Cloudflare R2 and shadcn/ui components
 */

import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon, ImageIcon, XIcon, CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { 
  useImageUpload,
  type ImageMetadata 
} from '../hooks/useImageManager';
import { 
  ImageValidator, 
  formatFileSize,
  getImageDimensions,
  type ImageUploadError 
} from '../utils/imageService';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  contentType: 'user_profile' | 'question' | 'answer' | 'event';
  contentId: string;
  onUploadSuccess?: (image: ImageMetadata) => void;
  onUploadError?: (error: Error) => void;
  maxFileSize?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showAltText?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  contentType,
  contentId,
  onUploadSuccess,
  onUploadError,
  maxFileSize = ImageValidator.MAX_FILE_SIZE,
  acceptedTypes = ImageValidator.SUPPORTED_TYPES,
  className,
  disabled = false,
  showPreview = true,
  showAltText = true
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useImageUpload();

  // Handle file validation and preview generation
  const processFile = useCallback(async (file: File) => {
    const validationErrors = ImageValidator.validateFile(file);
    
    if (validationErrors.length > 0) {
      toast({
        title: "Invalid file",
        description: validationErrors.join('\n'),
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    if (showPreview) {
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Get image dimensions
      try {
        const dims = await getImageDimensions(file);
        setDimensions(dims);
      } catch (error) {
        console.warn('Failed to get image dimensions:', error);
      }
    }
  }, [showPreview, toast]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Handle upload
  const handleUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      {
        file: selectedFile,
        contentType,
        contentId,
        altText: showAltText ? altText : undefined
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Upload successful",
            description: `Image uploaded: ${selectedFile.name}`,
          });
          
          // Reset form
          setSelectedFile(null);
          setPreview(null);
          setAltText('');
          setDimensions(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          onUploadSuccess?.(data.image);
        },
        onError: (error) => {
          let errorMessage = 'Upload failed';
          
          if (error instanceof ImageUploadError) {
            errorMessage = error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive",
          });

          onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    );
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setAltText('');
    setDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle click to open file dialog
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-primary/50"
        )}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          {preview && showPreview ? (
            // Preview mode
            <div className="space-y-4">
              <div className="relative mx-auto w-fit">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-48 rounded-lg object-contain"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile && formatFileSize(selectedFile.size)}
                  {dimensions && ` • ${dimensions.width}×${dimensions.height}px`}
                </p>
              </div>
            </div>
          ) : (
            // Upload prompt
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <UploadIcon className="h-6 w-6 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Upload an image</h3>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {formatFileSize(maxFileSize)} • {acceptedTypes.map(type => type.split('/')[1]).join(', ')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alt text input */}
      {showAltText && selectedFile && (
        <div className="space-y-2">
          <Label htmlFor="alt-text">
            Alt text (optional)
          </Label>
          <Input
            id="alt-text"
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image for accessibility"
            disabled={uploadMutation.isPending}
          />
        </div>
      )}

      {/* Action buttons */}
      {selectedFile && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="flex-1"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle2Icon className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Upload progress/status */}
      {uploadMutation.isPending && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm font-medium">Uploading image...</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {uploadMutation.isError && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Upload failed</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {uploadMutation.error?.message || 'An unexpected error occurred'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};