import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET_NAME');

    this.s3 = new S3Client({
      region: this.config.get<string>('AWS_REGION', 'ap-south-1'),
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      forcePathStyle: !!this.config.get('S3_ENDPOINT'),
      credentials: this.config.get<string>('AWS_ACCESS_KEY_ID')
        ? {
            accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
          }
        : undefined,
    });
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256',
      }),
    );
    return `s3://${this.bucket}/${key}`;
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async getSignedUploadUrl(
    prefix: string,
    contentType: string,
    expiresInSeconds = 300,
  ): Promise<{ url: string; key: string }> {
    const key = `${prefix}/${randomUUID()}`;
    const url = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }),
      { expiresIn: expiresInSeconds },
    );
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  extractKeyFromS3Uri(s3Uri: string): string {
    return s3Uri.replace(`s3://${this.bucket}/`, '');
  }
}
