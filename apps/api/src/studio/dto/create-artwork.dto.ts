import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Complexity, ServiceType } from '@prisma/client';

export class CreateArtworkDto {
  @ApiProperty({ description: 'Title of the artwork' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Unique URL slug' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  slug!: string;

  @ApiProperty({ description: 'Detailed story and description of the artwork' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Array of high-resolution image URLs' })
  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @ApiProperty({ enum: ServiceType, description: 'Type of artwork service' })
  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @ApiProperty({ description: 'ID of the associated Material' })
  @IsNotEmpty()
  @IsString()
  materialId!: string;

  @ApiPropertyOptional({ enum: Complexity, default: Complexity.MEDIUM })
  @IsOptional()
  @IsEnum(Complexity)
  defaultComplexity?: Complexity;

  @ApiPropertyOptional({ description: 'Dimensions recommendation note' })
  @IsOptional()
  @IsString()
  dimensionsNote?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
