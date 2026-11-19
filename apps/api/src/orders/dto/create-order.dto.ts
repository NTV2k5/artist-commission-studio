import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Complexity, FrameOption, ServiceType } from '@studio/shared';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsEnum(ServiceType)
  @IsNotEmpty()
  serviceType!: ServiceType;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customReferenceUrls?: string[];

  @IsNumber()
  @Min(10)
  widthCm!: number;

  @IsNumber()
  @Min(10)
  heightCm!: number;

  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @IsEnum(Complexity)
  @IsNotEmpty()
  complexity!: Complexity;

  @IsEnum(FrameOption)
  @IsOptional()
  frameOption?: FrameOption;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  distanceKm?: number;

  @IsString()
  @IsOptional()
  scheduledStartDate?: string;

  @IsString()
  @IsOptional()
  scheduledEndDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
