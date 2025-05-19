// Script to apply the RingCentral tokens table fix
// Run with: node scripts/apply-ringcentral-fix.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('Starting RingCentral tokens table fix migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250519_fix_ringcentral_tokens.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('Migration applied successfully!');
    console.log('The RingCentral tokens table has been fixed.');
    console.log('You should now be able to use RingCentral calling functionality again.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
