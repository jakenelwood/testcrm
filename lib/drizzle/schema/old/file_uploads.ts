import { pgTable, uuid, text, bigint, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const file_uploads = pgTable('file_uploads', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid(),
  bucket_name: text().notNull(),
  file_path: text().notNull(),
  file_name: text().notNull(),
  file_size: bigint({ mode: "number" }).notNull(),
  mime_type: text().notNull(),
  entity_type: text(),
  entity_id: uuid(),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type FileUploads = typeof file_uploads.$inferSelect;
export type NewFileUploads = typeof file_uploads.$inferInsert;
