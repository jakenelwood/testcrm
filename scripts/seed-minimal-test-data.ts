#!/usr/bin/env tsx

/**
 * 🌱 Minimal Test Data Seeder for Insurance CRM
 * 
 * This script populates the database with basic test data using minimal fields
 * and letting the database handle defaults where possible.
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
    application_name: 'seed-minimal-data'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

// Valid statuses based on database constraints
const VALID_LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated'];
const VALID_CLIENT_STATUSES = ['Active', 'Inactive', 'Prospect', 'Lost'];

async function seedMinimalLeads() {
  console.log('🏠 Seeding 25 Personal Insurance Leads...');
  
  for (let i = 0; i < 25; i++) {
    try {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      const leadData = {
        lead_type: 'Personal',
        priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
        current_carrier: faker.helpers.arrayElement(['State Farm', 'Allstate', 'GEICO', 'Progressive']),
        premium: faker.number.float({ min: 800, max: 3500, fractionDigits: 2 }).toString(),
        ai_summary: `${firstName} ${lastName} is interested in auto insurance coverage.`,
        notes: `Initial contact with ${firstName} ${lastName}. Interested in competitive rates.`,
        source: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Social Media']),
        status: faker.helpers.arrayElement(VALID_LEAD_STATUSES),
        pipeline_id: 1,
        insurance_type_id: faker.number.int({ min: 1, max: 3 })
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
      
      const leadData = {
        lead_type: 'Commercial',
        priority: faker.helpers.arrayElement(['Medium', 'High']),
        current_carrier: faker.helpers.arrayElement(['State Farm', 'Allstate', 'Liberty Mutual', 'Travelers']),
        premium: faker.number.float({ min: 5000, max: 25000, fractionDigits: 2 }).toString(),
        commercial_premium: faker.number.float({ min: 5000, max: 25000, fractionDigits: 2 }).toString(),
        ai_summary: `${companyName} is seeking comprehensive commercial insurance coverage.`,
        notes: `Commercial prospect ${companyName}. Needs liability and property coverage.`,
        source: faker.helpers.arrayElement(['Broker Referral', 'Website', 'Trade Show', 'Networking']),
        status: faker.helpers.arrayElement(VALID_LEAD_STATUSES),
        pipeline_id: 2,
        insurance_type_id: faker.number.int({ min: 4, max: 6 })
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
      
      const leadData = {
        lead_type: isPersonal ? 'Personal' : 'Commercial',
        priority: 'High',
        current_carrier: faker.helpers.arrayElement(['State Farm', 'Allstate', 'USAA', 'Nationwide']),
        premium: faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 }).toString(),
        specialty_premium: faker.number.float({ min: 5000, max: 15000, fractionDigits: 2 }).toString(),
        ai_summary: `High-value ${isPersonal ? 'individual' : 'commercial'} prospect ${name} with significant assets.`,
        notes: `Premium prospect requiring specialized coverage and white-glove service.`,
        source: faker.helpers.arrayElement(['Referral', 'Private Banking', 'Wealth Manager']),
        status: faker.helpers.arrayElement(['New', 'Contacted', 'Qualified']),
        pipeline_id: faker.number.int({ min: 1, max: 2 }),
        insurance_type_id: faker.number.int({ min: 1, max: 6 }),
        tags: ['High Value', 'VIP', 'Specialty Coverage']
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

async function seedMinimalClients() {
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
        ...(isIndividual && {
          date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
          gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
          marital_status: faker.helpers.arrayElement(['Single', 'Married', 'Divorced', 'Widowed']),
          drivers_license: faker.string.alphanumeric(10).toUpperCase(),
          license_state: faker.location.state({ abbreviated: true }),
          education_occupation: faker.person.jobTitle()
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
        tags: faker.helpers.arrayElements(['VIP Client', 'Multi-Policy', 'Long-term Client'], { min: 0, max: 2 })
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
    console.log('🌱 Starting minimal test data seeding...\n');
    
    // Seed different types of leads and clients
    await seedMinimalLeads();
    await seedCommercialLeads();
    await seedHighValueLeads();
    await seedMinimalClients();
    
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
