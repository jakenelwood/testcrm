import { pgTable, uuid, text, numeric, date, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const specialty_items = pgTable('specialty_items', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  contact_id: uuid().notNull(),
  item_type: text(),
  name: text().notNull(),
  description: text(),
  brand: text(),
  model: text(),
  serial_number: text(),
  appraised_value: numeric({ precision: 12, scale: 2 }),
  purchase_price: numeric({ precision: 12, scale: 2 }),
  purchase_date: date(),
  appraisal_date: date(),
  appraiser_name: text(),
  has_receipt: boolean().default(false),
  has_appraisal: boolean().default(false),
  has_photos: boolean().default(false),
  certificate_number: text(),
  storage_location: text(),
  security_measures: jsonb().default('[]'),
  current_coverage: jsonb().default('{}'),
  claims_history: jsonb().default('[]'),
  custom_fields: jsonb().default('{}'),
  is_active: boolean().default(true),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type SpecialtyItems = typeof specialty_items.$inferSelect;
export type NewSpecialtyItems = typeof specialty_items.$inferInsert;
