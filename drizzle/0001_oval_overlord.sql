CREATE TABLE "employee" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"personal_email" text NOT NULL,
	"work_email" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"role" text DEFAULT 'employee' NOT NULL,
	"department" text,
	"position" text,
	"applicant_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_personal_email_unique" UNIQUE("personal_email"),
	CONSTRAINT "employee_work_email_unique" UNIQUE("work_email")
);
--> statement-breakpoint
ALTER TABLE "task" RENAME TO "applicant";--> statement-breakpoint
ALTER TABLE "applicant" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applicant" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applicant" ADD COLUMN "status" text DEFAULT 'applied' NOT NULL;--> statement-breakpoint
ALTER TABLE "applicant" ADD COLUMN "resume_url" text;--> statement-breakpoint
ALTER TABLE "applicant" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "applicant" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "applicant" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'applicant';--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee" ADD CONSTRAINT "employee_applicant_id_applicant_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "applicant" DROP COLUMN "priority";