/**
 * 🚀 Unified AI-Native CRM Schema
 * Drizzle ORM schema for the new unified insurance CRM
 * Implements the optimization report recommendations
 */

import { 
  pgTable, 
  uuid, 
  text, 
  integer, 
  decimal, 
  boolean, 
  timestamp, 
  date,
  time,
  jsonb,
  serial,
  bigint,
  vector,
  pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// =============================================================================
// ENUMS
// =============================================================================

export const contactLifecycleStage = pgEnum('contact_lifecycle_stage', [
  'lead',
  'opportunity_contact', 
  'customer',
  'churned'
]);

export const opportunityStage = pgEnum('opportunity_stage', [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
]);



export const interactionType = pgEnum('interaction_type', [
  'email',
  'call', 
  'meeting',
  'note',
  'task_completed',
  'sms',
  'quote_generated',
  'policy_issued'
]);

// =============================================================================
// CORE TABLES
// =============================================================================

// Workspaces for multi-tenant isolation
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Insurance agency specific
  agencyLicense: text('agency_license'),
  agencyType: text('agency_type'), // 'Independent', 'Captive', 'Direct'
  primaryLines: jsonb('primary_lines').default('[]'), // ["auto", "home", "commercial"]
  // Settings
  timezone: text('timezone').default('America/Chicago'),
  dateFormat: text('date_format').default('MM/DD/YYYY'),
  currency: text('currency').default('USD'),
  // Subscription
  subscriptionTier: text('subscription_tier').default('basic'),
  maxUsers: integer('max_users').default(5),
  maxContacts: integer('max_contacts').default(1000),
  // Metadata
  settings: jsonb('settings').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Enhanced users with workspace reference
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // References auth.users.id
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  // Role-based access
  role: text('role').notNull().default('agent'), // 'owner', 'manager', 'agent', 'csr'
  permissions: jsonb('permissions').default('{}'),
  // Insurance agent specific
  licenseNumber: text('license_number'),
  licenseState: text('license_state'),
  licenseExpiration: date('license_expiration'),
  specializations: text('specializations').array(), // ["auto", "home", "commercial"]
  // Preferences
  timezone: text('timezone').default('America/Chicago'),
  notificationPreferences: jsonb('notification_preferences').default('{}'),
  // Contact/Sales preferences
  defaultMaxContactAttempts: integer('default_max_contact_attempts').default(7),
  defaultPauseDurationDays: integer('default_pause_duration_days').default(49), // 7 weeks
  contactPreferences: jsonb('contact_preferences').default('{}'), // Custom settings per user
  // Status
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  // Metadata
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Accounts for B2B relationships
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  website: text('website'),
  industry: text('industry'),
  employeeCount: integer('employee_count'),
  annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  // Address
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  // Business details
  businessType: text('business_type'),
  taxId: text('tax_id'),
  dunsNumber: text('duns_number'),
  yearEstablished: text('year_established'),
  // Insurance specific
  currentCarriers: jsonb('current_carriers').default('{}'),
  policyRenewalDates: jsonb('policy_renewal_dates').default('{}'),
  riskProfile: jsonb('risk_profile').default('{}'),
  // Commercial insurance premiums
  commercialPremium: decimal('commercial_premium', { precision: 10, scale: 2 }),
  // Commercial insurance data (JSONB for detailed coverage information)
  commercialData: jsonb('commercial_data').default('{}'),
  liabilityData: jsonb('liability_data').default('{}'),
  // Business relationships
  additionalInsureds: jsonb('additional_insureds').default('[]'),
  additionalLocations: jsonb('additional_locations').default('[]'),
  // Insurance data versioning
  commercialDataVersion: integer('commercial_data_version').default(1),
  liabilityDataVersion: integer('liability_data_version').default(1),
  // AI fields
  summaryEmbedding: vector('summary_embedding', { dimensions: 1024 }),
  aiRiskScore: integer('ai_risk_score'),
  aiLifetimeValue: decimal('ai_lifetime_value', { precision: 15, scale: 2 }),
  aiInsights: jsonb('ai_insights').default('{}'),
  // Flexible data
  customFields: jsonb('custom_fields').default('{}'),
  tags: text('tags').array(),
  // Ownership
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Unified contacts table (replaces clients/leads)
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  // B2B relationship (NULL for B2C)
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  // Basic info
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  mobilePhone: text('mobile_phone'),
  // Address (primary residence/business address)
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  // Personal details (for individual contacts)
  dateOfBirth: date('date_of_birth'),
  gender: text('gender'),
  maritalStatus: text('marital_status'),
  occupation: text('occupation'),
  // Business context (for B2B contacts)
  jobTitle: text('job_title'),
  department: text('department'),
  // Insurance specific (minimal - just for identity verification)
  driversLicense: text('drivers_license'),
  licenseState: text('license_state'),
  ssnLastFour: text('ssn_last_four'),
  // Lifecycle management
  lifecycleStage: contactLifecycleStage('lifecycle_stage').notNull().default('lead'),
  leadSource: text('lead_source'),
  referredBy: uuid('referred_by').references(() => contacts.id),
  // AI fields
  summaryEmbedding: vector('summary_embedding', { dimensions: 1024 }),
  aiRiskScore: integer('ai_risk_score'),
  aiLifetimeValue: decimal('ai_lifetime_value', { precision: 15, scale: 2 }),
  aiChurnProbability: decimal('ai_churn_probability', { precision: 5, scale: 2 }),
  aiInsights: jsonb('ai_insights').default('{}'),
  // Communication preferences
  preferredContactMethod: text('preferred_contact_method').default('email'),
  communicationPreferences: jsonb('communication_preferences').default('{}'),
  // Flexible data
  customFields: jsonb('custom_fields').default('{}'),
  tags: text('tags').array(),
  // Contact tracking
  lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
  nextContactAt: timestamp('next_contact_at', { withTimezone: true }),
  // Ownership
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Opportunities for insurance quotes/policies
export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Relationships
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  // Pipeline stage
  stage: opportunityStage('stage').notNull().default('prospecting'),
  // Financial details
  amount: decimal('amount', { precision: 12, scale: 2 }),
  probability: integer('probability').default(50),
  closeDate: date('close_date'),
  // Insurance specific
  insuranceTypes: text('insurance_types').array(), // ["auto", "home"]
  policyTerm: integer('policy_term').default(12), // months
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  // Premium breakdown
  premiumBreakdown: jsonb('premium_breakdown').default('{}'),
  coverageDetails: jsonb('coverage_details').default('{}'),
  // Competition
  competingCarriers: text('competing_carriers').array(),
  currentCarrier: text('current_carrier'),
  currentPremium: decimal('current_premium', { precision: 10, scale: 2 }),
  // AI insights
  aiWinProbability: decimal('ai_win_probability', { precision: 5, scale: 2 }),
  aiRecommendedActions: jsonb('ai_recommended_actions').default('[]'),
  aiRiskFactors: jsonb('ai_risk_factors').default('[]'),
  // Additional AI fields from leads system
  aiSummary: text('ai_summary'),
  aiNextAction: text('ai_next_action'),
  aiQuoteRecommendation: text('ai_quote_recommendation'),
  aiFollowUpPriority: integer('ai_follow_up_priority'),
  // Premium field for opportunity-specific tracking
  premium: decimal('premium', { precision: 10, scale: 2 }),
  // Flexible data
  customFields: jsonb('custom_fields').default('{}'),
  tags: text('tags').array(),
  notes: text('notes'),
  // Ownership
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  source: text('source'),
  // Contact tracking
  contactAttempts: integer('contact_attempts').default(0),
  maxContactAttempts: integer('max_contact_attempts').default(7), // Configurable per opportunity
  lastContactAttempt: timestamp('last_contact_attempt', { withTimezone: true }),
  nextContactDate: timestamp('next_contact_date', { withTimezone: true }),
  pausedUntil: timestamp('paused_until', { withTimezone: true }), // Custom pause duration
  pauseDurationDays: integer('pause_duration_days').default(49), // 7 weeks default, but configurable
  // Quote response tracking
  quoteSentAt: timestamp('quote_sent_at', { withTimezone: true }),
  quoteResponseAt: timestamp('quote_response_at', { withTimezone: true }),
  maybeFollowupDays: integer('maybe_followup_days').default(7), // Days to wait for "maybe" responses
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  stageChangedAt: timestamp('stage_changed_at', { withTimezone: true }).defaultNow(),
});

