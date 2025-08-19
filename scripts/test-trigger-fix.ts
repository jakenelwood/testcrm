#!/usr/bin/env tsx

/**
 * 🧪 Test Trigger Fix
 * 
 * Tests that the fixed trigger now works correctly without constraint violations.
 * Creates a test call log and verifies the communication record is created with 'Delivered' status.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import * as schema from '../lib/drizzle/schema';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });
const db = drizzle(sql, { schema });

class TriggerFixTester {
  async run() {
    console.log('🧪 Testing Trigger Fix...\n');
    
    try {
      await this.testTriggerFix();
      console.log('✅ Trigger fix test completed successfully!');
      
    } catch (error) {
      console.error('❌ Trigger fix test failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async testTriggerFix() {
    console.log('🔧 Testing create_communication_from_call_log trigger...');
    
    // First, get a test user ID
    const users = await sql`SELECT id FROM users LIMIT 1`;
    if (users.length === 0) {
      console.log('   ⚠️  No users found - creating test user...');
      await sql`
        INSERT INTO users (id, email, full_name, role) 
        VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'user')
      `;
      const newUsers = await sql`SELECT id FROM users WHERE email = 'test@example.com'`;
      var userId = newUsers[0].id;
    } else {
      var userId = users[0].id;
    }

    // Get a test lead ID
    const leads = await sql`SELECT id FROM leads LIMIT 1`;
    if (leads.length === 0) {
      console.log('   ⚠️  No leads found - creating test lead...');
      await sql`
        INSERT INTO leads (id, first_name, last_name, email, phone_number, status, lead_type, created_by) 
        VALUES (gen_random_uuid(), 'Test', 'Lead', 'testlead@example.com', '+1234567890', 'New', 'Personal', ${userId})
      `;
      const newLeads = await sql`SELECT id FROM leads WHERE email = 'testlead@example.com'`;
      var leadId = newLeads[0].id;
    } else {
      var leadId = leads[0].id;
    }

    console.log('   📞 Creating test call log...');
    
    // Create a test call log that should trigger communication creation
    const testCallId = `test-call-${Date.now()}`;
    
    await sql`
      INSERT INTO call_logs (
        id,
        ringcentral_call_id,
        user_id,
        lead_id,
        direction,
        status,
        from_number,
        to_number,
        start_time,
        end_time,
        duration,
        transcription
      ) VALUES (
        gen_random_uuid(),
        ${testCallId},
        ${userId},
        ${leadId},
        'Outbound',
        'Connected',
        '+1234567890',
        '+0987654321',
        NOW() - INTERVAL '5 minutes',
        NOW(),
        300,
        'Test call transcription'
      )
    `;
    
    console.log('   ✅ Test call log created');
    
    // Check if communication record was created with correct status
    console.log('   🔍 Checking if communication record was created...');
    
    const communications = await sql`
      SELECT id, status, type, content 
      FROM communications 
      WHERE lead_id = ${leadId} 
      AND type = 'call'
      AND content LIKE '%Test call transcription%'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (communications.length === 0) {
      throw new Error('No communication record was created by the trigger');
    }
    
    const communication = communications[0];
    console.log(`   📋 Communication record found: ${communication.id}`);
    console.log(`   📊 Status: ${communication.status}`);
    console.log(`   📝 Type: ${communication.type}`);
    
    if (communication.status === 'Delivered') {
      console.log('   ✅ Trigger fix successful - status is "Delivered"');
    } else {
      throw new Error(`Expected status "Delivered" but got "${communication.status}"`);
    }
    
    // Clean up test data
    console.log('   🧹 Cleaning up test data...');
    await sql`DELETE FROM communications WHERE id = ${communication.id}`;
    await sql`DELETE FROM call_logs WHERE ringcentral_call_id = ${testCallId}`;
    
    // Only delete test data if we created it
    const testUser = await sql`SELECT id FROM users WHERE email = 'test@example.com'`;
    if (testUser.length > 0) {
      await sql`DELETE FROM leads WHERE email = 'testlead@example.com'`;
      await sql`DELETE FROM users WHERE email = 'test@example.com'`;
    }
    
    console.log('   ✅ Test data cleaned up');
  }
}

// Run the test
if (require.main === module) {
  const tester = new TriggerFixTester();
  tester.run().catch(console.error);
}

export { TriggerFixTester };
