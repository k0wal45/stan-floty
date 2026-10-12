import { describe, it, expect } from "vitest";
import {
  createTenantSchema,
  createTenantUserSchema,
  changeUserPasswordSchema,
  updateUserRoleSchema,
} from "@/lib/validations/admin";

describe("createTenantSchema", () => {
  const validInput = {
    companyName: "Wypożyczalnia Auto-Mix",
    nip: "1234567890",
    ownerFullName: "Jan Kowalski",
    ownerEmail: "jan@automix.pl",
    ownerPassword: "StrongPassword123",
  };

  it("accepts valid input", () => {
    const result = createTenantSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts input without NIP", () => {
    const withoutNip = { ...validInput };
    delete (withoutNip as Record<string, unknown>).nip;
    const result = createTenantSchema.safeParse(withoutNip);
    expect(result.success).toBe(true);
  });

  it("rejects short company name", () => {
    const result = createTenantSchema.safeParse({ ...validInput, companyName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = createTenantSchema.safeParse({ ...validInput, ownerPassword: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createTenantSchema.safeParse({ ...validInput, ownerEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("createTenantUserSchema", () => {
  const validInput = {
    tenantId: "123e4567-e89b-12d3-a456-426614174000",
    fullName: "Piotr Nowak",
    email: "piotr@automix.pl",
    password: "Password123",
    role: "MANAGER" as const,
  };

  it("accepts valid input", () => {
    const result = createTenantUserSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts all valid roles", () => {
    for (const role of ["ADMIN", "OWNER", "MANAGER", "STAFF"] as const) {
      const result = createTenantUserSchema.safeParse({ ...validInput, role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    const result = createTenantUserSchema.safeParse({ ...validInput, role: "SUPERUSER" });
    expect(result.success).toBe(false);
  });

  it("rejects non-uuid tenantId", () => {
    const result = createTenantUserSchema.safeParse({ ...validInput, tenantId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("changeUserPasswordSchema", () => {
  it("accepts valid uuid and min 8 password", () => {
    const result = changeUserPasswordSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      newPassword: "NewSecretPassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = changeUserPasswordSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserRoleSchema", () => {
  it("accepts valid uuid and valid role", () => {
    const result = updateUserRoleSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      role: "ADMIN",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = updateUserRoleSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      role: "GUEST",
    });
    expect(result.success).toBe(false);
  });
});
