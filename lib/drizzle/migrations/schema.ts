import { pgTable, unique, serial, text, timestamp, boolean, index, pgPolicy, check, uuid, jsonb, integer, foreignKey, date, vector, time, bigint, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const contactLifecycleStage = pgEnum("contact_lifecycle_stage", ['lead', 'opportunity_contact', 'customer', 'churned', 'on_hold'])
export const interactionType = pgEnum("interaction_type", ['email', 'call', 'meeting', 'note', 'task_completed', 'sms', 'quote_generated', 'policy_issued'])
export const opportunityStage = pgEnum("opportunity_stage", ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'attempting_contact', 'contacted_no_interest', 'contacted_interested', 'quoted', 'quote_yes', 'quote_no_followup_ok', 'quote_no_dont_contact', 'quote_maybe', 'proposed', 'paused', 'future_follow_up_date'])


export const schemaVersions = pgTable("schema_versions", {
	id: serial().primaryKey().notNull(),
	version: text().notNull(),
	description: text(),
	appliedAt: timestamp("applied_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
}, (table) => [
	unique("schema_versions_version_key").on(table.version),
]);

export const workspaces = pgTable("workspaces", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	agencyLicense: text("agency_license"),
	agencyType: text("agency_type"),
	primaryLines: jsonb("primary_lines").default([]),
	timezone: text().default('America/Chicago'),
	dateFormat: text("date_format").default('MM/DD/YYYY'),
	currency: text().default('USD'),
	subscriptionTier: text("subscription_tier").default('basic'),
	maxUsers: integer("max_users").default(5),
	maxContacts: integer("max_contacts").default(1000),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_workspaces_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	pgPolicy("Workspace owners can update workspace", { as: "permissive", for: "update", to: ["public"], using: sql`((id = get_user_workspace_id()) AND is_workspace_admin())` }),
	pgPolicy("Users can view their workspace", { as: "permissive", for: "select", to: ["public"] }),
	check("workspaces_agency_type_check", sql`agency_type = ANY (ARRAY['Independent'::text, 'Captive'::text, 'Direct'::text])`),
]);

export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	role: text().default('agent').notNull(),
	permissions: jsonb().default({}),
	licenseNumber: text("license_number"),
	licenseState: text("license_state"),
	licenseExpiration: date("license_expiration"),
	specializations: text().array(),
	timezone: text().default('America/Chicago'),
	notificationPreferences: jsonb("notification_preferences").default({}),
	isActive: boolean("is_active").default(true),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_users_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "users_workspace_id_fkey"
		}).onDelete("cascade"),
	unique("users_email_key").on(table.email),
	pgPolicy("Admins can manage workspace users", { as: "permissive", for: "all", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND is_workspace_admin())` }),
	pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view workspace members", { as: "permissive", for: "select", to: ["public"] }),
	check("users_role_check", sql`role = ANY (ARRAY['owner'::text, 'manager'::text, 'agent'::text, 'csr'::text])`),
]);

export const notes = pgTable("notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	opportunityId: uuid("opportunity_id"),
	userId: uuid("user_id").notNull(),
	title: text(),
	content: text().notNull(),
	noteType: text("note_type").default('general'),
	embedding: vector({ dimensions: 1024 }),
	aiSummary: text("ai_summary"),
	aiTags: text("ai_tags").array(),
	isPrivate: boolean("is_private").default(false),
	tags: text().array(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_notes_account_id").using("btree", table.accountId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_notes_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_notes_embedding_hnsw").using("hnsw", table.embedding.asc().nullsLast().op("vector_ip_ops")).with({m: "32",ef_construction: "128"}),
	index("idx_notes_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "notes_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "notes_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "notes_opportunity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notes_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "notes_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update own notes", { as: "permissive", for: "update", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND ((user_id = auth.uid()) OR is_workspace_admin()))` }),
	pgPolicy("Users can create notes", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view workspace notes", { as: "permissive", for: "select", to: ["public"] }),
	check("chk_note_has_target", sql`(contact_id IS NOT NULL) OR (account_id IS NOT NULL) OR (opportunity_id IS NOT NULL)`),
	check("notes_note_type_check", sql`note_type = ANY (ARRAY['general'::text, 'meeting'::text, 'call'::text, 'research'::text, 'follow_up'::text])`),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	title: text().notNull(),
	description: text(),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	opportunityId: uuid("opportunity_id"),
	taskType: text("task_type").default('follow_up'),
	priority: text().default('medium'),
	status: text().default('pending').notNull(),
	dueDate: date("due_date"),
	dueTime: time("due_time"),
	estimatedDurationMinutes: integer("estimated_duration_minutes"),
	assignedToId: uuid("assigned_to_id"),
	createdById: uuid("created_by_id"),
	aiGenerated: boolean("ai_generated").default(false),
	aiPriorityScore: integer("ai_priority_score"),
	aiSuggestedActions: jsonb("ai_suggested_actions").default([]),
	tags: text().array(),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_tasks_assigned_to_pending").using("btree", table.assignedToId.asc().nullsLast().op("date_ops"), table.dueDate.asc().nullsLast().op("date_ops")).where(sql`(status = 'pending'::text)`),
	index("idx_tasks_contact_id").using("btree", table.contactId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_tasks_due_date").using("btree", table.workspaceId.asc().nullsLast().op("date_ops"), table.dueDate.asc().nullsLast().op("uuid_ops")).where(sql`(status = ANY (ARRAY['pending'::text, 'in_progress'::text]))`),
	index("idx_tasks_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "tasks_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "tasks_assigned_to_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "tasks_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "tasks_created_by_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "tasks_opportunity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "tasks_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update assigned tasks", { as: "permissive", for: "update", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND ((assigned_to_id = auth.uid()) OR (created_by_id = auth.uid()) OR is_workspace_admin()))` }),
	pgPolicy("Users can create tasks", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view workspace tasks", { as: "permissive", for: "select", to: ["public"] }),
	check("tasks_ai_priority_score_check", sql`(ai_priority_score >= 0) AND (ai_priority_score <= 100)`),
	check("tasks_priority_check", sql`priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])`),
	check("tasks_status_check", sql`status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])`),
	check("tasks_task_type_check", sql`task_type = ANY (ARRAY['follow_up'::text, 'quote'::text, 'meeting'::text, 'call'::text, 'email'::text, 'research'::text])`),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	fileName: text("file_name").notNull(),
	filePath: text("file_path").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
	mimeType: text("mime_type"),
	fileHash: text("file_hash"),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	opportunityId: uuid("opportunity_id"),
	uploadedById: uuid("uploaded_by_id"),
	documentType: text("document_type"),
	embedding: vector({ dimensions: 1024 }),
	aiExtractedText: text("ai_extracted_text"),
	aiSummary: text("ai_summary"),
	aiDocumentClassification: jsonb("ai_document_classification").default({}),
	aiKeyEntities: jsonb("ai_key_entities").default([]),
	tags: text().array(),
	isConfidential: boolean("is_confidential").default(false),
	retentionDate: date("retention_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_documents_account_id").using("btree", table.accountId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_documents_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_documents_embedding_hnsw").using("hnsw", table.embedding.asc().nullsLast().op("vector_ip_ops")).with({m: "32",ef_construction: "128"}),
	index("idx_documents_type").using("btree", table.workspaceId.asc().nullsLast().op("text_ops"), table.documentType.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_documents_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "documents_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "documents_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "documents_opportunity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedById],
			foreignColumns: [users.id],
			name: "documents_uploaded_by_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "documents_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update own documents", { as: "permissive", for: "update", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND ((uploaded_by_id = auth.uid()) OR is_workspace_admin()))` }),
	pgPolicy("Users can upload documents", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view workspace documents", { as: "permissive", for: "select", to: ["public"] }),
	check("documents_document_type_check", sql`document_type = ANY (ARRAY['quote'::text, 'policy'::text, 'application'::text, 'claim'::text, 'correspondence'::text, 'other'::text])`),
]);

