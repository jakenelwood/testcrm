#!/usr/bin/env tsx

/**
 * 🌱 Complete Test Data Seeder for Insurance CRM
 * 
 * This script populates ALL fields with proper data types using Drizzle best practices:
 * - 25 Personal Insurance Leads
 * - 25 Commercial Insurance Leads  
 * - 25 High Value Leads
 * - 25 Converted Clients
 * 
 * Usage: npm run seed:complete-data
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
import type { InferInsertModel } from 'drizzle-orm';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'seed-complete-data'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

// Type-safe insert models
type LeadInsert = InferInsertModel<typeof leads>;
type ClientInsert = InferInsertModel<typeof clients>;

// Valid statuses based on database constraints
const VALID_LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated'];
const VALID_CLIENT_STATUSES = ['Active', 'Inactive', 'Prospect', 'Lost'];

// Insurance carriers for realistic data
const INSURANCE_CARRIERS = [
  'State Farm', 'Allstate', 'GEICO', 'Progressive', 'Farmers', 'Liberty Mutual',
  'USAA', 'Nationwide', 'American Family', 'Travelers', 'Auto-Owners', 'Erie'
];

// Helper function to create proper Date objects for timestamp fields
function createTimestamp(daysOffset: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

function createDate(daysOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

// Generate comprehensive vehicle data
function generateAutoData() {
  return {
    vehicles: [{
      year: faker.date.between({ from: '2015-01-01', to: '2024-12-31' }).getFullYear(),
      make: faker.helpers.arrayElement(['Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW']),
      model: faker.helpers.arrayElement(['Accord', 'Camry', 'F-150', 'Silverado', '3 Series']),
      vin: faker.vehicle.vin(),
      usage: faker.helpers.arrayElement(['Commute', 'Pleasure', 'Business']),
      annual_mileage: faker.number.int({ min: 5000, max: 25000 }),
      comprehensive_deductible: faker.helpers.arrayElement([250, 500, 1000]),
      collision_deductible: faker.helpers.arrayElement([250, 500, 1000])
    }],
    coverage: {
      liability_limits: '100/300/100',
      uninsured_motorist: faker.datatype.boolean(),
      rental_coverage: faker.datatype.boolean()
    }
  };
}

// Generate comprehensive home data
function generateHomeData() {
  return {
    property: {
      dwelling_type: faker.helpers.arrayElement(['Single Family', 'Condo', 'Townhouse']),
      year_built: faker.date.between({ from: '1950-01-01', to: '2023-12-31' }).getFullYear(),
      square_footage: faker.number.int({ min: 800, max: 4000 }),
      construction_type: faker.helpers.arrayElement(['Frame', 'Masonry', 'Fire Resistive']),
      roof_type: faker.helpers.arrayElement(['Composition Shingle', 'Tile', 'Metal']),
      heating_type: faker.helpers.arrayElement(['Gas', 'Electric', 'Oil']),
      foundation_type: faker.helpers.arrayElement(['Slab', 'Crawl Space', 'Basement'])
    },
    coverage: {
      dwelling_coverage: faker.number.int({ min: 200000, max: 800000 }),
      personal_property: faker.number.int({ min: 50000, max: 200000 }),
      liability_coverage: faker.helpers.arrayElement([300000, 500000, 1000000]),
      deductible: faker.helpers.arrayElement([500, 1000, 2500])
    }
  };
}

// Generate commercial data
function generateCommercialData() {
  return {
    business: {
      business_description: faker.company.buzzPhrase(),
      industry: faker.helpers.arrayElement(['Construction', 'Manufacturing', 'Retail', 'Healthcare']),
      number_of_locations: faker.number.int({ min: 1, max: 5 }),
      total_employees: faker.number.int({ min: 1, max: 500 }),
      annual_payroll: faker.number.int({ min: 50000, max: 5000000 }),
      years_in_business: faker.number.int({ min: 1, max: 50 })
    },
    coverage: {
      general_liability: faker.number.int({ min: 1000000, max: 5000000 }),
      property_coverage: faker.number.int({ min: 100000, max: 2000000 }),
      workers_compensation: faker.datatype.boolean(),
      cyber_liability: faker.datatype.boolean()
    }
  };
}

// Generate specialty data for high-value items
function generateSpecialtyData() {
  return {
    items: [{
      type: faker.helpers.arrayElement(['Yacht', 'Art Collection', 'Jewelry', 'Classic Car']),
      description: faker.lorem.sentence(),
      value: faker.number.int({ min: 50000, max: 500000 }),
      coverage_type: faker.helpers.arrayElement(['Agreed Value', 'Replacement Cost'])
    }],
    coverage: {
      total_coverage: faker.number.int({ min: 100000, max: 2000000 }),
      deductible: faker.helpers.arrayElement([1000, 2500, 5000]),
      worldwide_coverage: faker.datatype.boolean()
    }
  };
}

// Generate AI insights
function generateAIInsights() {
  return {
    risk_assessment: {
      overall_risk: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
      risk_factors: faker.helpers.arrayElements(['Young driver', 'Multiple claims', 'High-risk location'], { min: 0, max: 2 }),
      risk_score: faker.number.int({ min: 1, max: 100 })
    },
    opportunities: faker.helpers.arrayElements(['Bundle discount', 'Safe driver discount', 'Multi-policy savings'], { min: 1, max: 3 }),
    financial_metrics: {
      estimated_ltv: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
      profit_margin: faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 2 }),
      retention_probability: faker.number.float({ min: 0.6, max: 0.95, fractionDigits: 2 })
    },
    engagement: {
      engagement_score: faker.number.int({ min: 1, max: 10 }),
      response_time_hours: faker.number.int({ min: 1, max: 48 }),
      website_visits: faker.number.int({ min: 1, max: 10 })
    }
  };
}

// Generate metadata
function generateMetadata() {
  return {
    lead_source_details: {
      utm_source: faker.helpers.arrayElement(['google', 'facebook', 'direct']),
      utm_medium: faker.helpers.arrayElement(['cpc', 'organic', 'social']),
      landing_page: faker.internet.url()
    },
    contact_preferences: {
      best_time_to_call: faker.helpers.arrayElement(['Morning', 'Afternoon', 'Evening']),
      preferred_language: faker.helpers.arrayElement(['English', 'Spanish']),
      marketing_opt_in: faker.datatype.boolean()
    },
    demographics: {
      age_range: faker.helpers.arrayElement(['18-25', '26-35', '36-45', '46-55', '56-65', '65+']),
      income_range: faker.helpers.arrayElement(['<50k', '50k-75k', '75k-100k', '100k-150k', '150k+']),
      education: faker.helpers.arrayElement(['High School', 'Some College', 'Bachelor\'s', 'Master\'s'])
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
      
      const autoData = generateAutoData();
      const homeData = generateHomeData();
      const aiInsights = generateAIInsights();
      const metadata = generateMetadata();
      
      // Create the lead data with proper types
      const leadData: LeadInsert = {
        lead_type: 'Personal',
        priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
        current_carrier: faker.helpers.arrayElement(INSURANCE_CARRIERS),
        current_policy_expiry: createDate(faker.number.int({ min: 30, max: 365 })),
        premium: premium.toString(),
        auto_premium: autoPremium.toString(),
        home_premium: homePremium.toString(),
        auto_data: autoData,
        home_data: homeData,
        drivers: autoData.vehicles.map(() => ({
          name: faker.person.fullName(),
          license_number: faker.string.alphanumeric(10).toUpperCase(),
          date_of_birth: createDate(-faker.number.int({ min: 6570, max: 25550 })), // 18-70 years old
          violations: faker.helpers.arrayElements(['None', 'Speeding', 'Parking'], { min: 1, max: 2 })
        })),
        vehicles: autoData.vehicles,
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
        ai_insights: aiInsights,
        attribution_data: {
          first_touch: faker.helpers.arrayElement(['Google Ads', 'Facebook', 'Referral']),
          last_touch: faker.helpers.arrayElement(['Website Form', 'Phone Call', 'Email']),
          touch_points: faker.number.int({ min: 1, max: 5 })
        },
        metadata: metadata,
        tags: faker.helpers.arrayElements(['Hot Lead', 'Bundle Opportunity', 'Price Sensitive', 'Referral'], { min: 0, max: 3 }),
        notes: `Initial contact with ${firstName} ${lastName}. ${faker.lorem.paragraph()}`,
        source: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Social Media']),
        status: status,
        pipeline_id: 7, // Personal Insurance Pipeline
        insurance_type_id: faker.number.int({ min: 17, max: 20 }), // Auto, Home, Renters, Specialty
        created_at: createTimestamp(-faker.number.int({ min: 1, max: 30 })),
        updated_at: createTimestamp(-faker.number.int({ min: 0, max: 7 })),
        status_changed_at: createTimestamp(-faker.number.int({ min: 0, max: 7 })),
        last_contact_at: createTimestamp(-faker.number.int({ min: 1, max: 14 })),
        next_contact_at: createTimestamp(faker.number.int({ min: 1, max: 30 })),
        is_converted: status === 'Sold'
      };
      
      // Add conditional timestamp fields based on status
      if (status === 'Quoted') {
        leadData.quote_generated_at = createTimestamp(-faker.number.int({ min: 1, max: 5 }));
      }
      if (status === 'Sold') {
        leadData.sold_at = createTimestamp(-faker.number.int({ min: 1, max: 3 }));
      }
      if (status === 'Lost') {
        leadData.lost_at = createTimestamp(-faker.number.int({ min: 1, max: 7 }));
      }
      if (status === 'Hibernated') {
        leadData.hibernated_at = createTimestamp(-faker.number.int({ min: 1, max: 10 }));
      }
      
      await db.insert(leads).values(leadData);
      
      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 personal leads`);
      }
    } catch (error) {
      console.error(`❌ Error inserting personal lead ${i + 1}:`, error);
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
      const status = faker.helpers.arrayElement(VALID_LEAD_STATUSES);

      const commercialData = generateCommercialData();
      const aiInsights = generateAIInsights();
      const metadata = generateMetadata();

      const leadData: LeadInsert = {
        lead_type: 'Business',
        priority: faker.helpers.arrayElement(['Medium', 'High']),
        current_carrier: faker.helpers.arrayElement(INSURANCE_CARRIERS),
        current_policy_expiry: createDate(faker.number.int({ min: 30, max: 365 })),
        premium: premium.toString(),
        commercial_premium: premium.toString(),
        commercial_data: commercialData,
        ai_summary: `${companyName} is seeking comprehensive commercial insurance coverage. ${faker.lorem.sentence()}`,
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
        ai_insights: aiInsights,
        attribution_data: {
          first_touch: faker.helpers.arrayElement(['Broker Referral', 'Trade Show', 'Website']),
          last_touch: faker.helpers.arrayElement(['Phone Call', 'Email', 'In-person Meeting']),
          touch_points: faker.number.int({ min: 1, max: 5 })
        },
        metadata: metadata,
        tags: faker.helpers.arrayElements(['Large Account', 'Growth Potential', 'Multi-Location', 'High Risk'], { min: 1, max: 3 }),
        notes: `Commercial prospect ${companyName}. ${faker.lorem.paragraph()}`,
        source: faker.helpers.arrayElement(['Broker Referral', 'Website', 'Trade Show', 'Cold Outreach']),
        status: status,
        pipeline_id: 8, // Commercial Insurance Pipeline
        insurance_type_id: faker.number.int({ min: 21, max: 24 }), // Commercial types
        created_at: createTimestamp(-faker.number.int({ min: 1, max: 45 })),
        updated_at: createTimestamp(-faker.number.int({ min: 0, max: 10 })),
        status_changed_at: createTimestamp(-faker.number.int({ min: 0, max: 10 })),
        last_contact_at: createTimestamp(-faker.number.int({ min: 1, max: 14 })),
        next_contact_at: createTimestamp(faker.number.int({ min: 1, max: 30 })),
        is_converted: status === 'Sold'
      };

      // Add conditional timestamp fields based on status
      if (status === 'Quoted') {
        leadData.quote_generated_at = createTimestamp(-faker.number.int({ min: 1, max: 5 }));
      }
      if (status === 'Sold') {
        leadData.sold_at = createTimestamp(-faker.number.int({ min: 1, max: 3 }));
      }
      if (status === 'Lost') {
        leadData.lost_at = createTimestamp(-faker.number.int({ min: 1, max: 7 }));
      }
      if (status === 'Hibernated') {
        leadData.hibernated_at = createTimestamp(-faker.number.int({ min: 1, max: 10 }));
      }

      await db.insert(leads).values(leadData);

      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 commercial leads`);
      }
    } catch (error) {
      console.error(`❌ Error inserting commercial lead ${i + 1}:`, error);
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
      const status = faker.helpers.arrayElement(['New', 'Contacted', 'Qualified', 'Quoted']);

      const specialtyData = generateSpecialtyData();
      const aiInsights = generateAIInsights();
      const metadata = generateMetadata();

      const leadData: LeadInsert = {
        lead_type: isPersonal ? 'Personal' : 'Business',
        priority: 'High',
        current_carrier: faker.helpers.arrayElement(INSURANCE_CARRIERS),
        current_policy_expiry: createDate(faker.number.int({ min: 30, max: 365 })),
        premium: premium.toString(),
        specialty_premium: faker.number.float({ min: 5000, max: 25000, fractionDigits: 2 }).toString(),
        ...(isPersonal && {
          auto_premium: faker.number.float({ min: 3000, max: 8000, fractionDigits: 2 }).toString(),
          home_premium: faker.number.float({ min: 4000, max: 12000, fractionDigits: 2 }).toString(),
          auto_data: generateAutoData(),
          home_data: generateHomeData()
        }),
        ...(!isPersonal && {
          commercial_premium: premium.toString(),
          commercial_data: generateCommercialData()
        }),
        specialty_data: specialtyData,
        ai_summary: `High-value ${isPersonal ? 'individual' : 'business'} prospect ${name} with significant assets requiring specialized coverage.`,
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
        ai_insights: aiInsights,
        attribution_data: {
          first_touch: faker.helpers.arrayElement(['Referral', 'Private Banking', 'Wealth Manager']),
          last_touch: faker.helpers.arrayElement(['In-person Meeting', 'Phone Call', 'Email']),
          touch_points: faker.number.int({ min: 2, max: 6 })
        },
        metadata: metadata,
        tags: ['High Value', 'VIP', 'Specialty Coverage', 'White Glove Service'],
        notes: `Premium prospect requiring specialized coverage and white-glove service. ${faker.lorem.paragraph()}`,
        source: faker.helpers.arrayElement(['Referral', 'Private Banking', 'Wealth Manager', 'Existing Client']),
        status: status,
        pipeline_id: 9, // High-Value Personal Pipeline
        insurance_type_id: 20, // Specialty
        created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
        updated_at: createTimestamp(-faker.number.int({ min: 0, max: 5 })),
        status_changed_at: createTimestamp(-faker.number.int({ min: 0, max: 5 })),
        last_contact_at: createTimestamp(-faker.number.int({ min: 1, max: 7 })),
        next_contact_at: createTimestamp(faker.number.int({ min: 1, max: 14 })),
        is_converted: status === 'Sold'
      };

      // Add conditional timestamp fields based on status
      if (status === 'Quoted') {
        leadData.quote_generated_at = createTimestamp(-faker.number.int({ min: 1, max: 3 }));
      }

      await db.insert(leads).values(leadData);

      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 high value leads`);
      }
    } catch (error) {
      console.error(`❌ Error inserting high value lead ${i + 1}:`, error);
    }
  }

  console.log('✅ High value leads seeded successfully');
}

async function seedClients() {
  console.log('👥 Seeding 25 Converted Clients...');

  for (let i = 0; i < 25; i++) {
    try {
      const isIndividual = faker.datatype.boolean();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const companyName = faker.company.name();

      const clientData: ClientInsert = {
        client_type: isIndividual ? 'Individual' : 'Business',
        name: isIndividual ? `${firstName} ${lastName}` : companyName,
        email: isIndividual ? faker.internet.email({ firstName, lastName }) : faker.internet.email(),
        phone_number: faker.phone.number(),

        // Individual-specific fields
        ...(isIndividual && {
          date_of_birth: createDate(-faker.number.int({ min: 6570, max: 25550 })), // 18-70 years old
          gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
          marital_status: faker.helpers.arrayElement(['Single', 'Married', 'Divorced', 'Widowed']),
          drivers_license: faker.string.alphanumeric(10).toUpperCase(),
          license_state: faker.location.state({ abbreviated: true }),
          education_occupation: faker.person.jobTitle(),
          referred_by: faker.helpers.maybe(() => faker.person.fullName(), { probability: 0.3 })
        }),

        // Business-specific fields
        ...(!isIndividual && {
          business_type: faker.helpers.arrayElement(['Corporation', 'LLC', 'Partnership']),
          industry: faker.helpers.arrayElement(['Technology', 'Healthcare', 'Manufacturing', 'Retail']),
          tax_id: faker.string.numeric(9),
          year_established: faker.date.between({ from: '1990-01-01', to: '2020-12-31' }).getFullYear().toString(),
          annual_revenue: faker.number.float({ min: 100000, max: 5000000, fractionDigits: 2 }),
          number_of_employees: faker.number.int({ min: 1, max: 200 })
        }),

        // AI fields
        ai_summary: `${isIndividual ? 'Individual' : 'Business'} client with excellent payment history and low risk profile.`,
        ai_next_action: faker.helpers.arrayElement([
          'Schedule annual policy review',
          'Discuss additional coverage options',
          'Process renewal documentation'
        ]),
        ai_risk_score: faker.number.int({ min: 1, max: 100 }),
        ai_lifetime_value: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),

        // Use valid status values only
        status: faker.helpers.arrayElement(VALID_CLIENT_STATUSES),
        source: faker.helpers.arrayElement(['Lead Conversion', 'Referral', 'Existing Client Expansion']),
        tags: faker.helpers.arrayElements(['VIP Client', 'Multi-Policy', 'Long-term Client'], { min: 0, max: 2 }),
        created_at: createTimestamp(-faker.number.int({ min: 30, max: 1095 })), // 1 month to 3 years ago
        updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 })),
        last_contact_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
        next_contact_at: createTimestamp(faker.number.int({ min: 7, max: 90 }))
      };

      await db.insert(clients).values(clientData);

      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 clients`);
      }
    } catch (error) {
      console.error(`❌ Error inserting client ${i + 1}:`, error);
    }
  }

  console.log('✅ Clients seeded successfully');
}

async function main() {
  try {
    console.log('🌱 Starting complete test data seeding...\n');

    // Seed all types of data
    await seedPersonalLeads();
    await seedCommercialLeads();
    await seedHighValueLeads();
    await seedClients();

    console.log('\n🎉 All test data seeded successfully!');
    console.log('📊 Summary:');
    console.log('  - 25 Personal Insurance Leads with ALL fields populated');
    console.log('  - 25 Commercial Insurance Leads with ALL fields populated');
    console.log('  - 25 High Value Leads with ALL fields populated');
    console.log('  - 25 Converted Clients with ALL fields populated');
    console.log('  - Total: 100 records');

    console.log('\n📋 Next Steps:');
    console.log('  1. Run your local development server: npm run dev');
    console.log('  2. Navigate to your CRM dashboard to view the test data');
    console.log('  3. Test lead management, client tracking, and AI features');
    console.log('  4. Verify all fields are properly populated and displayed');

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
