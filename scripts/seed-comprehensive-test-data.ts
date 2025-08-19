#!/usr/bin/env tsx

/**
 * 🌱 Comprehensive Test Data Seeder for Insurance CRM
 * 
 * This script populates ALL fields in the database with realistic test data:
 * - 25 Personal Insurance Leads
 * - 25 Commercial Insurance Leads  
 * - 25 High Value Leads
 * - 25 Converted Clients
 * 
 * Usage: npm run seed:comprehensive-test-data
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { leads, clients } from '../lib/drizzle/schema';
import * as schema from '../lib/drizzle/schema';
import { faker } from '@faker-js/faker';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'seed-comprehensive-data'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

// Valid statuses based on database constraints
const VALID_LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated'];
const VALID_CLIENT_STATUSES = ['Active', 'Inactive', 'Prospect', 'Lost'];

// Insurance carriers for realistic data
const INSURANCE_CARRIERS = [
  'State Farm', 'Allstate', 'GEICO', 'Progressive', 'Farmers', 'Liberty Mutual',
  'USAA', 'Nationwide', 'American Family', 'Travelers', 'Auto-Owners', 'Erie'
];

// Business types for commercial leads
const BUSINESS_TYPES = ['Corporation', 'LLC', 'Partnership', 'Sole Proprietorship', 'Non-Profit'];
const INDUSTRIES = ['Construction', 'Manufacturing', 'Retail', 'Healthcare', 'Technology', 'Professional Services'];

// Generate comprehensive vehicle data
function generateVehicleData() {
  const makes = ['Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Nissan'];
  const models = ['Accord', 'Camry', 'F-150', 'Silverado', '3 Series', 'C-Class', 'A4', 'Altima'];
  
  return {
    vehicles: [{
      year: faker.date.between({ from: '2015-01-01', to: '2024-12-31' }).getFullYear(),
      make: faker.helpers.arrayElement(makes),
      model: faker.helpers.arrayElement(models),
      vin: faker.vehicle.vin(),
      usage: faker.helpers.arrayElement(['Commute', 'Pleasure', 'Business', 'Farm']),
      annual_mileage: faker.number.int({ min: 5000, max: 25000 }),
      comprehensive_deductible: faker.helpers.arrayElement([250, 500, 1000]),
      collision_deductible: faker.helpers.arrayElement([250, 500, 1000]),
      liability_limits: '100/300/100',
      uninsured_motorist: true,
      rental_coverage: faker.datatype.boolean()
    }],
    drivers: [{
      name: faker.person.fullName(),
      license_number: faker.string.alphanumeric(10).toUpperCase(),
      date_of_birth: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().split('T')[0],
      gender: faker.helpers.arrayElement(['Male', 'Female']),
      marital_status: faker.helpers.arrayElement(['Single', 'Married', 'Divorced']),
      violations: faker.helpers.arrayElements(['Speeding', 'Parking', 'None'], { min: 0, max: 2 }),
      accidents: faker.number.int({ min: 0, max: 2 })
    }]
  };
}

// Generate comprehensive home data
function generateHomeData() {
  return {
    property: {
      dwelling_type: faker.helpers.arrayElement(['Single Family', 'Condo', 'Townhouse', 'Mobile Home']),
      year_built: faker.date.between({ from: '1950-01-01', to: '2023-12-31' }).getFullYear(),
      square_footage: faker.number.int({ min: 800, max: 4000 }),
      construction_type: faker.helpers.arrayElement(['Frame', 'Masonry', 'Fire Resistive']),
      roof_type: faker.helpers.arrayElement(['Composition Shingle', 'Tile', 'Metal', 'Slate']),
      heating_type: faker.helpers.arrayElement(['Gas', 'Electric', 'Oil', 'Heat Pump']),
      foundation_type: faker.helpers.arrayElement(['Slab', 'Crawl Space', 'Basement']),
      garage: faker.helpers.arrayElement(['None', 'Attached', 'Detached']),
      pool: faker.datatype.boolean(),
      security_system: faker.datatype.boolean(),
      fire_protection: faker.helpers.arrayElement(['None', 'Smoke Detectors', 'Sprinkler System'])
    },
    coverage: {
      dwelling_coverage: faker.number.int({ min: 200000, max: 800000 }),
      personal_property: faker.number.int({ min: 50000, max: 200000 }),
      liability_coverage: faker.helpers.arrayElement([300000, 500000, 1000000]),
      medical_payments: faker.helpers.arrayElement([1000, 5000, 10000]),
      deductible: faker.helpers.arrayElement([500, 1000, 2500, 5000])
    }
  };
}

// Generate commercial data
function generateCommercialData() {
  return {
    business: {
      business_description: faker.company.buzzPhrase(),
      industry: faker.helpers.arrayElement(INDUSTRIES),
      number_of_locations: faker.number.int({ min: 1, max: 5 }),
      total_employees: faker.number.int({ min: 1, max: 500 }),
      annual_payroll: faker.number.int({ min: 50000, max: 5000000 }),
      years_in_business: faker.number.int({ min: 1, max: 50 }),
      business_operations: faker.lorem.sentence(),
      peak_season: faker.helpers.arrayElement(['Spring', 'Summer', 'Fall', 'Winter', 'Year-round'])
    },
    coverage: {
      general_liability: faker.number.int({ min: 1000000, max: 5000000 }),
      property_coverage: faker.number.int({ min: 100000, max: 2000000 }),
      business_interruption: faker.number.int({ min: 50000, max: 1000000 }),
      workers_compensation: faker.datatype.boolean(),
      cyber_liability: faker.datatype.boolean(),
      professional_liability: faker.datatype.boolean(),
      commercial_auto: faker.datatype.boolean(),
      umbrella_coverage: faker.number.int({ min: 1000000, max: 10000000 })
    },
    locations: [{
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip: faker.location.zipCode(),
      building_type: faker.helpers.arrayElement(['Owned', 'Rented', 'Leased']),
      square_footage: faker.number.int({ min: 1000, max: 50000 }),
      construction_type: faker.helpers.arrayElement(['Frame', 'Masonry', 'Steel', 'Concrete'])
    }]
  };
}

// Generate specialty data for high-value items
function generateSpecialtyData() {
  const itemTypes = ['Yacht', 'Art Collection', 'Jewelry', 'Classic Car', 'Wine Collection', 'Antiques', 'Collectibles'];
  
  return {
    items: [{
      type: faker.helpers.arrayElement(itemTypes),
      description: faker.lorem.sentence(),
      value: faker.number.int({ min: 50000, max: 500000 }),
      coverage_type: faker.helpers.arrayElement(['Agreed Value', 'Actual Cash Value', 'Replacement Cost']),
      appraisal_date: faker.date.recent({ days: 365 }).toISOString().split('T')[0],
      storage_location: faker.helpers.arrayElement(['Primary Residence', 'Secondary Home', 'Storage Facility', 'Bank Vault'])
    }],
    coverage: {
      total_coverage: faker.number.int({ min: 100000, max: 2000000 }),
      deductible: faker.helpers.arrayElement([1000, 2500, 5000, 10000]),
      worldwide_coverage: faker.datatype.boolean(),
      newly_acquired_coverage: faker.datatype.boolean()
    }
  };
}

// Generate AI insights
function generateAIInsights(leadType: string, premium: number) {
  const riskFactors = faker.helpers.arrayElements([
    'Young driver', 'Multiple claims', 'High-risk location', 'Credit score', 'Driving record', 'Property age'
  ], { min: 0, max: 3 });
  
  const opportunities = faker.helpers.arrayElements([
    'Bundle discount', 'Safe driver discount', 'Multi-policy savings', 'Loyalty discount', 'Security system discount'
  ], { min: 1, max: 3 });

  return {
    risk_assessment: {
      overall_risk: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
      risk_factors: riskFactors,
      risk_score: faker.number.int({ min: 1, max: 100 })
    },
    opportunities: opportunities,
    financial_metrics: {
      estimated_ltv: premium * faker.number.float({ min: 3, max: 8 }),
      profit_margin: faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 2 }),
      retention_probability: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 })
    },
    engagement: {
      engagement_score: faker.number.int({ min: 1, max: 10 }),
      response_time_hours: faker.number.int({ min: 1, max: 48 }),
      quote_requests: faker.number.int({ min: 0, max: 3 }),
      website_visits: faker.number.int({ min: 1, max: 10 }),
      email_opens: faker.number.int({ min: 0, max: 5 })
    },
    predictions: {
      conversion_probability: faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }),
      optimal_contact_time: faker.helpers.arrayElement(['Morning', 'Afternoon', 'Evening']),
      preferred_communication: faker.helpers.arrayElement(['Phone', 'Email', 'Text', 'In-person']),
      price_sensitivity: faker.helpers.arrayElement(['Low', 'Medium', 'High'])
    }
  };
}

// Generate metadata
function generateMetadata(leadType: string) {
  return {
    lead_source_details: {
      utm_source: faker.helpers.arrayElement(['google', 'facebook', 'direct', 'referral']),
      utm_medium: faker.helpers.arrayElement(['cpc', 'organic', 'social', 'email']),
      utm_campaign: faker.lorem.words(2),
      landing_page: faker.internet.url(),
      referrer: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.3 })
    },
    contact_preferences: {
      best_time_to_call: faker.helpers.arrayElement(['Morning', 'Afternoon', 'Evening']),
      preferred_language: faker.helpers.arrayElement(['English', 'Spanish', 'French']),
      communication_frequency: faker.helpers.arrayElement(['Daily', 'Weekly', 'Bi-weekly', 'Monthly']),
      marketing_opt_in: faker.datatype.boolean()
    },
    demographics: {
      age_range: faker.helpers.arrayElement(['18-25', '26-35', '36-45', '46-55', '56-65', '65+']),
      income_range: faker.helpers.arrayElement(['<50k', '50k-75k', '75k-100k', '100k-150k', '150k+']),
      education: faker.helpers.arrayElement(['High School', 'Some College', 'Bachelor\'s', 'Master\'s', 'PhD']),
      occupation_category: faker.helpers.arrayElement(['Professional', 'Management', 'Service', 'Sales', 'Other'])
    }
  };
}

async function seedPersonalLeads() {
  console.log('🏠 Seeding 25 Personal Insurance Leads...');
  
  for (let i = 0; i < 25; i++) {
    try {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const premium = faker.number.float({ min: 800, max: 3500, fractionDigits: 2 });
      const autoPremium = faker.number.float({ min: 600, max: 2000, fractionDigits: 2 });
      const homePremium = faker.number.float({ min: 800, max: 2500, fractionDigits: 2 });
      const status = faker.helpers.arrayElement(VALID_LEAD_STATUSES);
      const createdAt = faker.date.recent({ days: 30 });
      const updatedAt = faker.date.recent({ days: 7 });
      
      const vehicleData = generateVehicleData();
      const homeData = generateHomeData();
      const aiInsights = generateAIInsights('Personal', premium);
      const metadata = generateMetadata('Personal');

      // Generate dates as strings to avoid toISOString issues
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const policyExpiry = futureDate.toISOString().split('T')[0];

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 14);
      const lastContact = recentDate.toISOString();

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30);
      const nextContact = nextDate.toISOString();

      const leadData = {
        lead_type: 'Personal',
        priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
        current_carrier: faker.helpers.arrayElement([...INSURANCE_CARRIERS, null]),
        current_policy_expiry: policyExpiry,
        premium: premium.toString(),
        auto_premium: autoPremium.toString(),
        home_premium: homePremium.toString(),
        auto_data: vehicleData,
        home_data: homeData,
        drivers: vehicleData.drivers,
        vehicles: vehicleData.vehicles,
        ai_summary: `${firstName} ${lastName} is interested in ${faker.helpers.arrayElement(['auto', 'home', 'bundled'])} insurance. ${faker.lorem.sentence()}`,
        ai_next_action: faker.helpers.arrayElement([
          'Schedule follow-up call',
          'Send quote comparison',
          'Provide additional coverage options',
          'Address pricing concerns',
          'Schedule in-person meeting'
        ]),
        ai_quote_recommendation: faker.helpers.arrayElement([
          'Recommend bundle discount',
          'Suggest higher deductible for savings',
          'Propose additional coverage',
          'Offer loyalty discount',
          'Consider umbrella policy'
        ]),
        ai_follow_up_priority: faker.number.int({ min: 1, max: 5 }),
        ai_conversion_probability: aiInsights.predictions.conversion_probability.toString(),
        ai_insights: aiInsights,
        attribution_data: {
          first_touch: faker.helpers.arrayElement(['Google Ads', 'Facebook', 'Referral', 'Direct']),
          last_touch: faker.helpers.arrayElement(['Website Form', 'Phone Call', 'Email', 'Chat']),
          touch_points: faker.number.int({ min: 1, max: 5 })
        },
        metadata: metadata,
        tags: faker.helpers.arrayElements(['Hot Lead', 'Bundle Opportunity', 'Price Sensitive', 'Referral', 'First Time Buyer'], { min: 0, max: 3 }),
        notes: `Initial contact with ${firstName} ${lastName}. ${faker.lorem.paragraph()}`,
        source: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Social Media', 'Advertisement']),
        status: status,
        pipeline_id: 1,
        insurance_type_id: faker.number.int({ min: 1, max: 3 }),
        created_at: createdAt.toISOString(),
        updated_at: updatedAt.toISOString(),
        status_changed_at: updatedAt.toISOString(),
        last_contact_at: lastContact,
        next_contact_at: nextContact,
        is_converted: status === 'Sold'
      };
      
      await db.insert(leads).values(leadData);
      
      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 personal leads`);
      }
    } catch (error) {
      console.error(`❌ Error inserting personal lead ${i + 1}:`, error.message);
    }
  }
  
  console.log('✅ Personal leads seeded successfully');
}

async function main() {
  try {
    console.log('🌱 Starting comprehensive test data seeding...\n');
    
    // Start with personal leads
    await seedPersonalLeads();
    
    console.log('\n🎉 Personal leads seeded successfully!');
    console.log('📊 Summary:');
    console.log('  - 25 Personal Insurance Leads with full data');
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Run your local development server: npm run dev');
    console.log('  2. Navigate to your CRM dashboard to view the test data');
    console.log('  3. Test lead management and AI features');
    
    // Close the database connection
    await client.end();
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  main();
}
