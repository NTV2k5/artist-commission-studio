import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReconcileSepayDto {
  @ApiProperty({ description: 'Order code to associate the transaction with (e.g. DH123456)' })
  @IsNotEmpty()
  @IsString()
  orderCode!: string;
}
