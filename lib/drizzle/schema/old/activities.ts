import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { contacts } from './contacts';
import { opportunities } from './opportunities';
import { users } from './users';

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Relationships
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  opportunityId: uuid('opportunity_id').references(() => opportunities.id, { onDelete: 'set null' }),
  
  // Activity details
  type: text('type').notNull().$type<'call' | 'email' | 'sms' | 'meeting' | 'note' | 'voicemail' | 'social' | 'letter'>(),
  direction: text('direction').$type<'inbound' | 'outbound'>(),
  subject: text('subject'),
  content: text('content'),
  
  // Call-specific fields
  duration: integer('duration'), // in seconds
  callQualityScore: integer('call_quality_score'), // 1-5
  
  // Status and timing
  status: text('status').notNull().default('completed').$type<'pending' | 'completed' | 'failed' | 'cancelled'>(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // AI fields
  aiSummary: text('ai_summary'),
  aiSentiment: text('ai_sentiment').$type<'positive' | 'neutral' | 'negative'>(),
  aiInsights: jsonb('ai_insights').$type<Record<string, any>>().default({}),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  // Audit fields
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  // Core relationships
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id],
  }),
  opportunity: one(opportunities, {
    fields: [activities.opportunityId],
    references: [opportunities.id],
  }),
  
  // User relationship
  creator: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
  }),
}));

// Type exports
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

// Utility types
export type ActivityType = Activity['type'];
export type ActivityDirection = Activity['direction'];
export type ActivityStatus = Activity['status'];
export type ActivitySentiment = Activity['aiSentiment'];

// Activity with relations type
export type ActivityWithRelations = Activity & {
  contact?: typeof contacts.$inferSelect;
  opportunity?: typeof opportunities.$inferSelect;
  creator?: typeof users.$inferSelect;
};

// Helper functions for activity management
export const activityHelpers = {
  // Format duration for display
  formatDuration: (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  },
  
  // Get activity icon based on type
  getActivityIcon: (type: ActivityType): string => {
    const icons: Record<ActivityType, string> = {
      call: '📞',
      email: '📧',
      sms: '💬',
      meeting: '🤝',
      note: '📝',
      voicemail: '🎵',
      social: '📱',
      letter: '✉️',
    };
    return icons[type] || '📋';
  },
  
  // Get sentiment color
  getSentimentColor: (sentiment: ActivitySentiment | null): string => {
    if (!sentiment) return 'gray';
    const colors: Record<ActivitySentiment, string> = {
      positive: 'green',
      neutral: 'yellow',
      negative: 'red',
    };
    return colors[sentiment];
  },
  
  // Check if activity is overdue (for scheduled activities)
  isOverdue: (activity: Activity): boolean => {
    if (!activity.scheduledAt || activity.status !== 'pending') return false;
    return new Date(activity.scheduledAt) < new Date();
  },
  
  // Get activity age in hours
  getAgeInHours: (activity: Activity): number => {
    const created = new Date(activity.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
  },
  
  // Check if activity is a communication type
  isCommunication: (type: ActivityType): boolean => {
    return ['call', 'email', 'sms', 'voicemail', 'social', 'letter'].includes(type);
  },
  
  // Check if activity is internal
  isInternal: (type: ActivityType): boolean => {
    return ['note', 'meeting'].includes(type);
  },
};
