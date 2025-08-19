import { pgTable, uuid, text, jsonb, timestamp, numeric, boolean, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaigns = pgTable('campaigns', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  name: text().notNull(),
  description: text(),
  campaign_type: text().notNull(),
  objective: text(),
  audience_criteria: jsonb().default('{}'),
  exclusion_criteria: jsonb().default('{}'),
  status: text().default('draft'),
  start_date: timestamp({ withTimezone: true }),
  end_date: timestamp({ withTimezone: true }),
  budget: numeric({ precision: 12, scale: 2 }),
  target_metrics: jsonb().default('{}'),
  ai_optimization_enabled: boolean().default(false),
  automation_rules: jsonb().default('{}'),
  total_targeted: integer().default(0),
  total_sent: integer().default(0),
  total_delivered: integer().default(0),
  total_opened: integer().default(0),
  total_clicked: integer().default(0),
  total_converted: integer().default(0),
  owner_id: uuid(),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type Campaigns = typeof campaigns.$inferSelect;
export type NewCampaigns = typeof campaigns.$inferInsert;
