import { pgTable, uuid, text, date, numeric, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { contacts } from './contacts';
import { users } from './users';

export const insuranceProfiles = pgTable('insurance_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Link to core contact
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  
  // Current insurance information
  currentCarrier: text('current_carrier'),
  currentPolicyExpiry: date('current_policy_expiry'),
  premiumBudget: numeric('premium_budget', { precision: 10, scale: 2 }),
  paymentPreference: text('payment_preference').$type<'monthly' | 'quarterly' | 'semi-annual' | 'annual'>(),
  
  // Insurance data (flexible JSONB structure)
  autoData: jsonb('auto_data').$type<{
    vehicles?: Array<{
      year?: number;
      make?: string;
      model?: string;
      vin?: string;
      usage?: string;
      annualMileage?: number;
      garagedAddress?: string;
      lienHolder?: string;
    }>;
    drivers?: Array<{
      name?: string;
      dateOfBirth?: string;
      licenseNumber?: string;
      licenseState?: string;
      yearsLicensed?: number;
      violations?: Array<{
        type?: string;
        date?: string;
        description?: string;
      }>;
      accidents?: Array<{
        date?: string;
        atFault?: boolean;
        description?: string;
        claimAmount?: number;
      }>;
    }>;
    coveragePreferences?: {
      liability?: string;
      collision?: string;
      comprehensive?: string;
      uninsuredMotorist?: string;
      personalInjury?: string;
    };
  }>().default({}),
  
  homeData: jsonb('home_data').$type<{
    properties?: Array<{
      address?: string;
      propertyType?: string;
      yearBuilt?: number;
      squareFootage?: number;
      constructionType?: string;
      roofType?: string;
      heatingType?: string;
      foundationType?: string;
      dwellingValue?: number;
      personalPropertyValue?: number;
      liabilityAmount?: number;
      deductible?: number;
      protectionClass?: string;
      distanceToFireStation?: number;
      distanceToHydrant?: number;
      securityFeatures?: string[];
      safetyFeatures?: string[];
    }>;
    coveragePreferences?: {
      dwelling?: number;
      personalProperty?: number;
      liability?: number;
      medicalPayments?: number;
      lossOfUse?: number;
    };
  }>().default({}),
  
  commercialData: jsonb('commercial_data').$type<{
    businessInfo?: {
      businessType?: string;
      industry?: string;
      yearsInBusiness?: number;
      numberOfEmployees?: number;
      annualRevenue?: number;
      businessDescription?: string;
    };
    locations?: Array<{
      address?: string;
      buildingValue?: number;
      contentsValue?: number;
      businessIncomeValue?: number;
      occupancyType?: string;
      constructionType?: string;
      protectionClass?: string;
    }>;
    coverageNeeds?: {
      generalLiability?: boolean;
      productLiability?: boolean;
      professionalLiability?: boolean;
      workersCompensation?: boolean;
      commercialProperty?: boolean;
      businessInterruption?: boolean;
      cyberLiability?: boolean;
      employmentPractices?: boolean;
    };
  }>().default({}),
  
  specialtyData: jsonb('specialty_data').$type<{
    boats?: Array<{
      year?: number;
      make?: string;
      model?: string;
      length?: number;
      hullId?: string;
      motorType?: string;
      horsepower?: number;
      value?: number;
      usage?: string;
      mooringLocation?: string;
    }>;
    rvs?: Array<{
      year?: number;
      make?: string;
      model?: string;
      vin?: string;
      length?: number;
      value?: number;
      usage?: string;
      storageLocation?: string;
    }>;
    motorcycles?: Array<{
      year?: number;
      make?: string;
      model?: string;
      vin?: string;
      engineSize?: number;
      value?: number;
      usage?: string;
    }>;
    collectibles?: Array<{
      type?: string;
      description?: string;
      value?: number;
      appraisalDate?: string;
    }>;
  }>().default({}),
  
  // Risk assessment and preferences
  riskFactors: jsonb('risk_factors').$type<{
    creditScore?: number;
    creditScoreRange?: string;
    drivingRecord?: {
      violations?: number;
      accidents?: number;
      yearsClaimFree?: number;
    };
    claimsHistory?: Array<{
      type?: string;
      date?: string;
      amount?: number;
      carrier?: string;
      description?: string;
    }>;
    lifestyle?: {
      smokingStatus?: string;
      alcoholConsumption?: string;
      hobbies?: string[];
      travelFrequency?: string;
    };
  }>().default({}),
  
  coveragePreferences: jsonb('coverage_preferences').$type<{
    preferredDeductibles?: {
      auto?: number;
      home?: number;
      commercial?: number;
    };
    coverageLimits?: {
      liability?: number;
      property?: number;
      umbrella?: number;
    };
    discountPreferences?: string[];
    bundlingPreferences?: string[];
  }>().default({}),
  
  claimsHistory: jsonb('claims_history').$type<Array<{
    type?: string;
    date?: string;
    amount?: number;
    carrier?: string;
    policyNumber?: string;
    description?: string;
    status?: string;
    faultDetermination?: string;
  }>>().default([]),
  
  // AI insurance insights
  aiRiskAssessment: jsonb('ai_risk_assessment').$type<{
    overallRiskScore?: number;
    riskFactors?: string[];
    riskMitigators?: string[];
    recommendedActions?: string[];
    lastAssessmentDate?: string;
  }>().default({}),
  
  aiCoverageRecommendations: jsonb('ai_coverage_recommendations').$type<{
    recommendedCoverages?: Array<{
      type?: string;
      reason?: string;
      priority?: string;
      estimatedCost?: number;
    }>;
    discountOpportunities?: Array<{
      type?: string;
      description?: string;
      potentialSavings?: number;
    }>;
    lastRecommendationDate?: string;
  }>().default({}),
  
  aiPricingFactors: jsonb('ai_pricing_factors').$type<{
    positiveFactors?: Array<{
      factor?: string;
      impact?: string;
      description?: string;
    }>;
    negativeFactors?: Array<{
      factor?: string;
      impact?: string;
      description?: string;
    }>;
    neutralFactors?: Array<{
      factor?: string;
      description?: string;
    }>;
  }>().default({}),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  notes: text('notes'),
  
  // Audit fields
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Ensure one profile per contact
  uniqueContactProfile: unique().on(table.contactId),
}));

