import {
  CloudinaryService,
  CloudinaryUploadOptions,
  CloudinaryResource,
  CloudinaryListOptions,
} from './cloudinary.datasource';

export class FileDatasource {
  async uploadImage(
    file: File | Buffer | string,
    options: CloudinaryUploadOptions = {}
  ) {
    return await CloudinaryService.uploadImage(file, options);
  }

  async getImage(publicId: string): Promise<CloudinaryResource> {
    return await CloudinaryService.getImage(publicId);
  }

  async getImages(options: CloudinaryListOptions = {}): Promise<CloudinaryResource[]> {
    return await CloudinaryService.getImages(options);
  }

  async removeImage(publicId: string): Promise<void> {
    return await CloudinaryService.removeImage(publicId);
  }
}
