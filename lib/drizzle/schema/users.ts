import { pgTable, uuid, text, jsonb, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid().notNull().primaryKey(),
  workspace_id: uuid().notNull(),
  email: text().notNull().unique(),
  full_name: text(),
  avatar_url: text(),
  role: text().notNull().default('agent'),
  permissions: jsonb().default('{}'),
  license_number: text(),
  license_state: text(),
  license_expiration: date(),
  specializations: text().array(),
  timezone: text().default('America/Chicago'),
  notification_preferences: jsonb().default('{}'),
  is_active: boolean().default(true),
  last_login_at: timestamp({ withTimezone: true }),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type Users = typeof users.$inferSelect;
export type NewUsers = typeof users.$inferInsert;
