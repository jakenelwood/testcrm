import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
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
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type RingcentralTokens = typeof ringcentral_tokens.$inferSelect;
export type NewRingcentralTokens = typeof ringcentral_tokens.$inferInsert;
