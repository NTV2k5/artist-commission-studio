import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SepayWebhookDto {
  @IsNotEmpty()
  id!: number | string;

  @IsString()
  @IsNotEmpty()
  gateway!: string;

  @IsString()
  @IsOptional()
  transactionDate?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  subAccount?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  transferType?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  transferAmount!: number;

  @IsString()
  @IsOptional()
  referenceCode?: string;

  @IsNumber()
  @IsOptional()
  accumulated?: number;
}
