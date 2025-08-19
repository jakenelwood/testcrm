import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const password_history = pgTable('password_history', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid().notNull(),
  password_hash: text().notNull(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type PasswordHistory = typeof password_history.$inferSelect;
export type NewPasswordHistory = typeof password_history.$inferInsert;
