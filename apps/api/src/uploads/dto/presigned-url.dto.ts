import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export class CreatePresignedUrlDto {
  @ApiProperty({ example: 'custom-livingroom-wall.jpg' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ enum: ALLOWED_IMAGE_MIME_TYPES, example: 'image/jpeg' })
  @IsString()
  @IsIn(ALLOWED_IMAGE_MIME_TYPES, {
    message: 'Chỉ chấp nhận các định dạng ảnh: image/jpeg, image/png, image/webp',
  })
  contentType!: string;

  @ApiProperty({ example: 4500000, description: 'File size in bytes (max 15MB)' })
  @IsInt()
  @Min(100)
  @Max(MAX_IMAGE_SIZE_BYTES, {
    message: 'Kích thước ảnh tối đa là 15MB',
  })
  fileSize!: number;
}
