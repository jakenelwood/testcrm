#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle Optimization Script
 * Analyzes and suggests optimizations for large chunks
 */

const CHUNK_THRESHOLDS = {
  critical: 300, // KB
  warning: 100,  // KB
  good: 50       // KB
};

function analyzeChunks() {
  console.log('🔍 Analyzing bundle chunks for optimization opportunities...\n');
  
  const staticPath = path.join(process.cwd(), '.next', 'static', 'chunks');
  
  if (!fs.existsSync(staticPath)) {
    console.log('❌ No build output found. Run `npm run build` first.');
    return;
  }

  const chunks = fs.readdirSync(staticPath);
  const analysis = {
    critical: [],
    warning: [],
    good: [],
    total: 0
  };

  chunks.forEach(chunk => {
    if (chunk.endsWith('.js')) {
      const chunkPath = path.join(staticPath, chunk);
      const stats = fs.statSync(chunkPath);
      const sizeKB = Math.round(stats.size / 1024);
      
      analysis.total += sizeKB;
      
      if (sizeKB > CHUNK_THRESHOLDS.critical) {
        analysis.critical.push({ name: chunk, size: sizeKB });
      } else if (sizeKB > CHUNK_THRESHOLDS.warning) {
        analysis.warning.push({ name: chunk, size: sizeKB });
      } else {
        analysis.good.push({ name: chunk, size: sizeKB });
      }
    }
  });

  // Sort by size
  analysis.critical.sort((a, b) => b.size - a.size);
  analysis.warning.sort((a, b) => b.size - a.size);

  console.log('📊 Bundle Analysis Results:');
  console.log(`Total bundle size: ${analysis.total} KB\n`);

  if (analysis.critical.length > 0) {
    console.log('🔴 Critical chunks (>300KB):');
    analysis.critical.forEach(chunk => {
      console.log(`  ${chunk.name}: ${chunk.size} KB`);
    });
    console.log('');
  }

  if (analysis.warning.length > 0) {
    console.log('🟡 Warning chunks (>100KB):');
    analysis.warning.forEach(chunk => {
      console.log(`  ${chunk.name}: ${chunk.size} KB`);
    });
    console.log('');
  }

  console.log(`✅ Good chunks (<100KB): ${analysis.good.length} chunks\n`);

  // Provide optimization suggestions
  console.log('💡 Optimization Suggestions:');
  
  if (analysis.critical.length > 0) {
    console.log('• Critical chunks detected - consider:');
    console.log('  - Dynamic imports for large components');
    console.log('  - Further vendor chunk splitting');
    console.log('  - Lazy loading non-critical features');
  }
  
  if (analysis.total > 2000) {
    console.log('• Total bundle size is large - consider:');
    console.log('  - Removing unused dependencies');
    console.log('  - Using lighter alternatives');
    console.log('  - Implementing progressive loading');
  }

  console.log('\n🔧 Next steps:');
  console.log('• Run `npm run analyze` for detailed bundle analysis');
  console.log('• Check for unused imports with `npx depcheck`');
  console.log('• Consider using `webpack-bundle-analyzer` for visual analysis');
}

if (require.main === module) {
  analyzeChunks();
}

module.exports = { analyzeChunks };
