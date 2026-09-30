import "server-only";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { AuthenticatedUser, UserRole } from "@/types/auth";

/**
 * Requires an authenticated user with a valid session and a linked
 * application user record. Returns trusted server-side context.
 *
 * Redirects to /auth/logout (which clears session and goes to /login)
 * on missing/invalid session or missing user record to prevent redirect loops.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/logout");
  }

  const [appUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!appUser) {
    redirect("/auth/logout");
  }

  return {
    userId: appUser.id,
    tenantId: appUser.tenantId,
    role: appUser.role,
    email: appUser.email,
    fullName: appUser.fullName,
  };
}

/**
 * Requires the authenticated user to have one of the specified roles.
 * Returns the authenticated user context if authorized.
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthenticatedUser> {
  const authUser = await requireAuthenticatedUser();

  if (!allowedRoles.includes(authUser.role)) {
    throw new Error("FORBIDDEN");
  }

  return authUser;
}
