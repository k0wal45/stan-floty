CREATE TYPE "public"."item_status" AS ENUM('AVAILABLE', 'RENTED', 'MAINTENANCE');--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"identifier" text NOT NULL,
	"daily_rate" integer NOT NULL,
	"status" "item_status" DEFAULT 'AVAILABLE' NOT NULL,
	"image_url" text,
	"gallery" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;