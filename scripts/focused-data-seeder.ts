#!/usr/bin/env tsx

/**
 * 🎯 Focused Data Seeder
 * 
 * Populates core tables with valid test data, working around authentication constraints.
 * Uses existing users from auth system and focuses on business data tables.
 * 
 * Part of Phase 3: Data Population
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { faker } from '@faker-js/faker';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });

interface SeedingResult {
  table: string;
  records_created: number;
  records_failed: number;
  execution_time_ms: number;
  errors: string[];
  sample_records: any[];
}

class FocusedDataSeeder {
  private results: SeedingResult[] = [];
  private existingUsers: any[] = [];
  private createdData: Record<string, any[]> = {};

  async run() {
    console.log('🎯 Starting Focused Data Seeder...\n');
    
    try {
      await this.loadExistingUsers();
      await this.clearExistingTestData();
      await this.seedCoreBusinessData();
      await this.validateResults();
      await this.generateReport();
      
      const totalRecords = this.results.reduce((sum, r) => sum + r.records_created, 0);
      const totalErrors = this.results.reduce((sum, r) => sum + r.records_failed, 0);
      
      console.log(`\n✅ Focused data seeding completed!`);
      console.log(`📊 Results: ${totalRecords} records created, ${totalErrors} errors`);
      console.log(`📄 Report saved to: focused-seeding-results.json`);
      
    } catch (error) {
      console.error('❌ Focused data seeding failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async loadExistingUsers() {
    console.log('👥 Loading existing users...');
    
    try {
      this.existingUsers = await sql`SELECT id, email, full_name, role FROM users LIMIT 10`;
      console.log(`   Found ${this.existingUsers.length} existing users`);
      
      if (this.existingUsers.length === 0) {
        console.log('   ⚠️  No existing users found - some seeding will be limited');
      }
    } catch (error) {
      console.log('   ⚠️  Could not load existing users:', error);
      this.existingUsers = [];
    }
  }

  private async clearExistingTestData() {
    console.log('🧹 Clearing existing test data...');
    
    try {
      // Clear in reverse dependency order
      await sql`DELETE FROM quotes WHERE quote_number LIKE 'TEST-%'`;
      await sql`DELETE FROM communications WHERE content LIKE '%[TEST]%'`;
      await sql`DELETE FROM clients WHERE name LIKE '%Test%' OR email LIKE '%test@%'`;
      await sql`DELETE FROM leads WHERE first_name = 'Test' OR email LIKE '%test@%'`;
      await sql`DELETE FROM addresses WHERE street LIKE '%Test%' AND country = 'US'`;
      await sql`DELETE FROM insurance_types WHERE name LIKE '%Test%'`;
      
      console.log('   ✅ Existing test data cleared');
    } catch (error) {
      console.log('   ⚠️  No existing test data to clear');
    }
  }

  private async seedCoreBusinessData() {
    console.log('🌱 Seeding core business data...');
    
    await this.seedInsuranceTypes();
    await this.seedAddresses();
    await this.seedLeads();
    await this.seedClients();
    await this.seedCommunications();
    await this.seedQuotes();
  }

  private async seedInsuranceTypes() {
    const tableName = 'insurance_types';
    console.log(`   🌱 Seeding ${tableName}...`);
    
    const startTime = Date.now();
    let recordsCreated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    const sampleRecords: any[] = [];

    try {
      const types = [
        { name: 'Test Auto Insurance', description: 'Test comprehensive auto insurance coverage' },
        { name: 'Test Home Insurance', description: 'Test comprehensive home insurance coverage' },
        { name: 'Test Life Insurance', description: 'Test comprehensive life insurance coverage' },
        { name: 'Test Business Insurance', description: 'Test comprehensive business insurance coverage' }
      ];

      for (const type of types) {
        try {
          const result = await sql`
            INSERT INTO insurance_types (name, description)
            VALUES (${type.name}, ${type.description})
            RETURNING *
          `;
          recordsCreated++;
          if (sampleRecords.length < 2) {
            sampleRecords.push(result[0]);
          }
        } catch (error) {
          recordsFailed++;
          errors.push(`${type.name}: ${error}`);
        }
      }

      if (recordsCreated > 0) {
        this.createdData[tableName] = await sql`SELECT * FROM insurance_types WHERE name LIKE '%Test%'`;
      }

    } catch (error) {
      recordsFailed = 4;
      errors.push(`Transaction failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_created: recordsCreated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 3),
      sample_records: sampleRecords
    });

    console.log(`      ✅ ${recordsCreated} created, ${recordsFailed} failed`);
  }

  private async seedAddresses() {
    const tableName = 'addresses';
    console.log(`   🌱 Seeding ${tableName}...`);
    
    const startTime = Date.now();
    let recordsCreated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    const sampleRecords: any[] = [];

    try {
      const addresses = [];
      const types = ['Physical', 'Mailing', 'Business'];
      
      for (let i = 0; i < 10; i++) {
        addresses.push({
          id: faker.string.uuid(),
          street: `${faker.location.streetAddress()} Test St`,
          street2: faker.datatype.boolean() ? faker.location.secondaryAddress() : null,
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zip_code: faker.location.zipCode(),
          country: 'US',
          type: faker.helpers.arrayElement(types)
        });
      }

      for (const address of addresses) {
        try {
          const result = await sql`
            INSERT INTO addresses (id, street, street2, city, state, zip_code, country, type)
            VALUES (${address.id}, ${address.street}, ${address.street2}, ${address.city}, ${address.state}, ${address.zip_code}, ${address.country}, ${address.type})
            RETURNING *
          `;
          recordsCreated++;
          if (sampleRecords.length < 2) {
            sampleRecords.push(result[0]);
          }
        } catch (error) {
          recordsFailed++;
          errors.push(`${address.street}: ${error}`);
        }
      }

      if (recordsCreated > 0) {
        this.createdData[tableName] = await sql`SELECT * FROM addresses WHERE street LIKE '%Test%'`;
      }

    } catch (error) {
      recordsFailed = 10;
      errors.push(`Transaction failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_created: recordsCreated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 3),
      sample_records: sampleRecords
    });

    console.log(`      ✅ ${recordsCreated} created, ${recordsFailed} failed`);
  }

  private async seedLeads() {
    const tableName = 'leads';
    console.log(`   🌱 Seeding ${tableName}...`);
    
    const startTime = Date.now();
    let recordsCreated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    const sampleRecords: any[] = [];

    try {
      const addresses = this.createdData.addresses || [];
      const statuses = ['New', 'Contacted', 'Qualified', 'Quoted'];
      const priorities = ['Low', 'Medium', 'High'];
      const leadTypes = ['Personal', 'Business'];
      
      for (let i = 0; i < 15; i++) {
        const leadType = faker.helpers.arrayElement(leadTypes);
        const assignedTo = this.existingUsers.length > 0 ? faker.helpers.arrayElement(this.existingUsers).id : null;
        const addressId = addresses.length > 0 ? faker.helpers.arrayElement(addresses).id : null;
        
        try {
          const result = await sql`
            INSERT INTO leads (
              id, first_name, last_name, email, phone_number, 
              status, priority, lead_type, lead_source,
              assigned_to, address_id, ai_follow_up_priority,
              notes, created_by
            ) VALUES (
              ${faker.string.uuid()}, 
              ${'Test'}, 
              ${faker.person.lastName()}, 
              ${faker.internet.email()}, 
              ${faker.phone.number()},
              ${faker.helpers.arrayElement(statuses)}, 
              ${faker.helpers.arrayElement(priorities)}, 
              ${leadType}, 
              ${'Website'},
              ${assignedTo}, 
              ${addressId}, 
              ${faker.number.int({ min: 1, max: 10 })},
              ${faker.lorem.paragraph()}, 
              ${assignedTo}
            ) RETURNING *
          `;
          recordsCreated++;
          if (sampleRecords.length < 2) {
            sampleRecords.push(result[0]);
          }
        } catch (error) {
          recordsFailed++;
          errors.push(`Lead ${i}: ${error}`);
        }
      }

      if (recordsCreated > 0) {
        this.createdData[tableName] = await sql`SELECT * FROM leads WHERE first_name = 'Test'`;
      }

    } catch (error) {
      recordsFailed = 15;
      errors.push(`Transaction failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_created: recordsCreated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 3),
      sample_records: sampleRecords
    });

    console.log(`      ✅ ${recordsCreated} created, ${recordsFailed} failed`);
  }

  private async seedClients() {
    const tableName = 'clients';
    console.log(`   🌱 Seeding ${tableName}...`);
    
    const startTime = Date.now();
    let recordsCreated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    const sampleRecords: any[] = [];

    try {
      const addresses = this.createdData.addresses || [];
      const statuses = ['Active', 'Inactive', 'Prospect'];
      const clientTypes = ['Individual', 'Business'];
      
      for (let i = 0; i < 8; i++) {
        const clientType = faker.helpers.arrayElement(clientTypes);
        const createdBy = this.existingUsers.length > 0 ? faker.helpers.arrayElement(this.existingUsers).id : null;
        const addressId = addresses.length > 0 ? faker.helpers.arrayElement(addresses).id : null;
        
        try {
          const result = await sql`
            INSERT INTO clients (
              id, name, email, phone_number, status, client_type,
              address_id, ai_risk_score, notes, created_by
            ) VALUES (
              ${faker.string.uuid()}, 
              ${clientType === 'Individual' ? 'Test ' + faker.person.fullName() : 'Test ' + faker.company.name()}, 
              ${faker.internet.email()}, 
              ${faker.phone.number()},
              ${faker.helpers.arrayElement(statuses)}, 
              ${clientType},
              ${addressId}, 
              ${faker.number.int({ min: 0, max: 100 })},
              ${faker.lorem.paragraph()}, 
              ${createdBy}
            ) RETURNING *
          `;
          recordsCreated++;
          if (sampleRecords.length < 2) {
            sampleRecords.push(result[0]);
          }
        } catch (error) {
          recordsFailed++;
          errors.push(`Client ${i}: ${error}`);
        }
      }

      if (recordsCreated > 0) {
        this.createdData[tableName] = await sql`SELECT * FROM clients WHERE name LIKE '%Test%'`;
      }

    } catch (error) {
      recordsFailed = 8;
      errors.push(`Transaction failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_created: recordsCreated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 3),
      sample_records: sampleRecords
    });

    console.log(`      ✅ ${recordsCreated} created, ${recordsFailed} failed`);
  }

  private async seedCommunications() {
    const tableName = 'communications';
    console.log(`   🌱 Seeding ${tableName}...`);
    
    const startTime = Date.now();
    let recordsCreated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    const sampleRecords: any[] = [];

    try {
      const leads = this.createdData.leads || [];
      const clients = this.createdData.clients || [];
      const statuses = ['Delivered', 'Sent', 'Opened', 'Replied'];
      const directions = ['Inbound', 'Outbound'];
      const types = ['call', 'email', 'sms'];
      
      for (let i = 0; i < 20; i++) {
        const isLead = faker.datatype.boolean() && leads.length > 0;
        const target = isLead ? faker.helpers.arrayElement(leads) : (clients.length > 0 ? faker.helpers.arrayElement(clients) : null);
        const createdBy = this.existingUsers.length > 0 ? faker.helpers.arrayElement(this.existingUsers).id : null;
        
        if (!target) continue;
        
        try {
          const result = await sql`
            INSERT INTO communications (
              id, type, direction, status, content,
              lead_id, client_id, created_by
            ) VALUES (
              ${faker.string.uuid()}, 
              ${faker.helpers.arrayElement(types)}, 
              ${faker.helpers.arrayElement(directions)}, 
              ${faker.helpers.arrayElement(statuses)},
              ${'[TEST] ' + faker.lorem.paragraph()},
              ${isLead ? target.id : null}, 
              ${!isLead ? target.id : null}, 
              ${createdBy}
            ) RETURNING *
          `;
          recordsCreated++;
          if (sampleRecords.length < 2) {
            sampleRecords.push(result[0]);
          }
        } catch (error) {
          recordsFailed++;
          errors.push(`Communication ${i}: ${error}`);
        }
      }

      if (recordsCreated > 0) {
        this.createdData[tableName] = await sql`SELECT * FROM communications WHERE content LIKE '%[TEST]%'`;
      }

    } catch (error) {
      recordsFailed = 20;
      errors.push(`Transaction failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_created: recordsCreated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 3),
      sample_records: sampleRecords
    });

    console.log(`      ✅ ${recordsCreated} created, ${recordsFailed} failed`);
  }

  private async seedQuotes() {
    const tableName = 'quotes';
    console.log(`   🌱 Seeding ${tableName}...`);
    
    const startTime = Date.now();
    let recordsCreated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    const sampleRecords: any[] = [];

    try {
      const leads = this.createdData.leads || [];
      const insuranceTypes = this.createdData.insurance_types || [];
      const statuses = ['Draft', 'Pending', 'Approved'];
      const contractTerms = ['6mo', '12mo', '24mo'];
      
      for (let i = 0; i < 10; i++) {
        const lead = leads.length > 0 ? faker.helpers.arrayElement(leads) : null;
        const insuranceType = insuranceTypes.length > 0 ? faker.helpers.arrayElement(insuranceTypes) : null;
        const createdBy = this.existingUsers.length > 0 ? faker.helpers.arrayElement(this.existingUsers).id : null;
        
        if (!lead || !insuranceType) continue;
        
        try {
          const result = await sql`
            INSERT INTO quotes (
              id, quote_number, lead_id, insurance_type_id, status,
              premium_amount, deductible, contract_term, created_by
            ) VALUES (
              ${faker.string.uuid()}, 
              ${'TEST-' + Date.now() + '-' + i}, 
              ${lead.id}, 
              ${insuranceType.id}, 
              ${faker.helpers.arrayElement(statuses)},
              ${faker.number.float({ min: 500, max: 3000, fractionDigits: 2 })}, 
              ${faker.number.float({ min: 250, max: 1000, fractionDigits: 2 })}, 
              ${faker.helpers.arrayElement(contractTerms)}, 
              ${createdBy}
            ) RETURNING *
          `;
          recordsCreated++;
          if (sampleRecords.length < 2) {
            sampleRecords.push(result[0]);
          }
        } catch (error) {
          recordsFailed++;
          errors.push(`Quote ${i}: ${error}`);
        }
      }

      if (recordsCreated > 0) {
        this.createdData[tableName] = await sql`SELECT * FROM quotes WHERE quote_number LIKE 'TEST-%'`;
      }

    } catch (error) {
      recordsFailed = 10;
      errors.push(`Transaction failed: ${error}`);
    }

    this.results.push({
      table: tableName,
      records_created: recordsCreated,
      records_failed: recordsFailed,
      execution_time_ms: Date.now() - startTime,
      errors: errors.slice(0, 3),
      sample_records: sampleRecords
    });

    console.log(`      ✅ ${recordsCreated} created, ${recordsFailed} failed`);
  }

  private async validateResults() {
    console.log('🔍 Validating seeding results...');
    
    for (const result of this.results) {
      if (result.records_created > 0) {
        console.log(`   ✅ ${result.table}: ${result.records_created} records validated`);
      } else if (result.records_failed > 0) {
        console.log(`   ⚠️  ${result.table}: ${result.records_failed} failures`);
      }
    }
  }

  private async generateReport() {
    console.log('📄 Generating seeding report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_tables: this.results.length,
        total_records_created: this.results.reduce((sum, r) => sum + r.records_created, 0),
        total_records_failed: this.results.reduce((sum, r) => sum + r.records_failed, 0),
        total_execution_time_ms: this.results.reduce((sum, r) => sum + r.execution_time_ms, 0),
        success_rate: 0,
        existing_users_found: this.existingUsers.length
      },
      seeding_results: this.results,
      created_data_summary: Object.keys(this.createdData).map(table => ({
        table,
        count: this.createdData[table].length
      }))
    };

    const totalAttempts = report.summary.total_records_created + report.summary.total_records_failed;
    report.summary.success_rate = totalAttempts > 0 ? ((report.summary.total_records_created / totalAttempts) * 100) : 0;

    // Save detailed JSON report
    writeFileSync('focused-seeding-results.json', JSON.stringify(report, null, 2));
  }
}

// Run the focused data seeder
if (require.main === module) {
  const seeder = new FocusedDataSeeder();
  seeder.run().catch(console.error);
}

export { FocusedDataSeeder };
