#!/usr/bin/env node

/**
 * Emergency RingCentral Token Reset Script
 * 
 * This script can be run to immediately reset all RingCentral tokens
 * when the system is stuck in a rate-limited or token-revoked state.
 */

const https = require('https');
const http = require('http');

// Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://crm-jakenelwoods-projects.vercel.app';
const RESET_ENDPOINT = `${APP_URL}/api/ringcentral/auth?action=reset`;
const CLEANUP_ENDPOINT = `${APP_URL}/api/ringcentral/auth?action=cleanup`;

console.log('🔧 RingCentral Token Reset Script');
console.log('==================================');
console.log(`Target URL: ${APP_URL}`);
console.log('');

/**
 * Make an HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'RingCentral-Reset-Script/1.0',
        ...options.headers
      },
      ...options
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Reset tokens
 */
async function resetTokens() {
  console.log('🔄 Resetting RingCentral tokens...');
  
  try {
    const response = await makeRequest(RESET_ENDPOINT);
    
    if (response.status === 200) {
      console.log('✅ Token reset successful!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('❌ Token reset failed!');
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Token reset error!');
    console.log('Error:', error.message);
    return false;
  }
}

/**
 * Cleanup expired tokens
 */
async function cleanupTokens() {
  console.log('🧹 Cleaning up expired tokens...');
  
  try {
    const response = await makeRequest(CLEANUP_ENDPOINT);
    
    if (response.status === 200) {
      console.log('✅ Token cleanup successful!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log('❌ Token cleanup failed!');
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Token cleanup error!');
    console.log('Error:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'both';

  console.log(`Action: ${action}`);
  console.log('');

  let success = false;

  switch (action) {
    case 'reset':
      success = await resetTokens();
      break;
      
    case 'cleanup':
      success = await cleanupTokens();
      break;
      
    case 'both':
    default:
      console.log('Performing both cleanup and reset...');
      console.log('');
      
      const cleanupSuccess = await cleanupTokens();
      console.log('');
      
      const resetSuccess = await resetTokens();
      console.log('');
      
      success = cleanupSuccess && resetSuccess;
      break;
  }

  console.log('==================================');
  if (success) {
    console.log('✅ Operation completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. The RingCentral tokens have been reset');
    console.log('2. Users will need to re-authenticate with RingCentral');
    console.log('3. Rate limiting has been cleared');
    console.log('4. Try making RingCentral calls again');
  } else {
    console.log('❌ Operation failed!');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check if the application is running');
    console.log('2. Verify the APP_URL is correct');
    console.log('3. Check network connectivity');
    console.log('4. Review application logs');
  }
  
  process.exit(success ? 0 : 1);
}

// Handle script arguments
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: node reset-ringcentral-tokens.js [action]');
    console.log('');
    console.log('Actions:');
    console.log('  reset   - Reset all tokens and clear authentication');
    console.log('  cleanup - Clean up expired tokens and rate limits');
    console.log('  both    - Perform both cleanup and reset (default)');
    console.log('');
    console.log('Environment Variables:');
    console.log('  NEXT_PUBLIC_APP_URL - Application URL (default: production URL)');
    process.exit(0);
  }
  
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { resetTokens, cleanupTokens };
