import { pgTable, uuid, text, integer, date, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const vehicles = pgTable('vehicles', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  contact_id: uuid().notNull(),
  vin: text(),
  year: integer(),
  make: text(),
  model: text(),
  trim: text(),
  body_style: text(),
  license_plate: text(),
  registration_state: text(),
  registration_expiration: date(),
  ownership_type: text(),
  lienholder_name: text(),
  lienholder_address: text(),
  annual_mileage: integer(),
  primary_use: text(),
  garage_type: text(),
  safety_features: jsonb().default('[]'),
  anti_theft_devices: jsonb().default('[]'),
  modifications: jsonb().default('[]'),
  current_coverage: jsonb().default('{}'),
  claims_history: jsonb().default('[]'),
  ai_risk_score: integer(),
  ai_risk_factors: jsonb().default('[]'),
  custom_fields: jsonb().default('{}'),
  is_active: boolean().default(true),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Vehicles = typeof vehicles.$inferSelect;
export type NewVehicles = typeof vehicles.$inferInsert;
