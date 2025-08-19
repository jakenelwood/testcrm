import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const conversation_sessions = pgTable('conversation_sessions', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  agent_id: uuid(),
  user_id: uuid(),
  client_id: uuid(),
  lead_id: uuid(),
  title: text(),
  purpose: text(),
  status: text().default('active'),
  total_interactions: integer().default(0),
  total_tokens_used: integer().default(0),
  average_response_time: numeric({ precision: 8, scale: 2 }),
  context: jsonb().default('{}'),
  summary: text(),
  goals_achieved: jsonb().default('[]'),
  action_items: jsonb().default('[]'),
  next_steps: jsonb().default('[]'),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
  completed_at: timestamp({ withTimezone: true }),
});

export type ConversationSessions = typeof conversation_sessions.$inferSelect;
export type NewConversationSessions = typeof conversation_sessions.$inferInsert;
