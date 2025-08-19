import { pgTable, integer, text, boolean, jsonb, numeric, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const pipeline_statuses = pgTable('pipeline_statuses', {
  id: integer().notNull().primaryKey(),
  pipeline_id: integer().unique(),
  name: text().notNull().unique(),
  description: text(),
  is_final: boolean().default(false),
  is_active: boolean().default(true),
  display_order: integer().notNull().unique(),
  color_hex: text(),
  icon_name: text(),
  badge_variant: text().default('default'),
  stage_type: text().default('active'),
  required_fields: text().array().default('{}'),
  optional_fields: text().array().default('{}'),
  target_duration: integer(),
  max_duration: integer(),
  ai_action_template: text(),
  ai_follow_up_suggestions: jsonb().default('[]'),
  ai_next_steps: jsonb().default('[]'),
  ai_exit_criteria: jsonb().default('{}'),
  auto_actions: jsonb().default('{}'),
  notification_settings: jsonb().default('{}'),
  escalation_rules: jsonb().default('{}'),
  conversion_probability: numeric({ precision: 5, scale: 2 }),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type PipelineStatuses = typeof pipeline_statuses.$inferSelect;
export type NewPipelineStatuses = typeof pipeline_statuses.$inferInsert;
