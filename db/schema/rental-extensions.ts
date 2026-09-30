import {
  pgTable,
  uuid,
  integer,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { rentals } from "./rentals";

export const rentalExtensions = pgTable(
  "rental_extensions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rentalId: uuid("rental_id")
      .references(() => rentals.id)
      .notNull(),
    previousEndDate: timestamp("previous_end_date", {
      withTimezone: true,
    }).notNull(),
    newEndDate: timestamp("new_end_date", { withTimezone: true }).notNull(),
    additionalCost: integer("additional_cost").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("additional_cost_non_negative", sql`${table.additionalCost} >= 0`),
    check(
      "new_end_after_previous",
      sql`${table.newEndDate} > ${table.previousEndDate}`
    ),
  ]
);