// Junction table for B2B opportunity participants
export const opportunityParticipants = pgTable('opportunity_participants', {
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  role: text('role'), // 'Decision Maker', 'Influencer', 'Champion'
  influenceLevel: integer('influence_level').default(50),
}, (table) => ({
  pk: { primaryKey: [table.opportunityId, table.contactId] }
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;

export type OpportunityParticipant = typeof opportunityParticipants.$inferSelect;
export type NewOpportunityParticipant = typeof opportunityParticipants.$inferInsert;

// =============================================================================
// ACTIVITY STREAM TABLES
// =============================================================================

// Partitioned interactions table for scalable activity tracking
export const interactions = pgTable('interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  // Relationships
  contactId: uuid('contact_id').references(() => contacts.id),
  accountId: uuid('account_id').references(() => accounts.id),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id),
  userId: uuid('user_id').references(() => users.id),
  // Interaction details
  type: interactionType('type').notNull(),
  subject: text('subject'),
  content: text('content'),
  direction: text('direction'), // 'inbound', 'outbound'
  // Communication specific
  durationMinutes: integer('duration_minutes'),
  outcome: text('outcome'),
  sentiment: text('sentiment'), // 'positive', 'neutral', 'negative'
  // AI analysis
  embedding: vector('embedding', { dimensions: 1024 }),
  aiSummary: text('ai_summary'),
  aiSentimentScore: decimal('ai_sentiment_score', { precision: 3, scale: 2 }),
  aiEntities: jsonb('ai_entities').default('[]'),
  aiActionItems: jsonb('ai_action_items').default('[]'),
  aiFollowUpSuggestions: jsonb('ai_follow_up_suggestions').default('[]'),
  // Metadata
  metadata: jsonb('metadata').default('{}'),
  externalId: text('external_id'),
  // Timestamps
  interactedAt: timestamp('interacted_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Notes for unstructured observations
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  // Relationships
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Content
  title: text('title'),
  content: text('content').notNull(),
  noteType: text('note_type').default('general'), // 'general', 'meeting', 'call', 'research'
  // AI analysis
  embedding: vector('embedding', { dimensions: 1024 }),
  aiSummary: text('ai_summary'),
  aiTags: text('ai_tags').array(),
  // Metadata
  isPrivate: boolean('is_private').default(false),
  tags: text('tags').array(),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Tasks for follow-up and workflow management
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  // Relationships
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
  // Task details
  taskType: text('task_type').default('follow_up'), // 'follow_up', 'quote', 'meeting'
  priority: text('priority').default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: text('status').notNull().default('pending'), // 'pending', 'in_progress', 'completed'
  // Scheduling
  dueDate: date('due_date'),
  dueTime: time('due_time'),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  // Assignment
  assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  // AI suggestions
  aiGenerated: boolean('ai_generated').default(false),
  aiPriorityScore: integer('ai_priority_score'),
  aiSuggestedActions: jsonb('ai_suggested_actions').default('[]'),
  // Metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Documents for file attachments
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  // File details
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  mimeType: text('mime_type'),
  fileHash: text('file_hash'),
  // Relationships
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'cascade' }),
  uploadedById: uuid('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
  // Document classification
  documentType: text('document_type'), // 'quote', 'policy', 'application', 'claim'
  // AI analysis
  embedding: vector('embedding', { dimensions: 1024 }),
  aiExtractedText: text('ai_extracted_text'),
  aiSummary: text('ai_summary'),
  aiDocumentClassification: jsonb('ai_document_classification').default('{}'),
  aiKeyEntities: jsonb('ai_key_entities').default('[]'),
  // Metadata
  tags: text('tags').array(),
  isConfidential: boolean('is_confidential').default(false),
  retentionDate: date('retention_date'),
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =============================================================================
// ACTIVITY STREAM TYPE EXPORTS
// =============================================================================

export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// =============================================================================
// INSURANCE-SPECIFIC TABLES
// =============================================================================

// Insurance policies table (post-sale)
export const insurancePolicies = pgTable('insurance_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),

  // Relationships
  opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'set null' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),

  // Policy basics
  policyNumber: text('policy_number').notNull(),
  carrier: text('carrier').notNull(),
  policyType: text('policy_type').notNull(), // 'auto', 'home', 'life', 'business', 'health', 'umbrella', 'specialty'

  // Financial details
  premiumAmount: decimal('premium_amount', { precision: 10, scale: 2 }).notNull(),
  deductible: decimal('deductible', { precision: 10, scale: 2 }),
  coverageLimit: decimal('coverage_limit', { precision: 12, scale: 2 }),

  // Policy period
  effectiveDate: date('effective_date').notNull(),
  expirationDate: date('expiration_date').notNull(),

  // Policy details (flexible JSONB for different policy types)
  policyDetails: jsonb('policy_details').default('{}'),

  // Status
  status: text('status').notNull().default('active'), // 'active', 'cancelled', 'expired', 'pending'

  // Ownership and tracking
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Insurance quotes table (pre-sale)
export const insuranceQuotes = pgTable('insurance_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),

  // Relationships
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),

  // Quote basics
  quoteNumber: text('quote_number'),
  carrier: text('carrier').notNull(),
  insuranceType: text('insurance_type').notNull(), // 'auto', 'home', 'life', 'business', 'health', 'umbrella', 'specialty'

  // Financial details
  quotedPremium: decimal('quoted_premium', { precision: 10, scale: 2 }).notNull(),
  deductible: decimal('deductible', { precision: 10, scale: 2 }),
  coverageLimits: jsonb('coverage_limits').default('{}'),

  // Quote validity
  quoteDate: date('quote_date').defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  // Quote details (flexible JSONB for different insurance types)
  quoteDetails: jsonb('quote_details').default('{}'),

  // Status
  status: text('status').notNull().default('pending'), // 'pending', 'presented', 'accepted', 'declined', 'expired'

  // Ownership and tracking
  createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type exports for insurance tables
export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type NewInsurancePolicy = typeof insurancePolicies.$inferInsert;

export type InsuranceQuote = typeof insuranceQuotes.$inferSelect;
export type NewInsuranceQuote = typeof insuranceQuotes.$inferInsert;
