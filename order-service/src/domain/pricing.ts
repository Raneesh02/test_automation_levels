export type Priority = "standard" | "express" | "overnight";

export interface PriceBreakdown {
  baseRate: number;
  weightSurcharge: number;
  oversizeSurcharge: number;
  priorityMultiplier: number;
  total: number;
}

const RATE_PER_KM = 2.0;
const RATE_PER_KG = 0.5;
const OVERSIZE_THRESHOLD_KG = 20;
const OVERSIZE_SURCHARGE_RATE = 0.15;

const PRIORITY_MULTIPLIERS: Record<Priority, number> = {
  standard: 1.0,
  express: 1.5,
  overnight: 2.0,
};

export function calculatePrice(
  weightKg: number,
  distanceKm: number,
  priority: Priority
): PriceBreakdown {
  if (weightKg <= 0) throw new Error("Weight must be greater than 0");
  if (distanceKm <= 0) throw new Error("Distance must be greater than 0");

  const baseRate = distanceKm * RATE_PER_KM;
  const weightSurcharge = weightKg * RATE_PER_KG;
  const subtotal = baseRate + weightSurcharge;

  const oversizeSurcharge =
    weightKg > OVERSIZE_THRESHOLD_KG ? subtotal * OVERSIZE_SURCHARGE_RATE : 0;

  const priorityMultiplier = PRIORITY_MULTIPLIERS[priority];
  const total =
    Math.round((subtotal + oversizeSurcharge) * priorityMultiplier * 100) /
    100;

  return { baseRate, weightSurcharge, oversizeSurcharge, priorityMultiplier, total };
}
