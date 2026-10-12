"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Adres e-mail i hasło są wymagane" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: "Nieprawidłowy adres e-mail lub hasło" };
    }
  } catch (err) {
    return { error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." };
  }

  return { success: true };
}

export async function signup(formData: FormData) {
  try {
    await requireRole("ADMIN");
  } catch {
    return {
      error: "Brak uprawnień. Tylko administrator platformy może rejestrować nowe wypożyczalnie.",
    };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const companyName = (formData.get("companyName") as string)?.trim();

  if (!email || !password || !fullName || !companyName) {
    return { error: "Wszystkie pola są wymagane" };
  }

  if (password.length < 8) {
    return { error: "Hasło musi mieć minimum 8 znaków" };
  }

  try {
    // Check if email is already registered in the application
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return { error: "Konto z tym adresem e-mail już istnieje" };
    }

    const adminClient = createAdminClient();

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (authError || !authData.user) {
      return { error: authError?.message || "Nie udało się utworzyć konta w systemie." };
    }

    // Create tenant + user (OWNER) atomically
    try {
      await db.transaction(async (tx) => {
        const [tenant] = await tx
          .insert(tenants)
          .values({ name: companyName })
          .returning({ id: tenants.id });

        await tx.insert(users).values({
          id: authData.user!.id,
          tenantId: tenant.id,
          email,
          fullName,
          role: "OWNER",
        });
      });
    } catch {
      // Rollback auth user if DB insert failed
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { error: "Nie udało się utworzyć organizacji. Spróbuj ponownie." };
    }
  } catch (err) {
    return { error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/logowanie?msg=logged_out");
}


