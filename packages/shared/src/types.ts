// ==============================================================================
// DOMAIN ENUMS
// ==============================================================================

export enum UserRole {
  ARTIST = 'ARTIST',
  CUSTOMER = 'CUSTOMER',
}

export enum ServiceType {
  FRAMED_ART = 'FRAMED_ART',
  WALL_MURAL = 'WALL_MURAL',
}

export enum Complexity {
  SIMPLE = 'SIMPLE',
  MEDIUM = 'MEDIUM',
  COMPLEX = 'COMPLEX',
}

export enum OrderStatus {
  PENDING_QUOTE = 'PENDING_QUOTE',
  AWAITING_DEPOSIT = 'AWAITING_DEPOSIT',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  SKETCHING = 'SKETCHING',
  PAINTING = 'PAINTING',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  SEPAY_VIETQR = 'SEPAY_VIETQR',
  CASH = 'CASH',
}

export enum MessageType {
  TEXT = 'TEXT',
  SKETCH_PROPOSAL = 'SKETCH_PROPOSAL',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
}

export enum SepayTxStatus {
  MATCHED = 'MATCHED',
  UNMATCHED_REVIEW = 'UNMATCHED_REVIEW',
}

export enum FrameOption {
  NONE = 'NONE',
  WOOD_MINIMAL = 'WOOD_MINIMAL',
  WOOD_ORNATE = 'WOOD_ORNATE',
  ALUMINUM_BLACK = 'ALUMINUM_BLACK',
  ALUMINUM_GOLD = 'ALUMINUM_GOLD',
}

// ==============================================================================
// DOMAIN INTERFACES / DTOS
// ==============================================================================

export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtistStudioConfigDto {
  id: string;
  artistName: string;
  bio: string;
  experienceYears: number;
  studioAddress: string;
  studioLat: number;
  studioLng: number;
  zaloUrl: string;
  messengerUrl: string;
  hotline: string;
  depositThreshold: number;
  depositPercent: number;
  minFramedAreaM2: number;
  minMuralAreaM2: number;
  freeSketchRevisions: number;
  freeKmRadius: number;
  feePerKm: number;
  simpleMultiplier: number;
  mediumMultiplier: number;
  complexMultiplier: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialDto {
  id: string;
  name: string;
  slug: string;
  serviceType: ServiceType;
  basePricePerM2: number;
  description: string;
  durabilityNote?: string | null;
  sampleImageUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtworkTemplateDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  serviceType: ServiceType;
  materialId: string;
  material?: MaterialDto;
  defaultComplexity: Complexity;
  dimensionsNote?: string | null;
  isFeatured: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDto {
  id: string;
  orderCode: string;
  customerId: string;
  customer?: UserDto;
  serviceType: ServiceType;
  templateId?: string | null;
  template?: ArtworkTemplateDto | null;
  customReferenceUrls: string[];
  widthCm: number;
  heightCm: number;
  materialId: string;
  material?: MaterialDto;
  complexity: Complexity;
  frameOption?: string | null;
  address: string;
  distanceKm: number;
  shippingOrTravelFee: number;
  artworkPrice: number;
  totalAmount: number;
  requireDeposit: boolean;
  depositAmount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  revisionCount: number;
  sketchApprovedAt?: Date | null;
  scheduledStartDate?: Date | null;
  scheduledEndDate?: Date | null;
  cancellationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderMessageDto {
  id: string;
  orderId: string;
  senderId: string;
  sender?: UserDto;
  content: string;
  attachmentUrls: string[];
  messageType: MessageType;
  createdAt: Date;
}

export interface SepayTransactionDto {
  id: string;
  sepayTxId: string;
  orderId?: string | null;
  amount: number;
  transferContent: string;
  gateway: string;
  rawPayload: Record<string, unknown>;
  status: SepayTxStatus;
  createdAt: Date;
}

// ==============================================================================
// PRICING CALCULATION TYPES
// ==============================================================================

export interface PricingConfigParams {
  depositThreshold: number;
  depositPercent: number;
  minFramedAreaM2: number;
  minMuralAreaM2: number;
  freeSketchRevisions: number;
  freeKmRadius: number;
  feePerKm: number;
  simpleMultiplier: number;
  mediumMultiplier: number;
  complexMultiplier: number;
}

export interface CalculatePriceInput {
  serviceType: ServiceType;
  widthCm: number;
  heightCm: number;
  materialBasePricePerM2: number;
  complexity: Complexity;
  frameOption?: FrameOption;
  distanceKm?: number;
  isCustomReference?: boolean;
  config?: Partial<PricingConfigParams>;
}

export interface CalculatePriceResult {
  billableAreaM2: number;
  rawAreaM2: number;
  materialRate: number;
  complexityMultiplier: number;
  artworkBasePrice: number;
  framePrice: number;
  shippingOrTravelFee: number;
  siteSurcharge: number;
  totalAmount: number;
  requireDeposit: boolean;
  depositAmount: number;
  remainingAmount: number;
}
