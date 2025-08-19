import { pgTable, uuid, text, timestamp, jsonb, integer, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const ab_tests = pgTable('ab_tests', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  name: text().notNull(),
  description: text(),
  campaign_id: uuid(),
  test_type: text().notNull(),
  status: text().default('Draft'),
  start_date: timestamp({ withTimezone: true }),
  end_date: timestamp({ withTimezone: true }),
  traffic_split: jsonb().default(sql`'{"variant_a": 50, "variant_b": 50}'::jsonb`),
  sample_size: integer(),
  confidence_level: numeric({ precision: 5, scale: 2 }).default(95.0),
  success_metric: text().notNull(),
  minimum_effect_size: numeric({ precision: 5, scale: 2 }),
  statistical_significance: numeric({ precision: 5, scale: 2 }),
  winner_variant: text(),
  variants: jsonb().default('{}'),
  results: jsonb().default('{}'),
  ai_analysis: jsonb().default('{}'),
  ai_recommendations: jsonb().default('{}'),
  metadata: jsonb().default('{}'),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type AbTests = typeof ab_tests.$inferSelect;
export type NewAbTests = typeof ab_tests.$inferInsert;
