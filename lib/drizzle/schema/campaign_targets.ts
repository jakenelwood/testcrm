import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_targets = pgTable('campaign_targets', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  opportunity_id: uuid().notNull(),
  contact_id: uuid(),
  account_id: uuid(),
  state: text().notNull().default('pending'),
  next_step_number: integer().default(1),
  last_attempt_at: timestamp({ withTimezone: true }),
  assigned_at: timestamp({ withTimezone: true }).default(sql`now()`),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type CampaignTargets = typeof campaign_targets.$inferSelect;
export type NewCampaignTargets = typeof campaign_targets.$inferInsert;
