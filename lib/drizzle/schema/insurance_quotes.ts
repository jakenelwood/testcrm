import { pgTable, uuid, text, numeric, jsonb, date, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const insurance_quotes = pgTable('insurance_quotes', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  opportunity_id: uuid().notNull(),
  contact_id: uuid(),
  account_id: uuid(),
  quote_number: text(),
  carrier: text().notNull(),
  insurance_type: text().notNull(),
  quoted_premium: numeric({ precision: 10, scale: 2 }).notNull(),
  deductible: numeric({ precision: 10, scale: 2 }),
  coverage_limits: jsonb().default('{}'),
  quote_date: date().notNull().default('CURRENT_DATE'),
  expires_at: timestamp({ withTimezone: true }),
  quote_details: jsonb().default('{}'),
  status: text().notNull().default('pending'),
  created_by_id: uuid(),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type InsuranceQuotes = typeof insurance_quotes.$inferSelect;
export type NewInsuranceQuotes = typeof insurance_quotes.$inferInsert;
