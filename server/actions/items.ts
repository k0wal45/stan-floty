"use server";

import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";
import { requireAuthenticatedUser, requireRole } from "@/lib/auth";
import { createItemSchema, updateItemSchema } from "@/lib/validations/item";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createItem(formData: FormData) {
  const user = await requireRole("OWNER", "MANAGER");

  const raw = {
    name: formData.get("name"),
    category: formData.get("category"),
    identifier: formData.get("identifier"),
    rate: Number(formData.get("rate")),
    rateUnit: formData.get("rateUnit"),
  };

  const parsed = createItemSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Nieprawidłowe dane";
    return { error: firstError };
  }

  let imageUrl: string | null = null;
  const image = formData.get("image") as File | null;

  if (image && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      return { error: "Przesłany plik musi być zdjęciem" };
    }

    const supabase = await createClient();
    const fileExt = image.name.split('.').pop();
    const fileName = `${user.tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("items")
      .upload(fileName, image, {
        upsert: false,
        contentType: image.type,
      });

    if (uploadError) {
      return { error: "Błąd podczas przesyłania zdjęcia: " + uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("items")
      .getPublicUrl(fileName);

    imageUrl = publicUrlData.publicUrl;
  }

  try {
    await db.insert(items).values({
      tenantId: user.tenantId,
      name: parsed.data.name,
      category: parsed.data.category,
      identifier: parsed.data.identifier,
      rate: parsed.data.rate,
      rateUnit: parsed.data.rateUnit,
      imageUrl,
    });
  } catch {
    return { error: "Nie udało się dodać zasobu. Spróbuj ponownie." };
  }

  revalidatePath("/przedmioty");
  return { success: true };
}

export async function getItems({
  page = 1,
  search = "",
  status = "",
}: {
  page?: number;
  search?: string;
  status?: string;
} = {}) {
  const user = await requireAuthenticatedUser();
  const PAGE_SIZE = 20;

  const conditions = [eq(items.tenantId, user.tenantId)];

  if (search) {
    conditions.push(
      or(
        ilike(items.name, `%${search}%`),
        ilike(items.category, `%${search}%`)
      )!
    );
  }

  if (status && status !== "ALL") {
    conditions.push(eq(items.status, status as "AVAILABLE" | "RENTED" | "MAINTENANCE"));
  }

  const totalItems = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(items)
    .where(and(...conditions));

  const totalPages = Math.ceil((totalItems[0]?.count || 0) / PAGE_SIZE);

  const data = await db
    .select()
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(items.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { items: data, totalPages };
}

export async function updateItem(id: string, formData: FormData) {
  const user = await requireRole("OWNER", "MANAGER");

  const raw = {
    name: formData.get("name"),
    category: formData.get("category"),
    identifier: formData.get("identifier"),
    rate: Number(formData.get("rate")),
    rateUnit: formData.get("rateUnit"),
    status: formData.get("status"),
  };

  const parsed = updateItemSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Nieprawidłowe dane";
    return { error: firstError };
  }

  // Verify item belongs to tenant
  const [existing] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.tenantId, user.tenantId)))
    .limit(1);

  if (!existing) {
    return { error: "Zasób nie został znaleziony" };
  }

  let imageUrl = existing.imageUrl;
  const image = formData.get("image") as File | null;

  if (image && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      return { error: "Przesłany plik musi być zdjęciem" };
    }

    const supabase = await createClient();
    
    // Optional: attempt to remove old image if exists
    if (existing.imageUrl) {
      const urlParts = existing.imageUrl.split("/przedmioty/");
      if (urlParts.length === 2) {
        await supabase.storage.from("items").remove([urlParts[1]]);
      }
    }

    const fileExt = image.name.split('.').pop();
    const fileName = `${user.tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("items")
      .upload(fileName, image, { upsert: false, contentType: image.type });

    if (uploadError) {
      return { error: "Błąd podczas przesyłania zdjęcia: " + uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage.from("items").getPublicUrl(fileName);
    imageUrl = publicUrlData.publicUrl;
  }

  try {
    await db
      .update(items)
      .set({
        name: parsed.data.name,
        category: parsed.data.category,
        identifier: parsed.data.identifier,
        rate: parsed.data.rate,
        rateUnit: parsed.data.rateUnit,
        status: parsed.data.status,
        imageUrl,
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, id), eq(items.tenantId, user.tenantId)));
  } catch {
    return { error: "Nie udało się zaktualizować zasobu." };
  }

  revalidatePath("/przedmioty");
  return { success: true };
}

export async function deleteItem(id: string) {
  const user = await requireRole("OWNER", "MANAGER");

  const [existing] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.tenantId, user.tenantId)))
    .limit(1);

  if (!existing) {
    return { error: "Zasób nie został znaleziony" };
  }

  try {
    // Optional: remove image from storage
    if (existing.imageUrl) {
      const supabase = await createClient();
      const urlParts = existing.imageUrl.split("/przedmioty/");
      if (urlParts.length === 2) {
        await supabase.storage.from("items").remove([urlParts[1]]);
      }
    }

    await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.tenantId, user.tenantId)));
  } catch (error) {
    // If foreign key constraint fails (e.g. rentals exist)
    return { error: "Nie można usunąć tego zasobu. Prawdopodobnie posiada historię wypożyczeń." };
  }

  revalidatePath("/przedmioty");
  return { success: true };
}

