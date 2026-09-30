"use server";

import { db } from "@/db";
import { rentals, items, payments, rentalExtensions } from "@/db/schema";
import { eq, and, desc, sql, or, ilike, lt, gt, gte, lte, ne } from "drizzle-orm";
import { requireAuthenticatedUser } from "@/lib/auth";
import {
  createRentalSchema,
  updateRentalSchema,
  extendRentalSchema,
  recordPaymentSchema,
} from "@/lib/validations/rental";
import { calculateRentalPrice, calculateBillingUnits } from "@/lib/pricing";
import { revalidatePath } from "next/cache";
import type { RentalWithPaymentInfo } from "@/types/rentals";
import { derivePaymentStatus } from "@/lib/pricing";
import type { RateUnit } from "@/types/items";

export async function createRental(formData: FormData) {
  const user = await requireAuthenticatedUser();

  const raw = {
    itemId: formData.get("itemId"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerIdentifier: formData.get("customerIdentifier"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    totalPriceOverride: formData.get("totalPriceOverride")
      ? Number(formData.get("totalPriceOverride"))
      : undefined,
  };

  const parsed = createRentalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  const { itemId, startDate, endDate, totalPriceOverride, ...customerData } =
    parsed.data;

  // Verify item belongs to tenant and is available
  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.tenantId, user.tenantId)))
    .limit(1);

  if (!item) {
    return { error: "Zasób nie został znaleziony" };
  }

  if (item.status === "MAINTENANCE") {
    return { error: "Zasób jest w serwisie i nie może być wypożyczony" };
  }

  // Check for date-overlapping non-cancelled rentals for this item
  // Overlap condition: existingStart < newEnd AND existingEnd > newStart
  const [conflict] = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(
      and(
        eq(rentals.itemId, itemId),
        eq(rentals.tenantId, user.tenantId),
        ne(rentals.status, "CANCELLED"),
        lt(rentals.startDate, endDate),
        gt(rentals.endDate, startDate)
      )
    )
    .limit(1);

  if (conflict) {
    return { error: "Zasób ma już wypożyczenie w tym zakresie dat. Wybierz inne daty." };
  }

  const rateSnapshot = item.rate;
  const rateUnitSnapshot = item.rateUnit as RateUnit;
  const calculatedPrice = calculateRentalPrice(
    startDate,
    endDate,
    rateSnapshot,
    rateUnitSnapshot
  );
  const totalPrice =
    totalPriceOverride !== undefined ? totalPriceOverride : calculatedPrice;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(rentals).values({
        tenantId: user.tenantId,
        itemId,
        ...customerData,
        startDate,
        endDate,
        initialEndDate: endDate,
        rateSnapshot,
        rateUnitSnapshot,
        totalPrice,
      });

      await tx
        .update(items)
        .set({ status: "RENTED", updatedAt: new Date() })
        .where(and(eq(items.id, itemId), eq(items.tenantId, user.tenantId)));
    });
  } catch {
    return { error: "Nie udało się utworzyć wypożyczenia. Spróbuj ponownie." };
  }

  revalidatePath("/wypozyczenia");
  revalidatePath("/przedmioty");
  return { success: true };
}

