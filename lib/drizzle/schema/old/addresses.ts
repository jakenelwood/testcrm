import { pgTable, uuid, text, boolean, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const addresses = pgTable('addresses', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  street: text(),
  street2: text(),
  city: text(),
  state: text(),
  zip_code: text(),
  country: text().default('US'),
  type: text(),
  is_verified: boolean().default(false),
  verification_source: text(),
  verification_date: timestamp({ withTimezone: true }),
  geocode_lat: numeric({ precision: 10, scale: 8 }),
  geocode_lng: numeric({ precision: 11, scale: 8 }),
  geocode_accuracy: text(),
  geocode_source: text(),
  geocode_date: timestamp({ withTimezone: true }),
  formatted_address: text(),
  plus_code: text(),
  place_id: text(),
  metadata: jsonb().default('{}'),
  notes: text(),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type Addresses = typeof addresses.$inferSelect;
export type NewAddresses = typeof addresses.$inferInsert;
