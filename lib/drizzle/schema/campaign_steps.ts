import { pgTable, uuid, integer, jsonb, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_steps = pgTable('campaign_steps', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  step_number: integer().notNull(),
  template_id: uuid(),
  wait_after_ms: integer().default(0),
  condition: jsonb().default('{}'),
  branch_label: text(),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type CampaignSteps = typeof campaign_steps.$inferSelect;
export type NewCampaignSteps = typeof campaign_steps.$inferInsert;
