ALTER TABLE "import_rows" ADD COLUMN "installment_number" integer;--> statement-breakpoint
ALTER TABLE "import_rows" ADD COLUMN "installment_total" integer;--> statement-breakpoint
ALTER TABLE "import_rows" ADD COLUMN "invoice_payment" boolean DEFAULT false NOT NULL;