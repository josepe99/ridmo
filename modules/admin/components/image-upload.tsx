'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUpload {
  file?: File;
  url: string;
  preview: string;
  isExisting?: boolean;
  publicId?: string;
}

interface ImageUploadComponentProps {
  images: ImageUpload[];
  onImagesChange: (images: ImageUpload[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export function ImageUploadComponent({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className,
}: ImageUploadComponentProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    return null;
  };

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newImages: ImageUpload[] = [];
      let hasError = false;

      // Check if adding these files would exceed max images
      if (images.length + fileArray.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      fileArray.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          hasError = true;
          return;
        }

        // Create preview URL
        const preview = URL.createObjectURL(file);
        
        newImages.push({
          file,
          url: '', // Will be set after upload
          preview,
          isExisting: false,
        });
      });

      if (!hasError && newImages.length > 0) {
        setError(null);
        onImagesChange([...images, ...newImages]);
      }
    },
    [images, maxImages, maxFileSize, acceptedTypes, onImagesChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
    e.target.value = ''; // Reset input
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    
    // Revoke the preview URL to prevent memory leaks
    if (imageToRemove.preview && !imageToRemove.isExisting) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const uploadImages = async () => {
    const filesToUpload = images.filter(img => img.file && !img.url);
    
    if (filesToUpload.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      filesToUpload.forEach((img, index) => {
        if (img.file) {
          formData.append(`image${index}`, img.file);
        }
      });

      const response = await fetch('/api/admin/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const result = await response.json();
      
      if (result.data?.images) {
        // Update images with URLs from upload
        const updatedImages = images.map((img, index) => {
          if (img.file && !img.url) {
            const uploadedImage = result.data.images.find((uploaded: any, uploadIndex: number) => {
              return uploadIndex === filesToUpload.findIndex(f => f === img);
            });
            
            if (uploadedImage) {
              return {
                ...img,
                url: uploadedImage.url,
                publicId: uploadedImage.publicId,
              };
            }
          }
          return img;
        });
        
        onImagesChange(updatedImages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Label>Images</Label>
      
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/10' : 'border-gray-300',
          images.length >= maxImages ? 'opacity-50 pointer-events-none' : ''
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">
              Drag and drop images here, or{' '}
              <Label htmlFor="file-upload" className="text-primary cursor-pointer hover:underline">
                browse
              </Label>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxImages} images, {maxFileSize}MB each. Supported: JPG, PNG, WebP
            </p>
          </div>
        </div>
        <Input
          id="file-upload"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={images.length >= maxImages}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Image Previews ({images.length}/{maxImages})</Label>
            {images.some(img => img.file && !img.url) && (
              <Button
                onClick={uploadImages}
                disabled={uploading}
                size="sm"
                variant="outline"
              >
                {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.preview || image.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.jpg';
                    }}
                  />
                </div>
                
                {/* Status Indicator */}
                <div className="absolute top-2 left-2">
                  {image.isExisting ? (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Saved
                    </div>
                  ) : image.url ? (
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Uploaded
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Pending
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* File Info */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {image.file?.name || 'Existing image'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
