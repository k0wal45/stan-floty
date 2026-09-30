import { z } from "zod";

export const RENTAL_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;
export const PAYMENT_METHODS = ["CASH", "CARD", "BLIK", "TRANSFER"] as const;

export const createRentalSchema = z
  .object({
    itemId: z.string().uuid("Nieprawidłowy identyfikator zasobu"),
    customerName: z
      .string()
      .min(1, "Imię i nazwisko klienta jest wymagane")
      .max(200, "Imię i nazwisko może mieć maksymalnie 200 znaków"),
    customerPhone: z
      .string()
      .min(1, "Numer telefonu jest wymagany")
      .max(20, "Numer telefonu może mieć maksymalnie 20 znaków"),
    customerIdentifier: z
      .string()
      .min(1, "Identyfikator klienta (PESEL/NIP) jest wymagany")
      .max(50, "Identyfikator może mieć maksymalnie 50 znaków"),
    startDate: z.coerce.date({ message: "Data rozpoczęcia jest wymagana" }),
    endDate: z.coerce.date({ message: "Data zakończenia jest wymagana" }),
    totalPriceOverride: z
      .number()
      .int("Cena musi być liczbą całkowitą (grosze)")
      .nonnegative("Cena nie może być ujemna")
      .optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Data zakończenia musi być późniejsza niż data rozpoczęcia",
    path: ["endDate"],
  });

export const updateRentalSchema = z
  .object({
    customerName: z
      .string()
      .min(1, "Imię i nazwisko klienta jest wymagane")
      .max(200, "Imię i nazwisko może mieć maksymalnie 200 znaków"),
    customerPhone: z
      .string()
      .min(1, "Numer telefonu jest wymagany")
      .max(20, "Numer telefonu może mieć maksymalnie 20 znaków"),
    customerIdentifier: z
      .string()
      .min(1, "Identyfikator klienta (PESEL/NIP) jest wymagany")
      .max(50, "Identyfikator może mieć maksymalnie 50 znaków"),
    totalPriceOverride: z
      .number()
      .int("Cena musi być liczbą całkowitą (grosze)")
      .nonnegative("Cena nie może być ujemna"),
  });

export const extendRentalSchema = z.object({
  newEndDate: z.coerce.date({ message: "Nowa data zakończenia jest wymagana" }),
});

export const recordPaymentSchema = z.object({
  amount: z
    .number()
    .int("Kwota musi być liczbą całkowitą (grosze)")
    .positive("Kwota musi być większa od zera"),
  method: z.enum(PAYMENT_METHODS, {
    message: "Nieprawidłowa metoda płatności",
  }),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type UpdateRentalInput = z.infer<typeof updateRentalSchema>;
export type ExtendRentalInput = z.infer<typeof extendRentalSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
