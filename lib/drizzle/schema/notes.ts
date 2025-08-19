import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const notes = pgTable('notes', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  contact_id: uuid(),
  account_id: uuid(),
  opportunity_id: uuid(),
  user_id: uuid().notNull(),
  title: text(),
  content: text().notNull(),
  note_type: text().default('general'),
  embedding: text(),
  ai_summary: text(),
  ai_tags: text().array(),
  is_private: boolean().default(false),
  tags: text().array(),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type Notes = typeof notes.$inferSelect;
export type NewNotes = typeof notes.$inferInsert;
