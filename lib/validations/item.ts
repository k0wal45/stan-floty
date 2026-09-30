import { z } from "zod";

export const RATE_UNITS = ["HOUR", "DAY", "WEEK", "MONTH"] as const;

export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa jest wymagana")
    .max(200, "Nazwa może mieć maksymalnie 200 znaków"),
  category: z
    .string()
    .min(1, "Kategoria jest wymagana")
    .max(100, "Kategoria może mieć maksymalnie 100 znaków"),
  identifier: z
    .string()
    .min(1, "Identyfikator jest wymagany")
    .max(100, "Identyfikator może mieć maksymalnie 100 znaków"),
  rate: z
    .number()
    .int("Stawka musi być liczbą całkowitą (grosze)")
    .positive("Stawka musi być większa od zera"),
  rateUnit: z.enum(RATE_UNITS, {
    message: "Nieprawidłowa jednostka rozliczeniowa",
  }),
});

export const updateItemSchema = createItemSchema.extend({
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE"], {
    message: "Nieprawidłowy status zasobu",
  }),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
