import {
  S3Service,
  StorageUploadOptions,
  StorageResource,
  StorageListOptions,
} from './s3.datasource';

export class FileDatasource {
  async uploadImage(
    file: File | Buffer | string,
    options: StorageUploadOptions = {}
  ) {
    return await S3Service.uploadImage(file, options);
  }

  async getImage(publicId: string): Promise<StorageResource> {
    return await S3Service.getImage(publicId);
  }

  async getImages(options: StorageListOptions = {}): Promise<StorageResource[]> {
    return await S3Service.getImages(options);
  }

  async removeImage(publicId: string): Promise<void> {
    return await S3Service.removeImage(publicId);
  }
}
