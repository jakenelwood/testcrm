import { pgTable, integer, text, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const insurance_types = pgTable('insurance_types', {
  id: integer().notNull().primaryKey(),
  name: text().notNull().unique(),
  is_personal: boolean().default(true),
  is_commercial: boolean().default(false),
  description: text(),
  icon_name: text(),
  form_schema: jsonb().default('{}'),
  required_fields: text().array().default('{}'),
  optional_fields: text().array().default('{}'),
  ai_prompt_template: text(),
  ai_risk_factors: jsonb().default('{}'),
  display_order: integer(),
  is_active: boolean().default(true),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type InsuranceTypes = typeof insurance_types.$inferSelect;
export type NewInsuranceTypes = typeof insurance_types.$inferInsert;
