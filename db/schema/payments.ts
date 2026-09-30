import {
  pgTable,
  uuid,
  integer,
  timestamp,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { rentals } from "./rentals";
import { tenants } from "./tenants";

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "CARD",
  "BLIK",
  "TRANSFER",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rentalId: uuid("rental_id")
      .references(() => rentals.id)
      .notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    amount: integer("amount").notNull(),
    method: paymentMethodEnum("method").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("amount_positive", sql`${table.amount} > 0`)]
);
