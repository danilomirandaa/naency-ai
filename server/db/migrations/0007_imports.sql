CREATE TYPE "public"."import_batch_status" AS ENUM('review', 'committed', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."rule_match_type" AS ENUM('contains', 'exact');--> statement-breakpoint
CREATE TYPE "public"."rule_source" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TABLE "categorization_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"match_type" "rule_match_type" DEFAULT 'contains' NOT NULL,
	"pattern" text NOT NULL,
	"category_id" uuid NOT NULL,
	"rename_to" text,
	"source" "rule_source" DEFAULT 'user' NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorization_rules_pattern_length" CHECK (length("categorization_rules"."pattern") >= 3)
);
--> statement-breakpoint
ALTER TABLE "categorization_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"format" text NOT NULL,
	"layout" text NOT NULL,
	"status" "import_batch_status" DEFAULT 'review' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "import_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"date" date NOT NULL,
	"amount_cents" bigint NOT NULL,
	"description" text NOT NULL,
	"raw_description" text NOT NULL,
	"category_id" uuid,
	"rule_id" uuid,
	"include" boolean DEFAULT true NOT NULL,
	"remember_category" boolean DEFAULT false NOT NULL,
	"fingerprint" text NOT NULL,
	"duplicate_of_transaction_id" uuid
);
--> statement-breakpoint
ALTER TABLE "import_rows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "import_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "fingerprint" text;--> statement-breakpoint
ALTER TABLE "categorization_rules" ADD CONSTRAINT "categorization_rules_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorization_rules" ADD CONSTRAINT "categorization_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categorization_rules_unique_idx" ON "categorization_rules" USING btree ("workspace_id","match_type","pattern","source");--> statement-breakpoint
CREATE INDEX "categorization_rules_workspace_id_idx" ON "categorization_rules" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "import_batches_workspace_id_idx" ON "import_batches" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_rows_batch_position_idx" ON "import_rows" USING btree ("batch_id","position");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_account_fingerprint_idx" ON "transactions" USING btree ("account_id","fingerprint");