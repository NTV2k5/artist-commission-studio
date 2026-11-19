import { z } from 'zod';
import {
  Complexity,
  FrameOption,
  MessageType,
  OrderStatus,
  PaymentMethod,
  SepayTxStatus,
  ServiceType,
  UserRole,
} from './types';

export const UserRoleSchema = z.nativeEnum(UserRole);
export const ServiceTypeSchema = z.nativeEnum(ServiceType);
export const ComplexitySchema = z.nativeEnum(Complexity);
export const OrderStatusSchema = z.nativeEnum(OrderStatus);
export const PaymentMethodSchema = z.nativeEnum(PaymentMethod);
export const MessageTypeSchema = z.nativeEnum(MessageType);
export const SepayTxStatusSchema = z.nativeEnum(SepayTxStatus);
export const FrameOptionSchema = z.nativeEnum(FrameOption);

export const CalculatePriceInputSchema = z.object({
  serviceType: ServiceTypeSchema,
  widthCm: z.number().positive(),
  heightCm: z.number().positive(),
  materialBasePricePerM2: z.number().positive(),
  complexity: ComplexitySchema,
  frameOption: FrameOptionSchema.optional(),
  distanceKm: z.number().min(0).optional().default(0),
  isCustomReference: z.boolean().optional().default(false),
});

export const PricingEstimateRequestSchema = z.object({
  serviceType: ServiceTypeSchema,
  materialId: z.string().min(1, 'Material ID is required'),
  widthCm: z.number().min(10, 'Width must be at least 10cm').max(3000, 'Width cannot exceed 30m'),
  heightCm: z.number().min(10, 'Height must be at least 10cm').max(3000, 'Height cannot exceed 30m'),
  complexity: ComplexitySchema.default(Complexity.MEDIUM),
  frameOption: FrameOptionSchema.optional().default(FrameOption.NONE),
  distanceKm: z.number().min(0).optional().default(0),
  isCustomReference: z.boolean().optional().default(false),
});

export type PricingEstimateRequest = z.infer<typeof PricingEstimateRequestSchema>;

export const CreateOrderSchema = z.object({
  serviceType: ServiceTypeSchema,
  templateId: z.string().uuid().optional(),
  customReferenceUrls: z.array(z.string().url()).optional().default([]),
  widthCm: z.number().min(10, 'Width must be at least 10cm').max(3000, 'Width cannot exceed 30m'),
  heightCm: z.number().min(10, 'Height must be at least 10cm').max(3000, 'Height cannot exceed 30m'),
  materialId: z.string().uuid(),
  complexity: ComplexitySchema.default(Complexity.MEDIUM),
  frameOption: FrameOptionSchema.optional(),
  address: z.string().min(5, 'Address is too short'),
  distanceKm: z.number().min(0).optional().default(0),
  paymentMethod: PaymentMethodSchema.default(PaymentMethod.SEPAY_VIETQR),
  scheduledStartDate: z.string().datetime().optional(),
  scheduledEndDate: z.string().datetime().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  cancellationReason: z.string().optional(),
});

export const UpdateArtistStudioConfigSchema = z.object({
  artistName: z.string().min(2).optional(),
  bio: z.string().min(10).optional(),
  experienceYears: z.number().int().min(0).optional(),
  studioAddress: z.string().min(5).optional(),
  studioLat: z.number().optional(),
  studioLng: z.number().optional(),
  zaloUrl: z.string().url().optional(),
  messengerUrl: z.string().url().optional(),
  hotline: z.string().min(8).optional(),
  depositThreshold: z.number().positive().optional(),
  depositPercent: z.number().min(10).max(100).optional(),
  minFramedAreaM2: z.number().positive().optional(),
  minMuralAreaM2: z.number().positive().optional(),
  freeSketchRevisions: z.number().int().min(0).optional(),
  freeKmRadius: z.number().min(0).optional(),
  feePerKm: z.number().min(0).optional(),
  simpleMultiplier: z.number().positive().optional(),
  mediumMultiplier: z.number().positive().optional(),
  complexMultiplier: z.number().positive().optional(),
});

export const SepayWebhookPayloadSchema = z.object({
  id: z.number().or(z.string()),
  gateway: z.string(),
  transactionDate: z.string(),
  accountNumber: z.string(),
  subAccount: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  content: z.string(),
  transferType: z.string(),
  description: z.string().nullable().optional(),
  transferAmount: z.number(),
  referenceCode: z.string().nullable().optional(),
  accumulated: z.number().optional(),
});
