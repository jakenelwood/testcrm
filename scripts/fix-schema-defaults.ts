#!/usr/bin/env tsx

/**
 * Fix malformed default values in existing Drizzle schema files
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

function fixSchemaFile(filePath: string): void {
  console.log(`🔧 Fixing ${filePath}...`);
  
  let content = readFileSync(filePath, 'utf-8');
  
  // Fix malformed jsonb defaults like ''{}'::jsonb' -> '{}'
  content = content.replace(/\.default\(''\{\}'::jsonb'\)/g, ".default('{}')");
  content = content.replace(/\.default\(''\[\]'::jsonb'\)/g, ".default('[]')");
  
  // Fix malformed complex jsonb defaults - wrap in sql template
  content = content.replace(/\.default\(''\{[^}]+\}'::jsonb'\)/g, (match) => {
    // Extract the JSON part
    const jsonMatch = match.match(/\.default\(''(\{[^}]+\})'::jsonb'\)/);
    if (jsonMatch) {
      const jsonPart = jsonMatch[1];
      return `.default(sql\`'${jsonPart}'::jsonb\`)`;
    }
    return match;
  });
  
  // Fix array defaults
  content = content.replace(/\.default\(''\{\}'::text\[\]'\)/g, ".default('{}')");

  // Fix malformed integer array defaults like ''{}'::integer[]' -> sql`'{}'::integer[]`
  content = content.replace(/\.default\(''\{\}'::integer\[\]'\)/g, ".default(sql`'{}'::integer[]`)");

  // Fix other typed array defaults that might be malformed
  content = content.replace(/\.default\(''\{\}'::(\w+)\[\]'\)/g, ".default(sql`'{}'::$1[]`)");

  writeFileSync(filePath, content);
  console.log(`  ✅ Fixed ${filePath}`);
}

function fixAllSchemaFiles(): void {
  console.log('🔍 Fixing malformed defaults in schema files...\n');
  
  const schemaDir = resolve(process.cwd(), 'lib/drizzle/schema');
  const files = readdirSync(schemaDir).filter(file => file.endsWith('.ts') && file !== 'index.ts');
  
  for (const file of files) {
    const filePath = resolve(schemaDir, file);
    fixSchemaFile(filePath);
  }
  
  console.log(`\n🎉 Fixed ${files.length} schema files!`);
}

// Run the fixer
fixAllSchemaFiles();
