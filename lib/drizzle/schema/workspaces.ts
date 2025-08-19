import { pgTable, uuid, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const workspaces = pgTable('workspaces', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  name: text().notNull(),
  agency_license: text(),
  agency_type: text(),
  primary_lines: jsonb().default('[]'),
  timezone: text().default('America/Chicago'),
  date_format: text().default('MM/DD/YYYY'),
  currency: text().default('USD'),
  subscription_tier: text().default('basic'),
  max_users: integer().default(5),
  max_contacts: integer().default(1000),
  settings: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type Workspaces = typeof workspaces.$inferSelect;
export type NewWorkspaces = typeof workspaces.$inferInsert;
