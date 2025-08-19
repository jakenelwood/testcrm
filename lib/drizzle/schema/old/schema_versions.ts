import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const schema_versions = pgTable('schema_versions', {
  id: integer().notNull().primaryKey(),
  version: text().notNull().unique(),
  description: text(),
  applied_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type SchemaVersions = typeof schema_versions.$inferSelect;
export type NewSchemaVersions = typeof schema_versions.$inferInsert;