export const insuranceTypes = pgTable("insurance_types", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	isActive: boolean("is_active").default(true),
	description: text(),
	iconName: text("icon_name"),
	formSchema: jsonb("form_schema").default({}),
	requiredFields: text("required_fields").array().default([""]),
	optionalFields: text("optional_fields").array().default([""]),
	aiPromptTemplate: text("ai_prompt_template"),
	aiRiskFactors: jsonb("ai_risk_factors").default({}),
	aiPricingFactors: jsonb("ai_pricing_factors").default({}),
	displayOrder: integer("display_order"),
	colorHex: text("color_hex"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("insurance_types_name_key").on(table.name),
	pgPolicy("Users can view insurance types", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	check("insurance_types_category_check", sql`category = ANY (ARRAY['personal'::text, 'commercial'::text, 'specialty'::text])`),
]);

export const pipelines = pgTable("pipelines", {
	id: serial().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	name: text().notNull(),
	description: text(),
	pipelineType: text("pipeline_type").default('sales'),
	insuranceCategory: text("insurance_category"),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	stages: jsonb().default([]),
	automationRules: jsonb("automation_rules").default({}),
	aiOptimizationEnabled: boolean("ai_optimization_enabled").default(false),
	targetConversionRate: numeric("target_conversion_rate", { precision: 5, scale:  2 }),
	averageCycleDays: integer("average_cycle_days"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "pipelines_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Admins can manage pipelines", { as: "permissive", for: "all", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND is_workspace_admin())` }),
	pgPolicy("Users can view workspace pipelines", { as: "permissive", for: "select", to: ["public"] }),
	check("pipelines_insurance_category_check", sql`insurance_category = ANY (ARRAY['personal'::text, 'commercial'::text, 'specialty'::text])`),
	check("pipelines_pipeline_type_check", sql`pipeline_type = ANY (ARRAY['sales'::text, 'service'::text, 'claims'::text, 'renewal'::text])`),
]);

export const vehicles = pgTable("vehicles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	vin: text(),
	year: integer(),
	make: text(),
	model: text(),
	trim: text(),
	bodyStyle: text("body_style"),
	licensePlate: text("license_plate"),
	registrationState: text("registration_state"),
	registrationExpiration: date("registration_expiration"),
	ownershipType: text("ownership_type"),
	lienholderName: text("lienholder_name"),
	lienholderAddress: text("lienholder_address"),
	annualMileage: integer("annual_mileage"),
	primaryUse: text("primary_use"),
	garageType: text("garage_type"),
	safetyFeatures: jsonb("safety_features").default([]),
	antiTheftDevices: jsonb("anti_theft_devices").default([]),
	modifications: jsonb().default([]),
	currentCoverage: jsonb("current_coverage").default({}),
	claimsHistory: jsonb("claims_history").default([]),
	aiRiskScore: integer("ai_risk_score"),
	aiRiskFactors: jsonb("ai_risk_factors").default([]),
	customFields: jsonb("custom_fields").default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_vehicles_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_vehicles_vin").using("btree", table.vin.asc().nullsLast().op("text_ops")).where(sql`(vin IS NOT NULL)`),
	index("idx_vehicles_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "vehicles_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "vehicles_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can manage vehicles", { as: "permissive", for: "all", to: ["public"], using: sql`(workspace_id = get_user_workspace_id())` }),
	pgPolicy("Users can view workspace vehicles", { as: "permissive", for: "select", to: ["public"] }),
	check("vehicles_ai_risk_score_check", sql`(ai_risk_score >= 0) AND (ai_risk_score <= 100)`),
	check("vehicles_garage_type_check", sql`garage_type = ANY (ARRAY['garage'::text, 'carport'::text, 'driveway'::text, 'street'::text])`),
	check("vehicles_ownership_type_check", sql`ownership_type = ANY (ARRAY['owned'::text, 'financed'::text, 'leased'::text])`),
	check("vehicles_primary_use_check", sql`primary_use = ANY (ARRAY['pleasure'::text, 'commute'::text, 'business'::text, 'farm'::text])`),
]);

export const properties = pgTable("properties", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	propertyType: text("property_type"),
	address: text().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	zipCode: text("zip_code").notNull(),
	county: text(),
	yearBuilt: integer("year_built"),
	squareFeet: integer("square_feet"),
	lotSizeAcres: numeric("lot_size_acres", { precision: 8, scale:  2 }),
	stories: integer(),
	bedrooms: integer(),
	bathrooms: numeric({ precision: 3, scale:  1 }),
	constructionType: text("construction_type"),
	roofType: text("roof_type"),
	roofAge: integer("roof_age"),
	foundationType: text("foundation_type"),
	exteriorWalls: text("exterior_walls"),
	heatingType: text("heating_type"),
	coolingType: text("cooling_type"),
	electricalType: text("electrical_type"),
	plumbingType: text("plumbing_type"),
	smokeDetectors: boolean("smoke_detectors").default(false),
	fireExtinguishers: boolean("fire_extinguishers").default(false),
	securitySystem: boolean("security_system").default(false),
	sprinklerSystem: boolean("sprinkler_system").default(false),
	ownershipType: text("ownership_type"),
	occupancyType: text("occupancy_type"),
	mortgageCompany: text("mortgage_company"),
	distanceToFireStationMiles: numeric("distance_to_fire_station_miles", { precision: 5, scale:  2 }),
	distanceToCoastMiles: numeric("distance_to_coast_miles", { precision: 5, scale:  2 }),
	floodZone: text("flood_zone"),
	wildfireRisk: text("wildfire_risk"),
	earthquakeRisk: text("earthquake_risk"),
	currentCoverage: jsonb("current_coverage").default({}),
	claimsHistory: jsonb("claims_history").default([]),
	replacementCost: numeric("replacement_cost", { precision: 12, scale:  2 }),
	marketValue: numeric("market_value", { precision: 12, scale:  2 }),
	aiRiskScore: integer("ai_risk_score"),
	aiRiskFactors: jsonb("ai_risk_factors").default([]),
	aiReplacementCostEstimate: numeric("ai_replacement_cost_estimate", { precision: 12, scale:  2 }),
	customFields: jsonb("custom_fields").default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_properties_address").using("btree", table.workspaceId.asc().nullsLast().op("text_ops"), table.address.asc().nullsLast().op("uuid_ops")),
	index("idx_properties_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_properties_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "properties_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "properties_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can manage properties", { as: "permissive", for: "all", to: ["public"], using: sql`(workspace_id = get_user_workspace_id())` }),
	pgPolicy("Users can view workspace properties", { as: "permissive", for: "select", to: ["public"] }),
	check("properties_ai_risk_score_check", sql`(ai_risk_score >= 0) AND (ai_risk_score <= 100)`),
	check("properties_earthquake_risk_check", sql`earthquake_risk = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text])`),
	check("properties_ownership_type_check", sql`ownership_type = ANY (ARRAY['owner_occupied'::text, 'rental'::text, 'vacant'::text, 'seasonal'::text])`),
	check("properties_property_type_check", sql`property_type = ANY (ARRAY['single_family'::text, 'condo'::text, 'townhouse'::text, 'mobile_home'::text, 'rental'::text, 'commercial'::text])`),
	check("properties_wildfire_risk_check", sql`wildfire_risk = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text])`),
]);

export const specialtyItems = pgTable("specialty_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	itemType: text("item_type"),
	name: text().notNull(),
	description: text(),
	brand: text(),
	model: text(),
	serialNumber: text("serial_number"),
	appraisedValue: numeric("appraised_value", { precision: 12, scale:  2 }),
	purchasePrice: numeric("purchase_price", { precision: 12, scale:  2 }),
	purchaseDate: date("purchase_date"),
	appraisalDate: date("appraisal_date"),
	appraiserName: text("appraiser_name"),
	hasReceipt: boolean("has_receipt").default(false),
	hasAppraisal: boolean("has_appraisal").default(false),
	hasPhotos: boolean("has_photos").default(false),
	certificateNumber: text("certificate_number"),
	storageLocation: text("storage_location"),
	securityMeasures: jsonb("security_measures").default([]),
	currentCoverage: jsonb("current_coverage").default({}),
	claimsHistory: jsonb("claims_history").default([]),
	customFields: jsonb("custom_fields").default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_specialty_items_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_specialty_items_type").using("btree", table.workspaceId.asc().nullsLast().op("text_ops"), table.itemType.asc().nullsLast().op("uuid_ops")),
	index("idx_specialty_items_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "specialty_items_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "specialty_items_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can manage specialty items", { as: "permissive", for: "all", to: ["public"], using: sql`(workspace_id = get_user_workspace_id())` }),
	pgPolicy("Users can view workspace specialty items", { as: "permissive", for: "select", to: ["public"] }),
	check("specialty_items_item_type_check", sql`item_type = ANY (ARRAY['jewelry'::text, 'art'::text, 'collectibles'::text, 'electronics'::text, 'musical_instruments'::text, 'firearms'::text, 'other'::text])`),
]);

export const campaigns = pgTable("campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	name: text().notNull(),
	description: text(),
	campaignType: text("campaign_type").notNull(),
	objective: text(),
	audienceCriteria: jsonb("audience_criteria").default({}),
	exclusionCriteria: jsonb("exclusion_criteria").default({}),
	status: text().default('draft'),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	budget: numeric({ precision: 12, scale:  2 }),
	targetMetrics: jsonb("target_metrics").default({}),
	aiOptimizationEnabled: boolean("ai_optimization_enabled").default(false),
	automationRules: jsonb("automation_rules").default({}),
	totalTargeted: integer("total_targeted").default(0),
	totalSent: integer("total_sent").default(0),
	totalDelivered: integer("total_delivered").default(0),
	totalOpened: integer("total_opened").default(0),
	totalClicked: integer("total_clicked").default(0),
	totalConverted: integer("total_converted").default(0),
	ownerId: uuid("owner_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_campaigns_campaign_type").using("btree", table.campaignType.asc().nullsLast().op("text_ops")),
	index("idx_campaigns_owner_id").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaigns_start_date").using("btree", table.startDate.asc().nullsLast().op("timestamptz_ops")),
	index("idx_campaigns_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_campaigns_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "campaigns_owner_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "campaigns_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can delete campaigns in their workspace", { as: "permissive", for: "delete", to: ["public"], using: sql`(workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid())))` }),
	pgPolicy("Users can update campaigns in their workspace", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can create campaigns in their workspace", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view campaigns in their workspace", { as: "permissive", for: "select", to: ["public"] }),
	check("campaigns_campaign_type_check", sql`campaign_type = ANY (ARRAY['email'::text, 'sms'::text, 'phone'::text, 'social'::text, 'direct_mail'::text, 'multi_channel'::text, 'ai_automated'::text, 'ai_nurture'::text, 'on_hold'::text, 'reengagement'::text])`),
	check("campaigns_objective_check", sql`objective = ANY (ARRAY['lead_generation'::text, 'nurture'::text, 'conversion'::text, 'retention'::text, 'winback'::text, 'ai_qualification'::text, 'ai_nurture'::text, 'hold_management'::text, 'reengagement'::text])`),
	check("campaigns_status_check", sql`status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])`),
]);

export const abTests = pgTable("ab_tests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	name: text().notNull(),
	hypothesis: text(),
	testType: text("test_type"),
	variants: jsonb().notNull(),
	trafficAllocation: jsonb("traffic_allocation").default({"control":50,"variant_a":50}),
	status: text().default('draft'),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	successMetric: text("success_metric").notNull(),
	minimumSampleSize: integer("minimum_sample_size").default(100),
	confidenceLevel: numeric("confidence_level", { precision: 5, scale:  2 }).default('95.0'),
	statisticalSignificance: numeric("statistical_significance", { precision: 5, scale:  2 }),
	winnerVariant: text("winner_variant"),
	results: jsonb().default({}),
	aiAnalysis: jsonb("ai_analysis").default({}),
	aiRecommendations: jsonb("ai_recommendations").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ab_tests_campaign_id").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_ab_tests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_ab_tests_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "ab_tests_campaign_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "ab_tests_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can delete ab_tests in their workspace", { as: "permissive", for: "delete", to: ["public"], using: sql`(workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid())))` }),
	pgPolicy("Users can update ab_tests in their workspace", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can create ab_tests in their workspace", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view ab_tests in their workspace", { as: "permissive", for: "select", to: ["public"] }),
	check("ab_tests_status_check", sql`status = ANY (ARRAY['draft'::text, 'running'::text, 'completed'::text, 'cancelled'::text])`),
	check("ab_tests_test_type_check", sql`test_type = ANY (ARRAY['subject_line'::text, 'content'::text, 'send_time'::text, 'call_script'::text, 'landing_page'::text, 'offer'::text])`),
]);

export const campaignParticipants = pgTable("campaign_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	abTestId: uuid("ab_test_id"),
	contactId: uuid("contact_id").notNull(),
	accountId: uuid("account_id"),
	variantAssigned: text("variant_assigned"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isCurrent: boolean("is_current").default(true),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
	endReason: text("end_reason"),
	excluded: boolean().default(false),
	exclusionReason: text("exclusion_reason"),
	metadata: jsonb().default({}),
}, (table) => [
	index("idx_campaign_participants_account_id").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_participants_campaign_id").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_participants_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_participants_is_current").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")).where(sql`(is_current = true)`),
	index("idx_campaign_participants_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.abTestId],
			foreignColumns: [abTests.id],
			name: "campaign_participants_ab_test_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "campaign_participants_account_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "campaign_participants_campaign_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "campaign_participants_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "campaign_participants_workspace_id_fkey"
		}).onDelete("cascade"),
	unique("unique_current_campaign_per_contact").on(table.contactId),
	pgPolicy("Users can update campaign_participants in their workspace", { as: "permissive", for: "update", to: ["public"], using: sql`(workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid())))` }),
	pgPolicy("Users can create campaign_participants in their workspace", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view campaign_participants in their workspace", { as: "permissive", for: "select", to: ["public"] }),
]);

export const campaignTransitions = pgTable("campaign_transitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	fromCampaignId: uuid("from_campaign_id"),
	toCampaignId: uuid("to_campaign_id").notNull(),
	transitionReason: text("transition_reason").notNull(),
	transitionData: jsonb("transition_data").default({}),
	transitionedAt: timestamp("transitioned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	transitionedBy: uuid("transitioned_by"),
}, (table) => [
	index("idx_campaign_transitions_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_transitions_from_campaign").using("btree", table.fromCampaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_transitions_to_campaign").using("btree", table.toCampaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_transitions_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "campaign_transitions_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromCampaignId],
			foreignColumns: [campaigns.id],
			name: "campaign_transitions_from_campaign_id_fkey"
		}),
	foreignKey({
			columns: [table.toCampaignId],
			foreignColumns: [campaigns.id],
			name: "campaign_transitions_to_campaign_id_fkey"
		}),
	foreignKey({
			columns: [table.transitionedBy],
			foreignColumns: [users.id],
			name: "campaign_transitions_transitioned_by_fkey"
		}),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "campaign_transitions_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can create campaign_transitions in their workspace", { as: "permissive", for: "insert", to: ["public"], withCheck: sql`(workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid())))`  }),
	pgPolicy("Users can view campaign_transitions in their workspace", { as: "permissive", for: "select", to: ["public"] }),
]);

export const reengagementSchedule = pgTable("reengagement_schedule", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	scheduledFor: timestamp("scheduled_for", { withTimezone: true, mode: 'string' }).notNull(),
	notificationType: text("notification_type"),
	status: text().default('scheduled'),
	executedAt: timestamp("executed_at", { withTimezone: true, mode: 'string' }),
	notificationData: jsonb("notification_data").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_reengagement_schedule_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_reengagement_schedule_scheduled_for").using("btree", table.scheduledFor.asc().nullsLast().op("timestamptz_ops")).where(sql`(status = 'scheduled'::text)`),
	index("idx_reengagement_schedule_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "reengagement_schedule_campaign_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "reengagement_schedule_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "reengagement_schedule_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update reengagement_schedule in their workspace", { as: "permissive", for: "update", to: ["public"], using: sql`(workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid())))` }),
	pgPolicy("Users can create reengagement_schedule in their workspace", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view reengagement_schedule in their workspace", { as: "permissive", for: "select", to: ["public"] }),
	check("reengagement_schedule_notification_type_check", sql`notification_type = ANY (ARRAY['email_reminder'::text, 'task_creation'::text, 'calendar_event'::text, 'ai_notification'::text])`),
	check("reengagement_schedule_status_check", sql`status = ANY (ARRAY['scheduled'::text, 'executed'::text, 'cancelled'::text, 'failed'::text])`),
]);

export const campaignMetrics = pgTable("campaign_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	abTestId: uuid("ab_test_id"),
	contactId: uuid("contact_id").notNull(),
	accountId: uuid("account_id"),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	openedAt: timestamp("opened_at", { withTimezone: true, mode: 'string' }),
	clickedAt: timestamp("clicked_at", { withTimezone: true, mode: 'string' }),
	respondedAt: timestamp("responded_at", { withTimezone: true, mode: 'string' }),
	convertedAt: timestamp("converted_at", { withTimezone: true, mode: 'string' }),
	variantShown: text("variant_shown"),
	conversionValue: numeric("conversion_value", { precision: 12, scale:  2 }),
	attributionWeight: numeric("attribution_weight", { precision: 5, scale:  4 }).default('1.0'),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_campaign_metrics_campaign_id").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_metrics_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_metrics_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.abTestId],
			foreignColumns: [abTests.id],
			name: "campaign_metrics_ab_test_id_fkey"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "campaign_metrics_account_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "campaign_metrics_campaign_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "campaign_metrics_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "campaign_metrics_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can update campaign_metrics in their workspace", { as: "permissive", for: "update", to: ["public"], using: sql`(workspace_id = ( SELECT users.workspace_id
   FROM users
  WHERE (users.id = auth.uid())))` }),
	pgPolicy("Users can create campaign_metrics in their workspace", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view campaign_metrics in their workspace", { as: "permissive", for: "select", to: ["public"] }),
]);

export const contacts = pgTable("contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	accountId: uuid("account_id"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text(),
	phone: text(),
	mobilePhone: text("mobile_phone"),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	dateOfBirth: date("date_of_birth"),
	gender: text(),
	maritalStatus: text("marital_status"),
	occupation: text(),
	jobTitle: text("job_title"),
	department: text(),
	driversLicense: text("drivers_license"),
	licenseState: text("license_state"),
	ssnLastFour: text("ssn_last_four"),
	lifecycleStage: contactLifecycleStage("lifecycle_stage").default('lead').notNull(),
	leadSource: text("lead_source"),
	referredBy: uuid("referred_by"),
	summaryEmbedding: vector("summary_embedding", { dimensions: 1024 }),
	aiRiskScore: integer("ai_risk_score"),
	aiLifetimeValue: numeric("ai_lifetime_value", { precision: 15, scale:  2 }),
	aiChurnProbability: numeric("ai_churn_probability", { precision: 5, scale:  2 }),
	aiInsights: jsonb("ai_insights").default({}),
	preferredContactMethod: text("preferred_contact_method").default('email'),
	communicationPreferences: jsonb("communication_preferences").default({}),
	customFields: jsonb("custom_fields").default({}),
	tags: text().array(),
	lastContactAt: timestamp("last_contact_at", { withTimezone: true, mode: 'string' }),
	nextContactAt: timestamp("next_contact_at", { withTimezone: true, mode: 'string' }),
	ownerId: uuid("owner_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	currentCampaignId: uuid("current_campaign_id"),
	campaignAssignedAt: timestamp("campaign_assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	holdUntil: timestamp("hold_until", { withTimezone: true, mode: 'string' }),
	holdReason: text("hold_reason"),
	holdRequestedBy: text("hold_requested_by"),
	holdNotes: text("hold_notes"),
	autoReengagementEnabled: boolean("auto_reengagement_enabled").default(true),
}, (table) => [
	index("idx_contacts_account_id").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("idx_contacts_campaign_assigned_at").using("btree", table.campaignAssignedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_contacts_current_campaign_id").using("btree", table.currentCampaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_contacts_email").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.email.asc().nullsLast().op("text_ops")),
	index("idx_contacts_hold_until").using("btree", table.holdUntil.asc().nullsLast().op("timestamptz_ops")).where(sql`(lifecycle_stage = 'on_hold'::contact_lifecycle_stage)`),
	index("idx_contacts_lifecycle_stage").using("btree", table.lifecycleStage.asc().nullsLast().op("enum_ops")),
	index("idx_contacts_name").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.firstName.asc().nullsLast().op("uuid_ops"), table.lastName.asc().nullsLast().op("uuid_ops")),
	index("idx_contacts_owner_id").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("idx_contacts_summary_embedding_hnsw").using("hnsw", table.summaryEmbedding.asc().nullsLast().op("vector_ip_ops")).with({m: "32",ef_construction: "128"}),
	index("idx_contacts_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	index("idx_contacts_workspace_lifecycle").using("btree", table.workspaceId.asc().nullsLast().op("timestamptz_ops"), table.lifecycleStage.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "contacts_account_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "contacts_owner_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.referredBy],
			foreignColumns: [table.id],
			name: "contacts_referred_by_fkey"
		}),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "contacts_workspace_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.currentCampaignId],
			foreignColumns: [campaigns.id],
			name: "fk_contacts_current_campaign"
		}),
	unique("unique_contact_email_in_workspace").on(table.workspaceId, table.email),
	pgPolicy("Users can delete owned contacts", { as: "permissive", for: "delete", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND ((owner_id = auth.uid()) OR is_workspace_admin()))` }),
	pgPolicy("Users can update owned contacts", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can create contacts", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view workspace contacts", { as: "permissive", for: "select", to: ["public"] }),
	check("chk_contacts_valid_churn_probability", sql`(ai_churn_probability IS NULL) OR ((ai_churn_probability >= (0)::numeric) AND (ai_churn_probability <= (100)::numeric))`),
	check("chk_contacts_valid_risk_score", sql`(ai_risk_score IS NULL) OR ((ai_risk_score >= 0) AND (ai_risk_score <= 100))`),
	check("contacts_ai_churn_probability_check", sql`(ai_churn_probability >= (0)::numeric) AND (ai_churn_probability <= (100)::numeric)`),
	check("contacts_ai_risk_score_check", sql`(ai_risk_score >= 0) AND (ai_risk_score <= 100)`),
	check("contacts_hold_requested_by_check", sql`hold_requested_by = ANY (ARRAY['customer'::text, 'agent'::text, 'compliance'::text])`),
	check("contacts_preferred_contact_method_check", sql`preferred_contact_method = ANY (ARRAY['email'::text, 'phone'::text, 'sms'::text, 'mail'::text])`),
]);

