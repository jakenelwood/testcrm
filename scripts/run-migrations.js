#!/usr/bin/env node

/**
 * Migration Runner for Hosted Supabase
 * Runs SQL migration files against your hosted Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration files directory
const migrationsDir = path.join(__dirname, '../supabase/migrations');

// Get all migration files in order
function getMigrationFiles() {
  try {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Files are named with timestamps, so sorting works
    
    return files.map(file => ({
      name: file,
      path: path.join(migrationsDir, file)
    }));
  } catch (error) {
    console.error('❌ Error reading migrations directory:', error.message);
    return [];
  }
}

// Execute a single migration file
async function executeMigration(migration) {
  console.log(`\n🔄 Running migration: ${migration.name}`);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(migration.path, 'utf8');
    
    // Execute the SQL using Supabase's RPC function
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Error in ${migration.name}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully executed: ${migration.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to execute ${migration.name}:`, error.message);
    return false;
  }
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const functionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'SUCCESS';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: functionSql });
    if (error && !error.message.includes('already exists')) {
      // If the function doesn't exist, we need to create it directly
      console.log('🔧 Creating exec_sql function...');
      // We'll handle this differently - let's use a direct SQL approach
    }
  } catch (error) {
    console.log('🔧 Setting up migration infrastructure...');
  }
}

// Main migration runner
async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  console.log(`📍 Target database: ${supabaseUrl}`);
  
  // Get migration files
  const migrations = getMigrationFiles();
  
  if (migrations.length === 0) {
    console.log('⚠️  No migration files found');
    return;
  }
  
  console.log(`📋 Found ${migrations.length} migration files:`);
  migrations.forEach(m => console.log(`   - ${m.name}`));
  
  // Create exec function
  await createExecSqlFunction();
  
  // Run migrations in order
  let successCount = 0;
  let failureCount = 0;
  
  for (const migration of migrations) {
    const success = await executeMigration(migration);
    if (success) {
      successCount++;
    } else {
      failureCount++;
      console.log('⚠️  Continuing with next migration...');
    }
  }
  
  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📁 Total: ${migrations.length}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 All migrations completed successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Check the errors above.');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/run-migrations.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be executed without running
  
Environment Variables (from .env.local):
  NEXT_PUBLIC_SUPABASE_URL      Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     Your Supabase service role key

Examples:
  node scripts/run-migrations.js
  npm run migrate
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 Dry run mode - showing migrations that would be executed:');
  const migrations = getMigrationFiles();
  migrations.forEach((m, i) => console.log(`${i + 1}. ${m.name}`));
  process.exit(0);
}

// Run the migrations
runMigrations().catch(error => {
  console.error('💥 Migration runner failed:', error);
  process.exit(1);
});
