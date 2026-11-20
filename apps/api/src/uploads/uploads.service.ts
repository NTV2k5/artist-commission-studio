import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreatePresignedUrlDto } from './dto/presigned-url.dto';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'artist-commission-studio';
    this.publicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

    const isPlaceholder = (val?: string) =>
      !val ||
      val.length === 0 ||
      val.includes('dummy') ||
      val.includes('placeholder') ||
      val.includes('your-') ||
      val.includes('example');

    const isValidR2 =
      !isPlaceholder(accountId) &&
      !isPlaceholder(accessKeyId) &&
      !isPlaceholder(secretAccessKey);

    if (isValidR2) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: accessKeyId!,
            secretAccessKey: secretAccessKey!,
          },
        });
        this.logger.log('☁️ Cloudflare R2 client initialized successfully.');
      } catch (err) {
        this.logger.warn('Failed to initialize S3Client for R2, falling back to local disk storage:', err);
        this.s3Client = null;
      }
    } else {
      this.logger.log('📁 Cloudflare R2 credentials not provided or placeholder. Using Local Storage fallback mode.');
    }
  }

  hasCloudStorage(): boolean {
    return this.s3Client !== null;
  }

  async createPresignedUrl(dto: CreatePresignedUrlDto) {
    const fileExt = dto.filename.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueKey = `orders/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${fileExt}`;

    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueKey,
          ContentType: dto.contentType,
          ContentLength: dto.fileSize,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
        const fileUrl = `${this.publicUrl}/${uniqueKey}`;

        return {
          uploadUrl,
          fileUrl,
          key: uniqueKey,
          isMock: false,
          isLocal: false,
        };
      } catch (err) {
        this.logger.warn('Failed to generate R2 presigned URL, defaulting to local upload:', err);
      }
    }

    // Local Storage Fallback when R2/S3 is not configured
    return {
      uploadUrl: '/api/v1/uploads/local',
      fileUrl: '',
      key: uniqueKey,
      isMock: false,
      isLocal: true,
    };
  }
}
