import { pgTable, uuid, text, numeric, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const specialty_items = pgTable('specialty_items', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  client_id: uuid(),
  lead_id: uuid(),
  name: text().notNull(),
  category: text(),
  description: text(),
  brand: text(),
  model: text(),
  serial_number: text(),
  appraised_value: numeric({ precision: 15, scale: 2 }),
  purchase_price: numeric({ precision: 15, scale: 2 }),
  current_value: numeric({ precision: 15, scale: 2 }),
  appraisal_date: date(),
  appraiser_name: text(),
  coverage_type: text(),
  coverage_limit: numeric({ precision: 15, scale: 2 }),
  deductible: numeric({ precision: 10, scale: 2 }),
  storage_location: text(),
  security_measures: text().array().default('{}'),
  photos: text().array().default('{}'),
  documents: text().array().default('{}'),
  metadata: jsonb().default('{}'),
  notes: text(),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type SpecialtyItems = typeof specialty_items.$inferSelect;
export type NewSpecialtyItems = typeof specialty_items.$inferInsert;
