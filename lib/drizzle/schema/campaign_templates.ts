import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_templates = pgTable('campaign_templates', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  channel: text().notNull(),
  name: text().notNull(),
  variables_schema: jsonb().default('{}'),
  subject_template: text(),
  body_template: text(),
  provider_metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type CampaignTemplates = typeof campaign_templates.$inferSelect;
export type NewCampaignTemplates = typeof campaign_templates.$inferInsert;
