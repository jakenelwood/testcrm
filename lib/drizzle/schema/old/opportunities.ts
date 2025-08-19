import { pgTable, uuid, text, integer, numeric, date, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { contacts } from './contacts';
import { pipelines } from './pipelines';
import { pipelineStatuses } from './pipeline_statuses';
import { users } from './users';

export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Relationships
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  pipelineId: integer('pipeline_id').references(() => pipelines.id),
  stageId: integer('stage_id').references(() => pipelineStatuses.id),
  
  // Opportunity details
  name: text('name').notNull(),
  description: text('description'),
  value: numeric('value', { precision: 15, scale: 2 }),
  probability: integer('probability'), // 0-100
  
  // Dates
  expectedCloseDate: date('expected_close_date'),
  actualCloseDate: date('actual_close_date'),
  
  // Status
  status: text('status').notNull().default('open').$type<'open' | 'closed-won' | 'closed-lost'>(),
  
  // AI fields
  aiScore: integer('ai_score'), // 0-100
  aiInsights: jsonb('ai_insights').$type<Record<string, any>>().default({}),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  // Audit fields
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  // Core relationships
  contact: one(contacts, {
    fields: [opportunities.contactId],
    references: [contacts.id],
  }),
  pipeline: one(pipelines, {
    fields: [opportunities.pipelineId],
    references: [pipelines.id],
  }),
  stage: one(pipelineStatuses, {
    fields: [opportunities.stageId],
    references: [pipelineStatuses.id],
  }),
  
  // User relationships
  creator: one(users, {
    fields: [opportunities.createdBy],
    references: [users.id],
    relationName: 'opportunityCreator'
  }),
  updater: one(users, {
    fields: [opportunities.updatedBy],
    references: [users.id],
    relationName: 'opportunityUpdater'
  }),
  
  // Related entities
  activities: many('activities'),
  insuranceQuotes: many('insuranceQuotes'),
}));

// Type exports
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;

// Utility types
export type OpportunityStatus = Opportunity['status'];

// Opportunity with relations type
export type OpportunityWithRelations = Opportunity & {
  contact?: typeof contacts.$inferSelect;
  pipeline?: typeof pipelines.$inferSelect;
  stage?: typeof pipelineStatuses.$inferSelect;
  creator?: typeof users.$inferSelect;
  updater?: typeof users.$inferSelect;
  activities?: any[]; // Will be properly typed when activities schema is created
  insuranceQuotes?: any[]; // Will be properly typed when insurance quotes schema is created
};

// Helper functions for opportunity management
export const opportunityHelpers = {
  // Calculate weighted value (value * probability)
  getWeightedValue: (opportunity: Opportunity): number => {
    if (!opportunity.value || !opportunity.probability) return 0;
    return (parseFloat(opportunity.value.toString()) * opportunity.probability) / 100;
  },
  
  // Check if opportunity is overdue
  isOverdue: (opportunity: Opportunity): boolean => {
    if (!opportunity.expectedCloseDate || opportunity.status !== 'open') return false;
    return new Date(opportunity.expectedCloseDate) < new Date();
  },
  
  // Get opportunity age in days
  getAgeInDays: (opportunity: Opportunity): number => {
    const created = new Date(opportunity.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  },
  
  // Get days until expected close
  getDaysUntilClose: (opportunity: Opportunity): number | null => {
    if (!opportunity.expectedCloseDate) return null;
    const expected = new Date(opportunity.expectedCloseDate);
    const now = new Date();
    return Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  },
};
