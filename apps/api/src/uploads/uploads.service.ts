import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreatePresignedUrlDto } from './dto/presigned-url.dto';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'artist-commission-studio';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

    if (
      accountId &&
      accessKeyId &&
      secretAccessKey &&
      !accountId.includes('dummy') &&
      !accessKeyId.includes('dummy')
    ) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  hasCloudStorage(): boolean {
    return this.s3Client !== null;
  }

  async createPresignedUrl(dto: CreatePresignedUrlDto) {
    const fileExt = dto.filename.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueKey = `orders/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${fileExt}`;

    if (this.s3Client) {
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
