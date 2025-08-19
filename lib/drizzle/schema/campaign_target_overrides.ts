import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_target_overrides = pgTable('campaign_target_overrides', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  target_id: uuid().notNull(),
  step_id: uuid().notNull(),
  overrides_json: jsonb().notNull().default('{}'),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type CampaignTargetOverrides = typeof campaign_target_overrides.$inferSelect;
export type NewCampaignTargetOverrides = typeof campaign_target_overrides.$inferInsert;
