import { pgTable, uuid, text, integer, jsonb, numeric, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const vehicles = pgTable('vehicles', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  client_id: uuid(),
  lead_id: uuid(),
  make: text().notNull(),
  model: text().notNull(),
  year: integer(),
  vin: text(),
  license_plate: text(),
  state: text(),
  body_style: text(),
  engine_size: text(),
  fuel_type: text(),
  transmission: text(),
  color: text(),
  primary_use: text(),
  annual_mileage: integer(),
  garage_location: text(),
  current_coverage: jsonb().default('{}'),
  coverage_limits: jsonb().default('{}'),
  deductibles: jsonb().default('{}'),
  purchase_price: numeric({ precision: 12, scale: 2 }),
  current_value: numeric({ precision: 12, scale: 2 }),
  loan_balance: numeric({ precision: 12, scale: 2 }),
  safety_features: text().array().default('{}'),
  anti_theft_devices: text().array().default('{}'),
  metadata: jsonb().default('{}'),
  notes: text(),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Vehicles = typeof vehicles.$inferSelect;
export type NewVehicles = typeof vehicles.$inferInsert;
