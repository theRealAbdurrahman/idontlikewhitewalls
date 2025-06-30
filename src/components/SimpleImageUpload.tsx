/**
 * Simple Image Upload Component
 * Handles drag-and-drop and click upload with validation
 */

import React, { useCallback, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { useSimpleImageUpload, ImageValidation, type ImageUploadParams } from '../hooks/useSimpleImageUpload';

export interface SimpleImageUploadProps {
  contentType: 'profile' | 'event' | 'general';
  contentId: string;
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  contentType,
  contentId,
  onUploadSuccess,
  onUploadError,
  accept = 'image/*',
  maxFiles = 1,
  disabled = false,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { toast } = useToast();
  const uploadMutation = useSimpleImageUpload();

  // Create preview URL when file is selected
  const createPreview = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  // Validate and set file
  const handleFileSelect = useCallback((file: File) => {
    const errors = ImageValidation.validateFile(file);
    setValidationErrors(errors);

    if (errors.length === 0) {
      setSelectedFile(file);
      createPreview(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [createPreview]);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [disabled, handleFileSelect]);

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationErrors([]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  // Upload file
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    const uploadParams: ImageUploadParams = {
      file: selectedFile,
      contentType,
      contentId,
    };

    try {
      const result = await uploadMutation.mutateAsync(uploadParams);
      
      if (result.success && result.image_url) {
        toast({
          title: 'Upload successful',
          description: `Image uploaded successfully: ${ImageValidation.formatFileSize(selectedFile.size)}`,
        });
        
        onUploadSuccess?.(result.image_url);
        handleClear();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      onUploadError?.(errorMessage);
    }
  }, [selectedFile, contentType, contentId, uploadMutation, toast, onUploadSuccess, onUploadError, handleClear]);

  // Clean up preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : validationErrors.length > 0
            ? 'border-red-300 bg-red-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="text-center">
            {selectedFile && previewUrl ? (
              // Preview
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-32 max-h-32 rounded-lg object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    onClick={handleClear}
                    disabled={disabled || uploadMutation.isPending}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {ImageValidation.formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              // Upload prompt
              <div className="space-y-4">
                <div className="flex justify-center">
                  {validationErrors.length > 0 ? (
                    <AlertCircle className="w-12 h-12 text-red-400" />
                  ) : (
                    <Upload className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Drop an image here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF, WebP up to 10MB
                  </p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
              id="file-upload"
            />
            
            {!selectedFile && (
              <label
                htmlFor="file-upload"
                className="absolute inset-0 cursor-pointer"
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-1">
          {validationErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && validationErrors.length === 0 && (
        <Button
          onClick={handleUpload}
          disabled={disabled || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
      )}

      {/* Upload Status */}
      {uploadMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {uploadMutation.error?.message || 'Upload failed'}
          </p>
        </div>
      )}
    </div>
  );
};