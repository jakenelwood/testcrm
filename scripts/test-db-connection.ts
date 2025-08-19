#!/usr/bin/env tsx

/**
 * 🔍 Database Connection Test
 *
 * This script tests the database connection and environment variables
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/drizzle/schema';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'test-connection'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.DATABASE_URL) {
    console.log(`\n🔗 Database URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
  }
  
  try {
    console.log('\n🔌 Testing raw postgres connection...');

    // Test raw postgres connection first
    const connectionString = process.env.DATABASE_URL!;
    console.log(`🔗 Connecting to: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);

    const sql_client = postgres(connectionString, {
      prepare: false,
      ssl: 'require',
      connection: {
        application_name: 'test-connection'
      }
    });

    const rawResult = await sql_client`SELECT version()`;
    console.log('✅ Raw postgres connection successful!');
    console.log(`📊 PostgreSQL version: ${rawResult[0]?.version || 'Unknown'}`);

    await sql_client.end();

    console.log('\n🔌 Testing Drizzle connection...');

    // Test basic connection
    const result = await db.execute(sql`SELECT version()`);
    console.log('✅ Drizzle connection successful!');
    console.log(`📊 PostgreSQL version: ${result[0]?.version || 'Unknown'}`);

    // Test table access
    console.log('\n🔍 Testing table access...');
    const tableResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`✅ Found ${tableResult.length} tables in public schema:`);
    tableResult.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });

    // Test leads table specifically
    console.log('\n🎯 Testing leads table...');
    const leadsCount = await db.execute(sql`SELECT COUNT(*) as count FROM leads`);
    console.log(`✅ Leads table accessible. Current count: ${leadsCount[0]?.count || 0}`);

    // Check pipelines table
    console.log('\n🔍 Checking pipelines table...');
    const pipelinesResult = await db.execute(sql`SELECT id, name FROM pipelines ORDER BY id`);
    console.log(`✅ Found ${pipelinesResult.length} pipelines:`);
    pipelinesResult.forEach((pipeline: any) => {
      console.log(`  - ID: ${pipeline.id}, Name: ${pipeline.name}`);
    });

    // Check insurance_types table
    console.log('\n🔍 Checking insurance_types table...');
    const insuranceTypesResult = await db.execute(sql`SELECT id, name FROM insurance_types ORDER BY id`);
    console.log(`✅ Found ${insuranceTypesResult.length} insurance types:`);
    insuranceTypesResult.forEach((type: any) => {
      console.log(`  - ID: ${type.id}, Name: ${type.name}`);
    });

    // Check lead_type constraint
    console.log('\n🔍 Checking lead_type constraint...');
    const constraintResult = await db.execute(sql`
      SELECT conname, consrc
      FROM pg_constraint
      WHERE conname = 'leads_lead_type_check'
    `);
    if (constraintResult.length > 0) {
      console.log(`✅ Found constraint: ${constraintResult[0].consrc}`);
    } else {
      console.log('❌ No lead_type constraint found');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testConnection();
}