export async function getRentals({
  page = 1,
  search = "",
  status = "",
  sort = "created_desc",
  startFrom = "",
  startTo = "",
  endFrom = "",
  endTo = "",
  paymentStatus = "",
  customerIdentifier = "",
  itemName = "",
}: {
  page?: number;
  search?: string;
  status?: string;
  sort?: string;
  startFrom?: string;
  startTo?: string;
  endFrom?: string;
  endTo?: string;
  paymentStatus?: string;
  customerIdentifier?: string;
  itemName?: string;
} = {}) {
  const user = await requireAuthenticatedUser();
  const PAGE_SIZE = 20;

  const conditions = [eq(rentals.tenantId, user.tenantId)];

  if (search) {
    conditions.push(
      or(
        ilike(rentals.customerName, `%${search}%`),
        ilike(rentals.customerPhone, `%${search}%`)
      )!
    );
  }

  if (customerIdentifier) {
    conditions.push(ilike(rentals.customerIdentifier, `%${customerIdentifier}%`));
  }

  if (itemName) {
    conditions.push(ilike(items.name, `%${itemName}%`));
  }

  if (status && status !== "ALL") {
    conditions.push(
      eq(
        rentals.status,
        status as "ACTIVE" | "COMPLETED" | "CANCELLED"
      )
    );
  }

  if (startFrom) {
    const d = new Date(startFrom);
    if (!isNaN(d.getTime())) conditions.push(gte(rentals.startDate, d));
  }
  if (startTo) {
    const d = new Date(startTo);
    if (!isNaN(d.getTime())) conditions.push(lte(rentals.startDate, d));
  }
  if (endFrom) {
    const d = new Date(endFrom);
    if (!isNaN(d.getTime())) conditions.push(gte(rentals.endDate, d));
  }
  if (endTo) {
    const d = new Date(endTo);
    if (!isNaN(d.getTime())) conditions.push(lte(rentals.endDate, d));
  }

  const totalResult = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(rentals)
    .leftJoin(items, eq(items.id, rentals.itemId))
    .where(and(...conditions));

  const totalPages = Math.ceil((totalResult[0]?.count || 0) / PAGE_SIZE);

  let orderByClause;
  switch (sort) {
    case "start_desc":
      orderByClause = desc(rentals.startDate);
      break;
    case "start_asc":
      orderByClause = rentals.startDate;
      break;
    case "end_desc":
      orderByClause = desc(rentals.endDate);
      break;
    case "end_asc":
      orderByClause = rentals.endDate;
      break;
    case "created_desc":
    default:
      orderByClause = desc(rentals.createdAt);
      break;
  }

  const data = await db
    .select({
      id: rentals.id,
      tenantId: rentals.tenantId,
      itemId: rentals.itemId,
      customerName: rentals.customerName,
      customerPhone: rentals.customerPhone,
      customerIdentifier: rentals.customerIdentifier,
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      initialEndDate: rentals.initialEndDate,
      rateSnapshot: rentals.rateSnapshot,
      rateUnitSnapshot: rentals.rateUnitSnapshot,
      totalPrice: rentals.totalPrice,
      status: rentals.status,
      attachments: rentals.attachments,
      createdAt: rentals.createdAt,
      updatedAt: rentals.updatedAt,
      itemName: items.name,
      itemIdentifier: items.identifier,
      totalPaid: sql<number>`COALESCE((
        SELECT SUM(${payments.amount})
        FROM ${payments}
        WHERE ${payments.rentalId} = ${rentals.id}
      ), 0)`.mapWith(Number),
    })
    .from(rentals)
    .leftJoin(items, eq(items.id, rentals.itemId))
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  let rentalRows: RentalWithPaymentInfo[] = data.map((r) => ({
    ...r,
    attachments: (r.attachments as import("@/types/rentals").RentalAttachment[]) || null,
    itemName: r.itemName ?? "Usunięty zasób",
    itemIdentifier: r.itemIdentifier ?? "",
    rateUnitSnapshot: r.rateUnitSnapshot as RateUnit,
    status: r.status as "ACTIVE" | "COMPLETED" | "CANCELLED",
    paymentStatus: derivePaymentStatus(r.totalPrice, r.totalPaid),
  }));

  if (paymentStatus) {
    rentalRows = rentalRows.filter(r => r.paymentStatus === paymentStatus);
  }

  return { rentals: rentalRows, totalPages };
}

export async function updateRental(id: string, formData: FormData) {
  const user = await requireAuthenticatedUser();

  const raw = {
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerIdentifier: formData.get("customerIdentifier"),
    totalPriceOverride: Number(formData.get("totalPriceOverride")),
  };

  const parsed = updateRentalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  const [existing] = await db
    .select()
    .from(rentals)
    .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)))
    .limit(1);

  if (!existing) {
    return { error: "Wypożyczenie nie zostało znalezione" };
  }

  try {
    await db
      .update(rentals)
      .set({
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerIdentifier: parsed.data.customerIdentifier,
        totalPrice: parsed.data.totalPriceOverride,
        updatedAt: new Date(),
      })
      .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)));
  } catch {
    return { error: "Nie udało się zaktualizować wypożyczenia." };
  }

  revalidatePath("/wypozyczenia");
  return { success: true };
}

