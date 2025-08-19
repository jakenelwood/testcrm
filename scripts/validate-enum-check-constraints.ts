#!/usr/bin/env tsx

/**
 * 🔍 Validate All Enum Values and Check Constraints
 * 
 * Systematically verifies all enum values and check constraints match application 
 * expectations across all tables. Identifies mismatches and provides recommendations.
 * 
 * Part of Phase 2: Constraint Remediation
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

interface EnumConstraint {
  table_name: string;
  column_name: string;
  constraint_name: string;
  allowed_values: string[];
  constraint_definition: string;
}

interface CheckConstraint {
  table_name: string;
  column_name: string;
  constraint_name: string;
  constraint_definition: string;
  constraint_type: 'RANGE' | 'ENUM' | 'PATTERN' | 'CUSTOM';
}

interface ValidationIssue {
  table: string;
  column: string;
  constraint: string;
  issue_type: 'MISSING_VALUE' | 'EXTRA_VALUE' | 'INVALID_RANGE' | 'INCONSISTENT_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  current_state: string;
  expected_state: string;
  recommendation: string;
}

class EnumCheckConstraintValidator {
  private enumConstraints: EnumConstraint[] = [];
  private checkConstraints: CheckConstraint[] = [];
  private validationIssues: ValidationIssue[] = [];

  async run() {
    console.log('🔍 Starting Enum and Check Constraint Validation...\n');
    
    try {
      await this.extractEnumConstraints();
      await this.extractCheckConstraints();
      await this.validateConstraints();
      await this.generateReport();
      
      console.log('✅ Enum and check constraint validation completed!');
      console.log(`📊 Found ${this.validationIssues.length} validation issues`);
      console.log('📄 Report saved to: enum-check-validation-report.json');
      console.log('📋 Summary saved to: enum-check-validation-summary.md');
      
    } catch (error) {
      console.error('❌ Enum and check constraint validation failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async extractEnumConstraints() {
    console.log('📋 Extracting enum constraints...');
    
    const constraints = await sql`
      SELECT 
        t.relname as table_name,
        a.attname as column_name,
        c.conname as constraint_name,
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
    
    for (const constraint of constraints) {
      const allowedValues = this.extractEnumValues(constraint.constraint_definition);
      if (allowedValues.length > 0) {
        this.enumConstraints.push({
          table_name: constraint.table_name,
          column_name: constraint.column_name,
          constraint_name: constraint.constraint_name,
          allowed_values: allowedValues,
          constraint_definition: constraint.constraint_definition
        });
      }
    }
    
    console.log(`   Found ${this.enumConstraints.length} enum constraints`);
  }

  private async extractCheckConstraints() {
    console.log('🔧 Extracting check constraints...');
    
    const constraints = await sql`
      SELECT 
        t.relname as table_name,
        a.attname as column_name,
        c.conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      LEFT JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE n.nspname = 'public'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%ARRAY%'
      ORDER BY t.relname, a.attname;
    `;
    
    for (const constraint of constraints) {
      this.checkConstraints.push({
        table_name: constraint.table_name,
        column_name: constraint.column_name || 'multiple',
        constraint_name: constraint.constraint_name,
        constraint_definition: constraint.constraint_definition,
        constraint_type: this.categorizeCheckConstraint(constraint.constraint_definition)
      });
    }
    
    console.log(`   Found ${this.checkConstraints.length} check constraints`);
  }

  private async validateConstraints() {
    console.log('🔍 Validating constraints against application expectations...');
    
    await this.validateEnumConstraints();
    await this.validateCheckConstraints();
    
    console.log(`   Generated ${this.validationIssues.length} validation issues`);
  }

  private async validateEnumConstraints() {
    // Define expected enum values based on application requirements
    const expectedEnums = {
      'communications.status': ['Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Replied', 'Failed', 'Bounced'],
      'communications.direction': ['Inbound', 'Outbound'],
      'communications.type': ['call', 'email', 'sms', 'meeting', 'note', 'voicemail', 'social', 'letter'],
      'leads.status': ['New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated'],
      'leads.priority': ['Low', 'Medium', 'High', 'Urgent'],
      'leads.lead_type': ['Personal', 'Business'],
      'clients.status': ['Active', 'Inactive', 'Prospect', 'Lost'],
      'clients.client_type': ['Individual', 'Business'],
      'quotes.status': ['Draft', 'Pending', 'Approved', 'Declined', 'Expired', 'Bound'],
      'quotes.contract_term': ['6mo', '12mo', '24mo'],
      'users.role': ['user', 'admin', 'agent', 'manager'],
      'pipelines.lead_type': ['Personal', 'Business', 'Both'],
      'pipeline_statuses.stage_type': ['active', 'waiting', 'final']
    };

    for (const enumConstraint of this.enumConstraints) {
      const key = `${enumConstraint.table_name}.${enumConstraint.column_name}`;
      const expectedValues = expectedEnums[key as keyof typeof expectedEnums];
      
      if (expectedValues) {
        // Check for missing values
        const missingValues = expectedValues.filter(v => !enumConstraint.allowed_values.includes(v));
        if (missingValues.length > 0) {
          this.validationIssues.push({
            table: enumConstraint.table_name,
            column: enumConstraint.column_name,
            constraint: enumConstraint.constraint_name,
            issue_type: 'MISSING_VALUE',
            severity: 'HIGH',
            current_state: enumConstraint.allowed_values.join(', '),
            expected_state: expectedValues.join(', '),
            recommendation: `Add missing values to constraint: ${missingValues.join(', ')}`
          });
        }

        // Check for extra values
        const extraValues = enumConstraint.allowed_values.filter(v => !expectedValues.includes(v));
        if (extraValues.length > 0) {
          this.validationIssues.push({
            table: enumConstraint.table_name,
            column: enumConstraint.column_name,
            constraint: enumConstraint.constraint_name,
            issue_type: 'EXTRA_VALUE',
            severity: 'MEDIUM',
            current_state: enumConstraint.allowed_values.join(', '),
            expected_state: expectedValues.join(', '),
            recommendation: `Consider removing unused values: ${extraValues.join(', ')}`
          });
        }

        // If perfect match, no issues
        if (missingValues.length === 0 && extraValues.length === 0) {
          console.log(`   ✅ ${key}: Perfect match`);
        }
      } else {
        console.log(`   ⚠️  ${key}: No expected values defined`);
      }
    }
  }

  private async validateCheckConstraints() {
    // Define expected check constraints
    const expectedChecks = {
      'leads.ai_follow_up_priority': { min: 1, max: 10, type: 'RANGE' },
      'leads.ai_conversion_probability': { min: 0, max: 100, type: 'RANGE' },
      'clients.ai_risk_score': { min: 0, max: 100, type: 'RANGE' },
      'ai_interactions.quality_score': { min: 0, max: 5, type: 'RANGE' },
      'ai_agents.temperature': { min: 0, max: 2, type: 'RANGE' },
      'agent_memory.importance_score': { min: 1, max: 10, type: 'RANGE' },
      'agent_memory.confidence_score': { min: 0, max: 100, type: 'RANGE' },
      'call_logs.quality_score': { min: 1, max: 5, type: 'RANGE' },
      'communications.call_quality_score': { min: 1, max: 5, type: 'RANGE' }
    };

    for (const checkConstraint of this.checkConstraints) {
      if (checkConstraint.constraint_type === 'RANGE') {
        const key = `${checkConstraint.table_name}.${checkConstraint.column_name}`;
        const expectedCheck = expectedChecks[key as keyof typeof expectedChecks];
        
        if (expectedCheck) {
          const actualRange = this.extractRangeFromConstraint(checkConstraint.constraint_definition);
          
          if (actualRange && (actualRange.min !== expectedCheck.min || actualRange.max !== expectedCheck.max)) {
            this.validationIssues.push({
              table: checkConstraint.table_name,
              column: checkConstraint.column_name,
              constraint: checkConstraint.constraint_name,
              issue_type: 'INVALID_RANGE',
              severity: 'MEDIUM',
              current_state: `${actualRange.min} to ${actualRange.max}`,
              expected_state: `${expectedCheck.min} to ${expectedCheck.max}`,
              recommendation: `Update range constraint to match expected values`
            });
          } else if (actualRange) {
            console.log(`   ✅ ${key}: Range constraint matches (${actualRange.min}-${actualRange.max})`);
          }
        }
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

  private categorizeCheckConstraint(constraintDef: string): 'RANGE' | 'ENUM' | 'PATTERN' | 'CUSTOM' {
    if (constraintDef.includes('>=') && constraintDef.includes('<=')) {
      return 'RANGE';
    } else if (constraintDef.includes('ARRAY')) {
      return 'ENUM';
    } else if (constraintDef.includes('~') || constraintDef.includes('LIKE')) {
      return 'PATTERN';
    } else {
      return 'CUSTOM';
    }
  }

  private extractRangeFromConstraint(constraintDef: string): { min: number; max: number } | null {
    // Extract range from constraints like: ((field >= 1) AND (field <= 10))
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

  private async generateReport() {
    console.log('📄 Generating validation report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_enum_constraints: this.enumConstraints.length,
        total_check_constraints: this.checkConstraints.length,
        total_issues: this.validationIssues.length,
        critical_issues: this.validationIssues.filter(i => i.severity === 'CRITICAL').length,
        high_issues: this.validationIssues.filter(i => i.severity === 'HIGH').length,
        medium_issues: this.validationIssues.filter(i => i.severity === 'MEDIUM').length,
        low_issues: this.validationIssues.filter(i => i.severity === 'LOW').length
      },
      enum_constraints: this.enumConstraints,
      check_constraints: this.checkConstraints,
      validation_issues: this.validationIssues
    };
    
    // Save detailed JSON report
    writeFileSync('enum-check-validation-report.json', JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const summary = this.generateMarkdownSummary(report);
    writeFileSync('enum-check-validation-summary.md', summary);
  }

  private generateMarkdownSummary(report: any): string {
    const criticalIssues = this.validationIssues.filter(i => i.severity === 'CRITICAL');
    const highIssues = this.validationIssues.filter(i => i.severity === 'HIGH');
    
    return `# 🔍 Enum and Check Constraint Validation Report

Generated: ${report.generated_at}

## 📊 Summary
- **Total Enum Constraints**: ${report.summary.total_enum_constraints}
- **Total Check Constraints**: ${report.summary.total_check_constraints}
- **Total Issues**: ${report.summary.total_issues}
- **Critical Issues**: ${report.summary.critical_issues}
- **High Priority Issues**: ${report.summary.high_issues}
- **Medium Priority Issues**: ${report.summary.medium_issues}
- **Low Priority Issues**: ${report.summary.low_issues}

## 🚨 Critical Issues

${criticalIssues.map(issue => `
### ${issue.table}.${issue.column}
- **Constraint**: ${issue.constraint}
- **Issue**: ${issue.issue_type}
- **Current**: ${issue.current_state}
- **Expected**: ${issue.expected_state}
- **Recommendation**: ${issue.recommendation}
`).join('\n')}

## ⚠️ High Priority Issues

${highIssues.map(issue => `
### ${issue.table}.${issue.column}
- **Constraint**: ${issue.constraint}
- **Issue**: ${issue.issue_type}
- **Current**: ${issue.current_state}
- **Expected**: ${issue.expected_state}
- **Recommendation**: ${issue.recommendation}
`).join('\n')}

## 📋 Enum Constraints Summary

${this.enumConstraints.map(constraint => `
### ${constraint.table_name}.${constraint.column_name}
- **Constraint**: ${constraint.constraint_name}
- **Values**: ${constraint.allowed_values.join(', ')}
`).join('\n')}

## 🔧 Check Constraints Summary

${this.checkConstraints.map(constraint => `
### ${constraint.table_name}.${constraint.column_name}
- **Constraint**: ${constraint.constraint_name}
- **Type**: ${constraint.constraint_type}
- **Definition**: ${constraint.constraint_definition.substring(0, 100)}...
`).join('\n')}

## 🎯 Next Steps

${report.summary.critical_issues > 0 ? 
  '1. **Address Critical Issues**: Fix all critical constraint issues immediately\n' : 
  '1. **No Critical Issues**: All critical constraints are properly aligned\n'
}
${report.summary.high_issues > 0 ? 
  '2. **Resolve High Priority**: Address high priority constraint mismatches\n' : 
  '2. **No High Priority Issues**: High priority constraints are working correctly\n'
}
3. **Review Medium Priority**: Consider addressing medium priority issues
4. **Enhance Documentation**: Document all constraint requirements
5. **Automate Validation**: Integrate constraint validation into CI/CD pipeline
`;
  }
}

// Run the enum and check constraint validator
if (require.main === module) {
  const validator = new EnumCheckConstraintValidator();
  validator.run().catch(console.error);
}

export { EnumCheckConstraintValidator };
