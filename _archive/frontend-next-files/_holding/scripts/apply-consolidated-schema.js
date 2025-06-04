#!/usr/bin/env node

/**
 * Script to apply the consolidated schema to the Supabase database
 * 
 * This script:
 * 1. Connects to the Supabase database
 * 2. Executes the consolidated_schema.sql file
 * 3. Checks if the tables are empty
 * 4. If empty, executes the consolidated_test_data.sql file
 * 
 * Usage:
 * node scripts/apply-consolidated-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Supabase connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to SQL files
const schemaFilePath = path.join(__dirname, '..', 'supabase', 'consolidated_schema.sql');
const testDataFilePath = path.join(__dirname, '..', 'supabase', 'consolidated_test_data.sql');

// Read SQL files
const schemaSQL = fs.readFileSync(schemaFilePath, 'utf8');
const testDataSQL = fs.readFileSync(testDataFilePath, 'utf8');

// Function to execute SQL
async function executeSQL(sql, description) {
  console.log(`Executing ${description}...`);
  
  try {
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt.length === 0) continue;
      
      // Execute the statement
      const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}/${statements.length}:`, error);
        // Continue with the next statement
      } else {
        process.stdout.write('.');
      }
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
}

// Function to check if tables are empty
async function areTablesEmpty() {
  try {
    // Check if the leads table exists and is empty
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });
    
    if (leadsError) {
      // Table might not exist yet
      return true;
    }
    
    // If we got data and the count is 0, tables are empty
    return leadsData.length === 0;
  } catch (error) {
    console.error('Error checking if tables are empty:', error);
    return true; // Assume empty if there's an error
  }
}

// Main function
async function main() {
  try {
    // Execute schema SQL
    await executeSQL(schemaSQL, 'schema SQL');
    
    // Check if tables are empty
    const empty = await areTablesEmpty();
    
    if (empty) {
      console.log('Tables are empty. Applying test data...');
      await executeSQL(testDataSQL, 'test data SQL');
    } else {
      console.log('Tables already have data. Skipping test data insertion.');
    }
    
    console.log('Schema and test data applied successfully!');
  } catch (error) {
    console.error('Error applying schema and test data:', error);
  }
}

// Run the main function
main();
