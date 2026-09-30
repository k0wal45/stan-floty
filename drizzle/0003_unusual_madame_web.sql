CREATE TYPE "public"."rate_unit" AS ENUM('HOUR', 'DAY', 'WEEK', 'MONTH');--> statement-breakpoint
ALTER TABLE "items" RENAME COLUMN "daily_rate" TO "rate";--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "rate_unit" "rate_unit" DEFAULT 'DAY' NOT NULL;