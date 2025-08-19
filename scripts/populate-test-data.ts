/**
 * 🧪 Populate Test Data for AI-Native CRM
 * Creates sample contacts, accounts, and interactions to test embeddings and AI features
 */

import { createClient } from '@supabase/supabase-js';
import { embeddingService } from '../lib/ai/embedding-service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

interface TestContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lifecycleStage: 'lead' | 'opportunity_contact' | 'customer' | 'churned';
  jobTitle?: string;
  occupation?: string;
  customFields: any;
}

interface TestAccount {
  name: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  customFields: any;
}

interface TestInteraction {
  contactId: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  subject: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const testAccounts: TestAccount[] = [
  {
    name: 'Midwest Manufacturing Corp',
    industry: 'Manufacturing',
    employeeCount: 150,
    annualRevenue: 25000000,
    customFields: {
      businessType: 'Corporation',
      riskFactors: ['Heavy machinery', 'Chemical storage'],
      currentCarriers: { workers_comp: 'State Fund', general_liability: 'Hartford' }
    }
  },
  {
    name: 'Downtown Restaurant Group',
    industry: 'Food Service',
    employeeCount: 45,
    annualRevenue: 3200000,
    customFields: {
      businessType: 'LLC',
      riskFactors: ['Food handling', 'Customer premises'],
      currentCarriers: { general_liability: 'Progressive', property: 'Travelers' }
    }
  }
];

const testContacts: TestContact[] = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    lifecycleStage: 'customer',
    occupation: 'Teacher',
    customFields: {
      dateOfBirth: '1985-03-15',
      maritalStatus: 'Married',
      driversLicense: 'MN123456789',
      vehicles: [{ year: 2020, make: 'Honda', model: 'Civic' }],
      currentPolicies: { auto: 'State Farm', home: 'Allstate' }
    }
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@email.com',
    phone: '(555) 234-5678',
    lifecycleStage: 'lead',
    occupation: 'Software Engineer',
    customFields: {
      dateOfBirth: '1990-07-22',
      maritalStatus: 'Single',
      driversLicense: 'CA987654321',
      vehicles: [{ year: 2019, make: 'Tesla', model: 'Model 3' }],
      leadSource: 'Website'
    }
  },
  {
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '(555) 345-6789',
    lifecycleStage: 'opportunity_contact',
    occupation: 'Marketing Manager',
    customFields: {
      dateOfBirth: '1988-11-08',
      maritalStatus: 'Married',
      driversLicense: 'TX456789123',
      vehicles: [
        { year: 2021, make: 'BMW', model: 'X3' },
        { year: 2018, make: 'Honda', model: 'Accord' }
      ],
      homeOwner: true,
      currentCarriers: { auto: 'Geico' }
    }
  },
  {
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@midwestmfg.com',
    phone: '(555) 456-7890',
    lifecycleStage: 'customer',
    jobTitle: 'Risk Manager',
    customFields: {
      businessRole: 'Decision Maker',
      authority: 'High',
      riskConcerns: ['Workers compensation', 'Product liability'],
      renewalDate: '2025-12-31'
    }
  }
];

const testInteractions: Omit<TestInteraction, 'contactId'>[] = [
  {
    type: 'call',
    subject: 'Auto Insurance Quote Discussion',
    content: 'Discussed auto insurance options for new Tesla Model 3. Customer is interested in comprehensive coverage with low deductible. Mentioned concerns about premium costs but values good coverage. Scheduled follow-up for next week to present formal quote.',
    sentiment: 'positive'
  },
  {
    type: 'email',
    subject: 'Home Insurance Renewal Reminder',
    content: 'Sent renewal reminder for home insurance policy expiring next month. Customer has been with us for 5 years, excellent claims history. Included options for increasing coverage limits due to recent home improvements.',
    sentiment: 'neutral'
  },
  {
    type: 'meeting',
    subject: 'Commercial Insurance Review',
    content: 'Met with risk manager to review current commercial insurance portfolio. Discussed increasing workers compensation coverage due to company expansion. Identified potential gaps in cyber liability coverage. Customer expressed satisfaction with current service but concerned about rising premiums.',
    sentiment: 'positive'
  },
  {
    type: 'note',
    subject: 'Customer Complaint Follow-up',
    content: 'Customer called regarding delayed claim processing. Escalated to claims department and provided direct contact. Customer was frustrated but appreciated immediate attention. Need to follow up within 48 hours to ensure resolution.',
    sentiment: 'negative'
  },
  {
    type: 'email',
    subject: 'Multi-Vehicle Discount Opportunity',
    content: 'Reached out about potential savings with multi-vehicle discount. Customer has two vehicles but only one insured with us. Presented quote showing 15% savings if they switch second vehicle. Customer interested and requested time to review with spouse.',
    sentiment: 'positive'
  }
];

async function createTestUser(): Promise<string> {
  console.log('🔧 Creating test user...');
  
  const testUserId = '11111111-1111-1111-1111-111111111111';
  
  const { error } = await supabase
    .from('users')
    .upsert({
      id: testUserId,
      workspace_id: DEMO_WORKSPACE_ID,
      email: 'test.agent@demo.com',
      full_name: 'Test Agent',
      role: 'agent',
      specializations: ['auto', 'home', 'commercial'],
      is_active: true
    });

  if (error) {
    console.error('Error creating test user:', error);
    throw error;
  }

  console.log('✅ Test user created');
  return testUserId;
}

