#!/usr/bin/env tsx

/**
 * Test script for Drizzle setup
 * This script helps verify that Drizzle is properly configured with Supabase
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testDrizzleSetup() {
  console.log('🔍 Testing Drizzle Setup...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

  if (!process.env.DATABASE_URL) {
    console.log('\n⚠️  DATABASE_URL is not set!');
    console.log('\n📝 To get your DATABASE_URL from Supabase:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Settings > Database');
    console.log('3. Look for "Connection string" section');
    console.log('4. Copy the "URI" connection string');
    console.log('5. Add it to your .env.local file as DATABASE_URL=your_connection_string');
    console.log('\n💡 The format should be:');
    console.log('DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres');
    return;
  }

  try {
    // Test Drizzle connection
    console.log('\n🔌 Testing Drizzle connection...');
    
    // Dynamic import to avoid issues if DATABASE_URL is not set
    const { db } = await import('../lib/drizzle/client');
    
    // Test basic query
    const result = await db.execute('SELECT version()');
    console.log('✅ Drizzle connection successful!');

    // Handle different result structures
    const versionRow = Array.isArray(result) ? result[0] : result.rows?.[0];
    const version = versionRow?.version || 'Unknown';
    console.log('📊 PostgreSQL version:', version.split(' ')[0] || 'Unknown');

    // Test schema introspection
    console.log('\n🔍 Testing schema introspection...');
    const tables = await db.execute(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Handle different result structures
    const tableRows = Array.isArray(tables) ? tables : tables.rows || [];
    console.log(`✅ Found ${tableRows.length} tables in public schema:`);
    tableRows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Drizzle connection failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your DATABASE_URL is correct');
    console.log('2. Make sure your Supabase project is running');
    console.log('3. Check that your database password is correct');
    console.log('4. Ensure your IP is whitelisted in Supabase (if applicable)');
  }
}

// Run the test
testDrizzleSetup().catch(console.error);
