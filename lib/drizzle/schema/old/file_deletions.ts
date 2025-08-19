import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const file_deletions = pgTable('file_deletions', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid(),
  bucket_name: text().notNull(),
  file_path: text().notNull(),
  file_name: text(),
  deleted_at: timestamp({ withTimezone: true }).default(sql`now()`),
  metadata: jsonb().default('{}'),
});

export type FileDeletions = typeof file_deletions.$inferSelect;
export type NewFileDeletions = typeof file_deletions.$inferInsert;
