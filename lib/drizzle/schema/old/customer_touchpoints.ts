import { pgTable, uuid, text, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const customer_touchpoints = pgTable('customer_touchpoints', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  client_id: uuid(),
  lead_id: uuid(),
  campaign_id: uuid(),
  ab_test_id: uuid(),
  communication_id: uuid(),
  touchpoint_type: text().notNull(),
  channel: text().notNull(),
  source: text(),
  medium: text(),
  campaign: text(),
  content: text(),
  attribution_weight: numeric({ precision: 5, scale: 4 }).default(1.0),
  attribution_model: text().default('last_touch'),
  conversion_value: numeric({ precision: 15, scale: 2 }),
  page_url: text(),
  referrer_url: text(),
  user_agent: text(),
  ip_address: text(),
  device_type: text(),
  browser: text(),
  metadata: jsonb().default('{}'),
  occurred_at: timestamp({ withTimezone: true }).default(sql`now()`),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type CustomerTouchpoints = typeof customer_touchpoints.$inferSelect;
export type NewCustomerTouchpoints = typeof customer_touchpoints.$inferInsert;
