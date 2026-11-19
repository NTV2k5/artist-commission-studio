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
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-dummy.r2.dev';

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
      };
    }

    // Dev Fallback when R2 cloud credentials are dummy in local development
    const mockFileUrl = `https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80`;
    return {
      uploadUrl: `/api/v1/uploads/mock-upload?key=${uniqueKey}`,
      fileUrl: mockFileUrl,
      key: uniqueKey,
      isMock: true,
    };
  }
}
