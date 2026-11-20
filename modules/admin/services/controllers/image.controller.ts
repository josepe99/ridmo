import { NextRequest, NextResponse } from 'next/server';
import { BaseController } from './base.controller';
import { S3Service, StorageUploadOptions } from '@/modules/admin/services/datasources/s3.datasource';

export interface ImageUploadResponse {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

export class ImageController extends BaseController {
  /**
   * Upload multiple images to storage
   */
  async uploadImages(
    files: File[],
    options: StorageUploadOptions = {}
  ): Promise<ImageUploadResponse[]> {
    try {
      const uploadPromises = files.map(file => this.uploadSingleImage(file, options));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('No se pudieron subir las imágenes');
    }
  }

  /**
   * Upload a single image to storage
   */
  async uploadSingleImage(
    file: File,
    options: StorageUploadOptions = {}
  ): Promise<ImageUploadResponse> {
    try {
      // Validate file type
      if (!this.isValidImageFile(file)) {
        throw new Error('Tipo de archivo inválido. Solo se permiten imágenes.');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. Máximo 10 MB.');
      }

      const uploadOptions: StorageUploadOptions = {
        folder: 'ridmo/items',
        ...options,
      };

      const result = await S3Service.uploadImage(file, uploadOptions);
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
    options: StorageUploadOptions = {}
  ): Promise<ImageUploadResponse> {
    try {
      const uploadOptions: StorageUploadOptions = {
        folder: 'ridmo/items',
        ...options,
      };

      const result = await S3Service.uploadImage(base64String, uploadOptions);
      return result;
    } catch (error) {
      console.error('Error uploading image from base64:', error);
      throw error;
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      await S3Service.deleteImage(publicId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Delete multiple images from storage
   */
  async deleteImages(publicIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const publicId of publicIds) {
      try {
        await S3Service.deleteImage(publicId);
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
            return this.createErrorResponse('No se enviaron imágenes', 400);
          }

          const uploadedImages = await this.uploadImages(files);
          
          return this.createSuccessResponse({
            images: uploadedImages,
            count: uploadedImages.length
          });
        } catch (error) {
          console.error('Error in image upload endpoint:', error);
          return this.createErrorResponse(
            error instanceof Error ? error.message : 'No se pudieron subir las imágenes',
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
            return this.createSuccessResponse({ message: 'Imagen eliminada con éxito' });
          } else {
            return this.createErrorResponse('No se pudo eliminar la imagen', 500);
          }
        } else if (publicIds) {
          // Delete multiple images
          const ids = publicIds.split(',');
          const result = await this.deleteImages(ids);
          return this.createSuccessResponse(result);
        } else {
          return this.createErrorResponse('Se requiere al menos un ID público', 400);
        }
      }
    );
  }
}