export async function extendRental(id: string, formData: FormData) {
  const user = await requireAuthenticatedUser();

  const raw = { newEndDate: formData.get("newEndDate") };
  const parsed = extendRentalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  const [rental] = await db
    .select()
    .from(rentals)
    .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)))
    .limit(1);

  if (!rental) {
    return { error: "Wypożyczenie nie zostało znalezione" };
  }

  if (rental.status !== "ACTIVE") {
    return { error: "Można przedłużyć tylko aktywne wypożyczenie" };
  }

  const newEndDate = parsed.data.newEndDate;
  if (newEndDate <= rental.endDate) {
    return {
      error: "Nowa data zakończenia musi być późniejsza niż aktualna",
    };
  }

  const rateUnit = rental.rateUnitSnapshot as RateUnit;
  const additionalUnits = calculateBillingUnits(
    rental.endDate,
    newEndDate,
    rateUnit
  );
  const additionalCost = additionalUnits * rental.rateSnapshot;

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(rentals)
        .set({
          endDate: newEndDate,
          totalPrice: rental.totalPrice + additionalCost,
          updatedAt: new Date(),
        })
        .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)));

      await tx.insert(rentalExtensions).values({
        rentalId: id,
        previousEndDate: rental.endDate,
        newEndDate,
        additionalCost,
      });
    });
  } catch {
    return { error: "Nie udało się przedłużyć wypożyczenia." };
  }

  revalidatePath("/wypozyczenia");
  return { success: true };
}

export async function completeRental(id: string) {
  const user = await requireAuthenticatedUser();

  const [rental] = await db
    .select()
    .from(rentals)
    .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)))
    .limit(1);

  if (!rental) {
    return { error: "Wypożyczenie nie zostało znalezione" };
  }

  if (rental.status !== "ACTIVE") {
    return { error: "Można zakończyć tylko aktywne wypożyczenie" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(rentals)
        .set({ status: "COMPLETED", updatedAt: new Date() })
        .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)));

      // Only set item to AVAILABLE if no other active rentals remain
      const [otherActive] = await tx
        .select({ id: rentals.id })
        .from(rentals)
        .where(
          and(
            eq(rentals.itemId, rental.itemId),
            eq(rentals.tenantId, user.tenantId),
            eq(rentals.status, "ACTIVE"),
            sql`${rentals.id} != ${id}`
          )
        )
        .limit(1);

      if (!otherActive) {
        await tx
          .update(items)
          .set({ status: "AVAILABLE", updatedAt: new Date() })
          .where(
            and(eq(items.id, rental.itemId), eq(items.tenantId, user.tenantId))
          );
      }
    });
  } catch {
    return { error: "Nie udało się zakończyć wypożyczenia." };
  }

  revalidatePath("/wypozyczenia");
  revalidatePath("/przedmioty");
  return { success: true };
}

export async function cancelRental(id: string) {
  const user = await requireAuthenticatedUser();

  const [rental] = await db
    .select()
    .from(rentals)
    .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)))
    .limit(1);

  if (!rental) {
    return { error: "Wypożyczenie nie zostało znalezione" };
  }

  if (rental.status !== "ACTIVE") {
    return { error: "Można anulować tylko aktywne wypożyczenie" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(rentals)
        .set({ status: "CANCELLED", updatedAt: new Date() })
        .where(and(eq(rentals.id, id), eq(rentals.tenantId, user.tenantId)));

      // Only set item to AVAILABLE if no other active rentals remain
      const [otherActive] = await tx
        .select({ id: rentals.id })
        .from(rentals)
        .where(
          and(
            eq(rentals.itemId, rental.itemId),
            eq(rentals.tenantId, user.tenantId),
            eq(rentals.status, "ACTIVE"),
            sql`${rentals.id} != ${id}`
          )
        )
        .limit(1);

      if (!otherActive) {
        await tx
          .update(items)
          .set({ status: "AVAILABLE", updatedAt: new Date() })
          .where(
            and(eq(items.id, rental.itemId), eq(items.tenantId, user.tenantId))
          );
      }
    });
  } catch {
    return { error: "Nie udało się anulować wypożyczenia." };
  }

  revalidatePath("/wypozyczenia");
  revalidatePath("/przedmioty");
  return { success: true };
}

