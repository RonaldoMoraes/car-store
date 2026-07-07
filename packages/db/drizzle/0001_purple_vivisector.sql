CREATE TABLE "fipe_year_models" (
	"reference_code" integer NOT NULL,
	"vehicle_type" integer NOT NULL,
	"brand_code" text NOT NULL,
	"year" integer NOT NULL,
	"model_code" text NOT NULL,
	"name" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fipe_year_models_reference_code_vehicle_type_brand_code_year_model_code_pk" PRIMARY KEY("reference_code","vehicle_type","brand_code","year","model_code")
);
--> statement-breakpoint
CREATE TABLE "tenant_modules" (
	"tenant_id" uuid NOT NULL,
	"module" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_modules_tenant_id_module_pk" PRIMARY KEY("tenant_id","module")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "modules" jsonb;--> statement-breakpoint
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;