#!/usr/bin/env tsx

/**
 * Generate Drizzle schema files from existing Supabase database
 * This script introspects the database and creates TypeScript schema files
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function generateSchema() {
  console.log('🔍 Generating Drizzle schema from existing database...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Please run "npm run test:drizzle" first.');
    process.exit(1);
  }

  try {
    // Dynamic import to avoid issues if DATABASE_URL is not set
    const { db } = await import('../lib/drizzle/client');
    
    console.log('🔌 Connected to database...');

    // Get all tables in public schema
    const tablesResult = await db.execute(`
      SELECT
        table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // Handle different result structures
    const tableRows = Array.isArray(tablesResult) ? tablesResult : tablesResult.rows || [];
    console.log(`📋 Found ${tableRows.length} tables to process...\n`);

    const schemaExports: string[] = [];

    for (const tableRow of tableRows) {
      const tableName = (tableRow as any).table_name;
      console.log(`🔧 Processing table: ${tableName}`);

      // Get column information
      const columnsResult = await db.execute(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${tableName}'
        ORDER BY ordinal_position
      `);

      // Get constraint information for this table
      const constraintsResult = await db.execute(`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = '${tableName}'
        AND tc.table_schema = 'public'
      `);

      // Handle different result structures
      const columnRows = Array.isArray(columnsResult) ? columnsResult : columnsResult.rows || [];
      const constraintRows = Array.isArray(constraintsResult) ? constraintsResult : constraintsResult.rows || [];

      // Generate schema file content
      const schemaContent = generateTableSchema(tableName, columnRows, constraintRows);
      
      // Write schema file
      const fileName = `lib/drizzle/schema/${tableName}.ts`;
      writeFileSync(fileName, schemaContent);
      
      schemaExports.push(`export * from './${tableName}';`);
      console.log(`  ✅ Generated ${fileName}`);
    }

    // Update index.ts file
    const indexContent = `// Auto-generated schema exports
// Generated on: ${new Date().toISOString()}

${schemaExports.join('\n')}
`;

    writeFileSync('lib/drizzle/schema/index.ts', indexContent);
    console.log(`\n✅ Updated lib/drizzle/schema/index.ts`);

    console.log(`\n🎉 Schema generation complete!`);
    console.log(`📁 Generated ${tableRows.length} schema files`);
    console.log(`\n💡 Next steps:`);
    console.log(`1. Review the generated schema files in lib/drizzle/schema/`);
    console.log(`2. Adjust data types if needed`);
    console.log(`3. Start using Drizzle in your application!`);

  } catch (error) {
    console.error('❌ Schema generation failed:', error);
    process.exit(1);
  }
}

function generateTableSchema(tableName: string, columns: any[], constraints: any[]): string {
  const imports = new Set(['pgTable']);
  const columnDefinitions: string[] = [];

  // Parse constraints
  const primaryKeys = new Set<string>();
  const uniqueColumns = new Set<string>();
  const foreignKeys = new Map<string, { table: string; column: string }>();

  for (const constraint of constraints) {
    if (constraint.constraint_type === 'PRIMARY KEY') {
      primaryKeys.add(constraint.column_name);
    } else if (constraint.constraint_type === 'UNIQUE') {
      uniqueColumns.add(constraint.column_name);
    } else if (constraint.constraint_type === 'FOREIGN KEY') {
      foreignKeys.set(constraint.column_name, {
        table: constraint.foreign_table_name,
        column: constraint.foreign_column_name
      });
    }
  }

  for (const col of columns) {
    const columnName = col.column_name;
    const dataType = col.data_type;
    const isNullable = col.is_nullable === 'YES';
    const hasDefault = col.column_default !== null;

    let drizzleType = mapPostgresToDrizzle(dataType, col);

    // Add import for the type
    const typeImport = drizzleType.split('(')[0];
    imports.add(typeImport);

    // Add array import if needed
    if (drizzleType.includes('.array()')) {
      imports.add('text'); // Ensure base type is imported
    }

    // Build column definition
    let columnDef = `  ${columnName}: ${drizzleType}`;

    if (!isNullable) {
      columnDef += '.notNull()';
    }

    // Add primary key
    if (primaryKeys.has(columnName)) {
      columnDef += '.primaryKey()';
    }

    // Add unique constraint
    if (uniqueColumns.has(columnName)) {
      columnDef += '.unique()';
    }

    if (hasDefault && !col.column_default.includes('nextval')) {
      // Add default if it's not a sequence
      columnDef += `.default(${formatDefault(col.column_default)})`;
    }

    columnDefinitions.push(columnDef + ',');
  }

  const importsArray = Array.from(imports);

  // Check if we need sql import
  const needsSql = columnDefinitions.some(def => def.includes('sql`'));

  let importStatements = `import { ${importsArray.join(', ')} } from 'drizzle-orm/pg-core';`;
  if (needsSql) {
    importStatements += `\nimport { sql } from 'drizzle-orm';`;
  }

  return `${importStatements}

export const ${tableName} = pgTable('${tableName}', {
${columnDefinitions.join('\n')}
});

export type ${toPascalCase(tableName)} = typeof ${tableName}.$inferSelect;
export type New${toPascalCase(tableName)} = typeof ${tableName}.$inferInsert;
`;
}

function mapPostgresToDrizzle(dataType: string, col: any): string {
  switch (dataType.toLowerCase()) {
    case 'uuid':
      return 'uuid()';
    case 'text':
      return 'text()';
    case 'varchar':
    case 'character varying':
      return col.character_maximum_length
        ? `varchar({ length: ${col.character_maximum_length} })`
        : 'varchar()';
    case 'integer':
      return 'integer()';
    case 'bigint':
      return 'bigint({ mode: "number" })';
    case 'boolean':
      return 'boolean()';
    case 'timestamp without time zone':
    case 'timestamp':
      return 'timestamp()';
    case 'timestamp with time zone':
      return 'timestamp({ withTimezone: true })';
    case 'date':
      return 'date()';
    case 'numeric':
    case 'decimal':
      return col.numeric_precision && col.numeric_scale
        ? `numeric({ precision: ${col.numeric_precision}, scale: ${col.numeric_scale} })`
        : 'numeric()';
    case 'real':
      return 'real()';
    case 'double precision':
      return 'doublePrecision()';
    case 'json':
      return 'json()';
    case 'jsonb':
      return 'jsonb()';
    case 'array':
      // Handle array types based on the underlying type
      if (col.udt_name === '_text') {
        return 'text().array()';
      } else if (col.udt_name === '_int4') {
        return 'integer().array()';
      } else if (col.udt_name === '_uuid') {
        return 'uuid().array()';
      } else {
        return 'text().array()'; // fallback for arrays
      }
    default:
      return 'text()'; // fallback
  }
}

function formatDefault(defaultValue: string): string {
  if (defaultValue.includes('uuid_generate_v4()')) {
    return 'sql`uuid_generate_v4()`';
  }
  if (defaultValue.includes('now()') || defaultValue.includes('CURRENT_TIMESTAMP')) {
    return 'sql`now()`';
  }
  if (defaultValue === 'true' || defaultValue === 'false') {
    return defaultValue;
  }
  if (!isNaN(Number(defaultValue))) {
    return defaultValue;
  }

  // Handle array defaults
  if (defaultValue.includes('::text[]') || defaultValue.includes('::integer[]')) {
    return `'${defaultValue}'`;
  }

  // Handle jsonb defaults - clean up the formatting
  if (defaultValue.includes('::jsonb')) {
    if (defaultValue === "'{}'::jsonb") {
      return "'{}'"
    }
    if (defaultValue === "'[]'::jsonb") {
      return "'[]'"
    }
    // For complex jsonb values, use sql template literal to avoid escaping issues
    return `sql\`${defaultValue}\``;
  }

  // Handle text defaults - remove extra quotes
  if (defaultValue.startsWith("'") && defaultValue.endsWith("'::text")) {
    const cleanValue = defaultValue.slice(1, -7); // Remove ' and ::text
    return `'${cleanValue}'`;
  }

  return `'${defaultValue.replace(/'/g, "\\'")}'`;
}

function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Ensure schema directory exists
mkdirSync('lib/drizzle/schema', { recursive: true });

// Run the generator
generateSchema().catch(console.error);
