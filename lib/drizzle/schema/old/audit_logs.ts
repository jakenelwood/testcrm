import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const audit_logs = pgTable('audit_logs', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  event_type: text().notNull(),
  table_name: text(),
  record_id: uuid(),
  user_id: uuid(),
  old_values: jsonb(),
  new_values: jsonb(),
  changes: jsonb(),
  ip_address: text(),
  user_agent: text(),
  request_id: text(),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type AuditLogs = typeof audit_logs.$inferSelect;
export type NewAuditLogs = typeof audit_logs.$inferInsert;
