DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'contact_lifecycle_stage' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "public"."contact_lifecycle_stage" AS ENUM('lead', 'opportunity_contact', 'customer', 'churned');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'interaction_type' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "public"."interaction_type" AS ENUM('email', 'call', 'meeting', 'note', 'task_completed', 'sms', 'quote_generated', 'policy_issued');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'opportunity_stage' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "public"."opportunity_stage" AS ENUM('start', 'attempting_contact', 'contacted_no_interest', 'contacted_interested', 'quoted', 'quote_yes', 'quote_no_followup_ok', 'quote_no_dont_contact', 'quote_maybe', 'proposed', 'closed_won', 'closed_lost', 'paused', 'future_follow_up_date');
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"industry" text,
	"employee_count" integer,
	"annual_revenue" numeric(15, 2),
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"business_type" text,
	"tax_id" text,
	"duns_number" text,
	"current_carriers" jsonb DEFAULT '{}',
	"policy_renewal_dates" jsonb DEFAULT '{}',
	"risk_profile" jsonb DEFAULT '{}',
	"summary_embedding" vector(1024),
	"ai_risk_score" integer,
	"ai_lifetime_value" numeric(15, 2),
	"ai_insights" jsonb DEFAULT '{}',
	"custom_fields" jsonb DEFAULT '{}',
	"tags" text[],
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"account_id" uuid,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"mobile_phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"date_of_birth" date,
	"gender" text,
	"marital_status" text,
	"occupation" text,
	"job_title" text,
	"department" text,
	"drivers_license" text,
	"license_state" text,
	"ssn_last_four" text,
	"lifecycle_stage" "contact_lifecycle_stage" DEFAULT 'lead' NOT NULL,
	"lead_source" text,
	"referred_by" uuid,
	"summary_embedding" vector(1024),
	"ai_risk_score" integer,
	"ai_lifetime_value" numeric(15, 2),
	"ai_churn_probability" numeric(5, 2),
	"ai_insights" jsonb DEFAULT '{}',
	"preferred_contact_method" text DEFAULT 'email',
	"communication_preferences" jsonb DEFAULT '{}',
	"custom_fields" jsonb DEFAULT '{}',
	"tags" text[],
	"last_contact_at" timestamp with time zone,
	"next_contact_at" timestamp with time zone,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size_bytes" bigint,
	"mime_type" text,
	"file_hash" text,
	"contact_id" uuid,
	"account_id" uuid,
	"opportunity_id" uuid,
	"uploaded_by_id" uuid,
	"document_type" text,
	"embedding" vector(1024),
	"ai_extracted_text" text,
	"ai_summary" text,
	"ai_document_classification" jsonb DEFAULT '{}',
	"ai_key_entities" jsonb DEFAULT '[]',
	"tags" text[],
	"is_confidential" boolean DEFAULT false,
	"retention_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"opportunity_id" uuid,
	"user_id" uuid,
	"type" "interaction_type" NOT NULL,
	"subject" text,
	"content" text,
	"direction" text,
	"duration_minutes" integer,
	"outcome" text,
	"sentiment" text,
	"embedding" vector(1024),
	"ai_summary" text,
	"ai_sentiment_score" numeric(3, 2),
	"ai_entities" jsonb DEFAULT '[]',
	"ai_action_items" jsonb DEFAULT '[]',
	"ai_follow_up_suggestions" jsonb DEFAULT '[]',
	"metadata" jsonb DEFAULT '{}',
	"external_id" text,
	"interacted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"opportunity_id" uuid,
	"user_id" uuid NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"note_type" text DEFAULT 'general',
	"embedding" vector(1024),
	"ai_summary" text,
	"ai_tags" text[],
	"is_private" boolean DEFAULT false,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"account_id" uuid,
	"contact_id" uuid,
	"stage" "opportunity_stage" DEFAULT 'start' NOT NULL,
	"amount" numeric(12, 2),
	"probability" integer DEFAULT 50,
	"close_date" date,
	"insurance_types" text[],
	"policy_term" integer DEFAULT 12,
	"effective_date" date,
	"expiration_date" date,
	"premium_breakdown" jsonb DEFAULT '{}',
	"coverage_details" jsonb DEFAULT '{}',
	"competing_carriers" text[],
	"current_carrier" text,
	"current_premium" numeric(10, 2),
	"ai_win_probability" numeric(5, 2),
	"ai_recommended_actions" jsonb DEFAULT '[]',
	"ai_risk_factors" jsonb DEFAULT '[]',
	"custom_fields" jsonb DEFAULT '{}',
	"tags" text[],
	"notes" text,
	"owner_id" uuid,
	"source" text,
	"contact_attempts" integer DEFAULT 0,
	"max_contact_attempts" integer DEFAULT 7,
	"last_contact_attempt" timestamp with time zone,
	"next_contact_date" timestamp with time zone,
	"paused_until" timestamp with time zone,
	"pause_duration_days" integer DEFAULT 49,
	"quote_sent_at" timestamp with time zone,
	"quote_response_at" timestamp with time zone,
	"maybe_followup_days" integer DEFAULT 7,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"stage_changed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "opportunity_participants" (
	"opportunity_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"role" text,
	"influence_level" integer DEFAULT 50
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"contact_id" uuid,
	"account_id" uuid,
	"opportunity_id" uuid,
	"task_type" text DEFAULT 'follow_up',
	"priority" text DEFAULT 'medium',
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"due_time" time,
	"estimated_duration_minutes" integer,
	"assigned_to_id" uuid,
	"created_by_id" uuid,
	"ai_generated" boolean DEFAULT false,
	"ai_priority_score" integer,
	"ai_suggested_actions" jsonb DEFAULT '[]',
	"tags" text[],
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"role" text DEFAULT 'agent' NOT NULL,
	"permissions" jsonb DEFAULT '{}',
	"license_number" text,
	"license_state" text,
	"license_expiration" date,
	"specializations" text[],
	"timezone" text DEFAULT 'America/Chicago',
	"notification_preferences" jsonb DEFAULT '{}',
	"default_max_contact_attempts" integer DEFAULT 7,
	"default_pause_duration_days" integer DEFAULT 49,
	"contact_preferences" jsonb DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"agency_license" text,
	"agency_type" text,
	"primary_lines" jsonb DEFAULT '[]',
	"timezone" text DEFAULT 'America/Chicago',
	"date_format" text DEFAULT 'MM/DD/YYYY',
	"currency" text DEFAULT 'USD',
	"subscription_tier" text DEFAULT 'basic',
	"max_users" integer DEFAULT 5,
	"max_contacts" integer DEFAULT 1000,
	"settings" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_referred_by_contacts_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;