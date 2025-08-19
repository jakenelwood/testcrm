#!/usr/bin/env tsx

/**
 * 🌱 Quotes Table Seeder
 * 
 * This script populates the quotes table with sample insurance quotes.
 * 
 * Usage: npm run seed:quotes
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/drizzle/schema';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'seed-quotes'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

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

// Get existing lead and client IDs for foreign key relationships
async function getExistingIds() {
  const leadsResult = await db.execute(sql`SELECT id FROM leads LIMIT 50`);
  const clientsResult = await db.execute(sql`SELECT id FROM clients LIMIT 25`);
  const usersResult = await db.execute(sql`SELECT id FROM users LIMIT 10`);
  
  return {
    leadIds: leadsResult.map((row: any) => row.id),
    clientIds: clientsResult.map((row: any) => row.id),
    userIds: usersResult.map((row: any) => row.id)
  };
}

async function seedQuotes(leadIds: string[], clientIds: string[], userIds: string[]) {
  console.log('💰 Seeding quotes table...');
  
  const quotes = [];
  
  for (let i = 0; i < 45; i++) {
    // Quotes are only for leads, not clients (based on schema)
    const leadId = faker.helpers.arrayElement(leadIds);

    const quoteType = faker.helpers.arrayElement(['Auto', 'Home', 'Life', 'Business', 'Umbrella']);
    const baseAmount = faker.number.float({ min: 500, max: 5000, fractionDigits: 2 });

    quotes.push({
      // Map to actual schema fields - quotes are only for leads
      lead_id: leadId,
      quote_number: `Q${faker.date.recent().getFullYear()}-${faker.string.alphanumeric(8).toUpperCase()}`,
      carrier: faker.helpers.arrayElement(['State Farm', 'Allstate', 'GEICO', 'Progressive', 'Farmers', 'Liberty Mutual']),
      status: faker.helpers.arrayElement(['Draft', 'Pending', 'Approved', 'Declined', 'Expired']),
      effective_date: createDate(faker.number.int({ min: 1, max: 90 })),
      expiration_date: createDate(faker.number.int({ min: 91, max: 455 })),
      paid_in_full_amount: baseAmount,
      monthly_payment_amount: faker.number.float({ min: baseAmount * 0.08, max: baseAmount * 0.12, fractionDigits: 2 }),
      down_payment_amount: faker.number.float({ min: 0, max: baseAmount * 0.25, fractionDigits: 2 }),
      contract_term: faker.helpers.arrayElement(['6 months', '12 months', '24 months']),
      coverage_details: {
        coverage_type: faker.helpers.arrayElement(['Liability', 'Comprehensive', 'Collision', 'Full Coverage']),
        discounts: faker.helpers.arrayElements(['Multi-Policy', 'Safe Driver', 'Good Student', 'Anti-Theft', 'Defensive Driving'], { min: 0, max: 3 })
      },
      limits: {
        bodily_injury: faker.helpers.arrayElement(['25/50', '50/100', '100/300', '250/500']),
        property_damage: faker.helpers.arrayElement(['25', '50', '100', '250']),
        comprehensive: faker.number.float({ min: 10000, max: 100000, fractionDigits: 0 }),
        collision: faker.number.float({ min: 10000, max: 100000, fractionDigits: 0 })
      },
      deductibles: {
        comprehensive: faker.helpers.arrayElement([250, 500, 1000, 2500]),
        collision: faker.helpers.arrayElement([250, 500, 1000, 2500])
      },
      competitor_quotes: [
        {
          carrier: faker.helpers.arrayElement(['State Farm', 'Allstate', 'GEICO', 'Progressive']),
          amount: faker.number.float({ min: baseAmount * 0.8, max: baseAmount * 1.2, fractionDigits: 2 })
        }
      ],
      savings_amount: faker.number.float({ min: 0, max: baseAmount * 0.3, fractionDigits: 2 }),
      savings_percentage: faker.number.float({ min: 0, max: 30, fractionDigits: 2 }),
      ai_recommendation: faker.lorem.sentence(),
      ai_risk_assessment: {
        risk_score: faker.number.int({ min: 1, max: 10 }),
        risk_factors: faker.helpers.arrayElements(['Young Driver', 'High Mileage', 'Urban Area', 'Previous Claims', 'Credit Score'], { min: 0, max: 3 })
      },
      ai_pricing_factors: {
        base_rate: faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 3 }),
        risk_multiplier: faker.number.float({ min: 0.9, max: 1.5, fractionDigits: 3 }),
        discount_factor: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 3 })
      },
      metadata: {
        source: faker.helpers.arrayElement(['Online', 'Phone', 'In-Person', 'Email']),
        referral_source: faker.helpers.arrayElement(['Website', 'Agent', 'Referral', 'Advertisement']),
        quote_version: faker.number.int({ min: 1, max: 5 }),
        calculation_method: faker.helpers.arrayElement(['Standard', 'Enhanced', 'Custom'])
      },
      notes: faker.lorem.paragraph(),
      created_by: faker.helpers.arrayElement(userIds),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.quotes).values(quotes);
  console.log(`✅ Inserted ${quotes.length} quotes`);
}

async function main() {
  try {
    console.log('🌱 Starting quotes table seeding...\n');
    
    // Get existing IDs for foreign key relationships
    const { leadIds, clientIds, userIds } = await getExistingIds();
    
    console.log(`📊 Found ${leadIds.length} leads, ${clientIds.length} clients, and ${userIds.length} users for relationships\n`);
    
    // Seed the quotes table
    await seedQuotes(leadIds, clientIds, userIds);
    
    console.log('\n🎉 Quotes table seeded successfully!');
    console.log('📊 Summary:');
    console.log('  - 45 Quotes');
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Test the application: npm run dev');
    console.log('  2. Check that data appears in the UI');
    console.log('  3. Verify all relationships are working');
    
    // Close the database connection
    await client.end();
    
  } catch (error) {
    console.error('❌ Error seeding quotes table:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  main();
}
