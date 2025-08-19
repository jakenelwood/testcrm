import { pgTable, uuid, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid().notNull().primaryKey(),
  email: text().unique(),
  full_name: text(),
  avatar_url: text(),
  role: text().default('user'),
  phone_number: text(),
  timezone: text().default('America/Chicago'),
  date_format: text().default('MM/DD/YYYY'),
  preferences: jsonb().default('{}'),
  is_active: boolean().default(true),
  last_login_at: timestamp({ withTimezone: true }),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Users = typeof users.$inferSelect;
export type NewUsers = typeof users.$inferInsert;
