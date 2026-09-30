import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const itemStatusEnum = pgEnum("item_status", [
  "AVAILABLE",
  "RENTED",
  "MAINTENANCE",
]);

export const rateUnitEnum = pgEnum("rate_unit", [
  "HOUR",
  "DAY",
  "WEEK",
  "MONTH",
]);

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  identifier: text("identifier").notNull(),
  rate: integer("rate").notNull(),
  rateUnit: rateUnitEnum("rate_unit").default("DAY").notNull(),
  status: itemStatusEnum("status").default("AVAILABLE").notNull(),
  imageUrl: text("image_url"),
  gallery: jsonb("gallery"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
