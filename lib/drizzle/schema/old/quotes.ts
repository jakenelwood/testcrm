import { pgTable, uuid, integer, text, numeric, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const quotes = pgTable('quotes', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  lead_id: uuid().notNull(),
  insurance_type_id: integer(),
  carrier: text().notNull(),
  policy_number: text(),
  quote_number: text(),
  paid_in_full_amount: numeric({ precision: 10, scale: 2 }),
  monthly_payment_amount: numeric({ precision: 10, scale: 2 }),
  down_payment_amount: numeric({ precision: 10, scale: 2 }),
  contract_term: text(),
  effective_date: date(),
  expiration_date: date(),
  coverage_details: jsonb().default('{}'),
  limits: jsonb().default('{}'),
  deductibles: jsonb().default('{}'),
  status: text().default('Draft'),
  competitor_quotes: jsonb().default('[]'),
  savings_amount: numeric({ precision: 10, scale: 2 }),
  savings_percentage: numeric({ precision: 5, scale: 2 }),
  ai_recommendation: text(),
  ai_risk_assessment: jsonb().default('{}'),
  ai_pricing_factors: jsonb().default('{}'),
  metadata: jsonb().default('{}'),
  notes: text(),
  created_by: uuid(),
  updated_by: uuid(),
  quote_date: timestamp({ withTimezone: true }).default(sql`now()`),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
  bound_at: timestamp({ withTimezone: true }),
  expired_at: timestamp({ withTimezone: true }),
});

export type Quotes = typeof quotes.$inferSelect;
export type NewQuotes = typeof quotes.$inferInsert;