export const insuranceProfilesRelations = relations(insuranceProfiles, ({ one }) => ({
  // Core relationship
  contact: one(contacts, {
    fields: [insuranceProfiles.contactId],
    references: [contacts.id],
  }),
  
  // User relationships
  creator: one(users, {
    fields: [insuranceProfiles.createdBy],
    references: [users.id],
    relationName: 'insuranceProfileCreator'
  }),
  updater: one(users, {
    fields: [insuranceProfiles.updatedBy],
    references: [users.id],
    relationName: 'insuranceProfileUpdater'
  }),
}));

// Type exports
export type InsuranceProfile = typeof insuranceProfiles.$inferSelect;
export type NewInsuranceProfile = typeof insuranceProfiles.$inferInsert;

// Utility types
export type PaymentPreference = InsuranceProfile['paymentPreference'];
export type AutoData = NonNullable<InsuranceProfile['autoData']>;
export type HomeData = NonNullable<InsuranceProfile['homeData']>;
export type CommercialData = NonNullable<InsuranceProfile['commercialData']>;
export type SpecialtyData = NonNullable<InsuranceProfile['specialtyData']>;

// Insurance profile with relations type
export type InsuranceProfileWithRelations = InsuranceProfile & {
  contact?: typeof contacts.$inferSelect;
  creator?: typeof users.$inferSelect;
  updater?: typeof users.$inferSelect;
};