export const insurancePolicies = pgTable("insurance_policies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	opportunityId: uuid("opportunity_id"),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	policyNumber: text("policy_number").notNull(),
	carrier: text().notNull(),
	policyType: text("policy_type").notNull(),
	premiumAmount: numeric("premium_amount", { precision: 10, scale:  2 }).notNull(),
	deductible: numeric({ precision: 10, scale:  2 }),
	coverageLimit: numeric("coverage_limit", { precision: 12, scale:  2 }),
	effectiveDate: date("effective_date").notNull(),
	expirationDate: date("expiration_date").notNull(),
	policyDetails: jsonb("policy_details").default({}),
	status: text().default('active').notNull(),
	ownerId: uuid("owner_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_insurance_policies_account_id").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("idx_insurance_policies_carrier").using("btree", table.carrier.asc().nullsLast().op("text_ops")),
	index("idx_insurance_policies_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_insurance_policies_expiration").using("btree", table.expirationDate.asc().nullsLast().op("date_ops")),
	index("idx_insurance_policies_opportunity_id").using("btree", table.opportunityId.asc().nullsLast().op("uuid_ops")),
	index("idx_insurance_policies_policy_number").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.policyNumber.asc().nullsLast().op("text_ops")),
	index("idx_insurance_policies_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_insurance_policies_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "insurance_policies_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "insurance_policies_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "insurance_policies_opportunity_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "insurance_policies_owner_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "insurance_policies_workspace_id_fkey"
		}).onDelete("cascade"),
	check("insurance_policies_policy_type_check", sql`policy_type = ANY (ARRAY['auto'::text, 'home'::text, 'life'::text, 'business'::text, 'health'::text, 'umbrella'::text, 'specialty'::text])`),
	check("insurance_policies_status_check", sql`status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'pending'::text])`),
]);

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	name: text().notNull(),
	website: text(),
	industry: text(),
	employeeCount: integer("employee_count"),
	annualRevenue: numeric("annual_revenue", { precision: 15, scale:  2 }),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	businessType: text("business_type"),
	taxId: text("tax_id"),
	dunsNumber: text("duns_number"),
	currentCarriers: jsonb("current_carriers").default({}),
	policyRenewalDates: jsonb("policy_renewal_dates").default({}),
	riskProfile: jsonb("risk_profile").default({}),
	summaryEmbedding: vector("summary_embedding", { dimensions: 1024 }),
	aiRiskScore: integer("ai_risk_score"),
	aiLifetimeValue: numeric("ai_lifetime_value", { precision: 15, scale:  2 }),
	aiInsights: jsonb("ai_insights").default({}),
	customFields: jsonb("custom_fields").default({}),
	tags: text().array(),
	ownerId: uuid("owner_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_accounts_industry").using("btree", table.industry.asc().nullsLast().op("text_ops")),
	index("idx_accounts_name").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.name.asc().nullsLast().op("text_ops")),
	index("idx_accounts_owner_id").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("idx_accounts_summary_embedding_hnsw").using("hnsw", table.summaryEmbedding.asc().nullsLast().op("vector_ip_ops")).with({m: "32",ef_construction: "128"}),
	index("idx_accounts_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "accounts_owner_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "accounts_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can delete owned accounts", { as: "permissive", for: "delete", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND ((owner_id = auth.uid()) OR is_workspace_admin()))` }),
	pgPolicy("Users can update owned accounts", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can create accounts", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view workspace accounts", { as: "permissive", for: "select", to: ["public"] }),
	check("accounts_ai_risk_score_check", sql`(ai_risk_score >= 0) AND (ai_risk_score <= 100)`),
	check("chk_accounts_valid_risk_score", sql`(ai_risk_score IS NULL) OR ((ai_risk_score >= 0) AND (ai_risk_score <= 100))`),
]);

export const insuranceQuotes = pgTable("insurance_quotes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	opportunityId: uuid("opportunity_id").notNull(),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	quoteNumber: text("quote_number"),
	carrier: text().notNull(),
	insuranceType: text("insurance_type").notNull(),
	quotedPremium: numeric("quoted_premium", { precision: 10, scale:  2 }).notNull(),
	deductible: numeric({ precision: 10, scale:  2 }),
	coverageLimits: jsonb("coverage_limits").default({}),
	quoteDate: date("quote_date").default(sql`CURRENT_DATE`).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	quoteDetails: jsonb("quote_details").default({}),
	status: text().default('pending').notNull(),
	createdById: uuid("created_by_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_insurance_quotes_account_id").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("idx_insurance_quotes_carrier").using("btree", table.carrier.asc().nullsLast().op("text_ops")),
	index("idx_insurance_quotes_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_insurance_quotes_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_insurance_quotes_opportunity_id").using("btree", table.opportunityId.asc().nullsLast().op("uuid_ops")),
	index("idx_insurance_quotes_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_insurance_quotes_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "insurance_quotes_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "insurance_quotes_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "insurance_quotes_created_by_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "insurance_quotes_opportunity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "insurance_quotes_workspace_id_fkey"
		}).onDelete("cascade"),
	check("insurance_quotes_insurance_type_check", sql`insurance_type = ANY (ARRAY['auto'::text, 'home'::text, 'life'::text, 'business'::text, 'health'::text, 'umbrella'::text, 'specialty'::text])`),
	check("insurance_quotes_status_check", sql`status = ANY (ARRAY['pending'::text, 'presented'::text, 'accepted'::text, 'declined'::text, 'expired'::text])`),
]);

export const opportunities = pgTable("opportunities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	name: text().notNull(),
	accountId: uuid("account_id"),
	contactId: uuid("contact_id"),
	stage: opportunityStage().default('prospecting').notNull(),
	amount: numeric({ precision: 12, scale:  2 }),
	probability: integer().default(50),
	closeDate: date("close_date"),
	insuranceTypes: text("insurance_types").array(),
	policyTerm: integer("policy_term").default(12),
	effectiveDate: date("effective_date"),
	expirationDate: date("expiration_date"),
	premiumBreakdown: jsonb("premium_breakdown").default({}),
	coverageDetails: jsonb("coverage_details").default({}),
	competingCarriers: text("competing_carriers").array(),
	currentCarrier: text("current_carrier"),
	currentPremium: numeric("current_premium", { precision: 10, scale:  2 }),
	aiWinProbability: numeric("ai_win_probability", { precision: 5, scale:  2 }),
	aiRecommendedActions: jsonb("ai_recommended_actions").default([]),
	aiRiskFactors: jsonb("ai_risk_factors").default([]),
	customFields: jsonb("custom_fields").default({}),
	tags: text().array(),
	notes: text(),
	ownerId: uuid("owner_id"),
	source: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	stageChangedAt: timestamp("stage_changed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	campaignId: uuid("campaign_id"),
	abTestId: uuid("ab_test_id"),
	variantShown: text("variant_shown"),
	contactAttempts: integer("contact_attempts").default(0),
	maxContactAttempts: integer("max_contact_attempts").default(7),
	lastContactAttempt: timestamp("last_contact_attempt", { withTimezone: true, mode: 'string' }),
	nextContactDate: timestamp("next_contact_date", { withTimezone: true, mode: 'string' }),
	pausedUntil: timestamp("paused_until", { withTimezone: true, mode: 'string' }),
	pauseDurationDays: integer("pause_duration_days").default(49),
	quoteSentAt: timestamp("quote_sent_at", { withTimezone: true, mode: 'string' }),
	quoteResponseAt: timestamp("quote_response_at", { withTimezone: true, mode: 'string' }),
	maybeFollowupDays: integer("maybe_followup_days").default(7),
	aiSummary: text("ai_summary"),
	aiNextAction: text("ai_next_action"),
	aiQuoteRecommendation: text("ai_quote_recommendation"),
	aiFollowUpPriority: integer("ai_follow_up_priority"),
	premium: numeric({ precision: 10, scale:  2 }),
	quotePremium: numeric("quote_premium", { precision: 10, scale:  2 }),
	quoteExpiresAt: timestamp("quote_expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_opportunities_ab_test_id").using("btree", table.abTestId.asc().nullsLast().op("uuid_ops")),
	index("idx_opportunities_account_id").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("idx_opportunities_ai_follow_up_priority").using("btree", table.aiFollowUpPriority.asc().nullsLast().op("int4_ops")).where(sql`(ai_follow_up_priority IS NOT NULL)`),
	index("idx_opportunities_amount").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.amount.desc().nullsFirst().op("numeric_ops")),
	index("idx_opportunities_campaign_id").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_opportunities_contact_attempts").using("btree", table.contactAttempts.asc().nullsLast().op("int4_ops")),
	index("idx_opportunities_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_opportunities_current_carrier").using("btree", table.currentCarrier.asc().nullsLast().op("text_ops")),
	index("idx_opportunities_insurance_types").using("gin", table.insuranceTypes.asc().nullsLast().op("array_ops")),
	index("idx_opportunities_next_contact_date").using("btree", table.nextContactDate.asc().nullsLast().op("timestamptz_ops")).where(sql`(next_contact_date IS NOT NULL)`),
	index("idx_opportunities_owner_id").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("idx_opportunities_paused_until").using("btree", table.pausedUntil.asc().nullsLast().op("timestamptz_ops")).where(sql`(paused_until IS NOT NULL)`),
	index("idx_opportunities_premium").using("btree", table.premium.asc().nullsLast().op("numeric_ops")).where(sql`(premium IS NOT NULL)`),
	index("idx_opportunities_quote_expires_at").using("btree", table.quoteExpiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_opportunities_stage").using("btree", table.workspaceId.asc().nullsLast().op("date_ops"), table.stage.asc().nullsLast().op("enum_ops"), table.closeDate.asc().nullsLast().op("enum_ops")),
	index("idx_opportunities_stage_changed_at").using("btree", table.stageChangedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_opportunities_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.abTestId],
			foreignColumns: [abTests.id],
			name: "opportunities_ab_test_id_fkey"
		}),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "opportunities_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "opportunities_campaign_id_fkey"
		}),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "opportunities_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "opportunities_owner_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "opportunities_workspace_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can delete owned opportunities", { as: "permissive", for: "delete", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND ((owner_id = auth.uid()) OR is_workspace_admin()))` }),
	pgPolicy("Users can update owned opportunities", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can create opportunities", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can view workspace opportunities", { as: "permissive", for: "select", to: ["public"] }),
	check("chk_opportunity_has_target", sql`(account_id IS NOT NULL) OR (contact_id IS NOT NULL)`),
	check("opportunities_probability_check", sql`(probability >= 0) AND (probability <= 100)`),
]);

