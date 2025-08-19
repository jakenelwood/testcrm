import { pgTable, uuid, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const homes = pgTable('homes', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  client_id: uuid(),
  lead_id: uuid(),
  address_id: uuid(),
  property_type: text(),
  year_built: integer(),
  square_feet: integer(),
  lot_size: numeric({ precision: 10, scale: 2 }),
  bedrooms: integer(),
  bathrooms: numeric({ precision: 3, scale: 1 }),
  stories: integer(),
  construction_type: text(),
  roof_type: text(),
  roof_age: integer(),
  foundation_type: text(),
  heating_type: text(),
  cooling_type: text(),
  purchase_price: numeric({ precision: 15, scale: 2 }),
  current_value: numeric({ precision: 15, scale: 2 }),
  mortgage_balance: numeric({ precision: 15, scale: 2 }),
  current_coverage: jsonb().default('{}'),
  coverage_limits: jsonb().default('{}'),
  deductibles: jsonb().default('{}'),
  safety_features: text().array().default('{}'),
  security_features: text().array().default('{}'),
  distance_to_fire_station: numeric({ precision: 5, scale: 2 }),
  distance_to_coast: numeric({ precision: 5, scale: 2 }),
  flood_zone: text(),
  wildfire_risk: text(),
  earthquake_risk: text(),
  metadata: jsonb().default('{}'),
  notes: text(),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Homes = typeof homes.$inferSelect;
export type NewHomes = typeof homes.$inferInsert;
