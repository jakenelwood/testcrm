import { pgTable, uuid, text, date, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tasks = pgTable('tasks', {
  id: uuid().notNull().primaryKey().default('gen_random_uuid()'),
  workspace_id: uuid().notNull(),
  title: text().notNull(),
  description: text(),
  contact_id: uuid(),
  account_id: uuid(),
  opportunity_id: uuid(),
  task_type: text().default('follow_up'),
  priority: text().default('medium'),
  status: text().notNull().default('pending'),
  due_date: date(),
  due_time: text(),
  estimated_duration_minutes: integer(),
  assigned_to_id: uuid(),
  created_by_id: uuid(),
  ai_generated: boolean().default(false),
  ai_priority_score: integer(),
  ai_suggested_actions: jsonb().default('[]'),
  tags: text().array(),
  metadata: jsonb().default('{}'),
  created_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp({ withTimezone: true }).notNull().default(sql`now()`),
  completed_at: timestamp({ withTimezone: true }),
});

export type Tasks = typeof tasks.$inferSelect;
export type NewTasks = typeof tasks.$inferInsert;
