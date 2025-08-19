import { pgTable, integer, text, boolean, jsonb, numeric, uuid, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const pipelines = pgTable('pipelines', {
  id: integer().notNull().primaryKey(),
  name: text().notNull(),
  description: text(),
  is_default: boolean().default(false),
  is_active: boolean().default(true),
  display_order: integer(),
  lead_type: text().default('Personal'),
  insurance_types: integer().array().default(sql`'{}'::integer[]`),
  conversion_goals: jsonb().default('{}'),
  target_conversion_rate: numeric({ precision: 5, scale: 2 }),
  average_cycle_time: integer(),
  ai_optimization_enabled: boolean().default(false),
  ai_scoring_model: jsonb().default('{}'),
  ai_automation_rules: jsonb().default('{}'),
  metadata: jsonb().default('{}'),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Pipelines = typeof pipelines.$inferSelect;
export type NewPipelines = typeof pipelines.$inferInsert;
