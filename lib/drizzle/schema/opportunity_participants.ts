import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';

export const opportunity_participants = pgTable('opportunity_participants', {
  opportunity_id: uuid().notNull().primaryKey(),
  contact_id: uuid().notNull().primaryKey(),
  workspace_id: uuid().notNull(),
  role: text(),
  influence_level: integer().default(50),
});

export type OpportunityParticipants = typeof opportunity_participants.$inferSelect;
export type NewOpportunityParticipants = typeof opportunity_participants.$inferInsert;
