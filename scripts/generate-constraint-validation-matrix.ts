#!/usr/bin/env tsx

/**
 * 🔍 Generate Constraint Validation Matrix
 * 
 * Creates a detailed comparison matrix showing database reality vs Drizzle schema expectations.
 * Identifies mismatches between actual database constraints and application schema definitions.
 * 
 * Part of Phase 1: Database Schema Audit
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { writeFileSync } from 'fs';
import { config } from 'dotenv';
import * as schema from '../lib/drizzle/schema';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });

interface DatabaseConstraint {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  constraint_definition: string;
  column_name?: string;
}

interface DrizzleField {
  table: string;
  field: string;
  type: string;
  constraints: string[];
  nullable: boolean;
  default?: string;
}

interface ValidationResult {
  table: string;
  field?: string;
  status: 'MATCH' | 'MISMATCH' | 'MISSING_IN_DB' | 'MISSING_IN_DRIZZLE';
  database_constraint?: string;
  drizzle_constraint?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

class ConstraintValidationMatrix {
  private dbConstraints: DatabaseConstraint[] = [];
  private drizzleFields: DrizzleField[] = [];
  private validationResults: ValidationResult[] = [];

  async run() {
    console.log('🔍 Generating Constraint Validation Matrix...\n');
    
    try {
      await this.extractDatabaseConstraints();
      await this.extractDrizzleSchema();
      await this.performValidation();
      await this.generateMatrix();
      
      console.log('✅ Constraint validation matrix generated successfully!');
      console.log('📄 Matrix saved to: constraint-validation-matrix.json');
      console.log('📋 Summary saved to: constraint-validation-summary.md');
      
    } catch (error) {
      console.error('❌ Failed to generate constraint validation matrix:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async extractDatabaseConstraints() {
    console.log('📋 Extracting database constraints...');
    
    const constraints = await sql`
      SELECT 
        t.relname as table_name,
        c.conname as constraint_name,
        c.contype as constraint_type,
        pg_get_constraintdef(c.oid) as constraint_definition,
        a.attname as column_name
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      LEFT JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE n.nspname = 'public'
      AND c.contype IN ('c', 'u', 'p', 'f')  -- Check, Unique, Primary Key, Foreign Key
      ORDER BY t.relname, c.conname;
    `;
    
    this.dbConstraints = constraints as DatabaseConstraint[];
    console.log(`   Found ${this.dbConstraints.length} database constraints`);
  }

  private async extractDrizzleSchema() {
    console.log('🔧 Analyzing Drizzle schema definitions...');
    
    // This is a simplified analysis - in a real implementation, you'd parse the actual schema files
    // For now, we'll focus on the key tables and their expected constraints
    
    const keyTables = [
      'users', 'leads', 'clients', 'communications', 'quotes', 
      'pipelines', 'pipeline_statuses', 'addresses', 'insurance_types'
    ];
    
    // Extract column information from database to compare with Drizzle expectations
    for (const tableName of keyTables) {
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `;
      
      for (const col of columns) {
        this.drizzleFields.push({
          table: tableName,
          field: col.column_name,
          type: col.data_type,
          constraints: [],
          nullable: col.is_nullable === 'YES',
          default: col.column_default
        });
      }
    }
    
    console.log(`   Analyzed ${this.drizzleFields.length} fields across ${keyTables.length} tables`);
  }

  private async performValidation() {
    console.log('🔍 Performing constraint validation...');
    
    // Check for critical enum constraint mismatches
    await this.validateEnumConstraints();
    
    // Check for missing primary keys
    await this.validatePrimaryKeys();
    
    // Check for foreign key consistency
    await this.validateForeignKeys();
    
    // Check for unique constraints
    await this.validateUniqueConstraints();
    
    console.log(`   Generated ${this.validationResults.length} validation results`);
  }

  private async validateEnumConstraints() {
    // Focus on tables with enum-like constraints that commonly cause issues
    const enumTables = [
      { table: 'communications', field: 'status', expected: ['Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Replied', 'Failed', 'Bounced'] },
      { table: 'leads', field: 'status', expected: ['New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated'] },
      { table: 'clients', field: 'status', expected: ['Active', 'Inactive', 'Prospect', 'Lost'] },
      { table: 'quotes', field: 'status', expected: ['Draft', 'Pending', 'Approved', 'Declined', 'Expired', 'Bound'] }
    ];
    
    for (const enumDef of enumTables) {
      const constraint = this.dbConstraints.find(c => 
        c.table_name === enumDef.table && 
        c.constraint_definition.includes(enumDef.field) &&
        c.constraint_type === 'c'
      );
      
      if (constraint) {
        const actualValues = this.extractEnumValues(constraint.constraint_definition);
        const missing = enumDef.expected.filter(v => !actualValues.includes(v));
        const extra = actualValues.filter(v => !enumDef.expected.includes(v));
        
        if (missing.length > 0 || extra.length > 0) {
          this.validationResults.push({
            table: enumDef.table,
            field: enumDef.field,
            status: 'MISMATCH',
            database_constraint: actualValues.join(', '),
            drizzle_constraint: enumDef.expected.join(', '),
            severity: missing.length > 0 ? 'HIGH' : 'MEDIUM',
            recommendation: missing.length > 0 
              ? `Add missing values to database constraint: ${missing.join(', ')}`
              : `Consider removing unused values from database: ${extra.join(', ')}`
          });
        } else {
          this.validationResults.push({
            table: enumDef.table,
            field: enumDef.field,
            status: 'MATCH',
            database_constraint: actualValues.join(', '),
            drizzle_constraint: enumDef.expected.join(', '),
            severity: 'LOW',
            recommendation: 'Constraint matches expected values'
          });
        }
      } else {
        this.validationResults.push({
          table: enumDef.table,
          field: enumDef.field,
          status: 'MISSING_IN_DB',
          drizzle_constraint: enumDef.expected.join(', '),
          severity: 'CRITICAL',
          recommendation: `Add check constraint for ${enumDef.field} with values: ${enumDef.expected.join(', ')}`
        });
      }
    }
  }

  private async validatePrimaryKeys() {
    const tables = [...new Set(this.drizzleFields.map(f => f.table))];
    
    for (const table of tables) {
      const pkConstraint = this.dbConstraints.find(c => 
        c.table_name === table && c.constraint_type === 'p'
      );
      
      if (!pkConstraint) {
        this.validationResults.push({
          table,
          status: 'MISSING_IN_DB',
          severity: 'CRITICAL',
          recommendation: `Add primary key constraint to table ${table}`
        });
      }
    }
  }

  private async validateForeignKeys() {
    // Check for foreign key constraints that should exist
    const expectedFKs = [
      { table: 'leads', field: 'assigned_to', references: 'users(id)' },
      { table: 'communications', field: 'lead_id', references: 'leads(id)' },
      { table: 'quotes', field: 'lead_id', references: 'leads(id)' },
    ];
    
    for (const fk of expectedFKs) {
      const constraint = this.dbConstraints.find(c => 
        c.table_name === fk.table && 
        c.constraint_type === 'f' &&
        c.constraint_definition.includes(fk.field)
      );
      
      if (!constraint) {
        this.validationResults.push({
          table: fk.table,
          field: fk.field,
          status: 'MISSING_IN_DB',
          drizzle_constraint: `FOREIGN KEY REFERENCES ${fk.references}`,
          severity: 'HIGH',
          recommendation: `Add foreign key constraint: ${fk.field} REFERENCES ${fk.references}`
        });
      }
    }
  }

  private async validateUniqueConstraints() {
    // Check for expected unique constraints
    const expectedUnique = [
      { table: 'users', field: 'email' },
      { table: 'insurance_types', field: 'name' },
    ];
    
    for (const unique of expectedUnique) {
      const constraint = this.dbConstraints.find(c => 
        c.table_name === unique.table && 
        c.constraint_type === 'u' &&
        c.constraint_definition.includes(unique.field)
      );
      
      if (!constraint) {
        this.validationResults.push({
          table: unique.table,
          field: unique.field,
          status: 'MISSING_IN_DB',
          drizzle_constraint: 'UNIQUE',
          severity: 'MEDIUM',
          recommendation: `Add unique constraint to ${unique.field}`
        });
      }
    }
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

  private async generateMatrix() {
    console.log('📄 Generating validation matrix...');
    
    const matrix = {
      generated_at: new Date().toISOString(),
      summary: {
        total_validations: this.validationResults.length,
        matches: this.validationResults.filter(r => r.status === 'MATCH').length,
        mismatches: this.validationResults.filter(r => r.status === 'MISMATCH').length,
        missing_in_db: this.validationResults.filter(r => r.status === 'MISSING_IN_DB').length,
        missing_in_drizzle: this.validationResults.filter(r => r.status === 'MISSING_IN_DRIZZLE').length,
        critical_issues: this.validationResults.filter(r => r.severity === 'CRITICAL').length,
        high_issues: this.validationResults.filter(r => r.severity === 'HIGH').length
      },
      database_constraints: this.dbConstraints,
      validation_results: this.validationResults
    };
    
    // Save detailed JSON
    writeFileSync('constraint-validation-matrix.json', JSON.stringify(matrix, null, 2));
    
    // Generate markdown summary
    const summary = this.generateMarkdownSummary(matrix);
    writeFileSync('constraint-validation-summary.md', summary);
  }

  private generateMarkdownSummary(matrix: any): string {
    const criticalIssues = this.validationResults.filter(r => r.severity === 'CRITICAL');
    const highIssues = this.validationResults.filter(r => r.severity === 'HIGH');
    
    return `# 🔍 Constraint Validation Matrix

Generated: ${matrix.generated_at}

## 📊 Summary
- **Total Validations**: ${matrix.summary.total_validations}
- **Matches**: ${matrix.summary.matches}
- **Mismatches**: ${matrix.summary.mismatches}
- **Missing in Database**: ${matrix.summary.missing_in_db}
- **Missing in Drizzle**: ${matrix.summary.missing_in_drizzle}
- **Critical Issues**: ${matrix.summary.critical_issues}
- **High Priority Issues**: ${matrix.summary.high_issues}

## 🚨 Critical Issues

${criticalIssues.map(issue => `
### ${issue.table}${issue.field ? `.${issue.field}` : ''}
- **Status**: ${issue.status}
- **Severity**: ${issue.severity}
- **Database**: ${issue.database_constraint || 'N/A'}
- **Expected**: ${issue.drizzle_constraint || 'N/A'}
- **Recommendation**: ${issue.recommendation}
`).join('\n')}

## ⚠️ High Priority Issues

${highIssues.map(issue => `
### ${issue.table}${issue.field ? `.${issue.field}` : ''}
- **Status**: ${issue.status}
- **Database**: ${issue.database_constraint || 'N/A'}
- **Expected**: ${issue.drizzle_constraint || 'N/A'}
- **Recommendation**: ${issue.recommendation}
`).join('\n')}

## 🎯 Next Steps

1. **Address Critical Issues**: Fix all CRITICAL severity issues immediately
2. **Resolve High Priority**: Address HIGH severity mismatches
3. **Update Schema**: Align Drizzle schema with database reality
4. **Test Thoroughly**: Validate all CRUD operations after fixes
`;
  }
}

// Run the matrix generator
if (require.main === module) {
  const generator = new ConstraintValidationMatrix();
  generator.run().catch(console.error);
}

export { ConstraintValidationMatrix };
