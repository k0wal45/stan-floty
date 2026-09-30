import { describe, it, expect } from "vitest";
import {
  createRentalSchema,
  updateRentalSchema,
  extendRentalSchema,
  recordPaymentSchema,
} from "@/lib/validations/rental";

describe("createRentalSchema", () => {
  const validInput = {
    itemId: "550e8400-e29b-41d4-a716-446655440000",
    customerName: "Jan Kowalski",
    customerPhone: "600123456",
    customerIdentifier: "12345678901",
    startDate: "2025-09-01T10:00:00Z",
    endDate: "2025-09-04T10:00:00Z",
  };

  it("accepts valid input", () => {
    const result = createRentalSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with totalPriceOverride", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      totalPriceOverride: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts totalPriceOverride of 0 (free rental)", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      totalPriceOverride: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative totalPriceOverride", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      totalPriceOverride: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects endDate before startDate", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      startDate: "2025-09-04T10:00:00Z",
      endDate: "2025-09-01T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects endDate equal to startDate", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      startDate: "2025-09-01T10:00:00Z",
      endDate: "2025-09-01T10:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty customerName", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      customerName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty customerPhone", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      customerPhone: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty customerIdentifier", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      customerIdentifier: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid itemId", () => {
    const result = createRentalSchema.safeParse({
      ...validInput,
      itemId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = createRentalSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateRentalSchema", () => {
  const validInput = {
    customerName: "Jan Kowalski",
    customerPhone: "600123456",
    customerIdentifier: "12345678901",
    totalPriceOverride: 50000,
  };

  it("accepts valid input", () => {
    const result = updateRentalSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts totalPriceOverride of 0", () => {
    const result = updateRentalSchema.safeParse({
      ...validInput,
      totalPriceOverride: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative totalPriceOverride", () => {
    const result = updateRentalSchema.safeParse({
      ...validInput,
      totalPriceOverride: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer totalPriceOverride", () => {
    const result = updateRentalSchema.safeParse({
      ...validInput,
      totalPriceOverride: 100.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("extendRentalSchema", () => {
  it("accepts valid date", () => {
    const result = extendRentalSchema.safeParse({
      newEndDate: "2025-09-10T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing newEndDate", () => {
    const result = extendRentalSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("recordPaymentSchema", () => {
  it("accepts valid payment", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 5000,
      method: "CASH",
    });
    expect(result.success).toBe(true);
  });

  it("accepts 1 grosz", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 1,
      method: "BLIK",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 0,
      method: "CASH",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = recordPaymentSchema.safeParse({
      amount: -100,
      method: "CASH",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer amount", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 100.5,
      method: "CASH",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid methods", () => {
    for (const method of ["CASH", "CARD", "BLIK", "TRANSFER"] as const) {
      const result = recordPaymentSchema.safeParse({ amount: 1000, method });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid method", () => {
    const result = recordPaymentSchema.safeParse({
      amount: 1000,
      method: "BITCOIN",
    });
    expect(result.success).toBe(false);
  });
});
