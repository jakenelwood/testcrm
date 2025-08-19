import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const interactions = pgTable('interactions', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  contact_id: uuid(),
  account_id: uuid(),
  opportunity_id: uuid(),
  user_id: uuid(),
  type: text().notNull(),
  subject: text(),
  content: text(),
  direction: text(),
  duration_minutes: integer(),
  outcome: text(),
  sentiment: text(),
  embedding: text(),
  ai_summary: text(),
  ai_sentiment_score: numeric({ precision: 3, scale: 2 }),
  ai_entities: jsonb().default('[]'),
  ai_action_items: jsonb().default('[]'),
  ai_follow_up_suggestions: jsonb().default('[]'),
  metadata: jsonb().default('{}'),
  external_id: text(),
  interacted_at: timestamp({ withTimezone: true }).notNull().primaryKey().default(sql`now()`),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type Interactions = typeof interactions.$inferSelect;
export type NewInteractions = typeof interactions.$inferInsert;
