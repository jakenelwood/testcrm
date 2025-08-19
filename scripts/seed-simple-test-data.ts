#!/usr/bin/env tsx

/**
 * 🌱 Simple Test Data Seeder for Insurance CRM
 * 
 * This script populates the database with realistic test data:
 * - 25 Personal Insurance Leads
 * - 25 Commercial Insurance Leads  
 * - 25 High Value Leads
 * - 25 Converted Clients
 * 
 * Usage: npm run seed:simple-test-data
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

// Valid statuses based on database constraints
const VALID_LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated'];
const VALID_CLIENT_STATUSES = ['Active', 'Inactive', 'Prospect', 'Lost'];

// Insurance carriers for realistic data
const INSURANCE_CARRIERS = [
  'State Farm', 'Allstate', 'GEICO', 'Progressive', 'Farmers', 'Liberty Mutual',
  'USAA', 'Nationwide', 'American Family', 'Travelers', 'Auto-Owners', 'Erie'
];

// Business types for commercial leads
const BUSINESS_TYPES = [
  'Corporation', 'LLC', 'Partnership', 'Sole Proprietorship', 'Non-Profit'
];

// Industries for commercial leads
const INDUSTRIES = [
  'Construction', 'Manufacturing', 'Retail', 'Healthcare', 'Technology', 
  'Professional Services', 'Transportation', 'Hospitality', 'Real Estate', 'Education'
];

async function seedLeads(type: string, count: number) {
  console.log(`🏠 Seeding ${count} ${type} Leads...`);
  
  for (let i = 0; i < count; i++) {
    try {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const premium = faker.number.float({ min: 800, max: 15000, fractionDigits: 2 });
      
      const leadData = {
        lead_type: type === 'Personal' ? 'Personal' : 'Commercial',
        priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
        current_carrier: faker.helpers.arrayElement([...INSURANCE_CARRIERS, null]),
        current_policy_expiry: faker.date.future({ years: 1 }).toISOString().split('T')[0],
        premium: premium.toString(),
        auto_premium: type === 'Personal' ? faker.number.float({ min: 600, max: 2000, fractionDigits: 2 }).toString() : null,
        home_premium: type === 'Personal' ? faker.number.float({ min: 800, max: 2500, fractionDigits: 2 }).toString() : null,
        commercial_premium: type === 'Commercial' ? premium.toString() : null,
        ai_summary: `${type === 'Personal' ? firstName + ' ' + lastName : faker.company.name()} is interested in ${faker.helpers.arrayElement(['auto', 'home', 'commercial', 'bundled'])} insurance.`,
        ai_next_action: faker.helpers.arrayElement([
          'Schedule follow-up call',
          'Send quote comparison',
          'Provide additional coverage options',
          'Address pricing concerns'
        ]),
        ai_follow_up_priority: faker.number.int({ min: 1, max: 5 }),
        ai_conversion_probability: faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }).toString(),
        notes: faker.lorem.paragraph(),
        source: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Social Media', 'Advertisement']),
        status: faker.helpers.arrayElement(VALID_LEAD_STATUSES),
        pipeline_id: type === 'Personal' ? 1 : 2,
        insurance_type_id: faker.number.int({ min: 1, max: 6 }),
        created_at: faker.date.recent({ days: 30 }).toISOString(),
        updated_at: faker.date.recent({ days: 7 }).toISOString()
      };
      
      await db.insert(leads).values(leadData);
      
      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/${count} ${type.toLowerCase()} leads`);
      }
    } catch (error) {
      console.error(`❌ Error inserting ${type.toLowerCase()} lead ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ ${type} leads seeded successfully`);
}

async function seedClients() {
  console.log('👥 Seeding 25 Converted Clients...');
  
  for (let i = 0; i < 25; i++) {
    try {
      const isIndividual = faker.datatype.boolean();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const companyName = faker.company.name();
      
      const clientData = {
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
        ai_summary: `${isIndividual ? 'Individual' : 'Business'} client with ${faker.helpers.arrayElement(['excellent', 'good', 'average'])} payment history.`,
        ai_next_action: faker.helpers.arrayElement([
          'Schedule annual policy review',
          'Discuss additional coverage options',
          'Process renewal documentation',
          'Conduct satisfaction survey'
        ]),
        ai_risk_score: faker.number.int({ min: 1, max: 100 }),
        ai_lifetime_value: faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
        
        // Use valid status values only
        status: faker.helpers.arrayElement(VALID_CLIENT_STATUSES),
        source: faker.helpers.arrayElement(['Lead Conversion', 'Referral', 'Existing Client Expansion']),
        created_at: faker.date.past({ years: 3 }).toISOString(),
        updated_at: faker.date.recent({ days: 30 }).toISOString(),
        last_contact_at: faker.date.recent({ days: 60 }).toISOString(),
        next_contact_at: faker.date.future({ days: 90 }).toISOString()
      };
      
      await db.insert(clients).values(clientData);
      
      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Inserted ${i + 1}/25 clients`);
      }
    } catch (error) {
      console.error(`❌ Error inserting client ${i + 1}:`, error.message);
    }
  }
  
  console.log('✅ Clients seeded successfully');
}

async function main() {
  try {
    console.log('🌱 Starting comprehensive test data seeding...\n');
    
    // Seed different types of leads and clients
    await seedLeads('Personal', 25);
    await seedLeads('Commercial', 25);
    await seedLeads('High Value', 25);
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
