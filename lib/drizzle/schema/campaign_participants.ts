import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_participants = pgTable('campaign_participants', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  ab_test_id: uuid(),
  contact_id: uuid().notNull().unique(),
  account_id: uuid(),
  variant_assigned: text(),
  assigned_at: timestamp({ withTimezone: true }).default(sql`now()`),
  is_current: boolean().default(true),
  ended_at: timestamp({ withTimezone: true }),
  end_reason: text(),
  excluded: boolean().default(false),
  exclusion_reason: text(),
  metadata: jsonb().default('{}'),
});

export type CampaignParticipants = typeof campaign_participants.$inferSelect;
export type NewCampaignParticipants = typeof campaign_participants.$inferInsert;
