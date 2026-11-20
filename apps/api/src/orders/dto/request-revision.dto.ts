import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestRevisionDto {
  @ApiPropertyOptional({ description: 'Detailed modification requests or notes for the artist' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
