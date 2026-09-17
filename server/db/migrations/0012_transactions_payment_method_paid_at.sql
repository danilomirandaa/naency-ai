CREATE TYPE "public"."payment_method" AS ENUM('pix', 'boleto', 'debit_card', 'credit_card', 'cash', 'bank_transfer');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "paid_at" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paid_at_cleared" CHECK ("transactions"."status" = 'cleared' or "transactions"."paid_at" is null);--> statement-breakpoint
-- Efetivados antigos: pagos na própria data do lançamento.
UPDATE "transactions" SET "paid_at" = "date" WHERE "status" = 'cleared';