import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Imię i nazwisko jest wymagane")
    .max(200, "Imię i nazwisko może mieć maksymalnie 200 znaków"),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa organizacji jest wymagana")
    .max(200, "Nazwa organizacji może mieć maksymalnie 200 znaków"),
  nip: z
    .string()
    .max(20, "NIP może mieć maksymalnie 20 znaków")
    .optional()
    .or(z.literal("")),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    confirmPassword: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export const createMemberSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy adres e-mail"),
  fullName: z
    .string()
    .min(1, "Imię i nazwisko jest wymagane")
    .max(200, "Imię i nazwisko może mieć maksymalnie 200 znaków"),
  role: z.enum(["MANAGER", "STAFF"], {
    message: "Nieprawidłowa rola",
  }),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
