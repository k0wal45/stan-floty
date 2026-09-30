import { describe, it, expect } from "vitest";
import {
  calculateBillingUnits,
  calculateRentalPrice,
  derivePaymentStatus,
} from "@/lib/pricing";

describe("calculateBillingUnits", () => {
  describe("HOUR", () => {
    it("exactly 1 hour → 1 unit", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-01T11:00:00Z");
      expect(calculateBillingUnits(start, end, "HOUR")).toBe(1);
    });

    it("1 hour 1 minute → 2 units (rounds up)", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-01T11:01:00Z");
      expect(calculateBillingUnits(start, end, "HOUR")).toBe(2);
    });

    it("exactly 3 hours → 3 units", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-01T13:00:00Z");
      expect(calculateBillingUnits(start, end, "HOUR")).toBe(3);
    });

    it("0 duration → 0 units", () => {
      const d = new Date("2025-09-01T10:00:00Z");
      expect(calculateBillingUnits(d, d, "HOUR")).toBe(0);
    });

    it("negative duration → 0 units", () => {
      const start = new Date("2025-09-01T11:00:00Z");
      const end = new Date("2025-09-01T10:00:00Z");
      expect(calculateBillingUnits(start, end, "HOUR")).toBe(0);
    });
  });

  describe("DAY", () => {
    it("exactly 24 hours → 1 day", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-02T10:00:00Z");
      expect(calculateBillingUnits(start, end, "DAY")).toBe(1);
    });

    it("24h + 30min (within grace) → 1 day", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-02T10:30:00Z");
      expect(calculateBillingUnits(start, end, "DAY")).toBe(1);
    });

    it("24h + 59min (within grace) → 1 day", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-02T10:59:00Z");
      expect(calculateBillingUnits(start, end, "DAY")).toBe(1);
    });

    it("24h + 1h30min (exceeds grace) → 2 days", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-02T11:30:00Z");
      expect(calculateBillingUnits(start, end, "DAY")).toBe(2);
    });

    it("exactly 48 hours → 2 days", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-03T10:00:00Z");
      expect(calculateBillingUnits(start, end, "DAY")).toBe(2);
    });

    it("3 hours (> grace) → 1 day", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-01T13:00:00Z");
      expect(calculateBillingUnits(start, end, "DAY")).toBe(1);
    });

    it("30 minutes (within grace of first cycle) → 0 days", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-01T10:30:00Z");
      expect(calculateBillingUnits(start, end, "DAY")).toBe(0);
    });
  });

  describe("WEEK", () => {
    it("exactly 7 days → 1 week", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-08T10:00:00Z");
      expect(calculateBillingUnits(start, end, "WEEK")).toBe(1);
    });

    it("8 days → 2 weeks (rounds up)", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-09T10:00:00Z");
      expect(calculateBillingUnits(start, end, "WEEK")).toBe(2);
    });

    it("exactly 14 days → 2 weeks", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-15T10:00:00Z");
      expect(calculateBillingUnits(start, end, "WEEK")).toBe(2);
    });
  });

  describe("MONTH", () => {
    it("exactly 1 calendar month → 1 month", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-10-01T10:00:00Z");
      expect(calculateBillingUnits(start, end, "MONTH")).toBe(1);
    });

    it("1 month + 1 day → 2 months", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-10-02T10:00:00Z");
      expect(calculateBillingUnits(start, end, "MONTH")).toBe(2);
    });

    it("exactly 2 calendar months → 2 months", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-11-01T10:00:00Z");
      expect(calculateBillingUnits(start, end, "MONTH")).toBe(2);
    });

    it("year boundary: Dec → Jan → 1 month", () => {
      const start = new Date("2025-12-15T10:00:00Z");
      const end = new Date("2026-01-15T10:00:00Z");
      expect(calculateBillingUnits(start, end, "MONTH")).toBe(1);
    });

    it("15 days (less than 1 month) → 1 month", () => {
      const start = new Date("2025-09-01T10:00:00Z");
      const end = new Date("2025-09-16T10:00:00Z");
      expect(calculateBillingUnits(start, end, "MONTH")).toBe(1);
    });
  });
});

describe("calculateRentalPrice", () => {
  it("1 day at 15000 grosz → 15000", () => {
    const start = new Date("2025-09-01T10:00:00Z");
    const end = new Date("2025-09-02T10:00:00Z");
    expect(calculateRentalPrice(start, end, 15000, "DAY")).toBe(15000);
  });

  it("3 days at 15000 grosz → 45000", () => {
    const start = new Date("2025-09-01T10:00:00Z");
    const end = new Date("2025-09-04T10:00:00Z");
    expect(calculateRentalPrice(start, end, 15000, "DAY")).toBe(45000);
  });

  it("1 hour at 5000 grosz → 5000", () => {
    const start = new Date("2025-09-01T10:00:00Z");
    const end = new Date("2025-09-01T11:00:00Z");
    expect(calculateRentalPrice(start, end, 5000, "HOUR")).toBe(5000);
  });

  it("1 week at 50000 grosz → 50000", () => {
    const start = new Date("2025-09-01T10:00:00Z");
    const end = new Date("2025-09-08T10:00:00Z");
    expect(calculateRentalPrice(start, end, 50000, "WEEK")).toBe(50000);
  });

  it("1 month at 200000 grosz → 200000", () => {
    const start = new Date("2025-09-01T10:00:00Z");
    const end = new Date("2025-10-01T10:00:00Z");
    expect(calculateRentalPrice(start, end, 200000, "MONTH")).toBe(200000);
  });

  it("1 grosz rate, 1 hour → 1 grosz", () => {
    const start = new Date("2025-09-01T10:00:00Z");
    const end = new Date("2025-09-01T11:00:00Z");
    expect(calculateRentalPrice(start, end, 1, "HOUR")).toBe(1);
  });

  it("returns integer result", () => {
    const start = new Date("2025-09-01T10:00:00Z");
    const end = new Date("2025-09-04T10:00:00Z");
    const price = calculateRentalPrice(start, end, 333, "DAY");
    expect(Number.isInteger(price)).toBe(true);
    expect(price).toBe(999);
  });
});

describe("derivePaymentStatus", () => {
  it("UNPAID when no payments", () => {
    expect(derivePaymentStatus(10000, 0)).toBe("UNPAID");
  });

  it("PAID when fully paid", () => {
    expect(derivePaymentStatus(10000, 10000)).toBe("PAID");
  });

  it("PAID when overpaid", () => {
    expect(derivePaymentStatus(10000, 12000)).toBe("PAID");
  });

  it("PARTIALLY_PAID when partially paid", () => {
    expect(derivePaymentStatus(10000, 3000)).toBe("PARTIALLY_PAID");
  });

  it("PAID with exact multi-payment sum", () => {
    expect(derivePaymentStatus(10000, 10000)).toBe("PAID");
  });

  it("PARTIALLY_PAID with partial sum", () => {
    expect(derivePaymentStatus(10000, 5500)).toBe("PARTIALLY_PAID");
  });

  it("PAID with exact 1 grosz total", () => {
    expect(derivePaymentStatus(1, 1)).toBe("PAID");
  });

  it("UNPAID with zero total price and zero paid", () => {
    expect(derivePaymentStatus(0, 0)).toBe("UNPAID");
  });

  it("UNPAID when negative totalPaid", () => {
    expect(derivePaymentStatus(10000, -100)).toBe("UNPAID");
  });
});

