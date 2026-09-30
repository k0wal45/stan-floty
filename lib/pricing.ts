import type { RateUnit } from "@/types/items";

/**
 * Calculate billing units between two dates for a given rate unit.
 *
 * DAY = 24-hour cycles; partial cycle beyond 59-min grace → +1 unit.
 * HOUR = 1-hour cycles; partial hours rounded up.
 * WEEK = 7×24-hour cycles; partial week rounded up.
 * MONTH = calendar months; partial month rounded up.
 */
export function calculateBillingUnits(
  start: Date,
  end: Date,
  rateUnit: RateUnit
): number {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;

  const HOUR_MS = 3_600_000;
  const DAY_MS = 24 * HOUR_MS;
  const WEEK_MS = 7 * DAY_MS;
  const GRACE_MS = 59 * 60_000; // 59-minute grace for DAY billing

  switch (rateUnit) {
    case "HOUR":
      return Math.ceil(diffMs / HOUR_MS);

    case "DAY": {
      const fullDays = Math.floor(diffMs / DAY_MS);
      const remainder = diffMs % DAY_MS;
      if (remainder === 0) return fullDays;
      return remainder > GRACE_MS ? fullDays + 1 : fullDays;
    }

    case "WEEK": {
      return Math.ceil(diffMs / WEEK_MS);
    }

    case "MONTH": {
      // Calendar month calculation
      let months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

      // Build the "exact N months later" date from start
      const exact = new Date(start);
      exact.setMonth(exact.getMonth() + months);

      if (end > exact) {
        months += 1;
      }

      return Math.max(months, 0);
    }
  }
}

/**
 * Calculate rental price in grosz.
 * price = billingUnits × ratePerUnit
 */
export function calculateRentalPrice(
  start: Date,
  end: Date,
  rate: number,
  rateUnit: RateUnit
): number {
  const units = calculateBillingUnits(start, end, rateUnit);
  return units * rate;
}

/**
 * Derive payment status from total price and total paid.
 */
export function derivePaymentStatus(
  totalPrice: number,
  totalPaid: number
): "PAID" | "PARTIALLY_PAID" | "UNPAID" {
  if (totalPaid <= 0) return "UNPAID";
  const balance = totalPrice - totalPaid;
  if (balance <= 0) return "PAID";
  return "PARTIALLY_PAID";
}
