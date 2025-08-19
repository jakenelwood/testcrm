import { pgTable, uuid, text, doublePrecision, integer, numeric, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const ai_interactions = pgTable('ai_interactions', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  agent_id: uuid(),
  client_id: uuid(),
  lead_id: uuid(),
  user_id: uuid(),
  type: text(),
  source: text(),
  prompt: text(),
  content: text(),
  ai_response: text(),
  summary: text(),
  model_used: text(),
  model_provider: text(),
  temperature: doublePrecision(),
  tokens_used: integer(),
  response_time_ms: integer(),
  quality_score: numeric({ precision: 3, scale: 2 }),
  user_feedback: text(),
  conversation_id: uuid(),
  session_id: uuid(),
  context: jsonb().default('{}'),
  actions_taken: jsonb().default('[]'),
  results: jsonb().default('{}'),
  follow_up_required: boolean().default(false),
  follow_up_date: timestamp({ withTimezone: true }),
  error_message: text(),
  retry_count: integer().default(0),
  metadata: jsonb().default('{}'),
  tags: text().array().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  completed_at: timestamp({ withTimezone: true }),
});

export type AiInteractions = typeof ai_interactions.$inferSelect;
export type NewAiInteractions = typeof ai_interactions.$inferInsert;