export const opportunityParticipants = pgTable("opportunity_participants", {
	opportunityId: uuid("opportunity_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	role: text(),
	influenceLevel: integer("influence_level").default(50),
}, (table) => [
	index("idx_opp_participants_contact_id").using("btree", table.contactId.asc().nullsLast().op("uuid_ops")),
	index("idx_opp_participants_workspace_id").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "opportunity_participants_contact_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.opportunityId],
			foreignColumns: [opportunities.id],
			name: "opportunity_participants_opportunity_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "opportunity_participants_workspace_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.opportunityId, table.contactId], name: "opportunity_participants_pkey"}),
	pgPolicy("Users can manage participants for owned opportunities", { as: "permissive", for: "all", to: ["public"], using: sql`((workspace_id = get_user_workspace_id()) AND (opportunity_id IN ( SELECT opportunities.id
   FROM opportunities
  WHERE ((opportunities.owner_id = auth.uid()) OR is_workspace_admin()))))` }),
	pgPolicy("Users can view workspace opportunity participants", { as: "permissive", for: "select", to: ["public"] }),
	check("opportunity_participants_influence_level_check", sql`(influence_level >= 0) AND (influence_level <= 100)`),
]);

export const interactions202508 = pgTable("interactions_2025_08", {
	id: uuid().defaultRandom().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	opportunityId: uuid("opportunity_id"),
	userId: uuid("user_id"),
	type: interactionType().notNull(),
	subject: text(),
	content: text(),
	direction: text(),
	durationMinutes: integer("duration_minutes"),
	outcome: text(),
	sentiment: text(),
	embedding: vector({ dimensions: 1024 }),
	aiSummary: text("ai_summary"),
	aiSentimentScore: numeric("ai_sentiment_score", { precision: 3, scale:  2 }),
	aiEntities: jsonb("ai_entities").default([]),
	aiActionItems: jsonb("ai_action_items").default([]),
	aiFollowUpSuggestions: jsonb("ai_follow_up_suggestions").default([]),
	metadata: jsonb().default({}),
	externalId: text("external_id"),
	interactedAt: timestamp("interacted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_interactions_2025_08_account").using("btree", table.accountId.asc().nullsLast().op("timestamptz_ops"), table.interactedAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_interactions_2025_08_embedding_hnsw").using("hnsw", table.embedding.asc().nullsLast().op("vector_ip_ops")).with({m: "32",ef_construction: "128"}),
	index("idx_interactions_2025_08_type").using("btree", table.workspaceId.asc().nullsLast().op("timestamptz_ops"), table.type.asc().nullsLast().op("enum_ops"), table.interactedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_interactions_2025_08_workspace_contact").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.contactId.asc().nullsLast().op("timestamptz_ops"), table.interactedAt.desc().nullsFirst().op("timestamptz_ops")),
	primaryKey({ columns: [table.id, table.interactedAt], name: "interactions_2025_08_pkey"}),
	check("interactions_ai_sentiment_score_check", sql`(ai_sentiment_score >= ('-1'::integer)::numeric) AND (ai_sentiment_score <= (1)::numeric)`),
	check("interactions_direction_check", sql`direction = ANY (ARRAY['inbound'::text, 'outbound'::text])`),
	check("interactions_sentiment_check", sql`sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])`),
]);

export const interactions202509 = pgTable("interactions_2025_09", {
	id: uuid().defaultRandom().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	opportunityId: uuid("opportunity_id"),
	userId: uuid("user_id"),
	type: interactionType().notNull(),
	subject: text(),
	content: text(),
	direction: text(),
	durationMinutes: integer("duration_minutes"),
	outcome: text(),
	sentiment: text(),
	embedding: vector({ dimensions: 1024 }),
	aiSummary: text("ai_summary"),
	aiSentimentScore: numeric("ai_sentiment_score", { precision: 3, scale:  2 }),
	aiEntities: jsonb("ai_entities").default([]),
	aiActionItems: jsonb("ai_action_items").default([]),
	aiFollowUpSuggestions: jsonb("ai_follow_up_suggestions").default([]),
	metadata: jsonb().default({}),
	externalId: text("external_id"),
	interactedAt: timestamp("interacted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_interactions_2025_09_account").using("btree", table.accountId.asc().nullsLast().op("timestamptz_ops"), table.interactedAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_interactions_2025_09_embedding_hnsw").using("hnsw", table.embedding.asc().nullsLast().op("vector_ip_ops")).with({m: "32",ef_construction: "128"}),
	index("idx_interactions_2025_09_type").using("btree", table.workspaceId.asc().nullsLast().op("timestamptz_ops"), table.type.asc().nullsLast().op("enum_ops"), table.interactedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_interactions_2025_09_workspace_contact").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.contactId.asc().nullsLast().op("timestamptz_ops"), table.interactedAt.desc().nullsFirst().op("timestamptz_ops")),
	primaryKey({ columns: [table.id, table.interactedAt], name: "interactions_2025_09_pkey"}),
	check("interactions_ai_sentiment_score_check", sql`(ai_sentiment_score >= ('-1'::integer)::numeric) AND (ai_sentiment_score <= (1)::numeric)`),
	check("interactions_direction_check", sql`direction = ANY (ARRAY['inbound'::text, 'outbound'::text])`),
	check("interactions_sentiment_check", sql`sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])`),
]);


// --- Campaign Execution Tables (MVP) ---
export const campaignTemplates = pgTable("campaign_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	channel: text().notNull(),
	name: text().notNull(),
	variablesSchema: jsonb("variables_schema").default({}),
	subjectTemplate: text("subject_template"),
	bodyTemplate: text("body_template"),
	providerMetadata: jsonb("provider_metadata").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_campaign_templates_campaign").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_templates_workspace").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({ columns: [table.campaignId], foreignColumns: [campaigns.id], name: "campaign_templates_campaign_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.workspaceId], foreignColumns: [workspaces.id], name: "campaign_templates_workspace_id_fkey" }).onDelete("cascade"),
	pgPolicy("Users can view campaign_templates in workspace", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can create campaign_templates in workspace", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can update campaign_templates in workspace", { as: "permissive", for: "update", to: ["public"] }),
]);

export const campaignSteps = pgTable("campaign_steps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	stepNumber: integer("step_number").notNull(),
	templateId: uuid("template_id"),
	waitAfterMs: integer("wait_after_ms").default(0),
	condition: jsonb("condition").default({}),
	branchLabel: text("branch_label"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_campaign_steps_campaign").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_steps_workspace").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({ columns: [table.campaignId], foreignColumns: [campaigns.id], name: "campaign_steps_campaign_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.templateId], foreignColumns: [campaignTemplates.id], name: "campaign_steps_template_id_fkey" }).onDelete("set null"),
	foreignKey({ columns: [table.workspaceId], foreignColumns: [workspaces.id], name: "campaign_steps_workspace_id_fkey" }).onDelete("cascade"),
]);

export const campaignTargets = pgTable("campaign_targets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	opportunityId: uuid("opportunity_id").notNull(),
	contactId: uuid("contact_id"),
	accountId: uuid("account_id"),
	state: text().default('pending').notNull(),
	nextStepNumber: integer("next_step_number").default(1),
	lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true, mode: 'string' }),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_campaign_targets_campaign").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_targets_opportunity").using("btree", table.opportunityId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_targets_workspace").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({ columns: [table.campaignId], foreignColumns: [campaigns.id], name: "campaign_targets_campaign_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.opportunityId], foreignColumns: [opportunities.id], name: "campaign_targets_opportunity_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.contactId], foreignColumns: [contacts.id], name: "campaign_targets_contact_id_fkey" }).onDelete("set null"),
	foreignKey({ columns: [table.accountId], foreignColumns: [accounts.id], name: "campaign_targets_account_id_fkey" }).onDelete("set null"),
	foreignKey({ columns: [table.workspaceId], foreignColumns: [workspaces.id], name: "campaign_targets_workspace_id_fkey" }).onDelete("cascade"),
	check("campaign_targets_state_check", sql`state = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'suppressed'::text, 'failed'::text])`),
]);

export const campaignTargetOverrides = pgTable("campaign_target_overrides", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	targetId: uuid("target_id").notNull(),
	stepId: uuid("step_id").notNull(),
	overridesJson: jsonb("overrides_json").default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_campaign_target_overrides_campaign").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_target_overrides_target").using("btree", table.targetId.asc().nullsLast().op("uuid_ops")),
	foreignKey({ columns: [table.campaignId], foreignColumns: [campaigns.id], name: "campaign_target_overrides_campaign_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.targetId], foreignColumns: [campaignTargets.id], name: "campaign_target_overrides_target_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.stepId], foreignColumns: [campaignSteps.id], name: "campaign_target_overrides_step_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.workspaceId], foreignColumns: [workspaces.id], name: "campaign_target_overrides_workspace_id_fkey" }).onDelete("cascade"),
]);

