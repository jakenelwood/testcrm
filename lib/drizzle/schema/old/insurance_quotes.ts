import { pgTable, uuid, text, integer, numeric, date, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { opportunities } from './opportunities';
import { insuranceTypes } from './insurance_types';
import { users } from './users';

export const insuranceQuotes = pgTable('insurance_quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Link to opportunity (not contact directly)
  opportunityId: uuid('opportunity_id').notNull().references(() => opportunities.id, { onDelete: 'cascade' }),
  insuranceTypeId: integer('insurance_type_id').references(() => insuranceTypes.id),
  
  // Quote identification
  quoteNumber: text('quote_number').notNull(),
  
  // Financial details
  premiumAmount: numeric('premium_amount', { precision: 10, scale: 2 }).notNull(),
  deductible: numeric('deductible', { precision: 10, scale: 2 }),
  fees: numeric('fees', { precision: 10, scale: 2 }).default('0'),
  // totalAmount is calculated as premiumAmount + fees (handled in application logic)
  
  // Terms
  contractTerm: text('contract_term').$type<'6mo' | '12mo' | '24mo'>(),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  
  // Coverage details (flexible structure for different insurance types)
  coverageDetails: jsonb('coverage_details').$type<{
    // Auto insurance coverage
    auto?: {
      liability?: {
        bodilyInjury?: string;
        propertyDamage?: string;
      };
      collision?: {
        deductible?: number;
        coverage?: string;
      };
      comprehensive?: {
        deductible?: number;
        coverage?: string;
      };
      uninsuredMotorist?: {
        bodilyInjury?: string;
        propertyDamage?: string;
      };
      personalInjuryProtection?: string;
      medicalPayments?: string;
      rentalReimbursement?: string;
      roadside?: boolean;
    };
    
    // Home insurance coverage
    home?: {
      dwelling?: number;
      personalProperty?: number;
      liability?: number;
      medicalPayments?: number;
      lossOfUse?: number;
      deductible?: number;
      replacementCost?: boolean;
      waterBackup?: boolean;
      identityTheft?: boolean;
    };
    
    // Commercial insurance coverage
    commercial?: {
      generalLiability?: number;
      productLiability?: number;
      professionalLiability?: number;
      workersCompensation?: number;
      commercialProperty?: number;
      businessInterruption?: number;
      cyberLiability?: number;
      employmentPractices?: number;
    };
    
    // Specialty coverage
    specialty?: {
      agreedValue?: number;
      actualCashValue?: number;
      liability?: number;
      medicalPayments?: number;
      uninsuredBoater?: number;
      personalEffects?: number;
      emergencyService?: boolean;
    };
  }>().default({}),
  
  policyLimits: jsonb('policy_limits').$type<{
    perOccurrence?: number;
    aggregate?: number;
    perPerson?: number;
    perAccident?: number;
    propertyDamage?: number;
    medicalExpense?: number;
    personalInjury?: number;
    advertisingInjury?: number;
  }>().default({}),
  
  exclusions: jsonb('exclusions').$type<Array<{
    type?: string;
    description?: string;
    reason?: string;
  }>>().default([]),
  
  // Quote status and workflow
  status: text('status').notNull().default('draft').$type<'draft' | 'pending' | 'approved' | 'declined' | 'expired' | 'bound'>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  // AI analysis
  aiRiskAssessment: jsonb('ai_risk_assessment').$type<{
    riskScore?: number;
    riskFactors?: Array<{
      factor?: string;
      impact?: string;
      weight?: number;
    }>;
    riskMitigators?: Array<{
      factor?: string;
      impact?: string;
      implemented?: boolean;
    }>;
    recommendedActions?: string[];
  }>().default({}),
  
  aiPricingFactors: jsonb('ai_pricing_factors').$type<{
    baseRate?: number;
    adjustmentFactors?: Array<{
      factor?: string;
      adjustment?: number;
      reason?: string;
    }>;
    discountsApplied?: Array<{
      discount?: string;
      amount?: number;
      percentage?: number;
    }>;
    competitiveAnalysis?: {
      marketPosition?: string;
      competitorRange?: {
        low?: number;
        high?: number;
        average?: number;
      };
    };
  }>().default({}),
  
  aiRecommendations: jsonb('ai_recommendations').$type<{
    coverageRecommendations?: Array<{
      coverage?: string;
      currentLimit?: number;
      recommendedLimit?: number;
      reason?: string;
      impact?: string;
    }>;
    deductibleRecommendations?: Array<{
      coverage?: string;
      currentDeductible?: number;
      recommendedDeductible?: number;
      reason?: string;
      savings?: number;
    }>;
    discountOpportunities?: Array<{
      discount?: string;
      description?: string;
      requirements?: string[];
      potentialSavings?: number;
    }>;
  }>().default({}),
  
  // Comparison data
  competitorQuotes: jsonb('competitor_quotes').$type<Array<{
    carrier?: string;
    premium?: number;
    coverageDetails?: Record<string, any>;
    advantages?: string[];
    disadvantages?: string[];
    source?: string;
    date?: string;
  }>>().default([]),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  notes: text('notes'),
  
  // Audit fields
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Ensure unique quote numbers
  uniqueQuoteNumber: unique().on(table.quoteNumber),
}));

