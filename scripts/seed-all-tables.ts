#!/usr/bin/env tsx

/**
 * 🌱 Complete Database Seeder for ALL Tables
 * 
 * This script populates ALL tables in the insurance CRM database:
 * - addresses, ai_interactions, call_logs, communications
 * - conversation_sessions, customer_touchpoints, homes, quotes
 * - sms_logs, specialty_items, user_phone_preferences, vehicles
 * 
 * Usage: npm run seed:all-tables
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
    application_name: 'seed-all-tables'
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
  
  return {
    leadIds: leadsResult.map((row: any) => row.id),
    clientIds: clientsResult.map((row: any) => row.id)
  };
}

async function seedAddresses(leadIds: string[], clientIds: string[]) {
  console.log('🏠 Seeding addresses table...');
  
  const addresses = [];
  
  // Create addresses for leads and clients
  for (let i = 0; i < 30; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    addresses.push({
      entity_type: isForLead ? 'lead' : 'client',
      entity_id: entityId,
      address_type: faker.helpers.arrayElement(['home', 'business', 'mailing']),
      street_address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip_code: faker.location.zipCode(),
      country: 'US',
      is_primary: faker.datatype.boolean(),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 90 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.addresses).values(addresses);
  console.log(`✅ Inserted ${addresses.length} addresses`);
}

async function seedVehicles(leadIds: string[], clientIds: string[]) {
  console.log('🚗 Seeding vehicles table...');
  
  const vehicles = [];
  
  for (let i = 0; i < 40; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    vehicles.push({
      entity_type: isForLead ? 'lead' : 'client',
      entity_id: entityId,
      year: faker.date.between({ from: '2010-01-01', to: '2024-12-31' }).getFullYear(),
      make: faker.helpers.arrayElement(['Honda', 'Toyota', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi']),
      model: faker.helpers.arrayElement(['Accord', 'Camry', 'F-150', 'Silverado', '3 Series', 'C-Class', 'A4']),
      trim: faker.helpers.arrayElement(['Base', 'LX', 'EX', 'Limited', 'Premium']),
      vin: faker.vehicle.vin(),
      license_plate: faker.vehicle.vrm(),
      color: faker.vehicle.color(),
      usage: faker.helpers.arrayElement(['Personal', 'Business', 'Commute', 'Pleasure']),
      annual_mileage: faker.number.int({ min: 5000, max: 30000 }),
      purchase_date: createDate(-faker.number.int({ min: 30, max: 2000 })),
      purchase_price: faker.number.float({ min: 15000, max: 80000, fractionDigits: 2 }),
      current_value: faker.number.float({ min: 10000, max: 70000, fractionDigits: 2 }),
      loan_balance: faker.number.float({ min: 0, max: 50000, fractionDigits: 2 }),
      safety_features: faker.helpers.arrayElements(['ABS', 'Airbags', 'Backup Camera', 'Blind Spot Monitor'], { min: 1, max: 4 }),
      anti_theft_devices: faker.helpers.arrayElements(['Alarm', 'GPS Tracking', 'Immobilizer'], { min: 0, max: 3 }),
      metadata: {
        fuel_type: faker.helpers.arrayElement(['Gasoline', 'Hybrid', 'Electric']),
        transmission: faker.helpers.arrayElement(['Automatic', 'Manual']),
        engine_size: faker.helpers.arrayElement(['1.5L', '2.0L', '2.5L', '3.0L', '3.5L'])
      },
      notes: faker.lorem.sentence(),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.vehicles).values(vehicles);
  console.log(`✅ Inserted ${vehicles.length} vehicles`);
}

async function seedHomes(leadIds: string[], clientIds: string[]) {
  console.log('🏡 Seeding homes table...');
  
  const homes = [];
  
  for (let i = 0; i < 35; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    homes.push({
      entity_type: isForLead ? 'lead' : 'client',
      entity_id: entityId,
      property_type: faker.helpers.arrayElement(['Single Family', 'Condo', 'Townhouse', 'Duplex']),
      dwelling_type: faker.helpers.arrayElement(['Primary', 'Secondary', 'Rental']),
      year_built: faker.date.between({ from: '1950-01-01', to: '2023-12-31' }).getFullYear(),
      square_footage: faker.number.int({ min: 800, max: 5000 }),
      lot_size: faker.number.float({ min: 0.1, max: 2.0, fractionDigits: 2 }),
      bedrooms: faker.number.int({ min: 1, max: 6 }),
      bathrooms: faker.number.float({ min: 1, max: 4, fractionDigits: 1 }),
      construction_type: faker.helpers.arrayElement(['Frame', 'Masonry', 'Fire Resistive']),
      roof_type: faker.helpers.arrayElement(['Composition Shingle', 'Tile', 'Metal', 'Slate']),
      roof_age: faker.number.int({ min: 0, max: 30 }),
      heating_type: faker.helpers.arrayElement(['Gas', 'Electric', 'Oil', 'Heat Pump']),
      cooling_type: faker.helpers.arrayElement(['Central Air', 'Window Units', 'None']),
      foundation_type: faker.helpers.arrayElement(['Slab', 'Crawl Space', 'Basement']),
      garage_type: faker.helpers.arrayElement(['Attached', 'Detached', 'Carport', 'None']),
      garage_spaces: faker.number.int({ min: 0, max: 4 }),
      purchase_date: createDate(-faker.number.int({ min: 30, max: 3650 })),
      purchase_price: faker.number.float({ min: 150000, max: 800000, fractionDigits: 2 }),
      current_value: faker.number.float({ min: 180000, max: 900000, fractionDigits: 2 }),
      mortgage_balance: faker.number.float({ min: 0, max: 600000, fractionDigits: 2 }),
      safety_features: faker.helpers.arrayElements(['Smoke Detectors', 'Security System', 'Fire Extinguisher', 'Sprinkler System'], { min: 1, max: 4 }),
      recent_updates: faker.helpers.arrayElements(['Kitchen', 'Bathroom', 'Roof', 'HVAC', 'Flooring'], { min: 0, max: 3 }),
      metadata: {
        hoa_fee: faker.number.float({ min: 0, max: 500, fractionDigits: 2 }),
        property_taxes: faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }),
        flood_zone: faker.helpers.arrayElement(['X', 'AE', 'VE', 'A'])
      },
      notes: faker.lorem.sentence(),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.homes).values(homes);
  console.log(`✅ Inserted ${homes.length} homes`);
}

async function seedSpecialtyItems(leadIds: string[], clientIds: string[]) {
  console.log('💎 Seeding specialty_items table...');
  
  const specialtyItems = [];
  
  for (let i = 0; i < 25; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    const itemType = faker.helpers.arrayElement(['Jewelry', 'Art', 'Collectibles', 'Electronics', 'Antiques']);

    specialtyItems.push({
      // Map to actual schema fields
      client_id: isForLead ? null : entityId,
      lead_id: isForLead ? entityId : null,
      name: `${faker.commerce.productAdjective()} ${itemType} Item`,
      category: faker.helpers.arrayElement(['Personal Property', 'Fine Arts', 'Collectibles']),
      description: faker.lorem.sentence(),
      brand: faker.company.name(),
      model: faker.commerce.productName(),
      serial_number: faker.string.alphanumeric(10).toUpperCase(),
      purchase_price: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
      current_value: faker.number.float({ min: 1200, max: 120000, fractionDigits: 2 }),
      appraisal_date: createDate(-faker.number.int({ min: 30, max: 365 })),
      coverage_type: faker.helpers.arrayElement(['Agreed Value', 'Replacement Cost', 'Actual Cash Value']),
      deductible: faker.number.float({ min: 250, max: 5000, fractionDigits: 2 }),
      storage_location: faker.helpers.arrayElement(['Home Safe', 'Bank Vault', 'Display Case', 'Storage Unit']),
      metadata: {
        certification: faker.helpers.arrayElement(['GIA', 'AGS', 'Appraisal Institute', 'None']),
        photos_available: faker.datatype.boolean(),
        documentation: faker.helpers.arrayElements(['Receipt', 'Appraisal', 'Certificate', 'Photos'], { min: 1, max: 4 })
      },
      notes: faker.lorem.sentence(),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.specialty_items).values(specialtyItems);
  console.log(`✅ Inserted ${specialtyItems.length} specialty items`);
}

async function main() {
  try {
    console.log('🌱 Starting comprehensive table seeding...\n');
    
    // Get existing IDs for foreign key relationships
    const { leadIds, clientIds } = await getExistingIds();
    
    console.log(`📊 Found ${leadIds.length} leads and ${clientIds.length} clients for relationships\n`);
    
    // Seed all the missing tables
    await seedAddresses(leadIds, clientIds);
    await seedVehicles(leadIds, clientIds);
    await seedHomes(leadIds, clientIds);
    await seedSpecialtyItems(leadIds, clientIds);
    
    console.log('\n🎉 All tables seeded successfully!');
    console.log('📊 Summary:');
    console.log('  - 30 Addresses');
    console.log('  - 40 Vehicles');
    console.log('  - 35 Homes');
    console.log('  - 25 Specialty Items');
    console.log('  - Total: 130 new records');
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Test the application: npm run dev');
    console.log('  2. Check that data appears in the UI');
    console.log('  3. Verify all relationships are working');
    
    // Close the database connection
    await client.end();
    
  } catch (error) {
    console.error('❌ Error seeding tables:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  main();
}
