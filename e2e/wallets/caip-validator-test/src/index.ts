/*
  CAIP Validator Test
  
  This test validates that the CAIP validator correctly identifies and fixes
  incorrect CAIP assignments, especially for eETH being assigned native ETH CAIP.
*/

require("dotenv").config();
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'});
require("dotenv").config({path:'../../../../.env'});

const TAG = ' | CAIP-Validator-Test | ';

// Import the validator functions from local copy
const { validateCaip, correctCaip, detectDuplicateNativeCAIPs, validateAndCorrectBalances } = require('./caipValidator.js');

const log = console.log;
const error = console.error;
let assert = require('assert');

// Test data
const TEST_BALANCES = [
  // Native ETH - should be valid
  {
    caip: 'eip155:1/slip44:60',
    networkId: 'eip155:1',
    symbol: 'ETH',
    name: 'Ethereum',
    pubkey: '0x123456789'
  },
  // eETH incorrectly using native ETH CAIP - CRITICAL ISSUE
  {
    caip: 'eip155:1/slip44:60', // WRONG - this is native ETH CAIP
    networkId: 'eip155:1',
    symbol: 'eETH',
    name: 'eETH',
    appId: 'ether-fi',
    pubkey: '0x123456789'
  },
  // USDC incorrectly using native ETH CAIP
  {
    caip: 'eip155:1/slip44:60', // WRONG
    networkId: 'eip155:1',
    symbol: 'USDC',
    name: 'USD Coin',
    contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    pubkey: '0x123456789'
  },
  // Correctly formatted USDT
  {
    caip: 'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7',
    networkId: 'eip155:1',
    symbol: 'USDT',
    name: 'Tether USD',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    pubkey: '0x123456789'
  },
  // WETH incorrectly using native CAIP
  {
    caip: 'eip155:1/slip44:60',
    networkId: 'eip155:1',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    pubkey: '0x123456789'
  }
];

