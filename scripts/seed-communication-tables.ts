#!/usr/bin/env tsx

/**
 * 🌱 Communication & Interaction Tables Seeder
 * 
 * This script populates the remaining communication and interaction tables:
 * - ai_interactions, call_logs, communications, conversation_sessions
 * - customer_touchpoints, sms_logs, user_phone_preferences, quotes
 * 
 * Usage: npm run seed:communication-tables
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/drizzle/schema';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'seed-communication-tables'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

// Helper function to create proper Date objects for timestamp fields
function createTimestamp(daysOffset: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

// Get existing lead and client IDs for foreign key relationships
async function getExistingIds() {
  const leadsResult = await db.execute(sql`SELECT id FROM leads LIMIT 50`);
  const clientsResult = await db.execute(sql`SELECT id FROM clients LIMIT 25`);
  const usersResult = await db.execute(sql`SELECT id FROM users LIMIT 10`);
  
  return {
    leadIds: leadsResult.map((row: any) => row.id),
    clientIds: clientsResult.map((row: any) => row.id),
    userIds: usersResult.map((row: any) => row.id)
  };
}

async function seedCommunications(leadIds: string[], clientIds: string[], userIds: string[]) {
  console.log('📞 Seeding communications table...');
  
  const communications = [];
  
  for (let i = 0; i < 50; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    communications.push({
      // Map to actual schema fields
      client_id: isForLead ? null : entityId,
      lead_id: isForLead ? entityId : null,
      type: faker.helpers.arrayElement(['email', 'call', 'sms', 'meeting', 'note']),
      direction: faker.helpers.arrayElement(['Inbound', 'Outbound']),
      subject: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      status: faker.helpers.arrayElement(['Sent', 'Delivered', 'Opened', 'Failed']),
      metadata: {
        channel: faker.helpers.arrayElement(['email', 'phone', 'sms', 'in-person']),
        duration: faker.number.int({ min: 60, max: 3600 }),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high'])
      },
      created_by: faker.helpers.arrayElement(userIds),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.communications).values(communications);
  console.log(`✅ Inserted ${communications.length} communications`);
}

async function seedCallLogs(leadIds: string[], clientIds: string[], userIds: string[]) {
  console.log('📱 Seeding call_logs table...');
  
  const callLogs = [];
  
  for (let i = 0; i < 30; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    callLogs.push({
      // Map to actual schema fields
      client_id: isForLead ? null : entityId,
      lead_id: isForLead ? entityId : null,
      direction: faker.helpers.arrayElement(['Inbound', 'Outbound']),
      from_number: faker.phone.number(),
      to_number: faker.phone.number(),
      duration: faker.number.int({ min: 30, max: 1800 }),
      status: faker.helpers.arrayElement(['Connected', 'Disconnected', 'Busy', 'NoAnswer']),
      recording_url: faker.datatype.boolean() ? faker.internet.url() : null,
      transcription: faker.datatype.boolean() ? faker.lorem.paragraphs(3) : null,
      ai_summary: faker.lorem.paragraph(),
      start_time: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      end_time: createTimestamp(-faker.number.int({ min: 0, max: 30 })),
      metadata: {
        caller_id: faker.phone.number(),
        call_quality: faker.helpers.arrayElement(['excellent', 'good', 'fair', 'poor']),
        ringcentral_session_id: faker.string.uuid()
      },
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.call_logs).values(callLogs);
  console.log(`✅ Inserted ${callLogs.length} call logs`);
}

async function seedSmsLogs(leadIds: string[], clientIds: string[], userIds: string[]) {
  console.log('💬 Seeding sms_logs table...');
  
  const smsLogs = [];
  
  for (let i = 0; i < 40; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    smsLogs.push({
      // Map to actual schema fields
      client_id: isForLead ? null : entityId,
      lead_id: isForLead ? entityId : null,
      direction: faker.helpers.arrayElement(['Inbound', 'Outbound']),
      from_number: faker.phone.number(),
      to_number: faker.phone.number(),
      message_text: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['Sent', 'Delivered', 'Received', 'SendingFailed']),
      metadata: {
        carrier: faker.helpers.arrayElement(['Verizon', 'AT&T', 'T-Mobile', 'Sprint']),
        message_type: faker.helpers.arrayElement(['SMS', 'MMS']),
        cost: faker.number.float({ min: 0.01, max: 0.25, fractionDigits: 3 })
      },
      sent_at: createTimestamp(-faker.number.int({ min: 0, max: 30 })),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.sms_logs).values(smsLogs);
  console.log(`✅ Inserted ${smsLogs.length} SMS logs`);
}

async function seedAiInteractions(leadIds: string[], clientIds: string[], userIds: string[]) {
  console.log('🤖 Seeding ai_interactions table...');
  
  const aiInteractions = [];
  
  for (let i = 0; i < 35; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    aiInteractions.push({
      // Map to actual schema fields
      client_id: isForLead ? null : entityId,
      lead_id: isForLead ? entityId : null,
      interaction_type: faker.helpers.arrayElement(['chat', 'analysis', 'recommendation', 'automation']),
      ai_model: faker.helpers.arrayElement(['gpt-4', 'claude-3', 'gemini-pro']),
      prompt: faker.lorem.paragraph(),
      response: faker.lorem.paragraphs(2),
      confidence_score: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
      tokens_used: faker.number.int({ min: 100, max: 4000 }),
      processing_time_ms: faker.number.int({ min: 500, max: 5000 }),
      metadata: {
        session_id: faker.string.uuid(),
        context: faker.helpers.arrayElement(['lead_qualification', 'quote_generation', 'follow_up', 'analysis']),
        user_feedback: faker.helpers.arrayElement(['positive', 'negative', 'neutral', null])
      },
      created_by: faker.helpers.arrayElement(userIds),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.ai_interactions).values(aiInteractions);
  console.log(`✅ Inserted ${aiInteractions.length} AI interactions`);
}

async function seedConversationSessions(leadIds: string[], clientIds: string[], userIds: string[]) {
  console.log('💭 Seeding conversation_sessions table...');
  
  const conversationSessions = [];
  
  for (let i = 0; i < 25; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    conversationSessions.push({
      // Map to actual schema fields
      client_id: isForLead ? null : entityId,
      lead_id: isForLead ? entityId : null,
      session_type: faker.helpers.arrayElement(['phone', 'email', 'chat', 'meeting']),
      status: faker.helpers.arrayElement(['active', 'completed', 'paused']),
      started_at: createTimestamp(-faker.number.int({ min: 1, max: 30 })),
      ended_at: faker.datatype.boolean() ? createTimestamp(-faker.number.int({ min: 0, max: 15 })) : null,
      summary: faker.lorem.paragraph(),
      metadata: {
        channel: faker.helpers.arrayElement(['phone', 'email', 'web_chat', 'in_person']),
        participant_count: faker.number.int({ min: 2, max: 5 }),
        quality_score: faker.number.float({ min: 1, max: 5, fractionDigits: 1 })
      },
      created_by: faker.helpers.arrayElement(userIds),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.conversation_sessions).values(conversationSessions);
  console.log(`✅ Inserted ${conversationSessions.length} conversation sessions`);
}

async function seedCustomerTouchpoints(leadIds: string[], clientIds: string[], userIds: string[]) {
  console.log('👥 Seeding customer_touchpoints table...');
  
  const customerTouchpoints = [];
  
  for (let i = 0; i < 45; i++) {
    const isForLead = faker.datatype.boolean();
    const entityId = isForLead 
      ? faker.helpers.arrayElement(leadIds)
      : faker.helpers.arrayElement(clientIds);
    
    customerTouchpoints.push({
      // Map to actual schema fields
      client_id: isForLead ? null : entityId,
      lead_id: isForLead ? entityId : null,
      touchpoint_type: faker.helpers.arrayElement(['website_visit', 'email_open', 'call', 'meeting', 'quote_request']),
      channel: faker.helpers.arrayElement(['website', 'email', 'phone', 'social_media', 'referral']),
      description: faker.lorem.sentence(),
      outcome: faker.helpers.arrayElement(['positive', 'neutral', 'negative']),
      follow_up_required: faker.datatype.boolean(),
      follow_up_date: faker.datatype.boolean() ? createTimestamp(faker.number.int({ min: 1, max: 14 })) : null,
      metadata: {
        source: faker.helpers.arrayElement(['organic', 'paid_ad', 'referral', 'direct']),
        campaign_id: faker.string.uuid(),
        engagement_score: faker.number.float({ min: 0, max: 10, fractionDigits: 1 })
      },
      created_by: faker.helpers.arrayElement(userIds),
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.customer_touchpoints).values(customerTouchpoints);
  console.log(`✅ Inserted ${customerTouchpoints.length} customer touchpoints`);
}

async function seedUserPhonePreferences(userIds: string[]) {
  console.log('📞 Seeding user_phone_preferences table...');
  
  const userPhonePreferences = [];
  
  for (const userId of userIds) {
    userPhonePreferences.push({
      user_id: userId,
      auto_answer: faker.datatype.boolean(),
      call_recording: faker.datatype.boolean(),
      voicemail_transcription: faker.datatype.boolean(),
      call_forwarding_enabled: faker.datatype.boolean(),
      forward_to_number: faker.datatype.boolean() ? faker.phone.number() : null,
      do_not_disturb_enabled: faker.datatype.boolean(),
      dnd_start_time: '22:00:00',
      dnd_end_time: '08:00:00',
      preferred_ringtone: faker.helpers.arrayElement(['default', 'professional', 'classic', 'modern']),
      metadata: {
        timezone: faker.location.timeZone(),
        notification_preferences: {
          missed_calls: faker.datatype.boolean(),
          voicemails: faker.datatype.boolean(),
          call_summaries: faker.datatype.boolean()
        }
      },
      created_at: createTimestamp(-faker.number.int({ min: 1, max: 60 })),
      updated_at: createTimestamp(-faker.number.int({ min: 0, max: 30 }))
    });
  }
  
  await db.insert(schema.user_phone_preferences).values(userPhonePreferences);
  console.log(`✅ Inserted ${userPhonePreferences.length} user phone preferences`);
}

async function main() {
  try {
    console.log('🌱 Starting communication tables seeding...\n');
    
    // Get existing IDs for foreign key relationships
    const { leadIds, clientIds, userIds } = await getExistingIds();
    
    console.log(`📊 Found ${leadIds.length} leads, ${clientIds.length} clients, and ${userIds.length} users for relationships\n`);
    
    // Seed all the communication tables
    await seedCommunications(leadIds, clientIds, userIds);
    await seedCallLogs(leadIds, clientIds, userIds);
    await seedSmsLogs(leadIds, clientIds, userIds);
    await seedAiInteractions(leadIds, clientIds, userIds);
    await seedConversationSessions(leadIds, clientIds, userIds);
    await seedCustomerTouchpoints(leadIds, clientIds, userIds);
    await seedUserPhonePreferences(userIds);
    
    console.log('\n🎉 All communication tables seeded successfully!');
    console.log('📊 Summary:');
    console.log('  - 50 Communications');
    console.log('  - 30 Call Logs');
    console.log('  - 40 SMS Logs');
    console.log('  - 35 AI Interactions');
    console.log('  - 25 Conversation Sessions');
    console.log('  - 45 Customer Touchpoints');
    console.log(`  - ${userIds.length} User Phone Preferences`);
    console.log(`  - Total: ${50+30+40+35+25+45+userIds.length} new records`);
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Test the application: npm run dev');
    console.log('  2. Check that data appears in the UI');
    console.log('  3. Verify all relationships are working');
    
    // Close the database connection
    await client.end();
    
  } catch (error) {
    console.error('❌ Error seeding communication tables:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  main();
}
