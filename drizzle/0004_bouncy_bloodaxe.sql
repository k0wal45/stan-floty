CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'CARD', 'BLIK', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."rental_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amount_positive" CHECK ("payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "rental_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_id" uuid NOT NULL,
	"previous_end_date" timestamp with time zone NOT NULL,
	"new_end_date" timestamp with time zone NOT NULL,
	"additional_cost" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "additional_cost_non_negative" CHECK ("rental_extensions"."additional_cost" >= 0),
	CONSTRAINT "new_end_after_previous" CHECK ("rental_extensions"."new_end_date" > "rental_extensions"."previous_end_date")
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_identifier" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"initial_end_date" timestamp with time zone NOT NULL,
	"rate_snapshot" integer NOT NULL,
	"rate_unit_snapshot" "rate_unit" NOT NULL,
	"total_price" integer NOT NULL,
	"status" "rental_status" DEFAULT 'ACTIVE' NOT NULL,
	"attachments" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "total_price_non_negative" CHECK ("rentals"."total_price" >= 0),
	CONSTRAINT "rate_snapshot_positive" CHECK ("rentals"."rate_snapshot" > 0),
	CONSTRAINT "end_date_after_start" CHECK ("rentals"."end_date" > "rentals"."start_date")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;