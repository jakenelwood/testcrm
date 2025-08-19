#!/usr/bin/env tsx

/**
 * 🔄 Populate Modular CRM with Existing Data
 * 
 * Migrates data from the existing leads/clients/communications structure
 * to the new modular CRM structure while preserving all data integrity.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });

interface MigrationResult {
  table: string;
  records_migrated: number;
  records_failed: number;
  execution_time_ms: number;
  errors: string[];
}

class ModularCRMPopulator {
  private results: MigrationResult[] = [];

  async run() {
    console.log('🔄 Starting Modular CRM Data Population...\n');
    
    try {
      await this.validateExistingData();
      await this.migrateClientsToContacts();
      await this.createOpportunitiesFromContacts();
      await this.migrateCommunicationsToActivities();
      await this.createInsuranceProfiles();
      await this.generateReport();
      
      const totalMigrated = this.results.reduce((sum, r) => sum + r.records_migrated, 0);
      const totalFailed = this.results.reduce((sum, r) => sum + r.records_failed, 0);
      
      console.log(`\n✅ Modular CRM data population completed!`);
      console.log(`📊 Results: ${totalMigrated} records migrated, ${totalFailed} failed`);
      console.log(`📄 Report saved to: modular-crm-population-results.json`);
      
    } catch (error) {
      console.error('❌ Data population failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async validateExistingData() {
    console.log('🔍 Validating existing data...');
    
    try {
      const dataCounts = await sql`
        SELECT 
          'clients' as table_name, COUNT(*) as count FROM clients
        UNION ALL
        SELECT 'communications', COUNT(*) FROM communications
        UNION ALL
        SELECT 'quotes', COUNT(*) FROM quotes
        UNION ALL
        SELECT 'leads', COUNT(*) FROM leads
      `;
      
      console.log('   📊 Existing data counts:');
      dataCounts.forEach(({ table_name, count }) => {
        console.log(`      ${table_name}: ${count} records`);
      });
      
      // Check if modular tables are empty
      const modularCounts = await sql`
        SELECT 
          'contacts' as table_name, COUNT(*) as count FROM contacts
        UNION ALL
        SELECT 'opportunities', COUNT(*) FROM opportunities
        UNION ALL
        SELECT 'activities', COUNT(*) FROM activities
      `;
      
      console.log('   📊 Current modular table counts:');
      modularCounts.forEach(({ table_name, count }) => {
        console.log(`      ${table_name}: ${count} records`);
      });
      
    } catch (error) {
      console.log('   ⚠️  Validation had issues:', error);
    }
  }

  private async migrateClientsToContacts() {
    const tableName = 'contacts_from_clients';
    console.log(`   🔄 Migrating clients to contacts...`);
    
    const startTime = Date.now();
    let recordsMigrated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Get all clients
      const clients = await sql`
        SELECT 
          id, name, email, phone_number, client_type,
          address_id, mailing_address_id, date_of_birth,
          gender, marital_status, drivers_license, license_state,
          education_occupation as occupation, industry, tax_id,
          year_established, annual_revenue, number_of_employees,
          business_type, ai_summary, ai_risk_score, ai_lifetime_value,
          ai_insights, metadata, tags, status, source,
          created_by, updated_by, created_at, updated_at,
          last_contact_at, next_contact_at
        FROM clients
      `;

      for (const client of clients) {
        try {
          await sql`
            INSERT INTO contacts (
              id, name, email, phone_number, contact_type, status,
              address_id, mailing_address_id, date_of_birth,
              gender, marital_status, drivers_license, license_state,
              occupation, industry, tax_id, year_established,
              annual_revenue, number_of_employees, business_type,
              ai_summary, ai_risk_score, ai_lifetime_value,
              ai_insights, metadata, tags, source,
              created_by, updated_by, created_at, updated_at,
              last_contact_at, next_contact_at
            ) VALUES (
              ${client.id}, ${client.name}, ${client.email}, ${client.phone_number},
              ${(client.client_type || 'individual').toLowerCase()}, 'client',
              ${client.address_id}, ${client.mailing_address_id}, ${client.date_of_birth},
              ${client.gender ? client.gender.toLowerCase() : null}, ${client.marital_status ? client.marital_status.toLowerCase() : null}, ${client.drivers_license}, ${client.license_state},
              ${client.occupation}, ${client.industry}, ${client.tax_id}, ${client.year_established},
              ${client.annual_revenue}, ${client.number_of_employees}, ${client.business_type},
              ${client.ai_summary}, ${client.ai_risk_score}, ${client.ai_lifetime_value},
              ${client.ai_insights || '{}'}, ${client.metadata || '{}'}, ${client.tags || '{}'},
              ${client.source}, ${client.created_by}, ${client.updated_by},
              ${client.created_at}, ${client.updated_at}, ${client.last_contact_at}, ${client.next_contact_at}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          recordsMigrated++;
        } catch (error) {
          recordsFailed++;
          errors.push(`Client ${client.name}: ${error}`);
        }
      }

    } catch (error) {
      recordsFailed = 1;
      errors.push(`Migration failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_migrated: recordsMigrated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 5)
    });

    console.log(`      ✅ ${recordsMigrated} migrated, ${recordsFailed} failed`);
  }

  private async createOpportunitiesFromContacts() {
    const tableName = 'opportunities_from_contacts';
    console.log(`   🔄 Creating opportunities from contacts...`);
    
    const startTime = Date.now();
    let recordsMigrated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Create opportunities for contacts that don't have them yet
      const contactsWithoutOpportunities = await sql`
        SELECT c.id, c.name, c.contact_type, c.status, c.ai_lifetime_value, c.created_by, c.created_at
        FROM contacts c
        LEFT JOIN opportunities o ON o.contact_id = c.id
        WHERE o.id IS NULL
        AND c.status IN ('lead', 'prospect', 'client')
      `;

      for (const contact of contactsWithoutOpportunities) {
        try {
          const opportunityName = contact.contact_type === 'business' 
            ? `${contact.name} - Business Insurance`
            : `${contact.name} - Personal Insurance`;
          
          const value = contact.ai_lifetime_value || 2000;
          const probability = contact.status === 'client' ? 100 : 
                           contact.status === 'prospect' ? 50 : 25;
          
          const status = contact.status === 'client' ? 'closed-won' : 'open';

          await sql`
            INSERT INTO opportunities (
              contact_id, name, description, value, probability,
              status, expected_close_date, created_by, created_at, updated_at
            ) VALUES (
              ${contact.id}, ${opportunityName}, 
              ${'Migrated opportunity from ' + contact.status + ' status'},
              ${value}, ${probability}, ${status},
              ${status === 'closed-won' ? contact.created_at : sql`CURRENT_DATE + INTERVAL '30 days'`},
              ${contact.created_by}, ${contact.created_at}, ${contact.created_at}
            )
          `;
          recordsMigrated++;
        } catch (error) {
          recordsFailed++;
          errors.push(`Contact ${contact.name}: ${error}`);
        }
      }

    } catch (error) {
      recordsFailed = 1;
      errors.push(`Migration failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_migrated: recordsMigrated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 5)
    });

    console.log(`      ✅ ${recordsMigrated} migrated, ${recordsFailed} failed`);
  }

  private async migrateCommunicationsToActivities() {
    const tableName = 'activities_from_communications';
    console.log(`   🔄 Migrating communications to activities...`);
    
    const startTime = Date.now();
    let recordsMigrated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Get all communications with their associated contacts
      const communications = await sql`
        SELECT
          c.id, c.type, c.direction, c.subject, c.content,
          c.duration, c.call_quality_score, c.status,
          c.completed_at, c.ai_summary, c.ai_sentiment,
          c.metadata, c.created_by, c.created_at, c.updated_at,
          COALESCE(c.lead_id, c.client_id) as contact_id
        FROM communications c
        WHERE COALESCE(c.lead_id, c.client_id) IS NOT NULL
      `;

      for (const comm of communications) {
        try {
          // Map communication status to activity status
          const activityStatus = ['Delivered', 'Sent', 'Opened', 'Replied'].includes(comm.status) 
            ? 'completed' : 'failed';

          // Get opportunity for this contact
          const opportunity = await sql`
            SELECT id FROM opportunities WHERE contact_id = ${comm.contact_id} LIMIT 1
          `;

          await sql`
            INSERT INTO activities (
              id, contact_id, opportunity_id, type, direction, subject, content,
              duration, call_quality_score, status, completed_at,
              ai_summary, ai_sentiment, metadata,
              created_by, created_at, updated_at
            ) VALUES (
              ${comm.id}, ${comm.contact_id}, ${opportunity[0]?.id || null},
              ${comm.type}, ${comm.direction ? comm.direction.toLowerCase() : null}, ${comm.subject}, ${comm.content},
              ${comm.duration}, ${comm.call_quality_score}, ${activityStatus},
              ${comm.completed_at || comm.created_at}, ${comm.ai_summary}, ${comm.ai_sentiment},
              ${comm.metadata || '{}'}, ${comm.created_by},
              ${comm.created_at}, ${comm.updated_at}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          recordsMigrated++;
        } catch (error) {
          recordsFailed++;
          errors.push(`Communication ${comm.id}: ${error}`);
        }
      }

    } catch (error) {
      recordsFailed = 1;
      errors.push(`Migration failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_migrated: recordsMigrated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 5)
    });

    console.log(`      ✅ ${recordsMigrated} migrated, ${recordsFailed} failed`);
  }

  private async createInsuranceProfiles() {
    const tableName = 'insurance_profiles_from_contacts';
    console.log(`   🔄 Creating insurance profiles...`);
    
    const startTime = Date.now();
    let recordsMigrated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Create basic insurance profiles for all contacts
      const contacts = await sql`
        SELECT id, contact_type, metadata, created_by, created_at
        FROM contacts
        WHERE NOT EXISTS (SELECT 1 FROM insurance_profiles WHERE contact_id = contacts.id)
      `;

      for (const contact of contacts) {
        try {
          await sql`
            INSERT INTO insurance_profiles (
              contact_id, auto_data, home_data, commercial_data,
              specialty_data, risk_factors, coverage_preferences,
              metadata, created_by, created_at, updated_at
            ) VALUES (
              ${contact.id}, '{}', '{}', 
              ${contact.contact_type === 'business' ? '{"businessInfo": {}}' : '{}'},
              '{}', '{}', '{}', ${contact.metadata || '{}'}, 
              ${contact.created_by}, ${contact.created_at}, ${contact.created_at}
            )
          `;
          recordsMigrated++;
        } catch (error) {
          recordsFailed++;
          errors.push(`Contact ${contact.id}: ${error}`);
        }
      }

    } catch (error) {
      recordsFailed = 1;
      errors.push(`Migration failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_migrated: recordsMigrated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 5)
    });

    console.log(`      ✅ ${recordsMigrated} migrated, ${recordsFailed} failed`);
  }

  private async generateReport() {
    console.log('📄 Generating population report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      migration_type: 'modular_crm_data_population',
      summary: {
        total_tables: this.results.length,
        total_records_migrated: this.results.reduce((sum, r) => sum + r.records_migrated, 0),
        total_records_failed: this.results.reduce((sum, r) => sum + r.records_failed, 0),
        total_execution_time_ms: this.results.reduce((sum, r) => sum + r.execution_time_ms, 0),
        success_rate: 0
      },
      migration_results: this.results,
      final_counts: await this.getFinalCounts()
    };

    const totalAttempts = report.summary.total_records_migrated + report.summary.total_records_failed;
    report.summary.success_rate = totalAttempts > 0 ? ((report.summary.total_records_migrated / totalAttempts) * 100) : 0;

    writeFileSync('modular-crm-population-results.json', JSON.stringify(report, null, 2));
  }

  private async getFinalCounts() {
    try {
      const counts = await sql`
        SELECT 
          'contacts' as table_name, COUNT(*) as count FROM contacts
        UNION ALL
        SELECT 'opportunities', COUNT(*) FROM opportunities
        UNION ALL
        SELECT 'activities', COUNT(*) FROM activities
        UNION ALL
        SELECT 'insurance_profiles', COUNT(*) FROM insurance_profiles
      `;
      
      return counts.reduce((acc, { table_name, count }) => {
        acc[table_name] = parseInt(count);
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      return {};
    }
  }
}

// Run the population
if (require.main === module) {
  const populator = new ModularCRMPopulator();
  populator.run().catch(console.error);
}

export { ModularCRMPopulator };
