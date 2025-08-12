#!/usr/bin/env node

/**
 * Database Validation Script
 * Checks the current state of the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  console.log('🔍 Checking existing tables...\n');
  
  try {
    // Query to get all tables in public schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.error('❌ Error querying tables:', error);
      return;
    }
    
    console.log('📋 Tables found in public schema:');
    if (data && data.length > 0) {
      data.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    } else {
      console.log('   No tables found');
    }
    
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
  }
}

async function checkMigrations() {
  console.log('\n🔍 Checking migration history...\n');
  
  try {
    // Check if migration table exists and get recent migrations
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT version, name, applied_at 
          FROM supabase_migrations.schema_migrations 
          ORDER BY version DESC 
          LIMIT 10;
        `
      });
    
    if (error) {
      console.log('⚠️  Could not query migration history:', error.message);
      return;
    }
    
    console.log('📋 Recent migrations:');
    if (data && data.length > 0) {
      data.forEach((migration, index) => {
        console.log(`   ${index + 1}. ${migration.version} - ${migration.name}`);
      });
    } else {
      console.log('   No migrations found');
    }
    
  } catch (error) {
    console.log('⚠️  Could not check migrations:', error.message);
  }
}

async function checkSpecificTables() {
  console.log('\n🔍 Checking key CRM tables...\n');
  
  const keyTables = [
    'users',
    'clients', 
    'leads',
    'addresses',
    'insurance_types',
    'pipelines',
    'pipeline_statuses',
    'communications',
    'ai_agents'
  ];
  
  for (const tableName of keyTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: Does not exist or no access`);
      } else {
        console.log(`✅ ${tableName}: Exists (${count || 0} rows)`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}: Error - ${error.message}`);
    }
  }
}

async function checkPipelineData() {
  console.log('\n🔍 Checking pipeline data specifically...\n');
  
  try {
    // Check pipelines table
    const { data: pipelines, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id, name');
    
    if (pipelineError) {
      console.log('❌ Pipelines table error:', pipelineError.message);
      return;
    }
    
    console.log('📋 Pipelines found:');
    if (pipelines && pipelines.length > 0) {
      pipelines.forEach(pipeline => {
        console.log(`   ID: ${pipeline.id}, Name: ${pipeline.name}`);
      });
    } else {
      console.log('   No pipelines found');
    }
    
    // Check pipeline_statuses table
    const { data: statuses, error: statusError } = await supabase
      .from('pipeline_statuses')
      .select('id, pipeline_id, name');
    
    if (statusError) {
      console.log('❌ Pipeline statuses table error:', statusError.message);
      return;
    }
    
    console.log('\n📋 Pipeline statuses found:');
    if (statuses && statuses.length > 0) {
      statuses.forEach(status => {
        console.log(`   ID: ${status.id}, Pipeline: ${status.pipeline_id}, Name: ${status.name}`);
      });
    } else {
      console.log('   No pipeline statuses found');
    }
    
  } catch (error) {
    console.log('❌ Error checking pipeline data:', error.message);
  }
}

async function main() {
  console.log('🚀 Database Validation Report');
  console.log('============================\n');
  console.log(`📍 Database: ${supabaseUrl}\n`);
  
  await checkTables();
  await checkMigrations();
  await checkSpecificTables();
  await checkPipelineData();
  
  console.log('\n✅ Validation complete!');
}

main().catch(error => {
  console.error('💥 Validation failed:', error);
  process.exit(1);
});
