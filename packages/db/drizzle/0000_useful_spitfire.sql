CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('draft', 'published', 'reserved', 'sold');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."lead_type" AS ENUM('whatsapp', 'form', 'call', 'financing', 'trade_in');--> statement-breakpoint
CREATE TABLE "tenant_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"template_id" text DEFAULT 't1' NOT NULL,
	"theme" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"whatsapp" text,
	"phone" text,
	"email" text,
	"address_line" text,
	"city" text,
	"state" text,
	"instagram" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" "vehicle_status" DEFAULT 'draft' NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"version" text,
	"model_year" integer NOT NULL,
	"manufacture_year" integer,
	"price_cents" bigint,
	"mileage_km" integer,
	"color" text,
	"fuel" text,
	"transmission" text,
	"doors" integer,
	"engine" text,
	"plate" text,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"fipe_code" text,
	"fipe_reference_code" integer,
	"fipe_price_cents" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"sold_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"type" "lead_type" NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"name" text,
	"phone" text,
	"email" text,
	"message" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fipe_brands" (
	"reference_code" integer NOT NULL,
	"vehicle_type" integer NOT NULL,
	"brand_code" text NOT NULL,
	"name" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fipe_brands_reference_code_vehicle_type_brand_code_pk" PRIMARY KEY("reference_code","vehicle_type","brand_code")
);
--> statement-breakpoint
CREATE TABLE "fipe_crawl_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fipe_model_years" (
	"reference_code" integer NOT NULL,
	"vehicle_type" integer NOT NULL,
	"brand_code" text NOT NULL,
	"model_code" text NOT NULL,
	"year_code" text NOT NULL,
	"year" integer NOT NULL,
	"fuel_code" integer NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fipe_model_years_reference_code_vehicle_type_brand_code_model_code_year_code_pk" PRIMARY KEY("reference_code","vehicle_type","brand_code","model_code","year_code")
);
--> statement-breakpoint
CREATE TABLE "fipe_models" (
	"reference_code" integer NOT NULL,
	"vehicle_type" integer NOT NULL,
	"brand_code" text NOT NULL,
	"model_code" text NOT NULL,
	"name" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fipe_models_reference_code_vehicle_type_brand_code_model_code_pk" PRIMARY KEY("reference_code","vehicle_type","brand_code","model_code")
);
--> statement-breakpoint
CREATE TABLE "fipe_prices" (
	"reference_code" integer NOT NULL,
	"vehicle_type" integer NOT NULL,
	"brand_code" text NOT NULL,
	"model_code" text NOT NULL,
	"year_code" text NOT NULL,
	"fipe_code" text NOT NULL,
	"price_cents" bigint NOT NULL,
	"brand_name" text,
	"model_name" text,
	"year" integer,
	"fuel_name" text,
	"month_label" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fipe_prices_reference_code_vehicle_type_brand_code_model_code_year_code_pk" PRIMARY KEY("reference_code","vehicle_type","brand_code","model_code","year_code")
);
--> statement-breakpoint
CREATE TABLE "fipe_reference_months" (
	"code" integer PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_email_idx" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "vehicle_photos_vehicle_idx" ON "vehicle_photos" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicles_tenant_status_idx" ON "vehicles" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "leads_tenant_status_idx" ON "leads" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "fipe_brands_name_idx" ON "fipe_brands" USING btree ("name");--> statement-breakpoint
CREATE INDEX "fipe_models_name_idx" ON "fipe_models" USING btree ("name");--> statement-breakpoint
CREATE INDEX "fipe_prices_fipe_code_idx" ON "fipe_prices" USING btree ("fipe_code");