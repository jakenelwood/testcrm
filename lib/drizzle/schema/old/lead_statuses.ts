import { pgTable, integer, text, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const lead_statuses = pgTable('lead_statuses', {
  id: integer().notNull().primaryKey(),
  value: text().notNull().unique(),
  description: text(),
  is_final: boolean().default(false),
  is_active: boolean().default(true),
  display_order: integer(),
  color_hex: text(),
  icon_name: text(),
  badge_variant: text().default('default'),
  ai_action_template: text(),
  ai_follow_up_suggestions: jsonb().default('[]'),
  ai_next_steps: jsonb().default('[]'),
  auto_actions: jsonb().default('{}'),
  notification_settings: jsonb().default('{}'),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type LeadStatuses = typeof lead_statuses.$inferSelect;
export type NewLeadStatuses = typeof lead_statuses.$inferInsert;
