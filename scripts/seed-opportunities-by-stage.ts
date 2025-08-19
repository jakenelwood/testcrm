#!/usr/bin/env tsx

/**
 * 🌱 Seed extra opportunities in specific stages for UI testing (personal + commercial)
 *
 * Usage:
 *   npm run seed:opps:staged
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

// Exact enum values from DB
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

// Stages we want to guarantee coverage for UI
const TARGET_STAGES: (typeof VALID_STAGES[number])[] = [
  'quoted',
  'proposal',
  'proposed',
  'closed_won',
  'closed_lost',
  'attempting_contact',
  'paused',
  'future_follow_up_date',
  'contacted_interested',
  'contacted_no_interest',
];

async function getOnePersonalContact(): Promise<string | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id')
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .is('account_id', null)
    .limit(20);
  if (error) throw error;
  return data?.[0]?.id ?? null;
}

async function getOneCommercialContext(): Promise<{ account_id: string; contact_id: string | null } | null> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .limit(10);
  if (error) throw error;
  if (!accounts || accounts.length === 0) return null;
  const account_id = faker.helpers.arrayElement(accounts).id as string;
  const { data: contacts, error: cErr } = await supabase
    .from('contacts')
    .select('id')
    .eq('workspace_id', DEMO_WORKSPACE_ID)
    .eq('account_id', account_id)
    .limit(10);
  if (cErr) throw cErr;
  const contact_id = contacts && contacts.length ? faker.helpers.arrayElement(contacts).id : null;
  return { account_id, contact_id };
}

function personalPremium() {
  const p = {
    auto: Number(faker.number.float({ min: 400, max: 2000, fractionDigits: 2 })),
    home: Number(faker.number.float({ min: 600, max: 2500, fractionDigits: 2 })),
  };
  return { p, amount: Object.values(p).reduce((a, b) => a + b, 0) };
}

function commercialPremium() {
  const p = {
    general_liability: Number(faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 })),
    workers_comp: Number(faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 })),
  };
  return { p, amount: Object.values(p).reduce((a, b) => a + b, 0) };
}

async function seedPersonal(contact_id: string, stage: typeof VALID_STAGES[number]) {
  const { p, amount } = personalPremium();
  const payload = {
    workspace_id: DEMO_WORKSPACE_ID,
    name: `${faker.person.lastName()} Family Policy (${stage})`,
    contact_id,
    stage,
    amount,
    probability: faker.number.int({ min: 10, max: 90 }),
    close_date: faker.date.soon({ days: 45 }).toISOString().split('T')[0],
    insurance_types: ['auto', 'home'],
    policy_term: 12,
    effective_date: faker.date.soon({ days: 15 }).toISOString().split('T')[0],
    expiration_date: faker.date.soon({ days: 380 }).toISOString().split('T')[0],
    premium_breakdown: p,
    coverage_details: { liability: '100/300/100', deductible: 500 },
    current_carrier: faker.helpers.arrayElement(['State Farm','Allstate','GEICO','Progressive','Farmers','Liberty Mutual']),
    current_premium: Number(faker.number.float({ min: 800, max: 4500, fractionDigits: 2 })),
    tags: faker.helpers.arrayElements(['Bundle','Teen Driver','Home Renovation'], { min: 0, max: 2 }),
    notes: faker.lorem.sentence(),
  };
  const { error } = await supabase.from('opportunities').insert(payload);
  if (error) throw error;
}

async function seedCommercial(ctx: { account_id: string; contact_id: string | null }, stage: typeof VALID_STAGES[number]) {
  const { p, amount } = commercialPremium();
  const payload = {
    workspace_id: DEMO_WORKSPACE_ID,
    name: `${faker.company.name()} Insurance Program (${stage})`,
    account_id: ctx.account_id,
    contact_id: ctx.contact_id,
    stage,
    amount,
    probability: faker.number.int({ min: 10, max: 90 }),
    close_date: faker.date.soon({ days: 60 }).toISOString().split('T')[0],
    insurance_types: faker.helpers.arrayElements(['general_liability','workers_comp','property','cyber'], { min: 1, max: 3 }),
    policy_term: 12,
    effective_date: faker.date.soon({ days: 30 }).toISOString().split('T')[0],
    expiration_date: faker.date.soon({ days: 420 }).toISOString().split('T')[0],
    premium_breakdown: p,
    coverage_details: { gl_limits: '1M/2M', wc_states: ['IL'], property_limit: faker.number.int({ min: 250000, max: 2000000 }) },
    competing_carriers: faker.helpers.arrayElements(['Hartford','Travelers','Chubb','Liberty Mutual','Zurich'], { min: 0, max: 2 }),
    current_carrier: faker.helpers.arrayElement(['Hartford','Travelers','Chubb','Liberty Mutual']),
    current_premium: Number(faker.number.float({ min: 5000, max: 40000, fractionDigits: 2 })),
    tags: faker.helpers.arrayElements(['Renewal','Mid-term Rewrite','Loss Sensitive'], { min: 0, max: 2 }),
    notes: faker.lorem.sentence(),
  };
  const { error } = await supabase.from('opportunities').insert(payload);
  if (error) throw error;
}

async function main() {
  try {
    console.log('🎯 Seeding targeted opportunity stages...');

    const personalContact = await getOnePersonalContact();
    const commercialCtx = await getOneCommercialContext();

    if (!personalContact) throw new Error('No personal contact found in workspace');
    if (!commercialCtx) throw new Error('No commercial account found in workspace');

    for (const stage of TARGET_STAGES) {
      await seedPersonal(personalContact, stage);
      await seedCommercial(commercialCtx, stage);
      console.log(`  • Inserted personal+commercial opportunities at stage: ${stage}`);
    }

    console.log('✅ Completed seeding of targeted stages.');
  } catch (err: any) {
    console.error('❌ Staged seeding failed:', err?.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

