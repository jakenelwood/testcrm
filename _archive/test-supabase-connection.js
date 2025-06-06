// Simple script to test Supabase connection and list tables
require('dotenv').config({ path: './frontend-next-files/.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test connection by running a simple query
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Tables in the database:', data);
    
    // Check if leads table exists
    if (data && data.includes('leads')) {
      console.log('Leads table exists. Fetching sample data...');
      
      // Fetch a sample of leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .limit(5);
      
      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      } else {
        console.log('Sample leads data:', JSON.stringify(leadsData, null, 2));
      }
    } else {
      console.log('Leads table does not exist. You may need to create it.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
