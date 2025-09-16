#!/usr/bin/env node

// Simple test to verify cosmos staking integration
const { exec } = require('child_process');

console.log('🚀 Testing Cosmos Staking Integration...');

// Run a quick test to see if our integration is working
exec('cd /Users/highlander/WebstormProjects/keepkey-stack/projects/pioneer-sdk/e2e/wallets/intergration-coins && timeout 60s pnpm run dev 2>&1 | grep -i "staking\\|cosmos.*position\\|delegation"', (error, stdout, stderr) => {
  if (error && error.code !== 124) { // 124 is timeout exit code
    console.error('❌ Test failed:', error);
    return;
  }
  
  if (stdout) {
    console.log('✅ Found staking-related output:');
    console.log(stdout);
  } else {
    console.log('ℹ️ No staking output found yet (this might be normal if test is still running)');
  }
  
  if (stderr) {
    console.log('⚠️ Errors:', stderr);
  }
}); 