export async function recordPayment(rentalId: string, formData: FormData) {
  const user = await requireAuthenticatedUser();

  const raw = {
    amount: Number(formData.get("amount")),
    method: formData.get("method"),
  };

  const parsed = recordPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  // Verify rental belongs to tenant
  const [rental] = await db
    .select({ id: rentals.id, tenantId: rentals.tenantId })
    .from(rentals)
    .where(and(eq(rentals.id, rentalId), eq(rentals.tenantId, user.tenantId)))
    .limit(1);

  if (!rental) {
    return { error: "Wypożyczenie nie zostało znalezione" };
  }

  try {
    await db.insert(payments).values({
      rentalId,
      tenantId: user.tenantId,
      amount: parsed.data.amount,
      method: parsed.data.method,
    });
  } catch {
    return { error: "Nie udało się zarejestrować płatności." };
  }

  revalidatePath("/wypozyczenia");
  return { success: true };
}

export async function getAvailableItems() {
  const user = await requireAuthenticatedUser();

  return db
    .select({
      id: items.id,
      name: items.name,
      identifier: items.identifier,
      rate: items.rate,
      rateUnit: items.rateUnit,
    })
    .from(items)
    .where(
      and(eq(items.tenantId, user.tenantId), ne(items.status, "MAINTENANCE"))
    )
    .orderBy(items.name);
}


export async function getRentalPayments(rentalId: string) {
  const user = await requireAuthenticatedUser();

  const [rental] = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(and(eq(rentals.id, rentalId), eq(rentals.tenantId, user.tenantId)))
    .limit(1);

  if (!rental) {
    throw new Error("Wypożyczenie nie zostało znalezione");
  }

  const data = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      paidAt: payments.paidAt,
    })
    .from(payments)
    .where(and(eq(payments.rentalId, rentalId), eq(payments.tenantId, user.tenantId)))
    .orderBy(desc(payments.paidAt));

  return data.map(p => ({ ...p, method: p.method as import("@/types/rentals").PaymentMethod }));
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadRentalAttachment(rentalId: string, formData: FormData) {
  try {
    const user = await requireAuthenticatedUser();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return { error: "Brak pliku" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: `Plik jest za duży (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksymalny rozmiar to 10 MB.` };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { error: "Niedozwolony typ pliku. Dozwolone: JPG, PNG, GIF, WebP, PDF." };
    }

    const [rental] = await db
      .select()
      .from(rentals)
      .where(and(eq(rentals.id, rentalId), eq(rentals.tenantId, user.tenantId)))
      .limit(1);

    if (!rental) {
      return { error: "Wypożyczenie nie zostało znalezione" };
    }

    const supabase = await import("@/lib/supabase/server").then(m => m.createClient());
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${user.tenantId}/rentals/${rentalId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("items")
      .upload(fileName, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      return { error: "Błąd przesyłania: " + uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage.from("items").getPublicUrl(fileName);

    const currentAttachments = (rental.attachments as import("@/types/rentals").RentalAttachment[]) || [];
    const newAttachment = {
      url: publicUrlData.publicUrl,
      name: file.name,
      uploadedAt: new Date().toISOString()
    };

    await db
      .update(rentals)
      .set({ attachments: [...currentAttachments, newAttachment], updatedAt: new Date() })
      .where(eq(rentals.id, rentalId));

    revalidatePath("/wypozyczenia");
    return { success: true };
  } catch {
    return { error: "Wystąpił nieoczekiwany błąd podczas przesyłania pliku. Spróbuj ponownie." };
  }
}

export async function deleteRentalAttachment(rentalId: string, attachmentUrl: string) {
  const user = await requireAuthenticatedUser();

  const [rental] = await db
    .select()
    .from(rentals)
    .where(and(eq(rentals.id, rentalId), eq(rentals.tenantId, user.tenantId)))
    .limit(1);

  if (!rental) {
    return { error: "Wypożyczenie nie zostało znalezione" };
  }

  const currentAttachments = (rental.attachments as import("@/types/rentals").RentalAttachment[]) || [];
  const newAttachments = currentAttachments.filter(a => a.url !== attachmentUrl);

  if (currentAttachments.length === newAttachments.length) {
    return { error: "Nie znaleziono załącznika" };
  }

  const supabase = await import("@/lib/supabase/server").then(m => m.createClient());
  const urlParts = attachmentUrl.split("/items/");
  if (urlParts.length === 2) {
    await supabase.storage.from("items").remove([urlParts[1]]);
  }

  await db
    .update(rentals)
    .set({ attachments: newAttachments.length > 0 ? newAttachments : null, updatedAt: new Date() })
    .where(eq(rentals.id, rentalId));

  revalidatePath("/wypozyczenia");
  return { success: true };
}