async function createTestAccounts(): Promise<string[]> {
  console.log('🏢 Creating test accounts...');
  
  const accountIds: string[] = [];
  
  for (const account of testAccounts) {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        workspace_id: DEMO_WORKSPACE_ID,
        name: account.name,
        industry: account.industry,
        employee_count: account.employeeCount,
        annual_revenue: account.annualRevenue,
        custom_fields: account.customFields
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating account:', error);
      throw error;
    }

    accountIds.push(data.id);
    console.log(`✅ Created account: ${account.name}`);
  }

  return accountIds;
}

async function createTestContacts(accountIds: string[], userId: string): Promise<string[]> {
  console.log('👥 Creating test contacts...');
  
  const contactIds: string[] = [];
  
  for (let i = 0; i < testContacts.length; i++) {
    const contact = testContacts[i];
    const accountId = i >= 2 ? accountIds[i - 2] : null; // Last 2 contacts are B2B
    
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        workspace_id: DEMO_WORKSPACE_ID,
        account_id: accountId,
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        lifecycle_stage: contact.lifecycleStage,
        job_title: contact.jobTitle,
        occupation: contact.occupation,
        custom_fields: contact.customFields,
        owner_id: userId
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      throw error;
    }

    contactIds.push(data.id);
    console.log(`✅ Created contact: ${contact.firstName} ${contact.lastName}`);
  }

  return contactIds;
}

async function createTestInteractions(contactIds: string[], userId: string): Promise<string[]> {
  console.log('💬 Creating test interactions...');
  
  const interactionIds: string[] = [];
  
  for (let i = 0; i < testInteractions.length; i++) {
    const interaction = testInteractions[i];
    const contactId = contactIds[i % contactIds.length]; // Distribute across contacts
    
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        workspace_id: DEMO_WORKSPACE_ID,
        contact_id: contactId,
        user_id: userId,
        type: interaction.type,
        subject: interaction.subject,
        content: interaction.content,
        sentiment: interaction.sentiment,
        interacted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating interaction:', error);
      throw error;
    }

    interactionIds.push(data.id);
    console.log(`✅ Created interaction: ${interaction.subject}`);
  }

  return interactionIds;
}

async function generateEmbeddings(contactIds: string[], interactionIds: string[]): Promise<void> {
  console.log('🧠 Generating AI embeddings...');
  
  // Generate contact summary embeddings
  for (const contactId of contactIds) {
    try {
      await embeddingService.updateContactSummaryEmbedding(contactId, DEMO_WORKSPACE_ID);
      console.log(`✅ Generated embedding for contact: ${contactId}`);
    } catch (error) {
      console.error(`❌ Failed to generate embedding for contact ${contactId}:`, error);
    }
  }

  // Generate interaction content embeddings
  for (const interactionId of interactionIds) {
    try {
      // Get interaction content
      const { data: interaction } = await supabase
        .from('interactions')
        .select('content')
        .eq('id', interactionId)
        .single();

      if (interaction?.content) {
        await embeddingService.updateInteractionEmbedding(interactionId, interaction.content);
        console.log(`✅ Generated embedding for interaction: ${interactionId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate embedding for interaction ${interactionId}:`, error);
    }
  }
}

async function createTestOpportunities(contactIds: string[], userId: string): Promise<void> {
  console.log('💰 Creating test opportunities...');
  
  const opportunities = [
    {
      contact_id: contactIds[1], // Michael Chen (lead)
      name: 'Auto Insurance Quote - Tesla Model 3',
      stage: 'proposal',
      amount: 1800,
      insurance_types: ['auto'],
      premium_breakdown: { auto: 1800 },
      probability: 75
    },
    {
      contact_id: contactIds[2], // Emily Rodriguez (opportunity_contact)
      name: 'Home + Auto Bundle',
      stage: 'negotiation',
      amount: 3200,
      insurance_types: ['auto', 'home'],
      premium_breakdown: { auto: 1400, home: 1800 },
      probability: 60
    }
  ];

  for (const opp of opportunities) {
    const { error } = await supabase
      .from('opportunities')
      .insert({
        workspace_id: DEMO_WORKSPACE_ID,
        ...opp,
        owner_id: userId,
        close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      });

    if (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }

    console.log(`✅ Created opportunity: ${opp.name}`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting test data population...');
    console.log('');

    // Create test user
    const userId = await createTestUser();

    // Create test accounts
    const accountIds = await createTestAccounts();

    // Create test contacts
    const contactIds = await createTestContacts(accountIds, userId);

    // Create test interactions
    const interactionIds = await createTestInteractions(contactIds, userId);

    // Create test opportunities
    await createTestOpportunities(contactIds, userId);

    // Generate AI embeddings
    await generateEmbeddings(contactIds, interactionIds);

    console.log('');
    console.log('🎉 Test data population complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${testAccounts.length} accounts created`);
    console.log(`   • ${testContacts.length} contacts created`);
    console.log(`   • ${testInteractions.length} interactions created`);
    console.log(`   • 2 opportunities created`);
    console.log(`   • AI embeddings generated`);
    console.log('');
    console.log('🧪 Ready for comprehensive testing!');

  } catch (error) {
    console.error('❌ Error populating test data:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
