import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const api_rate_limits = pgTable('api_rate_limits', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid(),
  ip_address: text(),
  endpoint: text().notNull(),
  request_count: integer().default(1),
  window_start: timestamp({ withTimezone: true }).default(sql`now()`),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type ApiRateLimits = typeof api_rate_limits.$inferSelect;
export type NewApiRateLimits = typeof api_rate_limits.$inferInsert;
