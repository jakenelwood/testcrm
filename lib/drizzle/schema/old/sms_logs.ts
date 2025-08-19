import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const sms_logs = pgTable('sms_logs', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid(),
  client_id: uuid(),
  lead_id: uuid(),
  communication_id: uuid(),
  ringcentral_message_id: text().unique(),
  conversation_id: text(),
  direction: text().notNull(),
  from_number: text().notNull(),
  to_number: text().notNull(),
  message_text: text().notNull(),
  attachments: jsonb().default('[]'),
  status: text(),
  ai_summary: text(),
  ai_sentiment: text(),
  ai_intent: text(),
  ai_action_items: jsonb().default('[]'),
  metadata: jsonb().default('{}'),
  tags: text().array().default('{}'),
  sent_at: timestamp({ withTimezone: true }),
  delivered_at: timestamp({ withTimezone: true }),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type SmsLogs = typeof sms_logs.$inferSelect;
export type NewSmsLogs = typeof sms_logs.$inferInsert;
