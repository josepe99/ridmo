import {
  StorageUploadOptions,
  StorageResource,
  StorageListOptions,
} from '../datasources/s3.datasource';
import { FileDatasource } from '../datasources/file.datasource';

export class FileController {
  private datasource: FileDatasource;

  constructor() {
    this.datasource = new FileDatasource();
  }

  async uploadImage(
    file: File | Buffer | string,
    options: StorageUploadOptions = {}
  ) {
    try {
      return await this.datasource.uploadImage(file, options);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('No se pudo subir el archivo');
    }
  }

  async getImage(publicId: string): Promise<StorageResource> {
    try {
      return await this.datasource.getImage(publicId);
    } catch (error) {
      console.error('Error fetching file:', error);
      throw new Error('No se pudo obtener el archivo');
    }
  }

  async getImages(options: StorageListOptions = {}): Promise<StorageResource[]> {
    try {
      return await this.datasource.getImages(options);
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('No se pudieron listar los archivos');
    }
  }

  async removeImage(publicId: string): Promise<void> {
    try {
      await this.datasource.removeImage(publicId);
    } catch (error) {
      console.error('Error removing file:', error);
      throw new Error('No se pudo eliminar el archivo');
    }
  }
}
