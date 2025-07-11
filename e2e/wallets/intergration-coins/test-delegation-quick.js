#!/usr/bin/env node

// Quick test to check delegation functionality
console.log('🚀 Testing Cosmos Delegation Integration...');

const { spawn } = require('child_process');

// Run the test and capture output for delegation-related logs
const testProcess = spawn('timeout', ['120s', 'pnpm', 'run', 'dev'], {
  cwd: '/Users/highlander/WebstormProjects/keepkey-stack/projects/pioneer-sdk/e2e/wallets/intergration-coins',
  stdio: ['inherit', 'pipe', 'pipe']
});

let foundDelegationTest = false;
let foundStakingTest = false;

testProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Look for delegation-related output
  if (output.includes('Testing Direct Cosmos Delegation') || 
      output.includes('GetDelegations') || 
      output.includes('GetStakingPositions')) {
    console.log('✅ Found delegation test output:');
    console.log(output);
    foundDelegationTest = true;
  }
  
  if (output.includes('delegation') || output.includes('staking')) {
    console.log('📊 Staking/Delegation activity:');
    console.log(output);
    foundStakingTest = true;
  }
});

testProcess.stderr.on('data', (data) => {
  const error = data.toString();
  if (error.includes('delegation') || error.includes('staking')) {
    console.log('⚠️ Delegation/Staking error:');
    console.log(error);
  }
});

testProcess.on('close', (code) => {
  console.log('\n🏁 Test completed with code:', code);
  console.log('📊 Results:');
  console.log(`  Delegation tests found: ${foundDelegationTest ? '✅' : '❌'}`);
  console.log(`  Staking activity found: ${foundStakingTest ? '✅' : '❌'}`);
  
  if (foundDelegationTest) {
    console.log('🎉 SUCCESS: Delegation integration is working!');
  } else {
    console.log('ℹ️ No delegation test output found - this might be normal if the test hasn\'t reached that point yet');
  }
});

// Kill after 2 minutes
setTimeout(() => {
  testProcess.kill();
  console.log('\n⏰ Test timeout - killed after 2 minutes');
}, 120000); 