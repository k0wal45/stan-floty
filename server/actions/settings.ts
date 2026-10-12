"use server";

import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuthenticatedUser, requireRole } from "@/lib/auth";
import {
  updateProfileSchema,
  updateOrganizationSchema,
  createMemberSchema,
  updatePasswordSchema,
} from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ── Profile (any authenticated user) ────────────────────────────

export async function updateProfile(formData: FormData) {
  const user = await requireAuthenticatedUser();

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  try {
    await db
      .update(users)
      .set({ fullName: parsed.data.fullName, updatedAt: new Date() })
      .where(eq(users.id, user.userId));
  } catch {
    return { error: "Nie udało się zaktualizować profilu." };
  }

  revalidatePath("/ustawienia");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const user = await requireAuthenticatedUser();

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return { error: "Nie udało się zmienić hasła. Sprawdź, czy jesteś poprawnie zalogowany." };
    }
  } catch (err) {
    return { error: "Wystąpił nieoczekiwany błąd podczas zmiany hasła." };
  }

  return { success: true };
}


// ── Organization (OWNER only) ───────────────────────────────────

export async function getOrganization() {
  const user = await requireAuthenticatedUser();

  const [tenant] = await db
    .select({ name: tenants.name, nip: tenants.nip })
    .from(tenants)
    .where(eq(tenants.id, user.tenantId))
    .limit(1);

  return tenant ?? null;
}

export async function updateOrganization(formData: FormData) {
  const user = await requireRole("OWNER");

  const parsed = updateOrganizationSchema.safeParse({
    name: formData.get("name"),
    nip: formData.get("nip"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  try {
    await db
      .update(tenants)
      .set({
        name: parsed.data.name,
        nip: parsed.data.nip || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, user.tenantId));
  } catch {
    return { error: "Nie udało się zaktualizować organizacji." };
  }

  revalidatePath("/ustawienia");
  return { success: true };
}

// ── Team Members (OWNER only) ───────────────────────────────────

export async function getTeamMembers() {
  const user = await requireRole("OWNER");

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, user.tenantId))
    .orderBy(users.createdAt);

  return members;
}

export async function createMember(formData: FormData) {
  const user = await requireRole("OWNER");

  const parsed = createMemberSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" };
  }

  // Check if email already exists in this tenant
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing) {
    return { error: "Użytkownik z tym adresem e-mail już istnieje" };
  }

  try {
    const admin = createAdminClient();

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return {
        error: "Nie udało się utworzyć konta: " + (authError?.message ?? "Nieznany błąd"),
      };
    }

    await db.insert(users).values({
      id: authData.user.id,
      tenantId: user.tenantId,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Wystąpił błąd podczas dodawania członka zespołu." };
  }

  revalidatePath("/ustawienia");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const user = await requireRole("OWNER");

  if (memberId === user.userId) {
    return { error: "Nie możesz usunąć swojego własnego konta" };
  }

  const [member] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, memberId), eq(users.tenantId, user.tenantId)))
    .limit(1);

  if (!member) {
    return { error: "Członek zespołu nie został znaleziony" };
  }

  try {
    const admin = createAdminClient();

    // Remove from app DB first
    await db
      .delete(users)
      .where(and(eq(users.id, memberId), eq(users.tenantId, user.tenantId)));

    // Then remove from Supabase auth
    await admin.auth.admin.deleteUser(memberId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się usunąć członka zespołu." };
  }

  revalidatePath("/ustawienia");
  return { success: true };
}
