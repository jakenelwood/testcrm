import { pgTable, integer, uuid, text, boolean, jsonb, numeric, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const pipelines = pgTable('pipelines', {
  id: integer().notNull().primaryKey(),
  workspace_id: uuid().notNull(),
  name: text().notNull(),
  description: text(),
  pipeline_type: text().default('sales'),
  insurance_category: text(),
  is_default: boolean().default(false),
  is_active: boolean().default(true),
  stages: jsonb().default('[]'),
  automation_rules: jsonb().default('{}'),
  ai_optimization_enabled: boolean().default(false),
  target_conversion_rate: numeric({ precision: 5, scale: 2 }),
  average_cycle_days: integer(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Pipelines = typeof pipelines.$inferSelect;
export type NewPipelines = typeof pipelines.$inferInsert;
