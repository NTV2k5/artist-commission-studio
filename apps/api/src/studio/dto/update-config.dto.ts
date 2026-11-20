import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateStudioConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  artistName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studioAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  studioLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  studioLng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zaloUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messengerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hotline?: string;

  @ApiPropertyOptional({ description: 'Threshold in VNĐ requiring mandatory deposit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depositThreshold?: number;

  @ApiPropertyOptional({ description: 'Deposit percentage (e.g. 40 for 40%)' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  depositPercent?: number;

  @ApiPropertyOptional({ description: 'Minimum billable area for framed art in m²' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  minFramedAreaM2?: number;

  @ApiPropertyOptional({ description: 'Minimum billable area for wall murals in m²' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  minMuralAreaM2?: number;

  @ApiPropertyOptional({ description: 'Number of free sketch revision rounds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeSketchRevisions?: number;

  @ApiPropertyOptional({ description: 'Free travel distance radius in km' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  freeKmRadius?: number;

  @ApiPropertyOptional({ description: 'Travel surcharge fee per km in VNĐ' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  feePerKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  simpleMultiplier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  mediumMultiplier?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  complexMultiplier?: number;
}
