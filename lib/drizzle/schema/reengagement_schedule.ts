import { pgTable, uuid, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const reengagement_schedule = pgTable('reengagement_schedule', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  contact_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  scheduled_for: timestamp({ withTimezone: true }).notNull(),
  notification_type: text(),
  status: text().default('scheduled'),
  executed_at: timestamp({ withTimezone: true }),
  notification_data: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type ReengagementSchedule = typeof reengagement_schedule.$inferSelect;
export type NewReengagementSchedule = typeof reengagement_schedule.$inferInsert;
