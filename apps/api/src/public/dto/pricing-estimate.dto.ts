import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Complexity, FrameOption, ServiceType } from '@studio/shared';

export class PricingEstimateDto {
  @ApiProperty({ enum: ServiceType, example: ServiceType.FRAMED_ART })
  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType!: ServiceType;

  @ApiProperty({ example: 'uuid-of-material' })
  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @ApiProperty({ example: 80, description: 'Width in centimeters (10 - 3000cm)' })
  @IsNumber()
  @Min(10)
  @Max(3000)
  widthCm!: number;

  @ApiProperty({ example: 120, description: 'Height in centimeters (10 - 3000cm)' })
  @IsNumber()
  @Min(10)
  @Max(3000)
  heightCm!: number;

  @ApiProperty({ enum: Complexity, example: Complexity.MEDIUM })
  @IsEnum(Complexity)
  @IsNotEmpty()
  complexity!: Complexity;

  @ApiPropertyOptional({ enum: FrameOption, example: FrameOption.WOOD_MINIMAL })
  @IsEnum(FrameOption)
  @IsOptional()
  frameOption?: FrameOption;

  @ApiPropertyOptional({ example: 15, description: 'Distance in kilometers from studio' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  distanceKm?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether the user uploaded their own custom reference photo' })
  @IsBoolean()
  @IsOptional()
  isCustomReference?: boolean;
}
