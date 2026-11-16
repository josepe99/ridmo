import "server-only"
import { randomUUID } from 'node:crypto';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getS3Config } from '@/shared/lib/settings';

export interface StorageUploadOptions {
  /** Key prefix inside the bucket (e.g. "ridmo/items"). */
  folder?: string;
  /** Overrides the content type detected from the file or data URI. */
  contentType?: string;
}

export interface StorageUploadResult {
  url: string;
  /** Object key. It is the identifier the app stores and passes back to delete. */
  publicId: string;
  format: string;
  bytes: number;
}

export interface StorageResource {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  contentType?: string;
  createdAt?: string;
}

export interface StorageListOptions {
  folder?: string;
  maxResults?: number;
}

const DEFAULT_FOLDER = 'ridmo';
const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
};

const DATA_URI = /^data:([^;,]+)?(?:;[^,]*)?;base64,([\s\S]*)$/;

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    const config = getS3Config();
    client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return client;
}

function extensionFromName(name: string | undefined): string | undefined {
  const match = name?.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : undefined;
}

function extensionFromKey(key: string): string {
  return extensionFromName(key) ?? '';
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function mapObject(key: string, extra: { bytes?: number; contentType?: string; date?: Date }): StorageResource {
  return {
    publicId: key,
    url: S3Service.generateUrl(key),
    format: (extra.contentType && EXTENSION_BY_CONTENT_TYPE[extra.contentType]) || extensionFromKey(key),
    bytes: extra.bytes ?? 0,
    ...(extra.contentType ? { contentType: extra.contentType } : {}),
    ...(extra.date ? { createdAt: extra.date.toISOString() } : {}),
  };
}

export class S3Service {
  /** Drops the cached client so the next call re-reads the S3 settings. */
  static resetClient(): void {
    client = null;
  }

  static async uploadImage(
    file: File | Buffer | string,
    options: StorageUploadOptions = {}
  ): Promise<StorageUploadResult> {
    try {
      let body: Buffer;
      let contentType: string | undefined;
      let extension: string | undefined;

      if (file instanceof File) {
        body = Buffer.from(await file.arrayBuffer());
        contentType = file.type || undefined;
        extension = extensionFromName(file.name);
      } else if (Buffer.isBuffer(file)) {
        body = file;
      } else if (typeof file === 'string') {
        // Only base64 data URIs are accepted: fetching arbitrary URLs server-side is an SSRF risk.
        const match = file.match(DATA_URI);
        if (!match) {
          throw new Error('Only base64 data URIs are supported');
        }
        contentType = match[1] || undefined;
        body = Buffer.from(match[2], 'base64');
      } else {
        throw new Error('Invalid file type');
      }

      contentType = options.contentType || contentType;
      extension = (contentType && EXTENSION_BY_CONTENT_TYPE[contentType]) || extension || 'bin';

      const folder = trimSlashes(options.folder || DEFAULT_FOLDER);
      const key = `${folder}/${randomUUID()}.${extension}`;

      await getClient().send(
        new PutObjectCommand({
          Bucket: getS3Config().bucket,
          Key: key,
          Body: body,
          ContentType: contentType || DEFAULT_CONTENT_TYPE,
        })
      );

      return {
        url: this.generateUrl(key),
        publicId: key,
        format: extension,
        bytes: body.length,
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload image to storage');
    }
  }

  static async uploadMultipleImages(
    files: (File | Buffer | string)[],
    options: StorageUploadOptions = {}
  ): Promise<StorageUploadResult[]> {
    return await Promise.all(files.map(file => this.uploadImage(file, options)));
  }

  static async getImage(publicId: string): Promise<StorageResource> {
    try {
      const head = await getClient().send(
        new HeadObjectCommand({ Bucket: getS3Config().bucket, Key: publicId })
      );
      return mapObject(publicId, {
        bytes: head.ContentLength,
        contentType: head.ContentType,
        date: head.LastModified,
      });
    } catch (error) {
      console.error('Storage get image error:', error);
      throw new Error('Failed to get image from storage');
    }
  }

  static async getImages(options: StorageListOptions = {}): Promise<StorageResource[]> {
    try {
      const prefix = options.folder ? `${trimSlashes(options.folder)}/` : undefined;
      const result = await getClient().send(
        new ListObjectsV2Command({
          Bucket: getS3Config().bucket,
          Prefix: prefix,
          MaxKeys: options.maxResults || 50,
        })
      );
      return (result.Contents || [])
        .filter(object => object.Key)
        .map(object => mapObject(object.Key!, { bytes: object.Size, date: object.LastModified }));
    } catch (error) {
      console.error('Storage list images error:', error);
      throw new Error('Failed to list images from storage');
    }
  }

  /**
   * Deletes one object. S3 treats a missing key as success, so ids of legacy
   * Cloudinary assets (still stored on old records) are a harmless no-op.
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      await getClient().send(
        new DeleteObjectCommand({ Bucket: getS3Config().bucket, Key: publicId })
      );
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error('Failed to delete image from storage');
    }
  }

  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    if (publicIds.length === 0) return;
    try {
      await getClient().send(
        new DeleteObjectsCommand({
          Bucket: getS3Config().bucket,
          Delete: { Objects: publicIds.map(Key => ({ Key })), Quiet: true },
        })
      );
    } catch (error) {
      console.error('Storage batch delete error:', error);
      throw new Error('Failed to delete images from storage');
    }
  }

  static async removeImage(publicId: string): Promise<void> {
    return this.deleteImage(publicId);
  }

  static generateUrl(publicId: string): string {
    return `${getS3Config().publicUrl}/${publicId.replace(/^\/+/, '')}`;
  }
}