export const insuranceQuotesRelations = relations(insuranceQuotes, ({ one }) => ({
  // Core relationships
  opportunity: one(opportunities, {
    fields: [insuranceQuotes.opportunityId],
    references: [opportunities.id],
  }),
  insuranceType: one(insuranceTypes, {
    fields: [insuranceQuotes.insuranceTypeId],
    references: [insuranceTypes.id],
  }),
  
  // User relationships
  creator: one(users, {
    fields: [insuranceQuotes.createdBy],
    references: [users.id],
    relationName: 'insuranceQuoteCreator'
  }),
  updater: one(users, {
    fields: [insuranceQuotes.updatedBy],
    references: [users.id],
    relationName: 'insuranceQuoteUpdater'
  }),
}));

// Type exports
export type InsuranceQuote = typeof insuranceQuotes.$inferSelect;
export type NewInsuranceQuote = typeof insuranceQuotes.$inferInsert;

// Utility types
export type QuoteStatus = InsuranceQuote['status'];
export type ContractTerm = InsuranceQuote['contractTerm'];
export type CoverageDetails = NonNullable<InsuranceQuote['coverageDetails']>;

// Insurance quote with relations type
export type InsuranceQuoteWithRelations = InsuranceQuote & {
  opportunity?: typeof opportunities.$inferSelect;
  insuranceType?: typeof insuranceTypes.$inferSelect;
  creator?: typeof users.$inferSelect;
  updater?: typeof users.$inferSelect;
};

// Helper functions for quote management
export const insuranceQuoteHelpers = {
  // Calculate total amount
  getTotalAmount: (quote: InsuranceQuote): number => {
    const premium = parseFloat(quote.premiumAmount?.toString() || '0');
    const fees = parseFloat(quote.fees?.toString() || '0');
    return premium + fees;
  },
  
  // Check if quote is expired
  isExpired: (quote: InsuranceQuote): boolean => {
    if (!quote.expiresAt) return false;
    return new Date(quote.expiresAt) < new Date();
  },
  
  // Get days until expiration
  getDaysUntilExpiration: (quote: InsuranceQuote): number | null => {
    if (!quote.expiresAt) return null;
    const expires = new Date(quote.expiresAt);
    const now = new Date();
    return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  },
  
  // Check if quote is bindable
  isBindable: (quote: InsuranceQuote): boolean => {
    return quote.status === 'approved' && !insuranceQuoteHelpers.isExpired(quote);
  },
  
  // Get quote age in days
  getAgeInDays: (quote: InsuranceQuote): number => {
    const created = new Date(quote.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  },
};
