import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ServiceType } from '@studio/shared';

export class ArtworkQueryDto {
  @ApiPropertyOptional({ enum: ServiceType, description: 'Filter by service type' })
  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;

  @ApiPropertyOptional({ description: 'Filter by material slug' })
  @IsString()
  @IsOptional()
  materialSlug?: string;

  @ApiPropertyOptional({ description: 'Filter featured artworks only' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 20, description: 'Page limit' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20;

  @ApiPropertyOptional({ default: 0, description: 'Page offset' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 0))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset: number = 0;
}
