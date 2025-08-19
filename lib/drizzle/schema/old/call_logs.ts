import { pgTable, uuid, text, timestamp, integer, numeric, jsonb, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const call_logs = pgTable('call_logs', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid(),
  client_id: uuid(),
  lead_id: uuid(),
  communication_id: uuid(),
  ringcentral_call_id: text().unique(),
  session_id: text(),
  direction: text().notNull(),
  from_number: text().notNull(),
  to_number: text().notNull(),
  status: text(),
  result: text(),
  start_time: timestamp({ withTimezone: true }),
  answer_time: timestamp({ withTimezone: true }),
  end_time: timestamp({ withTimezone: true }),
  duration: integer(),
  recording_url: text(),
  recording_id: text(),
  transcription: text(),
  transcription_confidence: numeric({ precision: 5, scale: 2 }),
  ai_summary: text(),
  ai_sentiment: text(),
  ai_action_items: jsonb().default('[]'),
  ai_follow_up_required: boolean().default(false),
  quality_score: integer(),
  connection_quality: text(),
  metadata: jsonb().default('{}'),
  tags: text().array().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type CallLogs = typeof call_logs.$inferSelect;
export type NewCallLogs = typeof call_logs.$inferInsert;
