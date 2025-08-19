#!/usr/bin/env tsx

/**
 * 🌱 Seed Contacts and Opportunities using Supabase (bypasses RLS with service role)
 * - Creates B2C contacts and opportunities (contact-linked)
 * - Creates B2B accounts, contacts, and opportunities (account-linked)
 *
 * Usage:
 *   npm run seed:contacts-opps:sr
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

const VALID_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
  'attempting_contact',
  'contacted_no_interest',
  'contacted_interested',
  'quoted',
  'quote_yes',
  'quote_no_followup_ok',
  'quote_no_dont_contact',
  'quote_maybe',
  'proposed',
  'paused',
  'future_follow_up_date',
] as const;

type Stage = typeof VALID_STAGES[number];

async function ensureWorkspace() {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', DEMO_WORKSPACE_ID)
    .single();

  if (!error && data) return data.id;

  const ins = await supabase.from('workspaces').insert({
    id: DEMO_WORKSPACE_ID,
    name: 'Demo Insurance Agency',
    agency_license: 'INS-DEV',
    agency_type: 'Independent',
    primary_lines: ['auto', 'home', 'commercial'],
    timezone: 'America/Chicago',
    subscription_tier: 'professional',
    max_users: 25,
    max_contacts: 10000,
  }).select('id').single();

  if (ins.error) throw ins.error;
  return ins.data.id as string;
}

async function ensureUser() {
  const { data } = await supabase.from('users').select('id').eq('id', TEST_USER_ID).single();
  if (data) return TEST_USER_ID;
  const { error } = await supabase.from('users').insert({
    id: TEST_USER_ID,
    workspace_id: DEMO_WORKSPACE_ID,
    email: 'test.agent@demo.com',
    full_name: 'Test Agent',
    role: 'agent',
    specializations: ['auto', 'home', 'commercial'],
    is_active: true,
  });
  if (error) throw error;
  return TEST_USER_ID;
}

async function ensureAccounts(count = 3): Promise<string[]> {
  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .limit(count);

  const ids: string[] = existing?.map((r: any) => r.id) ?? [];
  const toCreate = count - ids.length;

  for (let i = 0; i < toCreate; i++) {
    const payload = {
      workspace_id: DEMO_WORKSPACE_ID,
      name: faker.company.name(),
      website: faker.internet.url(),
      industry: faker.helpers.arrayElement([
        'Construction','Manufacturing','Retail','Healthcare','Technology',
        'Professional Services','Transportation','Hospitality','Real Estate','Education'
      ]),
      employee_count: faker.number.int({ min: 5, max: 500 }),
      annual_revenue: Number(faker.number.float({ min: 250000, max: 50000000, fractionDigits: 2 })),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip_code: faker.location.zipCode(),
      current_carriers: {},
      policy_renewal_dates: {},
      risk_profile: {},
    };
    const { data, error } = await supabase.from('accounts').insert(payload).select('id').single();
    if (error) throw error;
    ids.push(data!.id);
  }

  return ids;
}

async function createPersonalContacts(count = 8): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const payload = {
      workspace_id: DEMO_WORKSPACE_ID,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip_code: faker.location.zipCode(),
      lifecycle_stage: faker.helpers.arrayElement(['lead','opportunity_contact','customer']) as 'lead'|'opportunity_contact'|'customer',
      owner_id: TEST_USER_ID,
    };
    const { data, error } = await supabase.from('contacts').insert(payload).select('id').single();
    if (error) throw error;
    ids.push(data!.id);
  }
  return ids;
}

async function createCommercialContacts(accountIds: string[], perAccount = 2): Promise<Record<string,string[]>> {
  const map: Record<string,string[]> = {};
  for (const accId of accountIds) {
    map[accId] = [];
    for (let i = 0; i < perAccount; i++) {
      const payload = {
        workspace_id: DEMO_WORKSPACE_ID,
        account_id: accId,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        lifecycle_stage: faker.helpers.arrayElement(['lead','opportunity_contact','customer']) as 'lead'|'opportunity_contact'|'customer',
        owner_id: TEST_USER_ID,
      };
      const { data, error } = await supabase.from('contacts').insert(payload).select('id').single();
      if (error) throw error;
      map[accId].push(data!.id);
    }
  }
  return map;
}

function personalPremiumBreakdown() {
  return {
    auto: Number(faker.number.float({ min: 400, max: 2000, fractionDigits: 2 })),
    home: Number(faker.number.float({ min: 600, max: 2500, fractionDigits: 2 })),
    umbrella: Number(faker.number.float({ min: 150, max: 600, fractionDigits: 2 })),
  };
}

function commercialPremiumBreakdown() {
  return {
    general_liability: Number(faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 })),
    workers_comp: Number(faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 })),
    property: Number(faker.number.float({ min: 1500, max: 7000, fractionDigits: 2 })),
    cyber: Number(faker.number.float({ min: 800, max: 4000, fractionDigits: 2 })),
  };
}

async function createPersonalOpportunities(contactIds: string[], count = 10) {
  for (let i = 0; i < count; i++) {
    const cId = faker.helpers.arrayElement(contactIds);
    const stage = faker.helpers.arrayElement(VALID_STAGES) as Stage;
    const premium = personalPremiumBreakdown();
    const amount = Object.values(premium).reduce((a, b) => a + b, 0);
    const payload = {
      workspace_id: DEMO_WORKSPACE_ID,
      name: `${faker.person.lastName()} Family Policy`,
      contact_id: cId,
      stage,
      amount,
      probability: faker.number.int({ min: 10, max: 90 }),
      close_date: faker.date.soon({ days: 60 }).toISOString().split('T')[0],
      insurance_types: faker.helpers.arrayElements(['auto', 'home', 'umbrella'], { min: 1, max: 3 }),
      policy_term: 12,
      effective_date: faker.date.soon({ days: 30 }).toISOString().split('T')[0],
      expiration_date: faker.date.soon({ days: 395 }).toISOString().split('T')[0],
      premium_breakdown: premium,
      coverage_details: { liability: '100/300/100', deductible: 500 },
      current_carrier: faker.helpers.arrayElement(['State Farm','Allstate','GEICO','Progressive','Farmers','Liberty Mutual']),
      current_premium: Number(faker.number.float({ min: 800, max: 4500, fractionDigits: 2 })),
      tags: faker.helpers.arrayElements(['Bundle', 'Teen Driver', 'Home Renovation'], { min: 0, max: 2 }),
      notes: faker.lorem.sentence(),
    };
    const { error } = await supabase.from('opportunities').insert(payload);
    if (error) throw error;
  }
}

async function createCommercialOpportunities(accountIds: string[], contactsByAccount: Record<string,string[]>, count = 8) {
  for (let i = 0; i < count; i++) {
    const account_id = faker.helpers.arrayElement(accountIds);
    const contact_list = contactsByAccount[account_id] || [];
    const contact_id = contact_list.length ? faker.helpers.arrayElement(contact_list) : null;

    const stage = faker.helpers.arrayElement(VALID_STAGES) as Stage;
    const premium = commercialPremiumBreakdown();
    const amount = Object.values(premium).reduce((a, b) => a + b, 0);
    const payload = {
      workspace_id: DEMO_WORKSPACE_ID,
      name: `${faker.company.name()} Insurance Program`,
      account_id,
      contact_id,
      stage,
      amount,
      probability: faker.number.int({ min: 10, max: 90 }),
      close_date: faker.date.soon({ days: 90 }).toISOString().split('T')[0],
      insurance_types: faker.helpers.arrayElements(['general_liability','workers_comp','property','cyber'], { min: 1, max: 3 }),
      policy_term: 12,
      effective_date: faker.date.soon({ days: 45 }).toISOString().split('T')[0],
      expiration_date: faker.date.soon({ days: 425 }).toISOString().split('T')[0],
      premium_breakdown: premium,
      coverage_details: {
        gl_limits: '1M/2M',
        wc_states: [faker.location.state({ abbreviated: true })],
        property_limit: faker.number.int({ min: 250000, max: 2000000 }),
      },
      competing_carriers: faker.helpers.arrayElements(['Hartford','Travelers','Chubb','Liberty Mutual','Zurich'], { min: 0, max: 2 }),
      current_carrier: faker.helpers.arrayElement(['Hartford','Travelers','Chubb','Liberty Mutual']),
      current_premium: Number(faker.number.float({ min: 5000, max: 40000, fractionDigits: 2 })),
      tags: faker.helpers.arrayElements(['Renewal','Mid-term Rewrite','Loss Sensitive'], { min: 0, max: 2 }),
      notes: faker.lorem.sentence(),
    };
    const { error } = await supabase.from('opportunities').insert(payload);
    if (error) throw error;
  }
}

async function main() {
  try {
    console.log('🌱 Seeding (service role) contacts and opportunities...');
    await ensureWorkspace();
    await ensureUser();

    const accountIds = await ensureAccounts(3);
    console.log(`🏛️ Accounts ready: ${accountIds.length}`);

    const personalContacts = await createPersonalContacts(8);
    console.log(`👤 Personal contacts: ${personalContacts.length}`);

    const contactsByAccount = await createCommercialContacts(accountIds, 2);
    const commercialContactCount = Object.values(contactsByAccount).reduce((a,b)=>a+b.length,0);
    console.log(`👥 Commercial contacts: ${commercialContactCount}`);

    await createPersonalOpportunities(personalContacts, 10);
    console.log('📄 Personal opportunities created');

    await createCommercialOpportunities(accountIds, contactsByAccount, 8);
    console.log('📃 Commercial opportunities created');

    console.log('🎉 Done!');
  } catch (err: any) {
    console.error('❌ Seeding failed:', err?.message || err);
    process.exitCode = 1;
  }
}

main();

