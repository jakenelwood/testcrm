import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_step_runs = pgTable('campaign_step_runs', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  target_id: uuid().notNull(),
  step_id: uuid().notNull(),
  channel: text().notNull(),
  resolved_payload: jsonb().notNull().default('{}'),
  status: text().notNull().default('queued'),
  provider_message_id: text(),
  n8n_execution_id: text(),
  error_json: jsonb().default('{}'),
  sent_at: timestamp({ withTimezone: true }),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type CampaignStepRuns = typeof campaign_step_runs.$inferSelect;
export type NewCampaignStepRuns = typeof campaign_step_runs.$inferInsert;
