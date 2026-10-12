import "server-only";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AuthenticatedUser, UserRole } from "@/types/auth";

/**
 * Returns the current authenticated user if valid, or null if unauthenticated.
 * Safe to use in pages or components that need conditional role branching.
 */
export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const [appUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!appUser) {
      return null;
    }

    return {
      userId: appUser.id,
      tenantId: appUser.tenantId,
      role: appUser.role,
      email: appUser.email,
      fullName: appUser.fullName,
    };
  } catch {
    return null;
  }
});

/**
 * Requires an authenticated user with a valid session and a linked

 * application user record. Returns trusted server-side context.
 *
 * Wrapped in React cache() to deduplicate DB/Auth calls across layout/page renders.
 */
export const requireAuthenticatedUser = cache(async (): Promise<AuthenticatedUser> => {
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
});

/**
 * Requires the authenticated user to have one of the specified roles.
 */
export const requireRole = cache(async (
  ...allowedRoles: UserRole[]
): Promise<AuthenticatedUser> => {
  const authUser = await requireAuthenticatedUser();

  if (!allowedRoles.includes(authUser.role)) {
    throw new Error("FORBIDDEN");
  }

  return authUser;
});

