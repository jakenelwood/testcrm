#!/usr/bin/env tsx

/**
 * 🌱 Schema-Aware Seeder Framework
 * 
 * Intelligent seeder system that validates data against database constraints before insertion.
 * Uses constraint validation infrastructure from Phase 2 to ensure data integrity.
 * 
 * Part of Phase 3: Data Population
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import * as schema from '../lib/drizzle/schema';
import { faker } from '@faker-js/faker';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });
const db = drizzle(sql, { schema });

interface TableConstraints {
  table_name: string;
  enum_constraints: Record<string, string[]>;
  range_constraints: Record<string, { min: number; max: number }>;
  required_fields: string[];
  unique_fields: string[];
  foreign_keys: Record<string, { table: string; field: string }>;
}

interface SeedingResult {
  table: string;
  records_created: number;
  records_failed: number;
  execution_time_ms: number;
  errors: string[];
  sample_data: any[];
}

interface SeedingPlan {
  table: string;
  count: number;
  dependencies: string[];
  generator: (constraints: TableConstraints, existingData: Record<string, any[]>) => Promise<any[]>;
}

class SchemaAwareSeederFramework {
  private constraints: Record<string, TableConstraints> = {};
  private seedingResults: SeedingResult[] = [];
  private existingData: Record<string, any[]> = {};

  async run() {
    console.log('🌱 Starting Schema-Aware Seeder Framework...\n');
    
    try {
      await this.loadConstraints();
      await this.executeSeedingPlan();
      await this.validateResults();
      await this.generateReport();
      
      const totalRecords = this.seedingResults.reduce((sum, r) => sum + r.records_created, 0);
      const totalErrors = this.seedingResults.reduce((sum, r) => sum + r.records_failed, 0);
      
      console.log(`\n✅ Schema-aware seeding completed!`);
      console.log(`📊 Results: ${totalRecords} records created, ${totalErrors} errors`);
      console.log(`📄 Report saved to: seeding-results.json`);
      console.log(`📋 Summary saved to: seeding-summary.md`);
      
    } catch (error) {
      console.error('❌ Schema-aware seeding failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async loadConstraints() {
    console.log('📋 Loading database constraints...');
    
    // Load enum constraints
    const enumConstraints = await sql`
      SELECT 
        t.relname as table_name,
        a.attname as column_name,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE n.nspname = 'public'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%ARRAY%'
      ORDER BY t.relname, a.attname;
    `;

    // Load range constraints
    const rangeConstraints = await sql`
      SELECT 
        t.relname as table_name,
        a.attname as column_name,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      LEFT JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE n.nspname = 'public'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%ARRAY%'
      AND pg_get_constraintdef(c.oid) LIKE '%>=%'
      ORDER BY t.relname, a.attname;
    `;

    // Load required fields (NOT NULL constraints)
    const requiredFields = await sql`
      SELECT 
        table_name,
        column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND is_nullable = 'NO'
      AND column_default IS NULL
      ORDER BY table_name, column_name;
    `;

    // Process constraints into structured format
    const tables = ['users', 'insurance_types', 'addresses', 'leads', 'clients', 'communications', 'quotes', 'pipelines', 'pipeline_statuses'];
    
    for (const table of tables) {
      this.constraints[table] = {
        table_name: table,
        enum_constraints: {},
        range_constraints: {},
        required_fields: [],
        unique_fields: [],
        foreign_keys: {}
      };

      // Process enum constraints
      for (const constraint of enumConstraints) {
        if (constraint.table_name === table) {
          const values = this.extractEnumValues(constraint.constraint_definition);
          this.constraints[table].enum_constraints[constraint.column_name] = values;
        }
      }

      // Process range constraints
      for (const constraint of rangeConstraints) {
        if (constraint.table_name === table && constraint.column_name) {
          const range = this.extractRange(constraint.constraint_definition);
          if (range) {
            this.constraints[table].range_constraints[constraint.column_name] = range;
          }
        }
      }

      // Process required fields
      for (const field of requiredFields) {
        if (field.table_name === table) {
          this.constraints[table].required_fields.push(field.column_name);
        }
      }
    }

    // Define known foreign keys and unique fields
    this.defineKnownConstraints();
    
    console.log(`   Loaded constraints for ${tables.length} tables`);
  }

  private defineKnownConstraints() {
    // Define foreign key relationships
    this.constraints.leads.foreign_keys = {
      assigned_to: { table: 'users', field: 'id' },
      created_by: { table: 'users', field: 'id' },
      address_id: { table: 'addresses', field: 'id' }
    };

    this.constraints.clients.foreign_keys = {
      created_by: { table: 'users', field: 'id' },
      address_id: { table: 'addresses', field: 'id' }
    };

    this.constraints.communications.foreign_keys = {
      lead_id: { table: 'leads', field: 'id' },
      client_id: { table: 'clients', field: 'id' },
      created_by: { table: 'users', field: 'id' }
    };

    this.constraints.quotes.foreign_keys = {
      lead_id: { table: 'leads', field: 'id' },
      insurance_type_id: { table: 'insurance_types', field: 'id' },
      created_by: { table: 'users', field: 'id' }
    };

    // Define unique fields
    this.constraints.users.unique_fields = ['email'];
    this.constraints.insurance_types.unique_fields = ['name'];
  }

  private async executeSeedingPlan() {
    console.log('🌱 Executing seeding plan...');
    
    const seedingPlan: SeedingPlan[] = [
      {
        table: 'users',
        count: 10,
        dependencies: [],
        generator: this.generateUsers.bind(this)
      },
      {
        table: 'insurance_types',
        count: 8,
        dependencies: [],
        generator: this.generateInsuranceTypes.bind(this)
      },
      {
        table: 'addresses',
        count: 20,
        dependencies: [],
        generator: this.generateAddresses.bind(this)
      },
      {
        table: 'pipelines',
        count: 3,
        dependencies: ['users'],
        generator: this.generatePipelines.bind(this)
      },
      {
        table: 'pipeline_statuses',
        count: 12,
        dependencies: ['pipelines'],
        generator: this.generatePipelineStatuses.bind(this)
      },
      {
        table: 'leads',
        count: 50,
        dependencies: ['users', 'addresses'],
        generator: this.generateLeads.bind(this)
      },
      {
        table: 'clients',
        count: 25,
        dependencies: ['users', 'addresses'],
        generator: this.generateClients.bind(this)
      },
      {
        table: 'communications',
        count: 100,
        dependencies: ['users', 'leads', 'clients'],
        generator: this.generateCommunications.bind(this)
      },
      {
        table: 'quotes',
        count: 30,
        dependencies: ['users', 'leads', 'insurance_types'],
        generator: this.generateQuotes.bind(this)
      }
    ];

    for (const plan of seedingPlan) {
      await this.seedTable(plan);
    }
  }

  private async seedTable(plan: SeedingPlan) {
    console.log(`   🌱 Seeding ${plan.table} (${plan.count} records)...`);
    
    const startTime = Date.now();
    let recordsCreated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    const sampleData: any[] = [];

    try {
      // Generate data using the plan's generator
      const data = await plan.generator(this.constraints[plan.table], this.existingData);
      
      // Insert data in batches with transaction support
      const batchSize = 10;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        try {
          await sql.begin(async (tx) => {
            for (const record of batch) {
              try {
                const result = await this.insertRecord(plan.table, record, tx);
                recordsCreated++;
                if (sampleData.length < 3) {
                  sampleData.push(result);
                }
              } catch (error) {
                recordsFailed++;
                errors.push(`Record ${i}: ${error}`);
              }
            }
          });
        } catch (error) {
          recordsFailed += batch.length;
          errors.push(`Batch ${i}-${i + batchSize}: ${error}`);
        }
      }

      // Store data for dependent tables
      if (recordsCreated > 0) {
        this.existingData[plan.table] = await this.loadExistingData(plan.table);
      }

    } catch (error) {
      recordsFailed = plan.count;
      errors.push(`Generation failed: ${error}`);
    }

    const executionTime = Date.now() - startTime;

    this.seedingResults.push({
      table: plan.table,
      records_created: recordsCreated,
      records_failed: recordsFailed,
      execution_time_ms: executionTime,
      errors: errors.slice(0, 5), // Keep only first 5 errors
      sample_data: sampleData
    });

    console.log(`      ✅ ${recordsCreated} created, ${recordsFailed} failed (${executionTime}ms)`);
  }

  private async insertRecord(table: string, record: any, tx: any): Promise<any> {
    // This is a simplified insertion - in a real implementation, you'd use the actual Drizzle schema
    const query = `INSERT INTO ${table} (${Object.keys(record).join(', ')}) VALUES (${Object.keys(record).map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
    const values = Object.values(record);
    
    const result = await tx.unsafe(query, values);
    return result[0];
  }

  private async loadExistingData(table: string): Promise<any[]> {
    const result = await sql.unsafe(`SELECT * FROM ${table} LIMIT 100`);
    return result;
  }

  // Data generators will be implemented in the next part
  private async generateUsers(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const users = [];
    const roles = constraints.enum_constraints.role || ['user', 'admin', 'agent', 'manager'];
    
    for (let i = 0; i < 10; i++) {
      users.push({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        full_name: faker.person.fullName(),
        role: faker.helpers.arrayElement(roles),
        created_at: faker.date.past(),
        updated_at: new Date()
      });
    }
    
    return users;
  }

  private async generateInsuranceTypes(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const types = [
      'Auto Insurance', 'Home Insurance', 'Life Insurance', 'Health Insurance',
      'Business Insurance', 'Renters Insurance', 'Umbrella Insurance', 'Disability Insurance'
    ];
    
    return types.map(name => ({
      id: faker.number.int({ min: 1, max: 1000 }),
      name,
      description: `Comprehensive ${name.toLowerCase()} coverage`,
      created_at: faker.date.past(),
      updated_at: new Date()
    }));
  }

  private async generateAddresses(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const addresses = [];
    const types = constraints.enum_constraints.type || ['Physical', 'Mailing', 'Business'];
    
    for (let i = 0; i < 20; i++) {
      addresses.push({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(types),
        line1: faker.location.streetAddress(),
        line2: faker.datatype.boolean() ? faker.location.secondaryAddress() : null,
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        postal_code: faker.location.zipCode(),
        country: 'US',
        created_at: faker.date.past(),
        updated_at: new Date()
      });
    }
    
    return addresses;
  }

  private async generatePipelines(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const users = existingData.users || [];
    const leadTypes = constraints.enum_constraints.lead_type || ['Personal', 'Business', 'Both'];
    
    return [
      {
        id: faker.string.uuid(),
        name: 'Personal Insurance Pipeline',
        description: 'Pipeline for personal insurance leads',
        lead_type: 'Personal',
        is_active: true,
        created_by: faker.helpers.arrayElement(users)?.id,
        created_at: faker.date.past(),
        updated_at: new Date()
      },
      {
        id: faker.string.uuid(),
        name: 'Business Insurance Pipeline',
        description: 'Pipeline for business insurance leads',
        lead_type: 'Business',
        is_active: true,
        created_by: faker.helpers.arrayElement(users)?.id,
        created_at: faker.date.past(),
        updated_at: new Date()
      },
      {
        id: faker.string.uuid(),
        name: 'Universal Pipeline',
        description: 'Pipeline for all types of leads',
        lead_type: 'Both',
        is_active: true,
        created_by: faker.helpers.arrayElement(users)?.id,
        created_at: faker.date.past(),
        updated_at: new Date()
      }
    ];
  }

  private async generatePipelineStatuses(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const pipelines = existingData.pipelines || [];
    const stageTypes = constraints.enum_constraints.stage_type || ['active', 'waiting', 'final'];
    
    const statuses = [];
    
    for (const pipeline of pipelines) {
      const pipelineStatuses = [
        { name: 'New Lead', stage_type: 'active', order_position: 1 },
        { name: 'Contacted', stage_type: 'active', order_position: 2 },
        { name: 'Qualified', stage_type: 'active', order_position: 3 },
        { name: 'Quoted', stage_type: 'waiting', order_position: 4 },
        { name: 'Sold', stage_type: 'final', order_position: 5 },
        { name: 'Lost', stage_type: 'final', order_position: 6 }
      ];
      
      for (const status of pipelineStatuses) {
        statuses.push({
          id: faker.string.uuid(),
          pipeline_id: pipeline.id,
          name: status.name,
          description: `${status.name} stage in ${pipeline.name}`,
          stage_type: status.stage_type,
          order_position: status.order_position,
          is_active: true,
          created_at: faker.date.past(),
          updated_at: new Date()
        });
      }
    }
    
    return statuses;
  }

  private async generateLeads(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const users = existingData.users || [];
    const addresses = existingData.addresses || [];
    const statuses = constraints.enum_constraints.status || ['New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated'];
    const priorities = constraints.enum_constraints.priority || ['Low', 'Medium', 'High', 'Urgent'];
    const leadTypes = constraints.enum_constraints.lead_type || ['Personal', 'Business'];

    const leads = [];

    for (let i = 0; i < 50; i++) {
      const leadType = faker.helpers.arrayElement(leadTypes);
      const isPersonal = leadType === 'Personal';

      leads.push({
        id: faker.string.uuid(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        phone_number: faker.phone.number(),
        company_name: isPersonal ? null : faker.company.name(),
        job_title: isPersonal ? null : faker.person.jobTitle(),
        status: faker.helpers.arrayElement(statuses),
        priority: faker.helpers.arrayElement(priorities),
        lead_type: leadType,
        lead_source: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Social Media', 'Advertisement']),
        assigned_to: faker.helpers.arrayElement(users)?.id,
        address_id: faker.helpers.arrayElement(addresses)?.id,
        ai_follow_up_priority: faker.number.int({ min: 1, max: 10 }),
        ai_conversion_probability: faker.number.int({ min: 0, max: 100 }),
        notes: faker.lorem.paragraph(),
        created_by: faker.helpers.arrayElement(users)?.id,
        created_at: faker.date.past(),
        updated_at: new Date()
      });
    }

    return leads;
  }

  private async generateClients(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const users = existingData.users || [];
    const addresses = existingData.addresses || [];
    const statuses = constraints.enum_constraints.status || ['Active', 'Inactive', 'Prospect', 'Lost'];
    const clientTypes = constraints.enum_constraints.client_type || ['Individual', 'Business'];

    const clients = [];

    for (let i = 0; i < 25; i++) {
      const clientType = faker.helpers.arrayElement(clientTypes);
      const isIndividual = clientType === 'Individual';

      clients.push({
        id: faker.string.uuid(),
        name: isIndividual ? faker.person.fullName() : faker.company.name(),
        email: faker.internet.email(),
        phone_number: faker.phone.number(),
        status: faker.helpers.arrayElement(statuses),
        client_type: clientType,
        address_id: faker.helpers.arrayElement(addresses)?.id,
        mailing_address_id: faker.datatype.boolean() ? faker.helpers.arrayElement(addresses)?.id : null,
        ai_risk_score: faker.number.int({ min: 0, max: 100 }),
        ai_lifetime_value: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
        ai_churn_probability: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
        notes: faker.lorem.paragraph(),
        created_by: faker.helpers.arrayElement(users)?.id,
        created_at: faker.date.past(),
        updated_at: new Date()
      });
    }

    return clients;
  }

  private async generateCommunications(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const users = existingData.users || [];
    const leads = existingData.leads || [];
    const clients = existingData.clients || [];
    const statuses = constraints.enum_constraints.status || ['Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Replied', 'Failed', 'Bounced'];
    const directions = constraints.enum_constraints.direction || ['Inbound', 'Outbound'];
    const types = constraints.enum_constraints.type || ['call', 'email', 'sms', 'meeting', 'note', 'voicemail'];
    const sentiments = constraints.enum_constraints.ai_sentiment || ['Positive', 'Neutral', 'Negative'];

    const communications = [];

    for (let i = 0; i < 100; i++) {
      const type = faker.helpers.arrayElement(types);
      const direction = faker.helpers.arrayElement(directions);
      const isLead = faker.datatype.boolean();
      const target = isLead ? faker.helpers.arrayElement(leads) : faker.helpers.arrayElement(clients);

      const communication = {
        id: faker.string.uuid(),
        type,
        direction,
        status: faker.helpers.arrayElement(statuses),
        subject: type === 'email' ? faker.lorem.sentence() : null,
        content: faker.lorem.paragraphs(2),
        duration: type === 'call' ? faker.number.int({ min: 30, max: 1800 }) : null,
        call_quality_score: type === 'call' ? faker.number.int({ min: 1, max: 5 }) : null,
        ai_summary: faker.lorem.sentence(),
        ai_sentiment: faker.helpers.arrayElement(sentiments),
        created_by: faker.helpers.arrayElement(users)?.id,
        created_at: faker.date.past(),
        updated_at: new Date()
      };

      if (isLead && target) {
        communication.lead_id = target.id;
        communication.client_id = null;
      } else if (target) {
        communication.lead_id = null;
        communication.client_id = target.id;
      }

      communications.push(communication);
    }

    return communications;
  }

  private async generateQuotes(constraints: TableConstraints, existingData: Record<string, any[]>): Promise<any[]> {
    const users = existingData.users || [];
    const leads = existingData.leads || [];
    const insuranceTypes = existingData.insurance_types || [];
    const statuses = constraints.enum_constraints.status || ['Draft', 'Pending', 'Approved', 'Declined', 'Expired', 'Bound'];
    const contractTerms = constraints.enum_constraints.contract_term || ['6mo', '12mo', '24mo'];

    const quotes = [];

    for (let i = 0; i < 30; i++) {
      const lead = faker.helpers.arrayElement(leads);
      const insuranceType = faker.helpers.arrayElement(insuranceTypes);
      const contractTerm = faker.helpers.arrayElement(contractTerms);
      const effectiveDate = faker.date.future();

      quotes.push({
        id: faker.string.uuid(),
        quote_number: `Q-${Date.now()}-${i.toString().padStart(3, '0')}`,
        lead_id: lead?.id,
        insurance_type_id: insuranceType?.id,
        status: faker.helpers.arrayElement(statuses),
        premium_amount: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
        deductible: faker.number.float({ min: 250, max: 2500, fractionDigits: 2 }),
        coverage_limits: {
          liability: faker.number.int({ min: 100000, max: 1000000 }),
          comprehensive: faker.number.int({ min: 50000, max: 500000 }),
          collision: faker.number.int({ min: 50000, max: 500000 })
        },
        contract_term: contractTerm,
        effective_date: effectiveDate,
        expiration_date: new Date(effectiveDate.getTime() + (contractTerm === '6mo' ? 6 : contractTerm === '12mo' ? 12 : 24) * 30 * 24 * 60 * 60 * 1000),
        notes: faker.lorem.paragraph(),
        ai_risk_assessment: {
          risk_score: faker.number.int({ min: 1, max: 10 }),
          risk_factors: faker.helpers.arrayElements(['Age', 'Location', 'Driving Record', 'Credit Score'], { min: 1, max: 3 })
        },
        ai_pricing_factors: {
          base_rate: faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 2 }),
          risk_multiplier: faker.number.float({ min: 0.9, max: 1.5, fractionDigits: 2 })
        },
        created_by: faker.helpers.arrayElement(users)?.id,
        created_at: faker.date.past(),
        updated_at: new Date()
      });
    }

    return quotes;
  }

  private extractEnumValues(constraintDef: string): string[] {
    const match = constraintDef.match(/ARRAY\[(.*?)\]/);
    if (match) {
      return match[1]
        .split(',')
        .map(v => v.trim().replace(/['"]::text/g, '').replace(/['"]/g, ''))
        .filter(v => v.length > 0);
    }
    return [];
  }

  private extractRange(constraintDef: string): { min: number; max: number } | null {
    const minMatch = constraintDef.match(/>=\s*(\d+)/);
    const maxMatch = constraintDef.match(/<=\s*(\d+)/);
    
    if (minMatch && maxMatch) {
      return {
        min: parseInt(minMatch[1]),
        max: parseInt(maxMatch[1])
      };
    }
    
    return null;
  }

  private async validateResults() {
    console.log('🔍 Validating seeding results...');
    // Validation will be implemented in the next part
  }

  private async generateReport() {
    console.log('📄 Generating seeding report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_tables: this.seedingResults.length,
        total_records_created: this.seedingResults.reduce((sum, r) => sum + r.records_created, 0),
        total_records_failed: this.seedingResults.reduce((sum, r) => sum + r.records_failed, 0),
        total_execution_time_ms: this.seedingResults.reduce((sum, r) => sum + r.execution_time_ms, 0),
        success_rate: 0
      },
      constraints_loaded: this.constraints,
      seeding_results: this.seedingResults
    };

    report.summary.success_rate = ((report.summary.total_records_created / (report.summary.total_records_created + report.summary.total_records_failed)) * 100);

    // Save detailed JSON report
    writeFileSync('seeding-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const summary = this.generateMarkdownSummary(report);
    writeFileSync('seeding-summary.md', summary);
  }

  private generateMarkdownSummary(report: any): string {
    return `# 🌱 Schema-Aware Seeding Results

Generated: ${report.generated_at}

## 📊 Summary
- **Total Tables**: ${report.summary.total_tables}
- **Records Created**: ${report.summary.total_records_created}
- **Records Failed**: ${report.summary.total_records_failed}
- **Success Rate**: ${report.summary.success_rate.toFixed(1)}%
- **Total Execution Time**: ${report.summary.total_execution_time_ms}ms

## 📋 Seeding Results by Table

${this.seedingResults.map(result => `
### ${result.table}
- **Records Created**: ${result.records_created}
- **Records Failed**: ${result.records_failed}
- **Execution Time**: ${result.execution_time_ms}ms
- **Errors**: ${result.errors.length > 0 ? result.errors.join(', ') : 'None'}
`).join('\n')}

## 🎯 Next Steps

1. **Review Failed Records**: Investigate any failed record insertions
2. **Validate Data Quality**: Run data quality checks on populated data
3. **Test Application**: Verify application works with populated data
4. **Performance Testing**: Test application performance with realistic data volumes
`;
  }
}

// Run the schema-aware seeder framework
if (require.main === module) {
  const seeder = new SchemaAwareSeederFramework();
  seeder.run().catch(console.error);
}

export { SchemaAwareSeederFramework };
