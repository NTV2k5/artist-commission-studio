import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Request } from 'express';
import { UploadsService } from './uploads.service';
import { CreatePresignedUrlDto } from './dto/presigned-url.dto';

const uploadsDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Request presigned URL for direct cloud upload (R2/S3)' })
  async createPresignedUrl(@Body() dto: CreatePresignedUrlDto) {
    return this.uploadsService.createPresignedUrl(dto);
  }

  @Post('local')
  @ApiOperation({ summary: 'Upload file directly to local disk storage fallback' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const fileExt = extname(file.originalname).toLowerCase() || '.jpg';
          const uniqueName = `upload-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${fileExt}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải lên ảnh JPG, PNG hoặc WEBP.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadLocal(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy tệp ảnh tải lên');
    }

    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;

    return {
      success: true,
      fileUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Put('mock-upload')
  async mockUpload(@Query('key') key: string) {
    return {
      success: true,
      message: 'Mock file upload accepted in local development mode',
      key,
    };
  }
}
