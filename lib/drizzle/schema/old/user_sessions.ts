import { pgTable, uuid, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const user_sessions = pgTable('user_sessions', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid().notNull(),
  session_token: text().notNull().unique(),
  ip_address: text(),
  user_agent: text(),
  device_info: jsonb(),
  country: text(),
  city: text(),
  is_active: boolean().default(true),
  last_activity: timestamp({ withTimezone: true }).default(sql`now()`),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  expires_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type UserSessions = typeof user_sessions.$inferSelect;
export type NewUserSessions = typeof user_sessions.$inferInsert;
