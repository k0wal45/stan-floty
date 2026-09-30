import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { items, rateUnitEnum } from "./items";

export const rentalStatusEnum = pgEnum("rental_status", [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const rentals = pgTable(
  "rentals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    itemId: uuid("item_id")
      .references(() => items.id)
      .notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerIdentifier: text("customer_identifier").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    initialEndDate: timestamp("initial_end_date", {
      withTimezone: true,
    }).notNull(),
    rateSnapshot: integer("rate_snapshot").notNull(),
    rateUnitSnapshot: rateUnitEnum("rate_unit_snapshot").notNull(),
    totalPrice: integer("total_price").notNull(),
    status: rentalStatusEnum("status").default("ACTIVE").notNull(),
    attachments: jsonb("attachments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("total_price_non_negative", sql`${table.totalPrice} >= 0`),
    check("rate_snapshot_positive", sql`${table.rateSnapshot} > 0`),
    check("end_date_after_start", sql`${table.endDate} > ${table.startDate}`),
  ]
);
