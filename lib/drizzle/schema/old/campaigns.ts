import { pgTable, uuid, text, timestamp, numeric, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaigns = pgTable('campaigns', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  name: text().notNull(),
  description: text(),
  campaign_type: text().notNull(),
  status: text().default('Draft'),
  start_date: timestamp({ withTimezone: true }),
  end_date: timestamp({ withTimezone: true }),
  budget: numeric({ precision: 15, scale: 2 }),
  target_audience: jsonb().default('{}'),
  goals: jsonb().default('{}'),
  success_metrics: jsonb().default('{}'),
  audience_filters: jsonb().default('{}'),
  geographic_targeting: jsonb().default('{}'),
  demographic_targeting: jsonb().default('{}'),
  total_sent: integer().default(0),
  total_delivered: integer().default(0),
  total_opened: integer().default(0),
  total_clicked: integer().default(0),
  total_converted: integer().default(0),
  total_cost: numeric({ precision: 15, scale: 2 }).default(0),
  ai_optimization_enabled: boolean().default(false),
  ai_insights: jsonb().default('{}'),
  ai_recommendations: jsonb().default('{}'),
  metadata: jsonb().default('{}'),
  tags: text().array().default('{}'),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Campaigns = typeof campaigns.$inferSelect;
export type NewCampaigns = typeof campaigns.$inferInsert;
