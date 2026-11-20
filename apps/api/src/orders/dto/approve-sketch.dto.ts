import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveSketchDto {
  @ApiPropertyOptional({ description: 'Optional feedback or approval notes from customer' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
