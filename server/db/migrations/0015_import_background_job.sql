CREATE TYPE "public"."import_job" AS ENUM('suggest', 'commit');--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "job" "import_job";--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "job_error" text;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "job_finished_at" timestamp with time zone;