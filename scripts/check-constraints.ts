#!/usr/bin/env tsx

/**
 * 🔍 Check Database Constraints
 * 
 * This script checks the database constraints to understand what values are allowed.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'check-constraints'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client);

async function checkConstraints() {
  try {
    console.log('🔍 Checking database constraints...\n');
    
    // Check communications table constraints
    console.log('📞 Communications table constraints:');
    const communicationsConstraints = await db.execute(sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'communications'::regclass
    `);
    
    communicationsConstraints.forEach((constraint: any) => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });
    
    // Check call_logs table constraints
    console.log('\n📱 Call logs table constraints:');
    const callLogsConstraints = await db.execute(sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'call_logs'::regclass
    `);
    
    callLogsConstraints.forEach((constraint: any) => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });
    
    // Check sms_logs table constraints
    console.log('\n💬 SMS logs table constraints:');
    const smsLogsConstraints = await db.execute(sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'sms_logs'::regclass
    `);
    
    smsLogsConstraints.forEach((constraint: any) => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  } finally {
    await client.end();
  }
}

// Run the check
if (require.main === module) {
  checkConstraints();
}
