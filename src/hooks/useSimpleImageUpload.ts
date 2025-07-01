/**
 * Simple image upload hook using Cloudflare Worker
 * No authentication required - just direct upload to R2
 */

import { useMutation } from '@tanstack/react-query';

export interface ImageUploadParams {
  file: File;
  contentType: 'profile' | 'event' | 'general';
  contentId: string;
}

export interface ImageUploadResponse {
  success: boolean;
  image_url?: string;
  object_key?: string;
  file_size?: number;
  content_type?: string;
  message?: string;
  error?: string;
  details?: string[];
}

const UPLOAD_ENDPOINT = 'https://stdio.meetball.fun/upload';

/**
 * Simple image upload mutation
 */
export const useSimpleImageUpload = () => {
  return useMutation<ImageUploadResponse, Error, ImageUploadParams>({
    mutationFn: async ({ file, contentType, contentId }) => {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content_type', contentType);
      formData.append('content_id', contentId);

      // Upload to Cloudflare Worker
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      const result: ImageUploadResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Upload failed: ${response.statusText}`);
      }

      return result;
    },
  });
};

/**
 * Simple image validation utilities
 */
export const ImageValidation = {
  SUPPORTED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
  ],
  
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_SIZE: 1024, // 1KB

  validateFile(file: File): string[] {
    const errors: string[] = [];

    if (!file) {
      errors.push('No file selected');
      return errors;
    }

    // Check file type
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      errors.push(`Unsupported file type: ${file.type}. Supported: ${this.SUPPORTED_TYPES.join(', ')}`);
    }

    // Check file size
    if (file.size < this.MIN_SIZE) {
      errors.push(`File too small. Minimum size: ${this.MIN_SIZE} bytes`);
    }

    if (file.size > this.MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxMB = (this.MAX_SIZE / (1024 * 1024)).toFixed(0);
      errors.push(`File too large: ${sizeMB}MB. Maximum size: ${maxMB}MB`);
    }

    return errors;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};