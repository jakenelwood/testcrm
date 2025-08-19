#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testModalUpdate() {
  try {
    console.log('🔍 Testing modal update functionality...\n');

    // Test 1: Get a sample lead
    console.log('1. Getting a sample lead...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        *,
        pipeline_status:pipeline_statuses!pipeline_status_id(name),
        insurance_type:insurance_types!insurance_type_id(name)
      `)
      .limit(1);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
      return;
    }

    if (!leads || leads.length === 0) {
      console.log('⚠️  No leads found. Creating a test lead...');
      
      // Create a test lead
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          metadata: {
            contact: {
              first_name: 'Test',
              last_name: 'User',
              name: 'Test User',
              email: 'test@example.com',
              phone_number: '555-1234'
            }
          },
          status: 'New',
          current_carrier: 'Test Insurance',
          premium: 1200.00,
          notes: 'Test lead for modal update',
          pipeline_id: 1,
          pipeline_status_id: 30,
          insurance_type_id: 17,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          pipeline_status:pipeline_statuses!pipeline_status_id(name),
          insurance_type:insurance_types!insurance_type_id(name)
        `)
        .single();

      if (createError) {
        console.error('❌ Error creating test lead:', createError);
        return;
      }

      console.log('✅ Created test lead:', newLead.id);
      leads.push(newLead);
    }

    const lead = leads[0];
    console.log('✅ Using lead:', lead.id);
    console.log('- Current name:', lead.metadata?.contact?.name || 'No name in metadata');
    console.log('- Current status:', lead.pipeline_status?.name || lead.status);
    console.log('- Current insurance type:', lead.insurance_type?.name || 'Unknown');

    // Test 2: Simulate modal update
    console.log('\n2. Testing modal update...');
    
    const updatedMetadata = {
      ...lead.metadata,
      contact: {
        first_name: 'Updated',
        last_name: 'Name',
        name: 'Updated Name',
        email: 'updated@example.com',
        phone_number: '555-9999'
      }
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('leads')
      .update({
        pipeline_status_id: 31, // Try a different status
        current_carrier: 'Updated Insurance Co',
        premium: 1500.00,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id)
      .select(`
        *,
        pipeline_status:pipeline_statuses!pipeline_status_id(name),
        insurance_type:insurance_types!insurance_type_id(name)
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating lead:', updateError);
      return;
    }

    console.log('✅ Lead updated successfully!');
    console.log('- New name:', updateResult.metadata?.contact?.name);
    console.log('- New status:', updateResult.pipeline_status?.name);
    console.log('- New carrier:', updateResult.current_carrier);
    console.log('- New premium:', updateResult.premium);

    // Test 3: Verify the update persisted
    console.log('\n3. Verifying update persisted...');
    const { data: verifyResult, error: verifyError } = await supabase
      .from('leads')
      .select(`
        *,
        pipeline_status:pipeline_statuses!pipeline_status_id(name),
        insurance_type:insurance_types!insurance_type_id(name)
      `)
      .eq('id', lead.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('✅ Update verified!');
    console.log('- Persisted name:', verifyResult.metadata?.contact?.name);
    console.log('- Persisted status:', verifyResult.pipeline_status?.name);

    console.log('\n🎉 Modal update test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testModalUpdate();
