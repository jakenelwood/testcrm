#!/usr/bin/env tsx

import { db } from '../lib/drizzle/client';
import { leads } from '../lib/drizzle/schema/leads';
import { eq, desc } from 'drizzle-orm';

async function checkLeadsTable() {
  try {
    console.log('🔍 Checking leads table structure and data...\n');

    // Get a few sample leads to see the structure
    const sampleLeads = await db
      .select()
      .from(leads)
      .limit(3)
      .orderBy(desc(leads.created_at));

    console.log('📊 Sample leads data:');
    console.log(JSON.stringify(sampleLeads, null, 2));

    // Count total leads
    const totalLeads = await db.select().from(leads);
    console.log(`\n📈 Total leads in database: ${totalLeads.length}`);

    // Check for any leads with specific IDs mentioned in the error
    const specificLead = await db
      .select()
      .from(leads)
      .where(eq(leads.id, '6b0f94a3-47fe-456f-817b-01de52ff53b7'))
      .limit(1);

    if (specificLead.length > 0) {
      console.log('\n🎯 Found the specific lead mentioned in error:');
      console.log(JSON.stringify(specificLead[0], null, 2));
    } else {
      console.log('\n❌ Could not find lead with ID: 6b0f94a3-47fe-456f-817b-01de52ff53b7');
    }

  } catch (error) {
    console.error('❌ Error checking leads table:', error);
  }
}

checkLeadsTable();
