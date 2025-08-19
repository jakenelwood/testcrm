import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const user_invitations = pgTable('user_invitations', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  email: text().notNull(),
  role: text().notNull().default('user'),
  invited_by: uuid().notNull(),
  invitation_token: text().notNull().unique(),
  custom_message: text(),
  status: text().default('pending'),
  invited_at: timestamp({ withTimezone: true }).default(sql`now()`),
  expires_at: timestamp({ withTimezone: true }).notNull(),
  accepted_at: timestamp({ withTimezone: true }),
  accepted_by: uuid(),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type UserInvitations = typeof user_invitations.$inferSelect;
export type NewUserInvitations = typeof user_invitations.$inferInsert;
