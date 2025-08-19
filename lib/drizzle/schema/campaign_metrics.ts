import { pgTable, uuid, timestamp, text, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const campaign_metrics = pgTable('campaign_metrics', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  campaign_id: uuid().notNull(),
  ab_test_id: uuid(),
  contact_id: uuid().notNull(),
  account_id: uuid(),
  sent_at: timestamp({ withTimezone: true }),
  delivered_at: timestamp({ withTimezone: true }),
  opened_at: timestamp({ withTimezone: true }),
  clicked_at: timestamp({ withTimezone: true }),
  responded_at: timestamp({ withTimezone: true }),
  converted_at: timestamp({ withTimezone: true }),
  variant_shown: text(),
  conversion_value: numeric({ precision: 12, scale: 2 }),
  attribution_weight: numeric({ precision: 5, scale: 4 }).default(1.0),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type CampaignMetrics = typeof campaign_metrics.$inferSelect;
export type NewCampaignMetrics = typeof campaign_metrics.$inferInsert;
