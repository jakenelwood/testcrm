import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const _version_info = pgTable('_version_info', {
  id: integer().notNull().primaryKey(),
  version: text().notNull(),
  applied_at: timestamp({ withTimezone: true }).default(sql`now()`),
  description: text(),
});

export type VersionInfo = typeof _version_info.$inferSelect;
export type NewVersionInfo = typeof _version_info.$inferInsert;
