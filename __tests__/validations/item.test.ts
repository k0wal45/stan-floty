import { describe, it, expect } from "vitest";
import { createItemSchema } from "@/lib/validations/item";

describe("createItemSchema", () => {
  const validInput = {
    name: "Toyota Corolla",
    category: "Samochody osobowe",
    identifier: "WA12345",
    rate: 15000, // 150.00 PLN
    rateUnit: "DAY" as const,
  };

  it("accepts valid input", () => {
    const result = createItemSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts rate of 1 grosz", () => {
    const result = createItemSchema.safeParse({ ...validInput, rate: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createItemSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = createItemSchema.safeParse({ ...validInput, category: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty identifier", () => {
    const result = createItemSchema.safeParse({ ...validInput, identifier: "" });
    expect(result.success).toBe(false);
  });

  it("rejects rate of 0", () => {
    const result = createItemSchema.safeParse({ ...validInput, rate: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative rate", () => {
    const result = createItemSchema.safeParse({ ...validInput, rate: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rate", () => {
    const result = createItemSchema.safeParse({ ...validInput, rate: 100.5 });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = createItemSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 200 chars", () => {
    const result = createItemSchema.safeParse({
      ...validInput,
      name: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid rate units", () => {
    for (const unit of ["HOUR", "DAY", "WEEK", "MONTH"] as const) {
      const result = createItemSchema.safeParse({ ...validInput, rateUnit: unit });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid rate unit", () => {
    const result = createItemSchema.safeParse({ ...validInput, rateUnit: "YEAR" });
    expect(result.success).toBe(false);
  });

  it("rejects missing rate unit", () => {
    const { rateUnit: _, ...withoutUnit } = validInput;
    const result = createItemSchema.safeParse(withoutUnit);
    expect(result.success).toBe(false);
  });
});
