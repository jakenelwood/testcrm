import { pgTable, uuid, text, numeric, integer, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const ai_agents = pgTable('ai_agents', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  name: text().notNull(),
  description: text(),
  role: text().notNull(),
  agent_type: text().default('assistant'),
  model_provider: text().default('deepinfra'),
  model_name: text().default('deepseek-ai/DeepSeek-V3-0324'),
  temperature: numeric({ precision: 3, scale: 2 }).default(0.7),
  max_tokens: integer().default(4000),
  capabilities: jsonb().default('{}'),
  tools: jsonb().default('[]'),
  system_prompt: text(),
  config: jsonb().default('{}'),
  settings: jsonb().default('{}'),
  total_interactions: integer().default(0),
  successful_interactions: integer().default(0),
  average_response_time: numeric({ precision: 8, scale: 2 }),
  last_performance_review: timestamp({ withTimezone: true }),
  is_active: boolean().default(true),
  is_learning: boolean().default(true),
  version: text().default('1.0.0'),
  metadata: jsonb().default('{}'),
  tags: text().array().default('{}'),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
  last_used_at: timestamp({ withTimezone: true }),
});

export type AiAgents = typeof ai_agents.$inferSelect;
export type NewAiAgents = typeof ai_agents.$inferInsert;
