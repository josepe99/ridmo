import { NextRequest, NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { CloudinaryService, CloudinaryUploadOptions } from '@/lib/cloudinary';

export interface ImageUploadResponse {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class ImageController extends BaseController {
  /**
   * Upload multiple images to Cloudinary
   */
  async uploadImages(
    files: File[],
    options: CloudinaryUploadOptions = {}
  ): Promise<ImageUploadResponse[]> {
    try {
      const uploadPromises = files.map(file => this.uploadSingleImage(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Upload a single image to Cloudinary
   */
  async uploadSingleImage(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<ImageUploadResponse> {
    try {
      // Validate file type
      if (!this.isValidImageFile(file)) {
        throw new Error('Invalid file type. Only images are allowed.');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Maximum 10MB allowed.');
      }

      const uploadOptions: CloudinaryUploadOptions = {
        folder: 'milowearco/items',
        quality: 'auto',
        ...options,
      };

      const result = await CloudinaryService.uploadImage(file, uploadOptions);
      return result;
    } catch (error) {
      console.error('Error uploading single image:', error);
      throw error;
    }
  }

  /**
   * Upload image from base64 string
   */
  async uploadFromBase64(
    base64String: string,
    options: CloudinaryUploadOptions = {}
  ): Promise<ImageUploadResponse> {
    try {
      const uploadOptions: CloudinaryUploadOptions = {
        folder: 'milowearco/items',
        quality: 'auto',
        ...options,
      };

      const result = await CloudinaryService.uploadImage(base64String, uploadOptions);
      return result;
    } catch (error) {
      console.error('Error uploading image from base64:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      await CloudinaryService.deleteImage(publicId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteImages(publicIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const publicId of publicIds) {
      try {
        await CloudinaryService.deleteImage(publicId);
        success.push(publicId);
      } catch (error) {
        console.error(`Error deleting image ${publicId}:`, error);
        failed.push(publicId);
      }
    }

    return { success, failed };
  }

  /**
   * Process FormData and extract images
   */
  async processFormDataImages(formData: FormData): Promise<File[]> {
    const files: File[] = [];
    
    // Get all entries from FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        files.push(value);
      }
    }

    return files;
  }

  /**
   * Validate if file is a valid image
   */
  private isValidImageFile(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    return validTypes.includes(file.type);
  }

  /**
   * Handle POST request for image upload
   */
  async POST(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        try {
          const formData = await req.formData();
          const files = await this.processFormDataImages(formData);

          if (files.length === 0) {
            return this.createErrorResponse('No images provided', 400);
          }

          const uploadedImages = await this.uploadImages(files);
          
          return this.createSuccessResponse({
            images: uploadedImages,
            count: uploadedImages.length
          });
        } catch (error) {
          console.error('Error in image upload endpoint:', error);
          return this.createErrorResponse(
            error instanceof Error ? error.message : 'Failed to upload images',
            500
          );
        }
      }
    );
  }

  /**
   * Handle DELETE request for image deletion
   */
  async DELETE(request: NextRequest): Promise<NextResponse> {
    return this.handleRequest(
      request,
      async (req) => {
        const { searchParams } = new URL(req.url);
        const publicId = searchParams.get('publicId');
        const publicIds = searchParams.get('publicIds');

        if (publicId) {
          // Delete single image
          const success = await this.deleteImage(publicId);
          if (success) {
            return this.createSuccessResponse({ message: 'Image deleted successfully' });
          } else {
            return this.createErrorResponse('Failed to delete image', 500);
          }
        } else if (publicIds) {
          // Delete multiple images
          const ids = publicIds.split(',');
          const result = await this.deleteImages(ids);
          return this.createSuccessResponse(result);
        } else {
          return this.createErrorResponse('Public ID(s) required', 400);
        }
      }
    );
  }
}
