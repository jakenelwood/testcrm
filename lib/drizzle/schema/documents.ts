import { pgTable, uuid, text, bigint, jsonb, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const documents = pgTable('documents', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  file_name: text().notNull(),
  file_path: text().notNull(),
  file_size_bytes: bigint({ mode: "number" }),
  mime_type: text(),
  file_hash: text(),
  contact_id: uuid(),
  account_id: uuid(),
  opportunity_id: uuid(),
  uploaded_by_id: uuid(),
  document_type: text(),
  embedding: text(),
  ai_extracted_text: text(),
  ai_summary: text(),
  ai_document_classification: jsonb().default('{}'),
  ai_key_entities: jsonb().default('[]'),
  tags: text().array(),
  is_confidential: boolean().default(false),
  retention_date: date(),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type Documents = typeof documents.$inferSelect;
export type NewDocuments = typeof documents.$inferInsert;
