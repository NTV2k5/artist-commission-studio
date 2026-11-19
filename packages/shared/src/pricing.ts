import {
  CalculatePriceInput,
  CalculatePriceResult,
  Complexity,
  FrameOption,
  PricingConfigParams,
  ServiceType,
} from './types';

export const DEFAULT_PRICING_CONFIG: PricingConfigParams = {
  depositThreshold: 1500000, // 1,500,000 VNĐ
  depositPercent: 40,        // 40%
  minFramedAreaM2: 0.2,      // 0.2 m²
  minMuralAreaM2: 1.0,       // 1.0 m²
  freeSketchRevisions: 2,    // 2 free revision rounds
  freeKmRadius: 10,          // 10 km free
  feePerKm: 15000,           // 15,000 VNĐ/km
  simpleMultiplier: 1.0,
  mediumMultiplier: 1.35,
  complexMultiplier: 1.8,
};

/**
 * Calculates frame price based on frame option and area in m²
 */
export function calculateFramePrice(frameOption: FrameOption | undefined, areaM2: number): number {
  if (!frameOption || frameOption === FrameOption.NONE) {
    return 0;
  }

  switch (frameOption) {
    case FrameOption.WOOD_MINIMAL:
      return Math.round(200000 * areaM2 + 100000);
    case FrameOption.WOOD_ORNATE:
      return Math.round(450000 * areaM2 + 250000);
    case FrameOption.ALUMINUM_BLACK:
      return Math.round(280000 * areaM2 + 150000);
    case FrameOption.ALUMINUM_GOLD:
      return Math.round(320000 * areaM2 + 180000);
    default:
      return 0;
  }
}

/**
 * Calculates shipping fee for framed art based on distance and size
 */
export function calculateFramedArtShippingFee(distanceKm: number, areaM2: number): number {
  const baseShipping = 50000;
  const distanceFee = Math.max(0, distanceKm) * 8000;
  let oversizedFee = 0;

  if (areaM2 > 2.0) {
    oversizedFee = 250000;
  } else if (areaM2 > 1.2) {
    oversizedFee = 100000;
  }

  return Math.round(baseShipping + distanceFee + oversizedFee);
}

/**
 * Calculates travel fee for wall mural projects based on studio distance
 */
export function calculateMuralTravelFee(
  distanceKm: number,
  freeKmRadius: number,
  feePerKm: number
): number {
  const billableKm = Math.max(0, distanceKm - freeKmRadius);
  return Math.round(billableKm * feePerKm);
}

/**
 * Calculates site surcharge (e.g. scaffolding for high walls > 3m)
 */
export function calculateMuralSiteSurcharge(heightCm: number): number {
  if (heightCm <= 300) {
    return 0;
  }
  const extraMeters = Math.ceil((heightCm - 300) / 100);
  return Math.round(500000 + extraMeters * 200000);
}

/**
 * Main pricing engine adhering strictly to GEMINI.md Section 2.3
 */
export function calculateOrderPricing(input: CalculatePriceInput): CalculatePriceResult {
  const config: PricingConfigParams = {
    ...DEFAULT_PRICING_CONFIG,
    ...input.config,
  };

  const rawAreaM2 = (input.widthCm * input.heightCm) / 10000;
  const minBillableArea =
    input.serviceType === ServiceType.FRAMED_ART
      ? config.minFramedAreaM2
      : config.minMuralAreaM2;

  const billableAreaM2 = Math.max(rawAreaM2, minBillableArea);

  let complexityMultiplier = config.simpleMultiplier;
  if (input.complexity === Complexity.MEDIUM) {
    complexityMultiplier = config.mediumMultiplier;
  } else if (input.complexity === Complexity.COMPLEX) {
    complexityMultiplier = config.complexMultiplier;
  }

  const materialRate = input.materialBasePricePerM2;
  const artworkBasePrice = Math.round(billableAreaM2 * materialRate * complexityMultiplier);

  let framePrice = 0;
  let shippingOrTravelFee = 0;
  let siteSurcharge = 0;

  const distanceKm = input.distanceKm ?? 0;

  if (input.serviceType === ServiceType.FRAMED_ART) {
    framePrice = calculateFramePrice(input.frameOption, billableAreaM2);
    shippingOrTravelFee = calculateFramedArtShippingFee(distanceKm, billableAreaM2);
  } else {
    // WALL_MURAL
    shippingOrTravelFee = calculateMuralTravelFee(distanceKm, config.freeKmRadius, config.feePerKm);
    siteSurcharge = calculateMuralSiteSurcharge(input.heightCm);
  }

  const totalAmount = artworkBasePrice + framePrice + shippingOrTravelFee + siteSurcharge;

  // Mandatory Deposit Rules:
  // 1. totalAmount >= depositThreshold
  // 2. OR any WALL_MURAL order
  // 3. OR custom reference upload order
  const requireDeposit =
    totalAmount >= config.depositThreshold ||
    input.serviceType === ServiceType.WALL_MURAL ||
    Boolean(input.isCustomReference);

  const depositAmount = requireDeposit
    ? Math.round(totalAmount * (config.depositPercent / 100))
    : 0;

  const remainingAmount = totalAmount - depositAmount;

  return {
    billableAreaM2: Number(billableAreaM2.toFixed(3)),
    rawAreaM2: Number(rawAreaM2.toFixed(3)),
    materialRate,
    complexityMultiplier,
    artworkBasePrice,
    framePrice,
    shippingOrTravelFee,
    siteSurcharge,
    totalAmount,
    requireDeposit,
    depositAmount,
    remainingAmount,
  };
}

/**
 * Alias for calculateOrderPricing matching commission configurator specifications
 */
export const calculateCommissionPrice = calculateOrderPricing;

