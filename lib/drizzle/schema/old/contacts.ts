import { pgTable, uuid, text, date, integer, numeric, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { addresses } from './addresses';
import { users } from './users';

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Basic contact information
  name: text('name').notNull(),
  email: text('email'),
  phoneNumber: text('phone_number'),
  contactType: text('contact_type').notNull().$type<'individual' | 'business'>(),
  status: text('status').notNull().default('lead').$type<'lead' | 'prospect' | 'client' | 'inactive'>(),
  
  // Address relationships
  addressId: uuid('address_id').references(() => addresses.id),
  mailingAddressId: uuid('mailing_address_id').references(() => addresses.id),
  
  // Personal fields (for individuals)
  dateOfBirth: date('date_of_birth'),
  gender: text('gender').$type<'male' | 'female' | 'other' | 'prefer_not_to_say'>(),
  maritalStatus: text('marital_status').$type<'single' | 'married' | 'divorced' | 'widowed' | 'other'>(),
  driversLicense: text('drivers_license'),
  licenseState: text('license_state'),
  occupation: text('occupation'),
  educationLevel: text('education_level'),
  
  // Business fields (for businesses)
  industry: text('industry'),
  taxId: text('tax_id'),
  yearEstablished: integer('year_established'),
  annualRevenue: numeric('annual_revenue', { precision: 15, scale: 2 }),
  numberOfEmployees: integer('number_of_employees'),
  businessType: text('business_type'),
  
  // AI and CRM fields
  aiSummary: text('ai_summary'),
  aiRiskScore: integer('ai_risk_score'),
  aiLifetimeValue: numeric('ai_lifetime_value', { precision: 15, scale: 2 }),
  aiChurnProbability: numeric('ai_churn_probability', { precision: 5, scale: 2 }),
  aiInsights: jsonb('ai_insights').$type<Record<string, any>>().default({}),
  
  // CRM metadata
  tags: text('tags').array(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  source: text('source'),
  referredBy: uuid('referred_by').references(() => contacts.id),
  
  // Contact tracking
  lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
  nextContactAt: timestamp('next_contact_at', { withTimezone: true }),
  
  // Audit fields
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  // Address relationships
  address: one(addresses, {
    fields: [contacts.addressId],
    references: [addresses.id],
    relationName: 'contactAddress'
  }),
  mailingAddress: one(addresses, {
    fields: [contacts.mailingAddressId],
    references: [addresses.id],
    relationName: 'contactMailingAddress'
  }),
  
  // User relationships
  creator: one(users, {
    fields: [contacts.createdBy],
    references: [users.id],
    relationName: 'contactCreator'
  }),
  updater: one(users, {
    fields: [contacts.updatedBy],
    references: [users.id],
    relationName: 'contactUpdater'
  }),
  
  // Self-referential relationship for referrals
  referrer: one(contacts, {
    fields: [contacts.referredBy],
    references: [contacts.id],
    relationName: 'contactReferrer'
  }),
  referrals: many(contacts, {
    relationName: 'contactReferrer'
  }),
  
  // Related entities (will be defined in their respective files)
  opportunities: many('opportunities'),
  activities: many('activities'),
  insuranceProfile: one('insuranceProfiles'),
  insurancePolicies: many('insurancePolicies'),
}));

// Type exports
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

// Utility types
export type ContactStatus = Contact['status'];
export type ContactType = Contact['contactType'];

// Contact with relations type
export type ContactWithRelations = Contact & {
  address?: typeof addresses.$inferSelect;
  mailingAddress?: typeof addresses.$inferSelect;
  creator?: typeof users.$inferSelect;
  updater?: typeof users.$inferSelect;
  referrer?: Contact;
  referrals?: Contact[];
  opportunities?: any[]; // Will be properly typed when opportunities schema is created
  activities?: any[]; // Will be properly typed when activities schema is created
  insuranceProfile?: any; // Will be properly typed when insurance schema is created
  insurancePolicies?: any[]; // Will be properly typed when insurance schema is created
};
