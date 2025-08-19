import { pgTable, uuid, text, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const user_phone_preferences = pgTable('user_phone_preferences', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  user_id: uuid().notNull().unique(),
  selected_phone_number: text().notNull().unique(),
  phone_number_label: text(),
  phone_number_type: text(),
  is_default: boolean().default(false),
  is_active: boolean().default(true),
  call_forwarding_enabled: boolean().default(false),
  call_forwarding_number: text(),
  voicemail_enabled: boolean().default(true),
  call_recording_enabled: boolean().default(false),
  sms_notifications: boolean().default(true),
  email_notifications: boolean().default(true),
  desktop_notifications: boolean().default(true),
  business_hours: jsonb().default('{}'),
  timezone: text().default('America/Chicago'),
  auto_response_enabled: boolean().default(false),
  auto_response_message: text(),
  out_of_office_enabled: boolean().default(false),
  out_of_office_message: text(),
  crm_integration_enabled: boolean().default(true),
  auto_log_calls: boolean().default(true),
  auto_create_activities: boolean().default(true),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type UserPhonePreferences = typeof user_phone_preferences.$inferSelect;
export type NewUserPhonePreferences = typeof user_phone_preferences.$inferInsert;
