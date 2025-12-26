import {
  CloudinaryUploadOptions,
  CloudinaryResource,
  CloudinaryListOptions,
} from '../datasources/cloudinary.datasource';
import { FileDatasource } from '../datasources/file.datasource';

export class FileController {
  private datasource: FileDatasource;

  constructor() {
    this.datasource = new FileDatasource();
  }

  async uploadImage(
    file: File | Buffer | string,
    options: CloudinaryUploadOptions = {}
  ) {
    try {
      return await this.datasource.uploadImage(file, options);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getImage(publicId: string): Promise<CloudinaryResource> {
    try {
      return await this.datasource.getImage(publicId);
    } catch (error) {
      console.error('Error fetching file:', error);
      throw new Error('Failed to fetch file');
    }
  }

  async getImages(options: CloudinaryListOptions = {}): Promise<CloudinaryResource[]> {
    try {
      return await this.datasource.getImages(options);
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  async removeImage(publicId: string): Promise<void> {
    try {
      await this.datasource.removeImage(publicId);
    } catch (error) {
      console.error('Error removing file:', error);
      throw new Error('Failed to remove file');
    }
  }
}
