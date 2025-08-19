#!/usr/bin/env tsx

/**
 * 🌱 Comprehensive Test Data Seeder for Insurance CRM
 *
 * This script populates the database with realistic test data:
 * - 25 Personal Insurance Leads
 * - 25 Commercial Insurance Leads
 * - 25 High Value Leads
 * - 25 Converted Clients
 *
 * Usage: npm run seed:test-data
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
    application_name: 'seed-data'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

// Insurance carriers for realistic data
const INSURANCE_CARRIERS = [
  'State Farm', 'Allstate', 'GEICO', 'Progressive', 'Farmers', 'Liberty Mutual',
  'USAA', 'Nationwide', 'American Family', 'Travelers', 'Auto-Owners', 'Erie'
];

// Lead statuses
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Quoted', 'Negotiating', 'Lost'];

// Business types for commercial leads
const BUSINESS_TYPES = [
  'Corporation', 'LLC', 'Partnership', 'Sole Proprietorship', 'Non-Profit'
];

// Industries for commercial leads
const INDUSTRIES = [
  'Construction', 'Manufacturing', 'Retail', 'Healthcare', 'Technology', 
  'Professional Services', 'Transportation', 'Hospitality', 'Real Estate', 'Education'
];

// Generate realistic vehicle data
function generateVehicleData() {
  const makes = ['Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Nissan'];
  const models = ['Accord', 'Camry', 'F-150', 'Silverado', '3 Series', 'C-Class', 'A4', 'Altima'];
  
  return {
    vehicles: [{
      year: faker.date.between({ from: '2015-01-01', to: '2024-12-31' }).getFullYear().toString(),
      make: faker.helpers.arrayElement(makes),
      model: faker.helpers.arrayElement(models),
      vin: faker.vehicle.vin(),
      usage: faker.helpers.arrayElement(['Commute', 'Pleasure', 'Business', 'Farm']),
      annual_mileage: faker.number.int({ min: 5000, max: 25000 }),
      comprehensive_deductible: faker.helpers.arrayElement(['250', '500', '1000']),
      collision_deductible: faker.helpers.arrayElement(['250', '500', '1000'])
    }]
  };
}

// Generate realistic home data
function generateHomeData() {
  return {
    dwelling_type: faker.helpers.arrayElement(['Single Family', 'Condo', 'Townhouse', 'Mobile Home']),
    year_built: faker.date.between({ from: '1950-01-01', to: '2023-12-31' }).getFullYear(),
    square_footage: faker.number.int({ min: 800, max: 4000 }),
    construction_type: faker.helpers.arrayElement(['Frame', 'Masonry', 'Fire Resistive']),
    roof_type: faker.helpers.arrayElement(['Composition Shingle', 'Tile', 'Metal', 'Slate']),
    heating_type: faker.helpers.arrayElement(['Gas', 'Electric', 'Oil', 'Heat Pump']),
    foundation_type: faker.helpers.arrayElement(['Slab', 'Crawl Space', 'Basement']),
    dwelling_coverage: faker.number.int({ min: 200000, max: 800000 }),
    personal_property: faker.number.int({ min: 50000, max: 200000 }),
    liability_coverage: faker.helpers.arrayElement(['300000', '500000', '1000000'])
  };
}

// Generate commercial data
function generateCommercialData() {
  return {
    business_description: faker.company.buzzPhrase(),
    number_of_locations: faker.number.int({ min: 1, max: 5 }),
    total_employees: faker.number.int({ min: 1, max: 500 }),
    annual_payroll: faker.number.int({ min: 50000, max: 5000000 }),
    building_coverage: faker.number.int({ min: 100000, max: 2000000 }),
    contents_coverage: faker.number.int({ min: 50000, max: 1000000 }),
    liability_limit: faker.helpers.arrayElement(['1000000', '2000000', '5000000']),
    workers_comp_needed: faker.datatype.boolean(),
    fleet_vehicles: faker.number.int({ min: 0, max: 20 })
  };
}

// Generate AI insights
function generateAIInsights(leadType: string, premium: number) {
  const riskFactors = faker.helpers.arrayElements([
    'Young driver', 'Multiple claims', 'High-risk location', 'Credit score', 'Driving record'
  ], { min: 0, max: 3 });
  
  const opportunities = faker.helpers.arrayElements([
    'Bundle discount', 'Safe driver discount', 'Multi-policy savings', 'Loyalty discount'
  ], { min: 1, max: 3 });

  return {
    risk_factors: riskFactors,
    opportunities: opportunities,
    estimated_ltv: premium * faker.number.float({ min: 3, max: 8 }),
    conversion_indicators: {
      engagement_score: faker.number.int({ min: 1, max: 10 }),
      response_time: faker.number.int({ min: 1, max: 48 }),
      quote_requests: faker.number.int({ min: 0, max: 3 })
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

      const leadData = {
        lead_type: 'Personal',
        priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
        current_carrier: faker.helpers.arrayElement([...INSURANCE_CARRIERS, null]),
        current_policy_expiry: faker.date.future({ years: 1 }).toISOString().split('T')[0],
        premium: premium.toString(),
        auto_premium: faker.number.float({ min: 600, max: 2000, fractionDigits: 2 }).toString(),
        home_premium: faker.number.float({ min: 800, max: 2500, fractionDigits: 2 }).toString(),
        auto_data: generateVehicleData(),
        home_data: generateHomeData(),
        ai_summary: `${firstName} ${lastName} is interested in ${faker.helpers.arrayElement(['auto', 'home', 'bundled'])} insurance. ${faker.lorem.sentence()}`,
        ai_next_action: faker.helpers.arrayElement([
          'Schedule follow-up call',
          'Send quote comparison',
          'Provide additional coverage options',
          'Address pricing concerns'
        ]),
        ai_quote_recommendation: faker.helpers.arrayElement([
          'Recommend bundle discount',
          'Suggest higher deductible for savings',
          'Propose additional coverage',
          'Offer loyalty discount'
        ]),
        ai_follow_up_priority: faker.number.int({ min: 1, max: 5 }),
        ai_conversion_probability: faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }).toString(),
        ai_insights: generateAIInsights('Personal', premium),
        tags: faker.helpers.arrayElements(['Hot Lead', 'Bundle Opportunity', 'Price Sensitive', 'Referral'], { min: 0, max: 2 }),
        notes: faker.lorem.paragraph(),
        source: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Social Media', 'Advertisement']),
        status: faker.helpers.arrayElement(LEAD_STATUSES),
        pipeline_id: 1, // Assuming default personal pipeline
        insurance_type_id: faker.number.int({ min: 1, max: 3 }), // Auto, Home, or Bundle
        created_at: faker.date.recent({ days: 30 }).toISOString(),
        updated_at: faker.date.recent({ days: 7 }).toISOString()
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

async function seedCommercialLeads() {
  console.log('🏢 Seeding 25 Commercial Insurance Leads...');

  for (let i = 0; i < 25; i++) {
    try {
      const companyName = faker.company.name();
      const premium = faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 });

      const leadData = {
        lead_type: 'Commercial',
        priority: faker.helpers.arrayElement(['Medium', 'High']),
        current_carrier: faker.helpers.arrayElement([...INSURANCE_CARRIERS, null]),
        current_policy_expiry: faker.date.future({ years: 1 }).toISOString().split('T')[0],
        premium: premium.toString(),
        commercial_premium: premium.toString(),
        commercial_data: generateCommercialData(),
        ai_summary: `${companyName} is a ${faker.helpers.arrayElement(INDUSTRIES).toLowerCase()} business seeking comprehensive commercial coverage. ${faker.lorem.sentence()}`,
        ai_next_action: faker.helpers.arrayElement([
          'Schedule risk assessment',
          'Prepare comprehensive quote',
          'Review current coverage gaps',
          'Discuss workers compensation needs'
        ]),
        ai_quote_recommendation: faker.helpers.arrayElement([
          'Recommend umbrella policy',
          'Suggest cyber liability coverage',
          'Propose fleet management program',
          'Offer risk management services'
        ]),
        ai_follow_up_priority: faker.number.int({ min: 2, max: 5 }),
        ai_conversion_probability: faker.number.float({ min: 0.2, max: 0.8, fractionDigits: 2 }).toString(),
        ai_insights: generateAIInsights('Commercial', premium),
        tags: faker.helpers.arrayElements(['Large Account', 'Growth Potential', 'Multi-Location', 'High Risk'], { min: 1, max: 3 }),
        notes: faker.lorem.paragraph(),
        source: faker.helpers.arrayElement(['Broker Referral', 'Website', 'Trade Show', 'Cold Outreach', 'Networking']),
        status: faker.helpers.arrayElement(LEAD_STATUSES),
        pipeline_id: 2, // Assuming commercial pipeline
        insurance_type_id: faker.number.int({ min: 4, max: 6 }), // Commercial types
        created_at: faker.date.recent({ days: 45 }).toISOString(),
        updated_at: faker.date.recent({ days: 10 }).toISOString()
      };

      await db.insert(leads).values(leadData);

      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 commercial leads`);
      }
    } catch (error) {
      console.error(`❌ Error inserting commercial lead ${i + 1}:`, error.message);
    }
  }

  console.log('✅ Commercial leads seeded successfully');
}

async function seedHighValueLeads() {
  console.log('💎 Seeding 25 High Value Leads...');

  for (let i = 0; i < 25; i++) {
    try {
      const isPersonal = faker.datatype.boolean();
      const name = isPersonal ? `${faker.person.firstName()} ${faker.person.lastName()}` : faker.company.name();
      const premium = faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 });

      const leadData = {
        lead_type: isPersonal ? 'Personal' : 'Commercial',
        priority: 'High',
        current_carrier: faker.helpers.arrayElement(INSURANCE_CARRIERS),
        current_policy_expiry: faker.date.future({ years: 1 }).toISOString().split('T')[0],
        premium: premium.toString(),
        auto_premium: isPersonal ? faker.number.float({ min: 3000, max: 8000, fractionDigits: 2 }).toString() : null,
        home_premium: isPersonal ? faker.number.float({ min: 4000, max: 12000, fractionDigits: 2 }).toString() : null,
        specialty_premium: faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }).toString(),
        commercial_premium: !isPersonal ? premium.toString() : null,
        auto_data: isPersonal ? generateVehicleData() : null,
        home_data: isPersonal ? generateHomeData() : null,
        specialty_data: {
          items: [{
            type: faker.helpers.arrayElement(['Yacht', 'Art Collection', 'Jewelry', 'Classic Car', 'Wine Collection']),
            value: faker.number.int({ min: 50000, max: 500000 }),
            coverage_type: 'Agreed Value'
          }]
        },
        commercial_data: !isPersonal ? generateCommercialData() : null,
        ai_summary: `High-value ${isPersonal ? 'individual' : 'commercial'} client with significant assets requiring specialized coverage. ${faker.lorem.sentence()}`,
        ai_next_action: faker.helpers.arrayElement([
          'Schedule in-person consultation',
          'Prepare white-glove service proposal',
          'Coordinate with specialty underwriters',
          'Arrange asset appraisal'
        ]),
        ai_quote_recommendation: faker.helpers.arrayElement([
          'Recommend concierge claims service',
          'Suggest private client program',
          'Propose risk management consultation',
          'Offer exclusive coverage enhancements'
        ]),
        ai_follow_up_priority: 5,
        ai_conversion_probability: faker.number.float({ min: 0.4, max: 0.9, fractionDigits: 2 }).toString(),
        ai_insights: generateAIInsights('High Value', premium),
        tags: ['High Value', 'VIP', 'Specialty Coverage', 'White Glove Service'],
        notes: faker.lorem.paragraph(),
        source: faker.helpers.arrayElement(['Referral', 'Private Banking', 'Wealth Manager', 'Existing Client']),
        status: faker.helpers.arrayElement(['New', 'Contacted', 'Qualified', 'Quoted']),
        pipeline_id: faker.number.int({ min: 1, max: 2 }),
        insurance_type_id: faker.number.int({ min: 1, max: 6 }),
        created_at: faker.date.recent({ days: 60 }).toISOString(),
        updated_at: faker.date.recent({ days: 5 }).toISOString()
      };

      await db.insert(leads).values(leadData);

      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 high value leads`);
      }
    } catch (error) {
      console.error(`❌ Error inserting high value lead ${i + 1}:`, error.message);
    }
  }

  console.log('✅ High value leads seeded successfully');
}

async function seedClients() {
  console.log('👥 Seeding 25 Converted Clients...');

  const clientsData = [];

  for (let i = 0; i < 25; i++) {
    const isIndividual = faker.datatype.boolean();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const companyName = faker.company.name();

    clientsData.push({
      client_type: isIndividual ? 'Individual' : 'Business',
      name: isIndividual ? `${firstName} ${lastName}` : companyName,
      email: isIndividual ? faker.internet.email({ firstName, lastName }) : faker.internet.email(),
      phone_number: faker.phone.number(),

      // Individual-specific fields
      date_of_birth: isIndividual ? faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0] : null,
      gender: isIndividual ? faker.helpers.arrayElement(['Male', 'Female', 'Other']) : null,
      marital_status: isIndividual ? faker.helpers.arrayElement(['Single', 'Married', 'Divorced', 'Widowed']) : null,
      drivers_license: isIndividual ? faker.string.alphanumeric(10).toUpperCase() : null,
      license_state: isIndividual ? faker.location.state({ abbreviated: true }) : null,
      education_occupation: isIndividual ? faker.person.jobTitle() : null,
      referred_by: faker.helpers.maybe(() => faker.person.fullName(), { probability: 0.3 }),

      // Business-specific fields
      business_type: !isIndividual ? faker.helpers.arrayElement(BUSINESS_TYPES) : null,
      industry: !isIndividual ? faker.helpers.arrayElement(INDUSTRIES) : null,
      tax_id: !isIndividual ? faker.string.numeric(9) : null,
      year_established: !isIndividual ? faker.date.between({ from: '1980-01-01', to: '2020-12-31' }).getFullYear().toString() : null,
      annual_revenue: !isIndividual ? faker.number.float({ min: 100000, max: 10000000, fractionDigits: 2 }) : null,
      number_of_employees: !isIndividual ? faker.number.int({ min: 1, max: 500 }) : null,

      // AI fields
      ai_summary: `${isIndividual ? 'Individual' : 'Business'} client with ${faker.helpers.arrayElement(['excellent', 'good', 'average'])} payment history and ${faker.helpers.arrayElement(['low', 'medium', 'high'])} risk profile. ${faker.lorem.sentence()}`,
      ai_next_action: faker.helpers.arrayElement([
        'Schedule annual policy review',
        'Discuss additional coverage options',
        'Process renewal documentation',
        'Conduct satisfaction survey'
      ]),
      ai_risk_score: faker.number.int({ min: 1, max: 10 }),
      ai_lifetime_value: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
      ai_insights: {
        retention_probability: faker.number.float({ min: 0.7, max: 0.98, fractionDigits: 2 }),
        upsell_opportunities: faker.helpers.arrayElements([
          'Umbrella policy', 'Life insurance', 'Disability insurance', 'Additional vehicles'
        ], { min: 0, max: 3 }),
        satisfaction_score: faker.number.int({ min: 7, max: 10 }),
        payment_behavior: faker.helpers.arrayElement(['Excellent', 'Good', 'Fair']),
        claims_history: {
          total_claims: faker.number.int({ min: 0, max: 5 }),
          last_claim_date: faker.helpers.maybe(() => faker.date.recent({ days: 365 }).toISOString(), { probability: 0.4 })
        }
      },
      metadata: {
        preferred_contact_method: faker.helpers.arrayElement(['Email', 'Phone', 'Text', 'Mail']),
        policy_count: faker.number.int({ min: 1, max: 4 }),
        total_premium: faker.number.float({ min: 1200, max: 15000, fractionDigits: 2 }),
        client_since: faker.date.past({ years: 5 }).toISOString()
      },
      tags: faker.helpers.arrayElements([
        'VIP Client', 'Multi-Policy', 'Referral Source', 'Long-term Client', 'High Value'
      ], { min: 1, max: 3 }),
      status: faker.helpers.arrayElement(['Active', 'Renewal Due', 'Policy Review']),
      source: faker.helpers.arrayElement(['Lead Conversion', 'Referral', 'Existing Client Expansion']),
      created_at: faker.date.past({ years: 3 }),
      updated_at: faker.date.recent({ days: 30 }),
      last_contact_at: faker.date.recent({ days: 60 }),
      next_contact_at: faker.date.future({ days: 90 })
    });
  }

  await db.insert(clients).values(clientsData);
  console.log('✅ Clients seeded successfully');
}

async function main() {
  try {
    console.log('🌱 Starting comprehensive test data seeding...\n');

    // Seed different types of leads and clients
    await seedPersonalLeads();
    await seedCommercialLeads();
    await seedHighValueLeads();
    await seedClients();

    console.log('\n🎉 All test data seeded successfully!');
    console.log('📊 Summary:');
    console.log('  - 25 Personal Insurance Leads');
    console.log('  - 25 Commercial Insurance Leads');
    console.log('  - 25 High Value Leads');
    console.log('  - 25 Converted Clients');
    console.log('  - Total: 100 records');

    console.log('\n📋 Next Steps:');
    console.log('  1. Run your local development server: npm run dev');
    console.log('  2. Navigate to your CRM dashboard to view the test data');
    console.log('  3. Test lead management, client tracking, and AI features');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  main();
}
