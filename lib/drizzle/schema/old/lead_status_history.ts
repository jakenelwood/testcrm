import { pgTable, uuid, text, integer, boolean, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const lead_status_history = pgTable('lead_status_history', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  lead_id: uuid().notNull(),
  from_status: text(),
  to_status: text().notNull(),
  from_pipeline_status_id: integer(),
  to_pipeline_status_id: integer(),
  reason: text(),
  notes: text(),
  automated: boolean().default(false),
  duration_in_previous_status: integer(),
  ai_trigger: text(),
  ai_confidence: numeric({ precision: 5, scale: 2 }),
  metadata: jsonb().default('{}'),
  changed_by: uuid(),
  changed_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type LeadStatusHistory = typeof lead_status_history.$inferSelect;
export type NewLeadStatusHistory = typeof lead_status_history.$inferInsert;
