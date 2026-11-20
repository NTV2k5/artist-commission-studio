import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'New order lifecycle status' })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional({ description: 'Scheduled on-site start date for wall murals (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduledStartDate?: string;

  @ApiPropertyOptional({ description: 'Scheduled on-site end date for wall murals (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduledEndDate?: string;
}
