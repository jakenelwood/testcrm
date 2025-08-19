import { pgTable, uuid, text, numeric, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const clients = pgTable('clients', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  client_type: text().notNull(),
  name: text().notNull(),
  email: text(),
  phone_number: text(),
  address_id: uuid(),
  mailing_address_id: uuid(),
  date_of_birth: text(),
  gender: text(),
  marital_status: text(),
  drivers_license: text(),
  license_state: text(),
  education_occupation: text(),
  referred_by: text(),
  business_type: text(),
  industry: text(),
  tax_id: text(),
  year_established: text(),
  annual_revenue: numeric({ precision: 15, scale: 2 }),
  number_of_employees: integer(),
  ai_summary: text(),
  ai_next_action: text(),
  ai_risk_score: integer(),
  ai_lifetime_value: numeric({ precision: 15, scale: 2 }),
  ai_insights: jsonb().default('{}'),
  metadata: jsonb().default('{}'),
  tags: text().array().default('{}'),
  status: text().default('Active'),
  source: text().default('Manual Entry'),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
  last_contact_at: timestamp({ withTimezone: true }),
  next_contact_at: timestamp({ withTimezone: true }),
});

export type Clients = typeof clients.$inferSelect;
export type NewClients = typeof clients.$inferInsert;
