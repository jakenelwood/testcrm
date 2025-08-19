#!/usr/bin/env tsx

/**
 * 🌱 Seed Contacts and Opportunities (Personal + Commercial)
 * - Creates B2C contacts and their opportunities (contact-linked)
 * - Creates B2B accounts with contacts and opportunities (account-linked)
 *
 * Usage:
 *   npm run seed:contacts-opps
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { faker } from '@faker-js/faker';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/drizzle/schema';
import {
  workspaces,
  accounts,
  contacts,
  opportunities,
} from '../lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'seed-contacts-opps',
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

async function getWorkspaceId(): Promise<string> {
  // Prefer the known Demo workspace if present
  const demo = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, DEMO_WORKSPACE_ID));
  if (demo.length > 0) return demo[0].id;

  // Fallback to any existing workspace
  const any = await db.select({ id: workspaces.id }).from(workspaces).limit(1);
  if (any.length > 0) return any[0].id;

  // Create a simple workspace if none exist
  const name = `Demo Insurance Agency ${faker.number.int({ min: 1000, max: 9999 })}`;
  const inserted = await db
    .insert(workspaces)
    .values({
      id: DEMO_WORKSPACE_ID,
      name,
      agencyLicense: 'INS-DEV',
      agencyType: 'Independent',
      primaryLines: ['auto', 'home', 'commercial'],
      timezone: 'America/Chicago',
      subscriptionTier: 'professional',
      maxUsers: 25,
      maxContacts: 10000,
    })
    .returning({ id: workspaces.id });
  return inserted[0].id;
}

async function ensureAccounts(wsId: string, count = 3) {
  // Try to reuse a few existing accounts in the workspace
  const existing = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq((accounts as any).workspace_id, wsId))
    .limit(count);

  const accIds: string[] = existing.map((r) => r.id);
  const toCreate = count - existing.length;

  for (let i = 0; i < toCreate; i++) {
    const name = faker.company.name();
    const website = faker.internet.url();
    const industry = faker.helpers.arrayElement([
      'Construction',
      'Manufacturing',
      'Retail',
      'Healthcare',
      'Technology',
      'Professional Services',
      'Transportation',
      'Hospitality',
      'Real Estate',
      'Education',
    ]);
    const employeeCount = faker.number.int({ min: 5, max: 500 });
    const annualRevenue = faker.number.float({ min: 250000, max: 50000000, fractionDigits: 2 });
    const address = faker.location.streetAddress();
    const city = faker.location.city();
    const state = faker.location.state({ abbreviated: true });
    const zip = faker.location.zipCode();

    const result = await db.execute(sql`INSERT INTO accounts (
      workspace_id, name, website, industry, employee_count, annual_revenue,
      address, city, state, zip_code, current_carriers, policy_renewal_dates, risk_profile
    ) VALUES (
      ${wsId}, ${name}, ${website}, ${industry}, ${employeeCount}, ${annualRevenue},
      ${address}, ${city}, ${state}, ${zip}, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb
    ) RETURNING id`);

    accIds.push((result as any)[0].id);
  }

  return accIds;
}

async function createPersonalContacts(wsId: string, count = 8) {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const email = faker.internet.email();
    const phone = faker.phone.number();
    const address = faker.location.streetAddress();
    const city = faker.location.city();
    const state = faker.location.state({ abbreviated: true });
    const zip = faker.location.zipCode();
    const lifecycle = faker.helpers.arrayElement(['lead','opportunity_contact','customer']);

    const result = await db.execute(sql`INSERT INTO contacts (
      workspace_id, first_name, last_name, email, phone, address, city, state, zip_code, lifecycle_stage
    ) VALUES (
      ${wsId}, ${first}, ${last}, ${email}, ${phone}, ${address}, ${city}, ${state}, ${zip}, ${lifecycle}
    ) RETURNING id`);

    ids.push((result as any)[0].id);
  }
  return ids;
}

async function createCommercialContacts(wsId: string, accIds: string[], perAccount = 2) {
  const contactIdsByAccount: Record<string, string[]> = {};
  for (const accId of accIds) {
    contactIdsByAccount[accId] = [];
    for (let i = 0; i < perAccount; i++) {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      const email = faker.internet.email();
      const phone = faker.phone.number();
      const lifecycle = faker.helpers.arrayElement(['lead','opportunity_contact','customer']);

      const result = await db.execute(sql`INSERT INTO contacts (
        workspace_id, account_id, first_name, last_name, email, phone, lifecycle_stage
      ) VALUES (
        ${wsId}, ${accId}, ${first}, ${last}, ${email}, ${phone}, ${lifecycle}
      ) RETURNING id`);

      contactIdsByAccount[accId].push((result as any)[0].id);
    }
  }
  return contactIdsByAccount;
}

const PERSONAL_STAGES = ['start', 'proposed', 'quoted', 'closed_won', 'closed_lost', 'attempting_contact'] as const;
const COMMERCIAL_STAGES = PERSONAL_STAGES;

function randomPremiumBreakdown(kind: 'personal' | 'commercial') {
  if (kind === 'personal') {
    return {
      auto: faker.number.float({ min: 400, max: 2000, fractionDigits: 2 }),
      home: faker.number.float({ min: 600, max: 2500, fractionDigits: 2 }),
      umbrella: faker.number.float({ min: 150, max: 600, fractionDigits: 2 }),
    };
  }
  return {
    general_liability: faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 }),
    workers_comp: faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }),
    property: faker.number.float({ min: 1500, max: 7000, fractionDigits: 2 }),
    cyber: faker.number.float({ min: 800, max: 4000, fractionDigits: 2 }),
  };
}

async function createPersonalOpportunities(wsId: string, contactIds: string[], count = 10) {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const cId = faker.helpers.arrayElement(contactIds);
    const stage = faker.helpers.arrayElement(PERSONAL_STAGES) as any;
    const insuranceTypes = faker.helpers.arrayElements(['auto', 'home', 'umbrella'], { min: 1, max: 3 });
    const premiumBreakdown = randomPremiumBreakdown('personal');
    const amount = Object.values(premiumBreakdown).reduce((a, b) => a + Number(b), 0);

    const result = await db.execute(sql`INSERT INTO opportunities (
      workspace_id, name, contact_id, stage, amount, probability, close_date, insurance_types, policy_term, effective_date, expiration_date, premium_breakdown, coverage_details, current_carrier, current_premium, tags, notes, contact_attempts, max_contact_attempts, last_contact_attempt, next_contact_date, quote_sent_at, quote_response_at
    ) VALUES (
      ${wsId}, ${`${faker.person.lastName()} Family Policy`}, ${cId}, ${stage}, ${amount}, ${faker.number.int({ min: 10, max: 90 })}, ${faker.date.soon({ days: 60 }).toISOString().split('T')[0]}, ${sql.raw(`ARRAY[${insuranceTypes.map((t) => `'${t}'`).join(',')}]`)}, 12, ${faker.date.soon({ days: 30 }).toISOString().split('T')[0]}, ${faker.date.soon({ days: 395 }).toISOString().split('T')[0]}, ${sql.json(premiumBreakdown as any)}, ${sql.json({ liability: '100/300/100', deductible: 500 } as any)}, ${faker.helpers.arrayElement(['State Farm','Allstate','GEICO','Progressive','Farmers','Liberty Mutual'])}, ${faker.number.float({ min: 800, max: 4500, fractionDigits: 2 })}, ${sql.raw(`ARRAY['Bundle','Teen Driver','Home Renovation']`)}, ${faker.lorem.sentence()}, ${faker.number.int({ min: 0, max: 5 })}, 7, ${faker.date.recent({ days: 14 }).toISOString()}, ${faker.date.soon({ days: 21 }).toISOString()}, ${faker.datatype.boolean() ? faker.date.recent({ days: 10 }).toISOString() : null}, ${faker.datatype.boolean() ? faker.date.recent({ days: 5 }).toISOString() : null}
    ) RETURNING id`);

    ids.push((result as any)[0].id);
  }
  return ids;
}

async function createCommercialOpportunities(wsId: string, accIds: string[], contactsByAccount: Record<string, string[]>, count = 8) {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const accId = faker.helpers.arrayElement(accIds);
    const maybeContacts = contactsByAccount[accId] || [];
    const primaryC = maybeContacts.length ? faker.helpers.arrayElement(maybeContacts) : undefined;

    const stage = faker.helpers.arrayElement(COMMERCIAL_STAGES) as any;
    const insuranceTypes = faker.helpers.arrayElements(['general_liability', 'workers_comp', 'property', 'cyber'], { min: 1, max: 3 });
    const premiumBreakdown = randomPremiumBreakdown('commercial');
    const amount = Object.values(premiumBreakdown).reduce((a, b) => a + Number(b), 0);

    const [row] = await db
      .insert(opportunities)
      .values({
        workspaceId: wsId,
        name: `${faker.company.name()} Insurance Program`,
        accountId: accId,
        contactId: primaryC,
        stage,
        amount,
        probability: faker.number.int({ min: 10, max: 90 }),
        closeDate: faker.date.soon({ days: 90 }).toISOString().split('T')[0],
        insuranceTypes,
        policyTerm: 12,
        effectiveDate: faker.date.soon({ days: 45 }).toISOString().split('T')[0],
        expirationDate: faker.date.soon({ days: 425 }).toISOString().split('T')[0],
        premiumBreakdown: premiumBreakdown as any,
        coverageDetails: {
          gl_limits: '1M/2M',
          wc_states: [faker.location.state({ abbreviated: true })],
          property_limit: `${faker.number.int({ min: 250000, max: 2000000 })}`,
        } as any,
        competingCarriers: faker.helpers.arrayElements(['Hartford', 'Travelers', 'Chubb', 'Liberty Mutual', 'Zurich'], { min: 0, max: 2 }),
        currentCarrier: faker.helpers.arrayElement(['Hartford', 'Travelers', 'Chubb', 'Liberty Mutual', null as any]) ?? undefined,
        currentPremium: faker.number.float({ min: 5000, max: 40000, fractionDigits: 2 }),
        aiWinProbability: faker.number.float({ min: 0.1, max: 0.95, fractionDigits: 2 }),
        tags: faker.helpers.arrayElements(['Renewal', 'Mid-term Rewrite', 'Loss Sensitive'], { min: 0, max: 2 }),
        notes: faker.lorem.sentence(),
        contactAttempts: faker.number.int({ min: 0, max: 7 }),
        maxContactAttempts: 7,
        lastContactAttempt: faker.date.recent({ days: 21 }),
        nextContactDate: faker.date.soon({ days: 30 }),
        quoteSentAt: faker.datatype.boolean() ? faker.date.recent({ days: 14 }) : null,
        quoteResponseAt: faker.datatype.boolean() ? faker.date.recent({ days: 7 }) : null,
      })
      .returning({ id: opportunities.id });
    ids.push(row.id);
  }
  return ids;
}

async function main() {
  try {
    console.log('🌱 Seeding contacts and opportunities (personal + commercial) ...');
    const wsId = await getWorkspaceId();
    console.log('🏢 Workspace:', wsId);

    const accIds = await ensureAccounts(wsId, 3);
    console.log(`🏛️  Accounts ready: ${accIds.length}`);

    const personalContactIds = await createPersonalContacts(wsId, 8);
    console.log(`👤 Personal contacts created: ${personalContactIds.length}`);

    const contactsByAccount = await createCommercialContacts(wsId, accIds, 2);
    const commercialContactCount = Object.values(contactsByAccount).reduce((a, b) => a + b.length, 0);
    console.log(`👥 Commercial contacts created: ${commercialContactCount}`);

    const personalOppIds = await createPersonalOpportunities(wsId, personalContactIds, 10);
    console.log(`📄 Personal opportunities created: ${personalOppIds.length}`);

    const commercialOppIds = await createCommercialOpportunities(wsId, accIds, contactsByAccount, 8);
    console.log(`📃 Commercial opportunities created: ${commercialOppIds.length}`);

    console.log('\n🎉 Done! Test data ready for modals and opportunity detail views.');
    console.log('   Examples:');
    console.log('   - One personal opportunity ID:', personalOppIds[0]);
    console.log('   - One commercial opportunity ID:', commercialOppIds[0]);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    // Close Postgres connection
    await client.end();
  }
}

main();

