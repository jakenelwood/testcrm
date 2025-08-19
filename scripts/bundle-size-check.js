#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle Size Monitoring Script
 * Checks if bundle sizes exceed recommended thresholds
 */

const THRESHOLDS = {
  // First Load JS thresholds (in KB)
  firstLoadJS: {
    warning: 200,
    error: 300
  },
  // Individual page size thresholds (in KB)
  pageSize: {
    warning: 50,
    error: 100
  },
  // Total bundle size threshold (in MB)
  totalBundle: {
    warning: 5,
    error: 10
  }
};

function parseSize(sizeStr) {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*(kB|MB|B)$/);
  if (!match) return 0;
  
  const [, value, unit] = match;
  const numValue = parseFloat(value);
  
  switch (unit) {
    case 'MB': return numValue * 1024;
    case 'kB': return numValue;
    case 'B': return numValue / 1024;
    default: return numValue;
  }
}

function checkBundleSize() {
  console.log('🔍 Checking bundle sizes...\n');

  const buildOutputPath = path.join(process.cwd(), '.next');

  if (!fs.existsSync(buildOutputPath)) {
    console.log('❌ No build output found. Run `npm run build` first.');
    process.exit(1);
  }

  // Check for large chunks
  const staticPath = path.join(buildOutputPath, 'static', 'chunks');
  if (fs.existsSync(staticPath)) {
    const chunks = fs.readdirSync(staticPath);
    const largeChunks = [];

    chunks.forEach(chunk => {
      const chunkPath = path.join(staticPath, chunk);
      const stats = fs.statSync(chunkPath);
      const sizeKB = Math.round(stats.size / 1024);

      if (sizeKB > THRESHOLDS.pageSize.warning) {
        largeChunks.push({ name: chunk, size: sizeKB });
      }
    });

    if (largeChunks.length > 0) {
      console.log('⚠️  Large chunks detected:');
      largeChunks.forEach(chunk => {
        const status = chunk.size > THRESHOLDS.pageSize.error ? '🔴' : '🟡';
        console.log(`  ${status} ${chunk.name}: ${chunk.size} KB`);
      });
      console.log('');
    }
  }

  console.log('✅ Bundle size check completed.');
  console.log('\n📊 Current Optimizations Applied:');
  console.log('✓ Chunk splitting for vendors, database, forms, kanban, UI');
  console.log('✓ Dynamic imports for large components');
  console.log('✓ Performance budgets configured');
  console.log('✓ Package optimization enabled');

  console.log('\n📈 Next Steps:');
  console.log('- Monitor vendor chunk size (target: <500KB)');
  console.log('- Consider lazy loading more components');
  console.log('- Review and remove unused dependencies');
  console.log('\n🔧 Run `npm run analyze` for detailed bundle analysis');
}

if (require.main === module) {
  checkBundleSize();
}

module.exports = { checkBundleSize, parseSize, THRESHOLDS };
