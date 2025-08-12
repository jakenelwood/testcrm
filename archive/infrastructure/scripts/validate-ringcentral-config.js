#!/usr/bin/env node

/**
 * RingCentral Configuration Validator
 * 
 * This script validates that all required RingCentral environment variables
 * are properly configured and provides helpful setup guidance.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 RingCentral Configuration Validator');
console.log('=====================================');
console.log('');

// Required environment variables
const requiredVars = [
  {
    name: 'RINGCENTRAL_CLIENT_ID',
    value: process.env.RINGCENTRAL_CLIENT_ID,
    description: 'Client ID from RingCentral Developer Portal',
    example: 'abc123def456'
  },
  {
    name: 'RINGCENTRAL_CLIENT_SECRET',
    value: process.env.RINGCENTRAL_CLIENT_SECRET,
    description: 'Client Secret from RingCentral Developer Portal',
    example: 'xyz789uvw012'
  },
  {
    name: 'RINGCENTRAL_SERVER',
    value: process.env.RINGCENTRAL_SERVER,
    description: 'RingCentral server URL',
    example: 'https://platform.ringcentral.com',
    default: 'https://platform.ringcentral.com'
  },
  {
    name: 'RINGCENTRAL_OAUTH_SCOPES',
    value: process.env.RINGCENTRAL_OAUTH_SCOPES,
    description: 'OAuth scopes (space-separated)',
    example: 'SMS ReadCallLog ReadMessages ReadPresence RingOut',
    default: 'RingOut SMS'
  },
  {
    name: 'RINGCENTRAL_FROM_NUMBER',
    value: process.env.RINGCENTRAL_FROM_NUMBER,
    description: 'Default phone number for outbound calls (E.164 format)',
    example: '+15551234567'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    value: process.env.NEXT_PUBLIC_APP_URL,
    description: 'Application base URL',
    example: 'http://localhost:3000',
    default: 'http://localhost:3000'
  }
];

// Optional variables
const optionalVars = [
  {
    name: 'REDIRECT_URI',
    value: process.env.REDIRECT_URI,
    description: 'OAuth redirect URI (auto-constructed if not set)',
    example: 'http://localhost:3000/oauth-callback'
  }
];

let hasErrors = false;
let hasWarnings = false;

console.log('📋 Required Configuration:');
console.log('');

requiredVars.forEach(variable => {
  const isSet = variable.value && variable.value !== `your_${variable.name.toLowerCase()}`;
  const hasDefault = variable.default && (!variable.value || variable.value === variable.default);
  
  if (!isSet && !hasDefault) {
    console.log(`❌ ${variable.name}: NOT SET`);
    console.log(`   Description: ${variable.description}`);
    console.log(`   Example: ${variable.example}`);
    console.log('');
    hasErrors = true;
  } else if (hasDefault) {
    console.log(`✅ ${variable.name}: ${variable.value || variable.default} (default)`);
  } else {
    console.log(`✅ ${variable.name}: ${variable.value.substring(0, 20)}${variable.value.length > 20 ? '...' : ''}`);
  }
});

console.log('');
console.log('📋 Optional Configuration:');
console.log('');

optionalVars.forEach(variable => {
  if (variable.value) {
    console.log(`✅ ${variable.name}: ${variable.value}`);
  } else {
    console.log(`⚠️  ${variable.name}: Not set (will be auto-constructed)`);
    hasWarnings = true;
  }
});

console.log('');
console.log('🔧 Configuration Analysis:');
console.log('');

// Validate OAuth scopes
const scopes = process.env.RINGCENTRAL_OAUTH_SCOPES;
if (scopes) {
  const scopeArray = scopes.split(' ');
  const recommendedScopes = ['SMS', 'ReadCallLog', 'ReadMessages', 'ReadPresence', 'RingOut'];
  const missingScopes = recommendedScopes.filter(scope => !scopeArray.includes(scope));
  
  if (missingScopes.length === 0) {
    console.log('✅ OAuth scopes: All recommended scopes present');
  } else {
    console.log(`⚠️  OAuth scopes: Missing recommended scopes: ${missingScopes.join(', ')}`);
    hasWarnings = true;
  }
} else {
  console.log('❌ OAuth scopes: Not configured');
  hasErrors = true;
}

// Validate phone number format
const phoneNumber = process.env.RINGCENTRAL_FROM_NUMBER;
if (phoneNumber && phoneNumber !== '+1234567890') {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (e164Regex.test(phoneNumber)) {
    console.log('✅ Phone number: Valid E.164 format');
  } else {
    console.log('❌ Phone number: Invalid format (should be E.164: +1234567890)');
    hasErrors = true;
  }
} else {
  console.log('❌ Phone number: Not configured or using placeholder');
  hasErrors = true;
}

// Validate redirect URI
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const redirectUri = process.env.REDIRECT_URI || `${appUrl}/oauth-callback`;
console.log(`✅ Redirect URI: ${redirectUri}`);

console.log('');
console.log('=====================================');

if (hasErrors) {
  console.log('❌ Configuration has ERRORS that must be fixed');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update .env.local with the missing values');
  console.log('2. Get credentials from RingCentral Developer Portal');
  console.log('3. Run this script again to validate');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuration is mostly complete but has warnings');
  console.log('');
  console.log('The application should work, but consider addressing the warnings.');
  process.exit(0);
} else {
  console.log('✅ Configuration is complete and valid!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the application: npm run dev');
  console.log('2. Test RingCentral integration at /dashboard/telephony');
  console.log('3. Use /ringcentral-reset if you encounter issues');
  process.exit(0);
}
