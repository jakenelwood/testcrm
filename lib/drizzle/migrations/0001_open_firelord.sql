ALTER TYPE "public"."contact_lifecycle_stage" ADD VALUE 'on_hold';--> statement-breakpoint
CREATE TABLE "ab_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text NOT NULL,
	"hypothesis" text,
	"test_type" text,
	"variants" jsonb NOT NULL,
	"traffic_allocation" jsonb DEFAULT '{"control":50,"variant_a":50}'::jsonb,
	"status" text DEFAULT 'draft',
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"success_metric" text NOT NULL,
	"minimum_sample_size" integer DEFAULT 100,
	"confidence_level" numeric(5, 2) DEFAULT '95.0',
	"statistical_significance" numeric(5, 2),
	"winner_variant" text,
	"results" jsonb DEFAULT '{}'::jsonb,
	"ai_analysis" jsonb DEFAULT '{}'::jsonb,
	"ai_recommendations" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ab_tests_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'running'::text, 'completed'::text, 'cancelled'::text])),
	CONSTRAINT "ab_tests_test_type_check" CHECK (test_type = ANY (ARRAY['subject_line'::text, 'content'::text, 'send_time'::text, 'call_script'::text, 'landing_page'::text, 'offer'::text]))
);
--> statement-breakpoint
ALTER TABLE "ab_tests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campaign_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"ab_test_id" uuid,
	"contact_id" uuid NOT NULL,
	"account_id" uuid,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"variant_shown" text,
	"conversion_value" numeric(12, 2),
	"attribution_weight" numeric(5, 4) DEFAULT '1.0',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaign_metrics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campaign_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"ab_test_id" uuid,
	"contact_id" uuid NOT NULL,
	"account_id" uuid,
	"variant_assigned" text,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"is_current" boolean DEFAULT true,
	"ended_at" timestamp with time zone,
	"end_reason" text,
	"excluded" boolean DEFAULT false,
	"exclusion_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "unique_current_campaign_per_contact" UNIQUE("contact_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campaign_step_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"resolved_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"provider_message_id" text,
	"n8n_execution_id" text,
	"error_json" jsonb DEFAULT '{}'::jsonb,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_step_runs_status_check" CHECK (status = ANY (ARRAY['queued'::text, 'sent'::text, 'bounced'::text, 'failed'::text, 'skipped'::text]))
);
--> statement-breakpoint
CREATE TABLE "campaign_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"template_id" uuid,
	"wait_after_ms" integer DEFAULT 0,
	"condition" jsonb DEFAULT '{}'::jsonb,
	"branch_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_target_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"overrides_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"state" text DEFAULT 'pending' NOT NULL,
	"next_step_number" integer DEFAULT 1,
	"last_attempt_at" timestamp with time zone,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_targets_state_check" CHECK (state = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'suppressed'::text, 'failed'::text]))
);
--> statement-breakpoint
CREATE TABLE "campaign_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"name" text NOT NULL,
	"variables_schema" jsonb DEFAULT '{}'::jsonb,
	"subject_template" text,
	"body_template" text,
	"provider_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campaign_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"from_campaign_id" uuid,
	"to_campaign_id" uuid NOT NULL,
	"transition_reason" text NOT NULL,
	"transition_data" jsonb DEFAULT '{}'::jsonb,
	"transitioned_at" timestamp with time zone DEFAULT now(),
	"transitioned_by" uuid
);
--> statement-breakpoint
ALTER TABLE "campaign_transitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"campaign_type" text NOT NULL,
	"objective" text,
	"audience_criteria" jsonb DEFAULT '{}'::jsonb,
	"exclusion_criteria" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'draft',
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"budget" numeric(12, 2),
	"target_metrics" jsonb DEFAULT '{}'::jsonb,
	"ai_optimization_enabled" boolean DEFAULT false,
	"automation_rules" jsonb DEFAULT '{}'::jsonb,
	"total_targeted" integer DEFAULT 0,
	"total_sent" integer DEFAULT 0,
	"total_delivered" integer DEFAULT 0,
	"total_opened" integer DEFAULT 0,
	"total_clicked" integer DEFAULT 0,
	"total_converted" integer DEFAULT 0,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_campaign_type_check" CHECK (campaign_type = ANY (ARRAY['email'::text, 'sms'::text, 'phone'::text, 'social'::text, 'direct_mail'::text, 'multi_channel'::text, 'ai_automated'::text, 'ai_nurture'::text, 'on_hold'::text, 'reengagement'::text])),
	CONSTRAINT "campaigns_objective_check" CHECK (objective = ANY (ARRAY['lead_generation'::text, 'nurture'::text, 'conversion'::text, 'retention'::text, 'winback'::text, 'ai_qualification'::text, 'ai_nurture'::text, 'hold_management'::text, 'reengagement'::text])),
	CONSTRAINT "campaigns_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "insurance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"contact_id" uuid,
	"account_id" uuid,
	"policy_number" text NOT NULL,
	"carrier" text NOT NULL,
	"policy_type" text NOT NULL,
	"premium_amount" numeric(10, 2) NOT NULL,
	"deductible" numeric(10, 2),
	"coverage_limit" numeric(12, 2),
	"effective_date" date NOT NULL,
	"expiration_date" date NOT NULL,
	"policy_details" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_policies_policy_type_check" CHECK (policy_type = ANY (ARRAY['auto'::text, 'home'::text, 'life'::text, 'business'::text, 'health'::text, 'umbrella'::text, 'specialty'::text])),
	CONSTRAINT "insurance_policies_status_check" CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'pending'::text]))
);
--> statement-breakpoint
CREATE TABLE "insurance_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"contact_id" uuid,
	"account_id" uuid,
	"quote_number" text,
	"carrier" text NOT NULL,
	"insurance_type" text NOT NULL,
	"quoted_premium" numeric(10, 2) NOT NULL,
	"deductible" numeric(10, 2),
	"coverage_limits" jsonb DEFAULT '{}'::jsonb,
	"quote_date" date DEFAULT CURRENT_DATE NOT NULL,
	"expires_at" timestamp with time zone,
	"quote_details" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_quotes_insurance_type_check" CHECK (insurance_type = ANY (ARRAY['auto'::text, 'home'::text, 'life'::text, 'business'::text, 'health'::text, 'umbrella'::text, 'specialty'::text])),
	CONSTRAINT "insurance_quotes_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'presented'::text, 'accepted'::text, 'declined'::text, 'expired'::text]))
);
--> statement-breakpoint
CREATE TABLE "insurance_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"description" text,
	"icon_name" text,
	"form_schema" jsonb DEFAULT '{}'::jsonb,
	"required_fields" text[] DEFAULT '{""}',
	"optional_fields" text[] DEFAULT '{""}',
	"ai_prompt_template" text,
	"ai_risk_factors" jsonb DEFAULT '{}'::jsonb,
	"ai_pricing_factors" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer,
	"color_hex" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "insurance_types_name_key" UNIQUE("name"),
	CONSTRAINT "insurance_types_category_check" CHECK (category = ANY (ARRAY['personal'::text, 'commercial'::text, 'specialty'::text]))
);
--> statement-breakpoint
ALTER TABLE "insurance_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "interactions_2025_08" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
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
	"ai_entities" jsonb DEFAULT '[]'::jsonb,
	"ai_action_items" jsonb DEFAULT '[]'::jsonb,
	"ai_follow_up_suggestions" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"external_id" text,
	"interacted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interactions_2025_08_pkey" PRIMARY KEY("id","interacted_at"),
	CONSTRAINT "interactions_ai_sentiment_score_check" CHECK ((ai_sentiment_score >= ('-1'::integer)::numeric) AND (ai_sentiment_score <= (1)::numeric)),
	CONSTRAINT "interactions_direction_check" CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
	CONSTRAINT "interactions_sentiment_check" CHECK (sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))
);
--> statement-breakpoint
CREATE TABLE "interactions_2025_09" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
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
	"ai_entities" jsonb DEFAULT '[]'::jsonb,
	"ai_action_items" jsonb DEFAULT '[]'::jsonb,
	"ai_follow_up_suggestions" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"external_id" text,
	"interacted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interactions_2025_09_pkey" PRIMARY KEY("id","interacted_at"),
	CONSTRAINT "interactions_ai_sentiment_score_check" CHECK ((ai_sentiment_score >= ('-1'::integer)::numeric) AND (ai_sentiment_score <= (1)::numeric)),
	CONSTRAINT "interactions_direction_check" CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text])),
	CONSTRAINT "interactions_sentiment_check" CHECK (sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"pipeline_type" text DEFAULT 'sales',
	"insurance_category" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"stages" jsonb DEFAULT '[]'::jsonb,
	"automation_rules" jsonb DEFAULT '{}'::jsonb,
	"ai_optimization_enabled" boolean DEFAULT false,
	"target_conversion_rate" numeric(5, 2),
	"average_cycle_days" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pipelines_insurance_category_check" CHECK (insurance_category = ANY (ARRAY['personal'::text, 'commercial'::text, 'specialty'::text])),
	CONSTRAINT "pipelines_pipeline_type_check" CHECK (pipeline_type = ANY (ARRAY['sales'::text, 'service'::text, 'claims'::text, 'renewal'::text]))
);
--> statement-breakpoint
ALTER TABLE "pipelines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"property_type" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"county" text,
	"year_built" integer,
	"square_feet" integer,
	"lot_size_acres" numeric(8, 2),
	"stories" integer,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"construction_type" text,
	"roof_type" text,
	"roof_age" integer,
	"foundation_type" text,
	"exterior_walls" text,
	"heating_type" text,
	"cooling_type" text,
	"electrical_type" text,
	"plumbing_type" text,
	"smoke_detectors" boolean DEFAULT false,
	"fire_extinguishers" boolean DEFAULT false,
	"security_system" boolean DEFAULT false,
	"sprinkler_system" boolean DEFAULT false,
	"ownership_type" text,
	"occupancy_type" text,
	"mortgage_company" text,
	"distance_to_fire_station_miles" numeric(5, 2),
	"distance_to_coast_miles" numeric(5, 2),
	"flood_zone" text,
	"wildfire_risk" text,
	"earthquake_risk" text,
	"current_coverage" jsonb DEFAULT '{}'::jsonb,
	"claims_history" jsonb DEFAULT '[]'::jsonb,
	"replacement_cost" numeric(12, 2),
	"market_value" numeric(12, 2),
	"ai_risk_score" integer,
	"ai_risk_factors" jsonb DEFAULT '[]'::jsonb,
	"ai_replacement_cost_estimate" numeric(12, 2),
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "properties_ai_risk_score_check" CHECK ((ai_risk_score >= 0) AND (ai_risk_score <= 100)),
	CONSTRAINT "properties_earthquake_risk_check" CHECK (earthquake_risk = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text])),
	CONSTRAINT "properties_ownership_type_check" CHECK (ownership_type = ANY (ARRAY['owner_occupied'::text, 'rental'::text, 'vacant'::text, 'seasonal'::text])),
	CONSTRAINT "properties_property_type_check" CHECK (property_type = ANY (ARRAY['single_family'::text, 'condo'::text, 'townhouse'::text, 'mobile_home'::text, 'rental'::text, 'commercial'::text])),
	CONSTRAINT "properties_wildfire_risk_check" CHECK (wildfire_risk = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text]))
);
--> statement-breakpoint
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reengagement_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"notification_type" text,
	"status" text DEFAULT 'scheduled',
	"executed_at" timestamp with time zone,
	"notification_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reengagement_schedule_notification_type_check" CHECK (notification_type = ANY (ARRAY['email_reminder'::text, 'task_creation'::text, 'calendar_event'::text, 'ai_notification'::text])),
	CONSTRAINT "reengagement_schedule_status_check" CHECK (status = ANY (ARRAY['scheduled'::text, 'executed'::text, 'cancelled'::text, 'failed'::text]))
);
--> statement-breakpoint
ALTER TABLE "reengagement_schedule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schema_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"description" text,
	"applied_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "schema_versions_version_key" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "specialty_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"item_type" text,
	"name" text NOT NULL,
	"description" text,
	"brand" text,
	"model" text,
	"serial_number" text,
	"appraised_value" numeric(12, 2),
	"purchase_price" numeric(12, 2),
	"purchase_date" date,
	"appraisal_date" date,
	"appraiser_name" text,
	"has_receipt" boolean DEFAULT false,
	"has_appraisal" boolean DEFAULT false,
	"has_photos" boolean DEFAULT false,
	"certificate_number" text,
	"storage_location" text,
	"security_measures" jsonb DEFAULT '[]'::jsonb,
	"current_coverage" jsonb DEFAULT '{}'::jsonb,
	"claims_history" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "specialty_items_item_type_check" CHECK (item_type = ANY (ARRAY['jewelry'::text, 'art'::text, 'collectibles'::text, 'electronics'::text, 'musical_instruments'::text, 'firearms'::text, 'other'::text]))
);
--> statement-breakpoint
ALTER TABLE "specialty_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"vin" text,
	"year" integer,
	"make" text,
	"model" text,
	"trim" text,
	"body_style" text,
	"license_plate" text,
	"registration_state" text,
	"registration_expiration" date,
	"ownership_type" text,
	"lienholder_name" text,
	"lienholder_address" text,
	"annual_mileage" integer,
	"primary_use" text,
	"garage_type" text,
	"safety_features" jsonb DEFAULT '[]'::jsonb,
	"anti_theft_devices" jsonb DEFAULT '[]'::jsonb,
	"modifications" jsonb DEFAULT '[]'::jsonb,
	"current_coverage" jsonb DEFAULT '{}'::jsonb,
	"claims_history" jsonb DEFAULT '[]'::jsonb,
	"ai_risk_score" integer,
	"ai_risk_factors" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vehicles_ai_risk_score_check" CHECK ((ai_risk_score >= 0) AND (ai_risk_score <= 100)),
	CONSTRAINT "vehicles_garage_type_check" CHECK (garage_type = ANY (ARRAY['garage'::text, 'carport'::text, 'driveway'::text, 'street'::text])),
	CONSTRAINT "vehicles_ownership_type_check" CHECK (ownership_type = ANY (ARRAY['owned'::text, 'financed'::text, 'leased'::text])),
	CONSTRAINT "vehicles_primary_use_check" CHECK (primary_use = ANY (ARRAY['pleasure'::text, 'commute'::text, 'business'::text, 'farm'::text]))
);
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "interactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "interactions" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_referred_by_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" DROP CONSTRAINT "contacts_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunity_participants" DROP CONSTRAINT "opportunity_participants_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunity_participants" DROP CONSTRAINT "opportunity_participants_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunity_participants" DROP CONSTRAINT "opportunity_participants_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_contact_id_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_opportunity_id_opportunities_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_created_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "stage" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "stage" SET DEFAULT 'prospecting'::text;--> statement-breakpoint
DROP TYPE "public"."opportunity_stage";--> statement-breakpoint
CREATE TYPE "public"."opportunity_stage" AS ENUM('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'attempting_contact', 'contacted_no_interest', 'contacted_interested', 'quoted', 'quote_yes', 'quote_no_followup_ok', 'quote_no_dont_contact', 'quote_maybe', 'proposed', 'paused', 'future_follow_up_date');--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "stage" SET DEFAULT 'prospecting'::"public"."opportunity_stage";--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "stage" SET DATA TYPE "public"."opportunity_stage" USING "stage"::"public"."opportunity_stage";--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "current_carriers" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "policy_renewal_dates" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "risk_profile" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "ai_insights" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "custom_fields" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "ai_insights" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "communication_preferences" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "custom_fields" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "ai_document_classification" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "ai_key_entities" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "premium_breakdown" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "coverage_details" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "ai_recommended_actions" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "ai_risk_factors" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "custom_fields" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "ai_suggested_actions" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "permissions" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "notification_preferences" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "primary_lines" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "settings" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_pkey" PRIMARY KEY("opportunity_id","contact_id");--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "current_campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "campaign_assigned_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "hold_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "hold_reason" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "hold_requested_by" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "hold_notes" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "auto_reengagement_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "ab_test_id" uuid;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "variant_shown" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "ai_next_action" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "ai_quote_recommendation" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "ai_follow_up_priority" integer;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "premium" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "quote_premium" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "quote_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "public"."ab_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "public"."ab_tests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_step_runs" ADD CONSTRAINT "campaign_step_runs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_step_runs" ADD CONSTRAINT "campaign_step_runs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."campaign_targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_step_runs" ADD CONSTRAINT "campaign_step_runs_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."campaign_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_step_runs" ADD CONSTRAINT "campaign_step_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_steps" ADD CONSTRAINT "campaign_steps_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_steps" ADD CONSTRAINT "campaign_steps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."campaign_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_steps" ADD CONSTRAINT "campaign_steps_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_target_overrides" ADD CONSTRAINT "campaign_target_overrides_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_target_overrides" ADD CONSTRAINT "campaign_target_overrides_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."campaign_targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_target_overrides" ADD CONSTRAINT "campaign_target_overrides_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."campaign_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_target_overrides" ADD CONSTRAINT "campaign_target_overrides_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_templates" ADD CONSTRAINT "campaign_templates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_templates" ADD CONSTRAINT "campaign_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_transitions" ADD CONSTRAINT "campaign_transitions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_transitions" ADD CONSTRAINT "campaign_transitions_from_campaign_id_fkey" FOREIGN KEY ("from_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_transitions" ADD CONSTRAINT "campaign_transitions_to_campaign_id_fkey" FOREIGN KEY ("to_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_transitions" ADD CONSTRAINT "campaign_transitions_transitioned_by_fkey" FOREIGN KEY ("transitioned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_transitions" ADD CONSTRAINT "campaign_transitions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_quotes" ADD CONSTRAINT "insurance_quotes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reengagement_schedule" ADD CONSTRAINT "reengagement_schedule_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reengagement_schedule" ADD CONSTRAINT "reengagement_schedule_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reengagement_schedule" ADD CONSTRAINT "reengagement_schedule_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialty_items" ADD CONSTRAINT "specialty_items_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialty_items" ADD CONSTRAINT "specialty_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ab_tests_campaign_id" ON "ab_tests" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ab_tests_status" ON "ab_tests" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ab_tests_workspace_id" ON "ab_tests" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_metrics_campaign_id" ON "campaign_metrics" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_metrics_contact_id" ON "campaign_metrics" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_metrics_workspace_id" ON "campaign_metrics" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_account_id" ON "campaign_participants" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_campaign_id" ON "campaign_participants" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_contact_id" ON "campaign_participants" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_is_current" ON "campaign_participants" USING btree ("contact_id" uuid_ops) WHERE (is_current = true);--> statement-breakpoint
CREATE INDEX "idx_campaign_participants_workspace_id" ON "campaign_participants" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_step_runs_campaign" ON "campaign_step_runs" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_step_runs_target" ON "campaign_step_runs" USING btree ("target_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_step_runs_workspace" ON "campaign_step_runs" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_steps_campaign" ON "campaign_steps" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_steps_workspace" ON "campaign_steps" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_target_overrides_campaign" ON "campaign_target_overrides" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_target_overrides_target" ON "campaign_target_overrides" USING btree ("target_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_targets_campaign" ON "campaign_targets" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_targets_opportunity" ON "campaign_targets" USING btree ("opportunity_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_targets_workspace" ON "campaign_targets" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_templates_campaign" ON "campaign_templates" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_templates_workspace" ON "campaign_templates" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_transitions_contact_id" ON "campaign_transitions" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_transitions_from_campaign" ON "campaign_transitions" USING btree ("from_campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_transitions_to_campaign" ON "campaign_transitions" USING btree ("to_campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaign_transitions_workspace_id" ON "campaign_transitions" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaigns_campaign_type" ON "campaigns" USING btree ("campaign_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_campaigns_owner_id" ON "campaigns" USING btree ("owner_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_campaigns_start_date" ON "campaigns" USING btree ("start_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_campaigns_status" ON "campaigns" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_campaigns_workspace_id" ON "campaigns" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_account_id" ON "insurance_policies" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_carrier" ON "insurance_policies" USING btree ("carrier" text_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_contact_id" ON "insurance_policies" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_expiration" ON "insurance_policies" USING btree ("expiration_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_opportunity_id" ON "insurance_policies" USING btree ("opportunity_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_policy_number" ON "insurance_policies" USING btree ("workspace_id" text_ops,"policy_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_status" ON "insurance_policies" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_policies_workspace_id" ON "insurance_policies" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_quotes_account_id" ON "insurance_quotes" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_quotes_carrier" ON "insurance_quotes" USING btree ("carrier" text_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_quotes_contact_id" ON "insurance_quotes" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_quotes_expires_at" ON "insurance_quotes" USING btree ("expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_quotes_opportunity_id" ON "insurance_quotes" USING btree ("opportunity_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_quotes_status" ON "insurance_quotes" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_insurance_quotes_workspace_id" ON "insurance_quotes" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_08_account" ON "interactions_2025_08" USING btree ("account_id" timestamptz_ops,"interacted_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_08_embedding_hnsw" ON "interactions_2025_08" USING hnsw ("embedding" vector_ip_ops) WITH (m=32,ef_construction=128);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_08_type" ON "interactions_2025_08" USING btree ("workspace_id" timestamptz_ops,"type" enum_ops,"interacted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_08_workspace_contact" ON "interactions_2025_08" USING btree ("workspace_id" uuid_ops,"contact_id" timestamptz_ops,"interacted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_09_account" ON "interactions_2025_09" USING btree ("account_id" timestamptz_ops,"interacted_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_09_embedding_hnsw" ON "interactions_2025_09" USING hnsw ("embedding" vector_ip_ops) WITH (m=32,ef_construction=128);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_09_type" ON "interactions_2025_09" USING btree ("workspace_id" timestamptz_ops,"type" enum_ops,"interacted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_interactions_2025_09_workspace_contact" ON "interactions_2025_09" USING btree ("workspace_id" uuid_ops,"contact_id" timestamptz_ops,"interacted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_properties_address" ON "properties" USING btree ("workspace_id" text_ops,"address" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_properties_contact_id" ON "properties" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_properties_workspace_id" ON "properties" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_reengagement_schedule_contact_id" ON "reengagement_schedule" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_reengagement_schedule_scheduled_for" ON "reengagement_schedule" USING btree ("scheduled_for" timestamptz_ops) WHERE (status = 'scheduled'::text);--> statement-breakpoint
CREATE INDEX "idx_reengagement_schedule_workspace_id" ON "reengagement_schedule" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_specialty_items_contact_id" ON "specialty_items" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_specialty_items_type" ON "specialty_items" USING btree ("workspace_id" text_ops,"item_type" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_specialty_items_workspace_id" ON "specialty_items" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_vehicles_contact_id" ON "vehicles" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_vehicles_vin" ON "vehicles" USING btree ("vin" text_ops) WHERE (vin IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_vehicles_workspace_id" ON "vehicles" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "fk_contacts_current_campaign" FOREIGN KEY ("current_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_ab_test_id_fkey" FOREIGN KEY ("ab_test_id") REFERENCES "public"."ab_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounts_industry" ON "accounts" USING btree ("industry" text_ops);--> statement-breakpoint
CREATE INDEX "idx_accounts_name" ON "accounts" USING btree ("workspace_id" uuid_ops,"name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_accounts_owner_id" ON "accounts" USING btree ("owner_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_accounts_summary_embedding_hnsw" ON "accounts" USING hnsw ("summary_embedding" vector_ip_ops) WITH (m=32,ef_construction=128);--> statement-breakpoint
CREATE INDEX "idx_accounts_workspace_id" ON "accounts" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_account_id" ON "contacts" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_campaign_assigned_at" ON "contacts" USING btree ("campaign_assigned_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_current_campaign_id" ON "contacts" USING btree ("current_campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_email" ON "contacts" USING btree ("workspace_id" uuid_ops,"email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_hold_until" ON "contacts" USING btree ("hold_until" timestamptz_ops) WHERE (lifecycle_stage = 'on_hold'::contact_lifecycle_stage);--> statement-breakpoint
CREATE INDEX "idx_contacts_lifecycle_stage" ON "contacts" USING btree ("lifecycle_stage" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_name" ON "contacts" USING btree ("workspace_id" uuid_ops,"first_name" uuid_ops,"last_name" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_owner_id" ON "contacts" USING btree ("owner_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_summary_embedding_hnsw" ON "contacts" USING hnsw ("summary_embedding" vector_ip_ops) WITH (m=32,ef_construction=128);--> statement-breakpoint
CREATE INDEX "idx_contacts_workspace_id" ON "contacts" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contacts_workspace_lifecycle" ON "contacts" USING btree ("workspace_id" timestamptz_ops,"lifecycle_stage" uuid_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_account_id" ON "documents" USING btree ("account_id" timestamptz_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_contact_id" ON "documents" USING btree ("contact_id" uuid_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_embedding_hnsw" ON "documents" USING hnsw ("embedding" vector_ip_ops) WITH (m=32,ef_construction=128);--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("workspace_id" text_ops,"document_type" text_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_documents_workspace_id" ON "documents" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_account_id" ON "notes" USING btree ("account_id" uuid_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_contact_id" ON "notes" USING btree ("contact_id" uuid_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_notes_embedding_hnsw" ON "notes" USING hnsw ("embedding" vector_ip_ops) WITH (m=32,ef_construction=128);--> statement-breakpoint
CREATE INDEX "idx_notes_workspace_id" ON "notes" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_ab_test_id" ON "opportunities" USING btree ("ab_test_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_account_id" ON "opportunities" USING btree ("account_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_ai_follow_up_priority" ON "opportunities" USING btree ("ai_follow_up_priority" int4_ops) WHERE (ai_follow_up_priority IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_opportunities_amount" ON "opportunities" USING btree ("workspace_id" uuid_ops,"amount" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_campaign_id" ON "opportunities" USING btree ("campaign_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_contact_attempts" ON "opportunities" USING btree ("contact_attempts" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_contact_id" ON "opportunities" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_current_carrier" ON "opportunities" USING btree ("current_carrier" text_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_insurance_types" ON "opportunities" USING gin ("insurance_types" array_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_next_contact_date" ON "opportunities" USING btree ("next_contact_date" timestamptz_ops) WHERE (next_contact_date IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_opportunities_owner_id" ON "opportunities" USING btree ("owner_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_paused_until" ON "opportunities" USING btree ("paused_until" timestamptz_ops) WHERE (paused_until IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_opportunities_premium" ON "opportunities" USING btree ("premium" numeric_ops) WHERE (premium IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_opportunities_quote_expires_at" ON "opportunities" USING btree ("quote_expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_stage" ON "opportunities" USING btree ("workspace_id" date_ops,"stage" enum_ops,"close_date" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_stage_changed_at" ON "opportunities" USING btree ("stage_changed_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_opportunities_workspace_id" ON "opportunities" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opp_participants_contact_id" ON "opportunity_participants" USING btree ("contact_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_opp_participants_workspace_id" ON "opportunity_participants" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_to_pending" ON "tasks" USING btree ("assigned_to_id" date_ops,"due_date" date_ops) WHERE (status = 'pending'::text);--> statement-breakpoint
CREATE INDEX "idx_tasks_contact_id" ON "tasks" USING btree ("contact_id" timestamptz_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("workspace_id" date_ops,"due_date" uuid_ops) WHERE (status = ANY (ARRAY['pending'::text, 'in_progress'::text]));--> statement-breakpoint
CREATE INDEX "idx_tasks_workspace_id" ON "tasks" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_workspace_id" ON "users" USING btree ("workspace_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_workspaces_name" ON "workspaces" USING btree ("name" text_ops);--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "default_max_contact_attempts";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "default_pause_duration_days";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "contact_preferences";--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "unique_contact_email_in_workspace" UNIQUE("workspace_id","email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ai_risk_score_check" CHECK ((ai_risk_score >= 0) AND (ai_risk_score <= 100));--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "chk_accounts_valid_risk_score" CHECK ((ai_risk_score IS NULL) OR ((ai_risk_score >= 0) AND (ai_risk_score <= 100)));--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "chk_contacts_valid_churn_probability" CHECK ((ai_churn_probability IS NULL) OR ((ai_churn_probability >= (0)::numeric) AND (ai_churn_probability <= (100)::numeric)));--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "chk_contacts_valid_risk_score" CHECK ((ai_risk_score IS NULL) OR ((ai_risk_score >= 0) AND (ai_risk_score <= 100)));--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_ai_churn_probability_check" CHECK ((ai_churn_probability >= (0)::numeric) AND (ai_churn_probability <= (100)::numeric));--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_ai_risk_score_check" CHECK ((ai_risk_score >= 0) AND (ai_risk_score <= 100));--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_hold_requested_by_check" CHECK (hold_requested_by = ANY (ARRAY['customer'::text, 'agent'::text, 'compliance'::text]));--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_preferred_contact_method_check" CHECK (preferred_contact_method = ANY (ARRAY['email'::text, 'phone'::text, 'sms'::text, 'mail'::text]));--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_check" CHECK (document_type = ANY (ARRAY['quote'::text, 'policy'::text, 'application'::text, 'claim'::text, 'correspondence'::text, 'other'::text]));--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "chk_note_has_target" CHECK ((contact_id IS NOT NULL) OR (account_id IS NOT NULL) OR (opportunity_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_note_type_check" CHECK (note_type = ANY (ARRAY['general'::text, 'meeting'::text, 'call'::text, 'research'::text, 'follow_up'::text]));--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "chk_opportunity_has_target" CHECK ((account_id IS NOT NULL) OR (contact_id IS NOT NULL));--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_probability_check" CHECK ((probability >= 0) AND (probability <= 100));--> statement-breakpoint
ALTER TABLE "opportunity_participants" ADD CONSTRAINT "opportunity_participants_influence_level_check" CHECK ((influence_level >= 0) AND (influence_level <= 100));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_ai_priority_score_check" CHECK ((ai_priority_score >= 0) AND (ai_priority_score <= 100));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]));--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_type_check" CHECK (task_type = ANY (ARRAY['follow_up'::text, 'quote'::text, 'meeting'::text, 'call'::text, 'email'::text, 'research'::text]));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'agent'::text, 'csr'::text]));--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_agency_type_check" CHECK (agency_type = ANY (ARRAY['Independent'::text, 'Captive'::text, 'Direct'::text]));--> statement-breakpoint
CREATE POLICY "Users can delete owned accounts" ON "accounts" AS PERMISSIVE FOR DELETE TO public USING (((workspace_id = get_user_workspace_id()) AND ((owner_id = auth.uid()) OR is_workspace_admin())));--> statement-breakpoint
CREATE POLICY "Users can update owned accounts" ON "accounts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can create accounts" ON "accounts" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view workspace accounts" ON "accounts" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can delete owned contacts" ON "contacts" AS PERMISSIVE FOR DELETE TO public USING (((workspace_id = get_user_workspace_id()) AND ((owner_id = auth.uid()) OR is_workspace_admin())));--> statement-breakpoint
CREATE POLICY "Users can update owned contacts" ON "contacts" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can create contacts" ON "contacts" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view workspace contacts" ON "contacts" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can update own documents" ON "documents" AS PERMISSIVE FOR UPDATE TO public USING (((workspace_id = get_user_workspace_id()) AND ((uploaded_by_id = auth.uid()) OR is_workspace_admin())));--> statement-breakpoint
CREATE POLICY "Users can upload documents" ON "documents" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view workspace documents" ON "documents" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can update own notes" ON "notes" AS PERMISSIVE FOR UPDATE TO public USING (((workspace_id = get_user_workspace_id()) AND ((user_id = auth.uid()) OR is_workspace_admin())));--> statement-breakpoint
CREATE POLICY "Users can create notes" ON "notes" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view workspace notes" ON "notes" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can delete owned opportunities" ON "opportunities" AS PERMISSIVE FOR DELETE TO public USING (((workspace_id = get_user_workspace_id()) AND ((owner_id = auth.uid()) OR is_workspace_admin())));--> statement-breakpoint
CREATE POLICY "Users can update owned opportunities" ON "opportunities" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can create opportunities" ON "opportunities" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view workspace opportunities" ON "opportunities" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can manage participants for owned opportunities" ON "opportunity_participants" AS PERMISSIVE FOR ALL TO public USING (((workspace_id = get_user_workspace_id()) AND (opportunity_id IN ( SELECT opportunities.id
   FROM opportunities
  WHERE ((opportunities.owner_id = auth.uid()) OR is_workspace_admin())))));--> statement-breakpoint
CREATE POLICY "Users can view workspace opportunity participants" ON "opportunity_participants" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can update assigned tasks" ON "tasks" AS PERMISSIVE FOR UPDATE TO public USING (((workspace_id = get_user_workspace_id()) AND ((assigned_to_id = auth.uid()) OR (created_by_id = auth.uid()) OR is_workspace_admin())));--> statement-breakpoint
CREATE POLICY "Users can create tasks" ON "tasks" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view workspace tasks" ON "tasks" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Admins can manage workspace users" ON "users" AS PERMISSIVE FOR ALL TO public USING (((workspace_id = get_user_workspace_id()) AND is_workspace_admin()));--> statement-breakpoint
CREATE POLICY "Users can update own profile" ON "users" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view workspace members" ON "users" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Workspace owners can update workspace" ON "workspaces" AS PERMISSIVE FOR UPDATE TO public USING (((id = get_user_workspace_id()) AND is_workspace_admin()));--> statement-breakpoint
CREATE POLICY "Users can view their workspace" ON "workspaces" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can delete ab_tests in their workspace" ON "ab_tests" AS PERMISSIVE FOR DELETE TO public USING ((workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "Users can update ab_tests in their workspace" ON "ab_tests" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can create ab_tests in their workspace" ON "ab_tests" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view ab_tests in their workspace" ON "ab_tests" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can update campaign_metrics in their workspace" ON "campaign_metrics" AS PERMISSIVE FOR UPDATE TO public USING ((workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "Users can create campaign_metrics in their workspace" ON "campaign_metrics" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view campaign_metrics in their workspace" ON "campaign_metrics" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can update campaign_participants in their workspace" ON "campaign_participants" AS PERMISSIVE FOR UPDATE TO public USING ((workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "Users can create campaign_participants in their workspace" ON "campaign_participants" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view campaign_participants in their workspace" ON "campaign_participants" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can view campaign_templates in workspace" ON "campaign_templates" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can create campaign_templates in workspace" ON "campaign_templates" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update campaign_templates in workspace" ON "campaign_templates" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can create campaign_transitions in their workspace" ON "campaign_transitions" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "Users can view campaign_transitions in their workspace" ON "campaign_transitions" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can delete campaigns in their workspace" ON "campaigns" AS PERMISSIVE FOR DELETE TO public USING ((workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "Users can update campaigns in their workspace" ON "campaigns" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can create campaigns in their workspace" ON "campaigns" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view campaigns in their workspace" ON "campaigns" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can view insurance types" ON "insurance_types" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Admins can manage pipelines" ON "pipelines" AS PERMISSIVE FOR ALL TO public USING (((workspace_id = get_user_workspace_id()) AND is_workspace_admin()));--> statement-breakpoint
CREATE POLICY "Users can view workspace pipelines" ON "pipelines" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can manage properties" ON "properties" AS PERMISSIVE FOR ALL TO public USING ((workspace_id = get_user_workspace_id()));--> statement-breakpoint
CREATE POLICY "Users can view workspace properties" ON "properties" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can update reengagement_schedule in their workspace" ON "reengagement_schedule" AS PERMISSIVE FOR UPDATE TO public USING ((workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "Users can create reengagement_schedule in their workspace" ON "reengagement_schedule" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view reengagement_schedule in their workspace" ON "reengagement_schedule" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can manage specialty items" ON "specialty_items" AS PERMISSIVE FOR ALL TO public USING ((workspace_id = get_user_workspace_id()));--> statement-breakpoint
CREATE POLICY "Users can view workspace specialty items" ON "specialty_items" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can manage vehicles" ON "vehicles" AS PERMISSIVE FOR ALL TO public USING ((workspace_id = get_user_workspace_id()));--> statement-breakpoint
CREATE POLICY "Users can view workspace vehicles" ON "vehicles" AS PERMISSIVE FOR SELECT TO public;