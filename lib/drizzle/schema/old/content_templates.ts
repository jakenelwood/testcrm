import { pgTable, uuid, text, jsonb, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const content_templates = pgTable('content_templates', {
  id: uuid().notNull().primaryKey().default(sql`uuid_generate_v4()`),
  name: text().notNull(),
  description: text(),
  template_type: text().notNull(),
  category: text(),
  subject: text(),
  content: text().notNull(),
  variables: jsonb().default('{}'),
  personalization_fields: text().array().default('{}'),
  dynamic_content: jsonb().default('{}'),
  usage_count: integer().default(0),
  performance_score: numeric({ precision: 5, scale: 2 }),
  conversion_rate: numeric({ precision: 5, scale: 2 }),
  engagement_rate: numeric({ precision: 5, scale: 2 }),
  ai_optimized: boolean().default(false),
  ai_suggestions: jsonb().default('{}'),
  ai_performance_insights: jsonb().default('{}'),
  is_active: boolean().default(true),
  tags: text().array().default('{}'),
  metadata: jsonb().default('{}'),
  created_by: uuid(),
  updated_by: uuid(),
  created_at: timestamp({ withTimezone: true }).default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).default(sql`now()`),
});

export type ContentTemplates = typeof content_templates.$inferSelect;
export type NewContentTemplates = typeof content_templates.$inferInsert;
