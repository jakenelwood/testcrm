import { pgTable, uuid, text, jsonb, timestamp, integer, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const ab_tests = pgTable('ab_tests', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  name: text().notNull(),
  hypothesis: text(),
  test_type: text(),
  variants: jsonb().notNull(),
  traffic_allocation: jsonb().default(sql`'{"control": 50, "variant_a": 50}'::jsonb`),
  status: text().default('draft'),
  start_date: timestamp({ withTimezone: true }),
  end_date: timestamp({ withTimezone: true }),
  success_metric: text().notNull(),
  minimum_sample_size: integer().default(100),
  confidence_level: numeric({ precision: 5, scale: 2 }).default(95.0),
  statistical_significance: numeric({ precision: 5, scale: 2 }),
  winner_variant: text(),
  results: jsonb().default('{}'),
  ai_analysis: jsonb().default('{}'),
  ai_recommendations: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type AbTests = typeof ab_tests.$inferSelect;
export type NewAbTests = typeof ab_tests.$inferInsert;
