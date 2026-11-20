import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { Complexity } from '@prisma/client';

export class UpdateQuoteDto {
  @ApiPropertyOptional({ enum: Complexity, description: 'Adjust brush complexity' })
  @IsOptional()
  @IsEnum(Complexity)
  complexity?: Complexity;

  @ApiPropertyOptional({ description: 'Confirmed artwork creation price in VNĐ' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  artworkPrice?: number;

  @ApiPropertyOptional({ description: 'Confirmed shipping or on-site travel fee in VNĐ' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingOrTravelFee?: number;
}
