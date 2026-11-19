import { Body, Controller, Post, Put, Query } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CreatePresignedUrlDto } from './dto/presigned-url.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  async createPresignedUrl(@Body() dto: CreatePresignedUrlDto) {
    return this.uploadsService.createPresignedUrl(dto);
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
