import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const permissions = pgTable('permissions', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  name: text().notNull().unique(),
  description: text(),
  category: text().notNull(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Permissions = typeof permissions.$inferSelect;
export type NewPermissions = typeof permissions.$inferInsert;
