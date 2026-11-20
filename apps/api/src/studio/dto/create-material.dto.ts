import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateMaterialDto {
  @ApiProperty({ description: 'Display name of the material' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Unique slug identifier (e.g. mat-oil)' })
  @IsNotEmpty()
  @IsString()
  slug!: string;

  @ApiProperty({ enum: ServiceType, description: 'Service category' })
  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @ApiProperty({ description: 'Base creation price per m² in VNĐ' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basePricePerM2!: number;

  @ApiProperty({ description: 'Detailed artistic characteristics and technique' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Durability and preservation note' })
  @IsOptional()
  @IsString()
  durabilityNote?: string;

  @ApiPropertyOptional({ description: 'Sample texture image URL' })
  @IsOptional()
  @IsString()
  sampleImageUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
