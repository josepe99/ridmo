import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../settings';

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any[];
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
}

export interface CloudinaryResource {
  assetId: string;
  publicId: string;
  url: string;
  secureUrl?: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt?: string;
}

export interface CloudinaryListOptions {
  folder?: string;
  maxResults?: number;
}

export class CloudinaryService {
  static async uploadImage(
    file: File | Buffer | string,
    options: CloudinaryUploadOptions = {}
  ): Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }> {
    try {
      const uploadOptions: any = {
        folder: options.folder || 'milowearco',
        transformation: options.transformation || [],
        quality: options.quality || 'auto',
        ...options,
      };

      // Only include format if it's specified and not 'auto'
      if (options.format && options.format !== 'auto') {
        uploadOptions.format = options.format;
      }

      let uploadData: any;

      if (file instanceof File) {
        // Convert File to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        uploadData = await cloudinary.uploader.upload(
          `data:${file.type};base64,${buffer.toString('base64')}`,
          uploadOptions
        );
      } else if (Buffer.isBuffer(file)) {
        // Upload from buffer
        uploadData = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${file.toString('base64')}`,
          uploadOptions
        );
      } else if (typeof file === 'string') {
        // Upload from URL or base64 string
        uploadData = await cloudinary.uploader.upload(file, uploadOptions);
      } else {
        throw new Error('Invalid file type');
      }

      return {
        url: uploadData.secure_url,
        publicId: uploadData.public_id,
        width: uploadData.width,
        height: uploadData.height,
        format: uploadData.format,
        bytes: uploadData.bytes,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  static async uploadMultipleImages(
    files: (File | Buffer | string)[],
    options: CloudinaryUploadOptions = {}
  ): Promise<Array<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }>> {
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return await Promise.all(uploadPromises);
  }

  static async getImage(publicId: string): Promise<CloudinaryResource> {
    try {
      const resource = await cloudinary.api.resource(publicId);
      return this.mapResource(resource);
    } catch (error) {
      console.error('Cloudinary get image error:', error);
      throw new Error('Failed to get image from Cloudinary');
    }
  }

  static async getImages(options: CloudinaryListOptions = {}): Promise<CloudinaryResource[]> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: options.folder,
        max_results: options.maxResults || 50,
      });

      return (result.resources || []).map((resource: any) => this.mapResource(resource));
    } catch (error) {
      console.error('Cloudinary list images error:', error);
      throw new Error('Failed to list images from Cloudinary');
    }
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      console.error('Cloudinary batch delete error:', error);
      throw new Error('Failed to delete images from Cloudinary');
    }
  }

  static async removeImage(publicId: string): Promise<void> {
    return this.deleteImage(publicId);
  }

  static generateUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
      transformation?: any[];
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      quality: options.quality || 'auto',
      fetch_format: 'auto', // Use f_auto for delivery
      ...options,
    });
  }

  static generateThumbnail(
    publicId: string,
    width: number = 200,
    height: number = 200
  ): string {
    return this.generateUrl(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
    });
  }

  static generateResponsiveUrls(
    publicId: string,
    sizes: number[] = [400, 800, 1200]
  ): Array<{ width: number; url: string }> {
    return sizes.map(width => ({
      width,
      url: this.generateUrl(publicId, {
        width,
        quality: 'auto',
        crop: 'scale',
      }),
    }));
  }

  private static mapResource(resource: any): CloudinaryResource {
    return {
      assetId: resource.asset_id,
      publicId: resource.public_id,
      url: resource.secure_url || resource.url,
      secureUrl: resource.secure_url,
      format: resource.format,
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      createdAt: resource.created_at,
    };
  }
}

export default cloudinary;
