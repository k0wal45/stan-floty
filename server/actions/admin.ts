"use server";

import { db } from "@/db";
import { tenants, users, items, rentals, payments, rentalExtensions } from "@/db/schema";
import { eq, inArray, desc, count } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createTenantSchema,
  createTenantUserSchema,
  changeUserPasswordSchema,
  updateUserRoleSchema,
} from "@/lib/validations/admin";
import { revalidatePath } from "next/cache";
import type { AdminTenant, AdminTenantUser } from "@/types/admin";

/**
 * Returns all tenants in the system with their assigned users and basic resource counts.
 * Requires ADMIN role.
 */
export async function getAdminTenantsWithUsers(): Promise<{ tenants: AdminTenant[] }> {
  await requireRole("ADMIN");

  const allTenants = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      nip: tenants.nip,
      plan: tenants.plan,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt));

  if (allTenants.length === 0) {
    return { tenants: [] };
  }

  const allUsers = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.fullName);

  const itemsCounts = await db
    .select({
      tenantId: items.tenantId,
      count: count(items.id),
    })
    .from(items)
    .groupBy(items.tenantId);

  const rentalsCounts = await db
    .select({
      tenantId: rentals.tenantId,
      count: count(rentals.id),
    })
    .from(rentals)
    .groupBy(rentals.tenantId);

  const itemsMap = new Map<string, number>(
    itemsCounts.map((i) => [i.tenantId, Number(i.count)])
  );
  const rentalsMap = new Map<string, number>(
    rentalsCounts.map((r) => [r.tenantId, Number(r.count)])
  );

  const usersByTenant = new Map<string, AdminTenantUser[]>();
  for (const u of allUsers) {
    const list = usersByTenant.get(u.tenantId) ?? [];
    list.push({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      createdAt: u.createdAt,
    });
    usersByTenant.set(u.tenantId, list);
  }

  const result: AdminTenant[] = allTenants.map((t) => ({
    id: t.id,
    name: t.name,
    nip: t.nip,
    plan: t.plan,
    createdAt: t.createdAt,
    users: usersByTenant.get(t.id) ?? [],
    itemCount: itemsMap.get(t.id) ?? 0,
    rentalCount: rentalsMap.get(t.id) ?? 0,
  }));

  return { tenants: result };
}

/**
 * Creates a new organization (tenant) and its initial OWNER user.
 * Requires ADMIN role.
 */
export async function createTenantByAdmin(formData: FormData) {
  await requireRole("ADMIN");

  const raw = {
    companyName: formData.get("companyName"),
    nip: formData.get("nip") || undefined,
    ownerFullName: formData.get("ownerFullName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
  };

  const parsed = createTenantSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji danych." };
  }

  const { companyName, nip, ownerFullName, ownerEmail, ownerPassword } = parsed.data;

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, ownerEmail))
    .limit(1);

  if (existingUser) {
    return { error: "Użytkownik z podanym adresem e-mail już istnieje w systemie." };
  }

  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: { full_name: ownerFullName },
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Nie udało się utworzyć konta w systemie auth." };
  }

  try {
    await db.transaction(async (tx) => {
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: companyName,
          nip: nip || null,
        })
        .returning({ id: tenants.id });

      await tx.insert(users).values({
        id: authData.user!.id,
        tenantId: newTenant.id,
        email: ownerEmail,
        fullName: ownerFullName,
        role: "OWNER",
      });
    });
  } catch {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Błąd podczas zapisu wypożyczalni w bazie danych." };
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Deletes a tenant along with all its resources, rentals, payments and users.
 * Requires ADMIN role.
 */
export async function deleteTenantByAdmin(tenantId: string) {
  const admin = await requireRole("ADMIN");

  if (admin.tenantId === tenantId) {
    return { error: "Nie możesz usunąć organizacji, do której aktualnie należysz." };
  }

  const tenantUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.tenantId, tenantId));

  const userIds = tenantUsers.map((u) => u.id);

  try {
    await db.transaction(async (tx) => {
      await tx.delete(payments).where(eq(payments.tenantId, tenantId));

      const tenantRentals = await tx
        .select({ id: rentals.id })
        .from(rentals)
        .where(eq(rentals.tenantId, tenantId));

      const rentalIds = tenantRentals.map((r) => r.id);
      if (rentalIds.length > 0) {
        await tx
          .delete(rentalExtensions)
          .where(inArray(rentalExtensions.rentalId, rentalIds));
      }

      await tx.delete(rentals).where(eq(rentals.tenantId, tenantId));
      await tx.delete(items).where(eq(items.tenantId, tenantId));
      await tx.delete(users).where(eq(users.tenantId, tenantId));
      await tx.delete(tenants).where(eq(tenants.id, tenantId));
    });
  } catch {
    return { error: "Wystąpił błąd podczas usuwania wypożyczalni z bazy danych." };
  }

  const adminClient = createAdminClient();
  for (const uid of userIds) {
    await adminClient.auth.admin.deleteUser(uid);
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Adds a new user to an existing tenant.
 * Requires ADMIN role.
 */
export async function createTenantUserByAdmin(formData: FormData) {
  await requireRole("ADMIN");

  const raw = {
    tenantId: formData.get("tenantId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  };

  const parsed = createTenantUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji danych." };
  }

  const { tenantId, fullName, email, password, role } = parsed.data;

  const [tenantExists] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenantExists) {
    return { error: "Wybrana wypożyczalnia nie istnieje." };
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return { error: "Konto z tym adresem e-mail już istnieje." };
  }

  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Nie udało się utworzyć konta w systemie auth." };
  }

  try {
    await db.insert(users).values({
      id: authData.user!.id,
      tenantId,
      email,
      fullName,
      role,
    });
  } catch {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Nie udało się przypisać użytkownika do bazy danych." };
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Changes a user's password without viewing or exposing the old/new password.
 * Strictly write-only.
 * Requires ADMIN role.
 */
export async function changeUserPasswordByAdmin(formData: FormData) {
  await requireRole("ADMIN");

  const raw = {
    userId: formData.get("userId"),
    newPassword: formData.get("newPassword"),
  };

  const parsed = changeUserPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji hasła." };
  }

  const { userId, newPassword } = parsed.data;

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { error: "Nie udało się zaktualizować hasła użytkownika." };
  }

  return { success: true };
}

/**
 * Updates a user's role (e.g. OWNER, MANAGER, STAFF, ADMIN).
 * Requires ADMIN role.
 */
export async function updateUserRoleByAdmin(formData: FormData) {
  const currentAdmin = await requireRole("ADMIN");

  const raw = {
    userId: formData.get("userId"),
    role: formData.get("role"),
  };

  const parsed = updateUserRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Błąd walidacji roli." };
  }

  const { userId, role } = parsed.data;

  if (currentAdmin.userId === userId && role !== "ADMIN") {
    return { error: "Nie możesz odebrać samemu sobie roli administratora." };
  }

  await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Deletes a single user from the tenant and auth system.
 * Requires ADMIN role.
 */
export async function deleteUserByAdmin(userId: string) {
  const currentAdmin = await requireRole("ADMIN");

  if (currentAdmin.userId === userId) {
    return { error: "Nie możesz usunąć własnego konta administratora." };
  }

  const [targetUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!targetUser) {
    return { error: "Użytkownik nie został odnaleziony." };
  }

  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch {
    return { error: "Błąd podczas usuwania użytkownika z bazy danych." };
  }

  const adminClient = createAdminClient();
  await adminClient.auth.admin.deleteUser(userId);

  revalidatePath("/admin");
  return { success: true };
}

