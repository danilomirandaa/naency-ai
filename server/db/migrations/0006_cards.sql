CREATE TABLE "card_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"reference_month" text NOT NULL,
	"closing_date" date NOT NULL,
	"due_date" date NOT NULL,
	"paid_at" timestamp with time zone,
	"payment_transfer_group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_invoices_reference_month" CHECK ("card_invoices"."reference_month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
ALTER TABLE "card_invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_card_details" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"closing_day" integer NOT NULL,
	"due_day" integer NOT NULL,
	"limit_cents" bigint,
	"default_payment_account_id" uuid,
	CONSTRAINT "credit_card_closing_day" CHECK ("credit_card_details"."closing_day" between 1 and 31),
	CONSTRAINT "credit_card_due_day" CHECK ("credit_card_details"."due_day" between 1 and 31),
	CONSTRAINT "credit_card_limit" CHECK ("credit_card_details"."limit_cents" is null or "credit_card_details"."limit_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "credit_card_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "installment_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text NOT NULL,
	"total_amount_cents" bigint NOT NULL,
	"installments_count" integer NOT NULL,
	"first_date" date NOT NULL,
	"category_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installment_groups_count" CHECK ("installment_groups"."installments_count" between 2 and 48),
	CONSTRAINT "installment_groups_total" CHECK ("installment_groups"."total_amount_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "installment_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "installment_group_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "installment_number" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "installment_total" integer;--> statement-breakpoint
ALTER TABLE "card_invoices" ADD CONSTRAINT "card_invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_invoices" ADD CONSTRAINT "card_invoices_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_details" ADD CONSTRAINT "credit_card_details_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_details" ADD CONSTRAINT "credit_card_details_default_payment_account_id_accounts_id_fk" FOREIGN KEY ("default_payment_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_groups" ADD CONSTRAINT "installment_groups_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_groups" ADD CONSTRAINT "installment_groups_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_groups" ADD CONSTRAINT "installment_groups_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_groups" ADD CONSTRAINT "installment_groups_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "card_invoices_account_month_idx" ON "card_invoices" USING btree ("account_id","reference_month");--> statement-breakpoint
CREATE INDEX "installment_groups_workspace_id_idx" ON "installment_groups" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_card_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."card_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_installment_group_id_installment_groups_id_fk" FOREIGN KEY ("installment_group_id") REFERENCES "public"."installment_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_invoice_id_idx" ON "transactions" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "transactions_installment_group_id_idx" ON "transactions" USING btree ("installment_group_id");