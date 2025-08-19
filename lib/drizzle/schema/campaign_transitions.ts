import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_transitions = pgTable('campaign_transitions', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  contact_id: uuid().notNull(),
  from_campaign_id: uuid(),
  to_campaign_id: uuid().notNull(),
  transition_reason: text().notNull(),
  transition_data: jsonb().default('{}'),
  transitioned_at: timestamp({ withTimezone: true }).default(sql`now()`),
  transitioned_by: uuid(),
});

export type CampaignTransitions = typeof campaign_transitions.$inferSelect;
export type NewCampaignTransitions = typeof campaign_transitions.$inferInsert;