export const campaignStepRuns = pgTable("campaign_step_runs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	campaignId: uuid("campaign_id").notNull(),
	targetId: uuid("target_id").notNull(),
	stepId: uuid("step_id").notNull(),
	channel: text().notNull(),
	resolvedPayload: jsonb("resolved_payload").default({}).notNull(),
	status: text().default('queued').notNull(),
	providerMessageId: text("provider_message_id"),
	n8nExecutionId: text("n8n_execution_id"),
	errorJson: jsonb("error_json").default({}),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_campaign_step_runs_campaign").using("btree", table.campaignId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_step_runs_target").using("btree", table.targetId.asc().nullsLast().op("uuid_ops")),
	index("idx_campaign_step_runs_workspace").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({ columns: [table.campaignId], foreignColumns: [campaigns.id], name: "campaign_step_runs_campaign_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.targetId], foreignColumns: [campaignTargets.id], name: "campaign_step_runs_target_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.stepId], foreignColumns: [campaignSteps.id], name: "campaign_step_runs_step_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.workspaceId], foreignColumns: [workspaces.id], name: "campaign_step_runs_workspace_id_fkey" }).onDelete("cascade"),
	check("campaign_step_runs_status_check", sql`status = ANY (ARRAY['queued'::text, 'sent'::text, 'bounced'::text, 'failed'::text, 'skipped'::text])`),
]);
