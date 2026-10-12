import { z } from "zod";

export const createTenantSchema = z.object({
  companyName: z
    .string()
    .min(2, "Nazwa firmy musi mieć minimum 2 znaki")
    .max(200, "Nazwa firmy nie może przekraczać 200 znaków"),
  nip: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  ownerFullName: z
    .string()
    .min(2, "Imię i nazwisko właściciela musi mieć minimum 2 znaki")
    .max(100, "Imię i nazwisko nie może przekraczać 100 znaków"),
  ownerEmail: z
    .string()
    .email("Niepoprawny format adresu e-mail")
    .max(255),
  ownerPassword: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków"),
});

export const createTenantUserSchema = z.object({
  tenantId: z.string().uuid("Nieprawidłowy identyfikator wypożyczalni"),
  fullName: z
    .string()
    .min(2, "Imię i nazwisko musi mieć minimum 2 znaki")
    .max(100, "Imię i nazwisko nie może przekraczać 100 znaków"),
  email: z
    .string()
    .email("Niepoprawny format adresu e-mail")
    .max(255),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków"),
  role: z.enum(["ADMIN", "OWNER", "MANAGER", "STAFF"], {
    message: "Nieprawidłowa rola użytkownika",
  }),
});

export const changeUserPasswordSchema = z.object({
  userId: z.string().uuid("Nieprawidłowy identyfikator użytkownika"),
  newPassword: z
    .string()
    .min(8, "Nowe hasło musi mieć minimum 8 znaków"),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("Nieprawidłowy identyfikator użytkownika"),
  role: z.enum(["ADMIN", "OWNER", "MANAGER", "STAFF"], {
    message: "Nieprawidłowa rola użytkownika",
  }),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type CreateTenantUserInput = z.infer<typeof createTenantUserSchema>;
export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
