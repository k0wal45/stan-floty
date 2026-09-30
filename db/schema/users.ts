import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { tenants, userRoleEnum } from "./tenants";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // matches Supabase auth.users.id
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").default("STAFF").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
});
