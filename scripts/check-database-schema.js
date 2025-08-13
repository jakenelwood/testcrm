#!/usr/bin/env node

// Simple script to check database schema using Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');

  // List of tables we expect to exist
  const expectedTables = [
    'leads_ins_info',
    'leads_contact_info', 
    'pipelines',
    'pipeline_statuses',
    'addresses',
    'insurance_types',
    'lead_statuses',
    'users',
    'clients',
    'leads'
  ];

  console.log('📋 Checking table existence:');
  const tableStatus = {};
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        tableStatus[tableName] = `❌ Error: ${error.message}`;
      } else {
        tableStatus[tableName] = `✅ Exists (${data.length} sample records)`;
      }
    } catch (err) {
      tableStatus[tableName] = `❌ Error: ${err.message}`;
    }
  }

  // Print results
  for (const [table, status] of Object.entries(tableStatus)) {
    console.log(`  ${table}: ${status}`);
  }

  // Try to get actual table list using information_schema
  console.log('\n📊 Attempting to get full table list...');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.log(`❌ Could not query information_schema: ${error.message}`);
    } else {
      console.log('✅ Tables found in public schema:');
      data.forEach(row => console.log(`  - ${row.table_name}`));
    }
  } catch (err) {
    console.log(`❌ Error querying information_schema: ${err.message}`);
  }

  // Check pipelines specifically
  console.log('\n🔧 Checking pipelines data...');
  try {
    const { data, error } = await supabase
      .from('pipelines')
      .select('id, name, description')
      .order('id');

    if (error) {
      console.log(`❌ Error querying pipelines: ${error.message}`);
    } else {
      console.log(`✅ Found ${data.length} pipelines:`);
      data.forEach(pipeline => {
        console.log(`  - ID ${pipeline.id}: ${pipeline.name}`);
      });
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

checkDatabaseSchema().catch(console.error);