async function runTests() {
  log(TAG, '🧪 Starting CAIP Validator Tests');
  log(TAG, '==================================');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Validate correct native ETH CAIP
  log(TAG, '\n📌 Test 1: Validate correct native ETH CAIP');
  try {
    const ethBalance = TEST_BALANCES[0];
    const result = validateCaip(ethBalance);
    assert(result.isValid === true, 'Native ETH should be valid');
    assert(result.issues.length === 0, 'Native ETH should have no issues');
    log(TAG, '  ✅ PASSED: Native ETH CAIP validated correctly');
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Test 2: Detect eETH incorrectly using native ETH CAIP
  log(TAG, '\n📌 Test 2: Detect eETH using wrong CAIP (CRITICAL BUG)');
  try {
    const eethBalance = TEST_BALANCES[1];
    const result = validateCaip(eethBalance);
    assert(result.isValid === false, 'eETH with native CAIP should be invalid');
    assert(result.severity === 'critical', 'eETH issue should be critical');
    assert(result.issues.includes('Known token "eETH" using native asset CAIP'), 'Should detect eETH issue');
    assert(result.suggestedCaip === 'eip155:1/erc20:0x35fa164735182de50811e8e2e824cfb9b6118ac2', 'Should suggest correct eETH CAIP');
    log(TAG, '  ✅ PASSED: eETH wrong CAIP detected as CRITICAL');
    log(TAG, '    - Original CAIP:', eethBalance.caip);
    log(TAG, '    - Suggested CAIP:', result.suggestedCaip);
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Test 3: Correct eETH CAIP
  log(TAG, '\n📌 Test 3: Correct eETH CAIP');
  try {
    const eethBalance = TEST_BALANCES[1];
    const corrected = correctCaip(eethBalance);
    assert(corrected === 'eip155:1/erc20:0x35fa164735182de50811e8e2e824cfb9b6118ac2', 'Should correct eETH CAIP');
    log(TAG, '  ✅ PASSED: eETH CAIP corrected');
    log(TAG, '    - From:', eethBalance.caip);
    log(TAG, '    - To:', corrected);
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Test 4: Detect USDC with wrong CAIP
  log(TAG, '\n📌 Test 4: Detect USDC using wrong CAIP');
  try {
    const usdcBalance = TEST_BALANCES[2];
    const result = validateCaip(usdcBalance);
    assert(result.isValid === false, 'USDC with native CAIP should be invalid');
    assert(result.severity === 'critical', 'USDC issue should be critical');
    assert(result.suggestedCaip === 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'Should suggest correct USDC CAIP');
    log(TAG, '  ✅ PASSED: USDC wrong CAIP detected');
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Test 5: Validate correct ERC-20 CAIP
  log(TAG, '\n📌 Test 5: Validate correct ERC-20 CAIP (USDT)');
  try {
    const usdtBalance = TEST_BALANCES[3];
    const result = validateCaip(usdtBalance);
    assert(result.isValid === true, 'Correct USDT CAIP should be valid');
    assert(result.issues.length === 0, 'Correct USDT should have no issues');
    log(TAG, '  ✅ PASSED: Correct ERC-20 CAIP validated');
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Test 6: Detect duplicate native CAIPs
  log(TAG, '\n📌 Test 6: Detect duplicate native CAIPs');
  try {
    const duplicates = detectDuplicateNativeCAIPs(TEST_BALANCES);
    assert(duplicates.size === 1, 'Should detect 1 set of duplicates');
    const key = 'eip155:1/slip44:60:0x123456789';
    assert(duplicates.has(key), 'Should have duplicate key for ETH CAIP');
    const dups = duplicates.get(key);
    assert(dups && dups.length === 4, 'Should have 4 duplicates (ETH, eETH, USDC, WETH)');
    log(TAG, '  ✅ PASSED: Duplicate native CAIPs detected');
    log(TAG, '    - Found', dups?.length, 'balances sharing native ETH CAIP:');
    dups?.forEach((d: any) => {
      log(TAG, '      •', d.symbol, '/', d.name);
    });
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Test 7: Validate and correct all balances
  log(TAG, '\n📌 Test 7: Validate and correct all balances');
  try {
    const { corrected, issues } = validateAndCorrectBalances(TEST_BALANCES);
    
    // Should have 3 issues (eETH, USDC, WETH)
    assert(issues.length === 3, `Should have 3 issues, got ${issues.length}`);
    
    // Check corrected CAIPs
    assert(corrected[0].caip === 'eip155:1/slip44:60', 'ETH should remain unchanged');
    assert(corrected[1].caip === 'eip155:1/erc20:0x35fa164735182de50811e8e2e824cfb9b6118ac2', 'eETH should be corrected');
    assert(corrected[2].caip === 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 'USDC should be corrected');
    assert(corrected[3].caip === 'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7', 'USDT should remain unchanged');
    
    // Check that corrected items are marked
    assert(corrected[1].caipCorrected === true, 'eETH should be marked as corrected');
    assert(corrected[2].caipCorrected === true, 'USDC should be marked as corrected');
    
    log(TAG, '  ✅ PASSED: All balances validated and corrected');
    log(TAG, '    - Issues found:', issues.length);
    log(TAG, '    - Critical issues:', issues.filter(i => i.validation.severity === 'critical').length);
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Test 8: WETH detection on fresh balance (not mutated by test 7)
  log(TAG, '\n📌 Test 8: Detect WETH using wrong CAIP');
  try {
    // Create a fresh WETH balance to test (test 7 mutates the original)
    const freshWethBalance = {
      caip: 'eip155:1/slip44:60',
      networkId: 'eip155:1',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      pubkey: '0x123456789'
    };
    const result = validateCaip(freshWethBalance);
    assert(result.isValid === false, 'WETH with native CAIP should be invalid');
    assert(result.severity === 'critical', `WETH severity should be critical, got: ${result.severity}`);
    assert(result.issues.some((i: string) => i.includes('Wrapped Ether')), 'Should detect WETH by name');
    log(TAG, '  ✅ PASSED: WETH wrong CAIP detected');
    log(TAG, '    - Severity:', result.severity);
    log(TAG, '    - Issues:', result.issues);
    passedTests++;
  } catch (e: any) {
    error(TAG, '  ❌ FAILED:', e.message);
    failedTests++;
  }
  
  // Summary
  log(TAG, '\n==================================');
  log(TAG, '📊 TEST SUMMARY');
  log(TAG, '==================================');
  log(TAG, `✅ Passed: ${passedTests}`);
  log(TAG, `❌ Failed: ${failedTests}`);
  log(TAG, `📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
  
  if (failedTests === 0) {
    log(TAG, '\n🎉 ALL TESTS PASSED! CAIP Validator is working correctly.');
    log(TAG, '✅ The validator successfully detects and corrects the eETH bug.');
  } else {
    error(TAG, '\n⚠️ SOME TESTS FAILED! Review the failures above.');
  }
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
log(TAG, '🚀 Starting CAIP Validator Test Suite...');
runTests().catch(err => {
  error(TAG, '❌ Fatal error:', err);
  process.exit(1);
});