import { pgTable, uuid, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const ringcentral_tokens = pgTable('ringcentral_tokens', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid().notNull().unique(),
  access_token: text().notNull(),
  refresh_token: text().notNull(),
  token_type: text().notNull().default('Bearer'),
  expires_at: timestamp({ withTimezone: true }).notNull(),
  refresh_token_expires_at: timestamp({ withTimezone: true }),
  scope: text(),
  granted_permissions: jsonb().default('[]'),
  account_id: text(),
  extension_id: text(),
  extension_number: text(),
  is_active: boolean().default(true),
  last_validated_at: timestamp({ withTimezone: true }),
  validation_error: text(),
  api_calls_count: integer().default(0),
  last_api_call_at: timestamp({ withTimezone: true }),
  rate_limit_remaining: integer(),
  rate_limit_reset_at: timestamp({ withTimezone: true }),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type RingcentralTokens = typeof ringcentral_tokens.$inferSelect;
export type NewRingcentralTokens = typeof ringcentral_tokens.$inferInsert;
