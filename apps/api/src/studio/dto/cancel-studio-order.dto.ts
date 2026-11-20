import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelStudioOrderDto {
  @ApiProperty({ description: 'Artist reason for cancelling the order' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
