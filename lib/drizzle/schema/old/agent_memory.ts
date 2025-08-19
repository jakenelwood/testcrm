import { pgTable, uuid, text, integer, timestamp, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const agent_memory = pgTable('agent_memory', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  agent_id: uuid(),
  entity_type: text().notNull(),
  entity_id: uuid(),
  memory_type: text().notNull(),
  importance_score: integer().default(5),
  title: text(),
  content: text().notNull(),
  summary: text(),
  embedding: text(),
  related_memories: uuid().array().default('\'{}\'::uuid[]'),
  conversation_id: uuid(),
  session_id: uuid(),
  access_count: integer().default(0),
  last_accessed_at: timestamp({ withTimezone: true }),
  confidence_score: numeric({ precision: 5, scale: 2 }).default(100.0),
  expires_at: timestamp({ withTimezone: true }),
  is_archived: boolean().default(false),
  metadata: jsonb().default('{}'),
  tags: text().array().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type AgentMemory = typeof agent_memory.$inferSelect;
export type NewAgentMemory = typeof agent_memory.$inferInsert;
