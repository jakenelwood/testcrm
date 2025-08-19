import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const accounts = pgTable('accounts', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  name: text().notNull(),
  website: text(),
  industry: text(),
  employee_count: integer(),
  annual_revenue: numeric({ precision: 15, scale: 2 }),
  address: text(),
  city: text(),
  state: text(),
  zip_code: text(),
  business_type: text(),
  tax_id: text(),
  duns_number: text(),
  current_carriers: jsonb().default('{}'),
  policy_renewal_dates: jsonb().default('{}'),
  risk_profile: jsonb().default('{}'),
  summary_embedding: text(),
  ai_risk_score: integer(),
  ai_lifetime_value: numeric({ precision: 15, scale: 2 }),
  ai_insights: jsonb().default('{}'),
  custom_fields: jsonb().default('{}'),
  tags: text().array(),
  owner_id: uuid(),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type Accounts = typeof accounts.$inferSelect;
export type NewAccounts = typeof accounts.$inferInsert;
