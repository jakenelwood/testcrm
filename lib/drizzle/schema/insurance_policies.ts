import { pgTable, uuid, text, numeric, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const insurance_policies = pgTable('insurance_policies', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  opportunity_id: uuid(),
  contact_id: uuid(),
  account_id: uuid(),
  policy_number: text().notNull(),
  carrier: text().notNull(),
  policy_type: text().notNull(),
  premium_amount: numeric({ precision: 10, scale: 2 }).notNull(),
  deductible: numeric({ precision: 10, scale: 2 }),
  coverage_limit: numeric({ precision: 12, scale: 2 }),
  effective_date: date().notNull(),
  expiration_date: date().notNull(),
  policy_details: jsonb().default('{}'),
  status: text().notNull().default('active'),
  owner_id: uuid(),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
});

export type InsurancePolicies = typeof insurance_policies.$inferSelect;
export type NewInsurancePolicies = typeof insurance_policies.$inferInsert;
