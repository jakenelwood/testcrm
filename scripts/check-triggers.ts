#!/usr/bin/env tsx

/**
 * 🔍 Check Database Triggers
 * 
 * This script checks the database triggers to understand what's causing the constraint violation.
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
    application_name: 'check-triggers'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client);

async function checkTriggers() {
  try {
    console.log('🔍 Checking database triggers...\n');
    
    // Check triggers on call_logs table
    console.log('📱 Call logs table triggers:');
    const callLogsTriggers = await db.execute(sql`
      SELECT 
        t.tgname as trigger_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE t.tgrelid = 'call_logs'::regclass
    `);
    
    callLogsTriggers.forEach((trigger: any) => {
      console.log(`\n🔧 Trigger: ${trigger.trigger_name}`);
      console.log(`📋 Function: ${trigger.function_name}`);
      console.log(`📝 Definition:\n${trigger.function_definition}`);
    });
    
    // Check triggers on communications table
    console.log('\n📞 Communications table triggers:');
    const communicationsTriggers = await db.execute(sql`
      SELECT 
        t.tgname as trigger_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE t.tgrelid = 'communications'::regclass
    `);
    
    communicationsTriggers.forEach((trigger: any) => {
      console.log(`\n🔧 Trigger: ${trigger.trigger_name}`);
      console.log(`📋 Function: ${trigger.function_name}`);
      console.log(`📝 Definition:\n${trigger.function_definition}`);
    });
    
    // Check all functions that contain 'communication' in their name
    console.log('\n🔍 Functions containing "communication":');
    const communicationFunctions = await db.execute(sql`
      SELECT 
        proname as function_name,
        pg_get_functiondef(oid) as function_definition
      FROM pg_proc 
      WHERE proname ILIKE '%communication%'
    `);
    
    communicationFunctions.forEach((func: any) => {
      console.log(`\n📋 Function: ${func.function_name}`);
      console.log(`📝 Definition:\n${func.function_definition}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking triggers:', error);
  } finally {
    await client.end();
  }
}

// Run the check
if (require.main === module) {
  checkTriggers();
}
