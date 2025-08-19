#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testModalUpdateFixed() {
  try {
    console.log('🔍 Testing fixed modal update functionality...\n');

    // Test 1: Get a sample lead
    console.log('1. Getting a sample lead...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        *,
        lead_status:lead_statuses!lead_status_id(value),
        insurance_type:insurance_types!insurance_type_id(name)
      `)
      .limit(1);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
      return;
    }

    if (!leads || leads.length === 0) {
      console.log('⚠️  No leads found');
      return;
    }

    const lead = leads[0];
    console.log('✅ Using lead:', lead.id);
    console.log('- Current name:', lead.metadata?.contact?.name || 'No name in metadata');
    console.log('- Current status:', lead.lead_status?.value || lead.status);
    console.log('- Current insurance type:', lead.insurance_type?.name || 'Unknown');
    console.log('- Current lead_status_id:', lead.lead_status_id);
    console.log('- Current insurance_type_id:', lead.insurance_type_id);

    // Test 2: Simulate modal update with correct IDs
    console.log('\n2. Testing modal update with correct field mapping...');
    
    const updatedMetadata = {
      ...lead.metadata,
      contact: {
        first_name: 'Fixed',
        last_name: 'Update',
        name: 'Fixed Update',
        email: 'fixed@example.com',
        phone_number: '555-FIXED'
      }
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('leads')
      .update({
        lead_status_id: 18, // "Contacted" status
        insurance_type_id: 18, // "Home" insurance
        current_carrier: 'Fixed Insurance Co',
        premium: 1800.00,
        metadata: updatedMetadata,
        status: 'Contacted', // Also update text status
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id)
      .select(`
        *,
        lead_status:lead_statuses!lead_status_id(value),
        insurance_type:insurance_types!insurance_type_id(name)
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating lead:', updateError);
      return;
    }

    console.log('✅ Lead updated successfully!');
    console.log('- New name:', updateResult.metadata?.contact?.name);
    console.log('- New status:', updateResult.lead_status?.value);
    console.log('- New insurance type:', updateResult.insurance_type?.name);
    console.log('- New carrier:', updateResult.current_carrier);
    console.log('- New premium:', updateResult.premium);

    // Test 3: Test the lead-api function
    console.log('\n3. Testing lead-api fetchLeadsWithRelations...');
    
    // Import and test the lead API function
    const { fetchLeadsWithRelations } = await import('../utils/lead-api');
    const apiLeads = await fetchLeadsWithRelations();
    
    if (apiLeads.length > 0) {
      console.log('✅ Lead API working correctly');
      const apiLead = apiLeads.find(l => l.id === lead.id);
      if (apiLead) {
        console.log('- API lead name:', apiLead.name);
        console.log('- API lead status:', apiLead.status);
        console.log('- API lead insurance type:', apiLead.insurance_type);
      }
    } else {
      console.log('⚠️  No leads returned from API');
    }

    console.log('\n🎉 Fixed modal update test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testModalUpdateFixed();
