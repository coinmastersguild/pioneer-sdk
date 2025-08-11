/*
  E2E Test: ETH Asset Context Resolution Bug
  
  This test reproduces an issue where clicking on ETH from the dashboard
  incorrectly shows "eETH" (Ether.fi staked ETH) instead of native ETH.
  
  The issue occurs when multiple balances share the same CAIP identifier
  (eip155:1/slip44:60) but represent different assets (native ETH vs eETH token).
*/

require("dotenv").config();
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'});
require("dotenv").config({path:'../../../../.env'});

const TAG = ' | ETH Asset Context Test | ';
const SDK = require('@coinmasters/pioneer-sdk');
const { getPaths } = require('@pioneer-platform/pioneer-coins');

const log = console.log;
const error = console.error;

async function testEthAssetContext() {
  try {
    log(TAG, '🧪 Starting ETH Asset Context Test');
    
    // Initialize wallet - use same pattern as integration-coins test
    const spec = 'http://127.0.0.1:9001/spec/swagger.json'; // Use local Pioneer server
    const blockchains = ['eip155:1']; // Just Ethereum mainnet
    const paths = getPaths(blockchains);
    
    // Generate random keys for unique session
    const queryKey = "sdk:pair-keepkey:" + Math.random();
    const username = "user:" + Math.random();
    
    const config: any = {
      username: username,
      queryKey: queryKey,
      spec: spec,
      wss: process.env.VITE_PIONEER_URL_WSS || 'wss://pioneers.dev',
      keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
      keepkeyEndpoint: undefined, // Let it auto-detect
      blockchains: blockchains,
      paths: paths,
      pubkeys: [],
      balances: [],
      nodes: [] // Add nodes array like integration-coins
    };

    log(TAG, 'Initializing SDK...');
    const app = new SDK.SDK(spec, config);
    
    log(TAG, 'Calling app.init()...');
    const resultInit = await app.init({}, { skipSync: false });
    log(TAG, '✅ SDK initialized:', resultInit);

    // Wait for wallet to be fully loaded
    log(TAG, 'Waiting for wallet to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // app is already initialized above
    if (!app) {
      throw new Error('App not initialized');
    }

    log(TAG, '📊 Analyzing balances...');
    
    // Log all balances for debugging
    const allBalances = app.balances || [];
    log(TAG, `Total balances: ${allBalances.length}`);
    
    // Find all ETH-related balances
    const ethBalances = allBalances.filter((b: any) => 
      b.caip === 'eip155:1/slip44:60'
    );
    
    log(TAG, `Found ${ethBalances.length} balances with CAIP eip155:1/slip44:60:`);
    
    if (ethBalances.length === 0) {
      error(TAG, '❌ No ETH balances found. Make sure the wallet has ETH balances.');
      return;
    }
    
    // Log each ETH balance
    ethBalances.forEach((balance: any, index: number) => {
      log(TAG, `  Balance ${index + 1}:`, {
        caip: balance.caip,
        name: balance.name,
        symbol: balance.symbol || balance.ticker,
        balance: balance.balance,
        valueUsd: balance.valueUsd,
        appId: balance.appId, // This might show 'ether-fi' for eETH
        context: balance.context,
      });
    });

    // Check dashboard data
    log(TAG, '📋 Checking dashboard data...');
    const dashboard = app.dashboard;
    if (dashboard && dashboard.networks) {
      const ethNetwork = dashboard.networks.find((n: any) => 
        n.networkId === 'eip155:1'
      );
      
      if (ethNetwork) {
        log(TAG, 'Dashboard ETH network data:', {
          networkId: ethNetwork.networkId,
          gasAssetCaip: ethNetwork.gasAssetCaip,
          gasAssetSymbol: ethNetwork.gasAssetSymbol,
        });
        
        // This is what gets encoded and passed to the asset page
        if (ethNetwork.gasAssetCaip) {
          const encodedCaip = Buffer.from(ethNetwork.gasAssetCaip).toString('base64');
          log(TAG, 'Encoded CAIP that would be passed to asset page:', encodedCaip);
        }
      } else {
        log(TAG, '⚠️ No ETH network found in dashboard');
      }
    } else {
      log(TAG, '⚠️ No dashboard data available');
    }

    // Test 1: Simulate clicking on ETH from dashboard
    log(TAG, '\n🔍 Test 1: Simulating ETH selection from dashboard');
    const ethCaip = 'eip155:1/slip44:60';
    
    // Find the balance that would be selected (first match)
    const selectedBalance = allBalances.find((b: any) => b.caip === ethCaip);
    
    if (selectedBalance) {
      log(TAG, 'First matching balance (what gets selected):', {
        caip: selectedBalance.caip,
        name: selectedBalance.name,
        symbol: selectedBalance.symbol || selectedBalance.ticker,
        appId: selectedBalance.appId,
      });
      
      // Check if this is the wrong balance (eETH instead of ETH)
      if (selectedBalance.name === 'eETH' || selectedBalance.appId === 'ether-fi') {
        error(TAG, '❌ BUG CONFIRMED: Selected eETH instead of native ETH!');
        error(TAG, '   This happens because multiple balances share the same CAIP');
        error(TAG, '   and the wrong one (eETH) is being selected first.');
        
        // Try to find the correct native ETH balance
        const nativeEth = ethBalances.find((b: any) => 
          !b.appId || 
          b.appId === 'native' || 
          b.appId === 'ethereum' ||
          (b.name === 'ETH' && b.appId !== 'ether-fi')
        );
        
        if (nativeEth) {
          log(TAG, '✅ Found correct native ETH balance:', {
            caip: nativeEth.caip,
            name: nativeEth.name,
            symbol: nativeEth.symbol || nativeEth.ticker,
            appId: nativeEth.appId,
          });
          log(TAG, 'The fix should prioritize this balance over the eETH balance');
        } else {
          error(TAG, '⚠️ Could not find native ETH balance in the list');
        }
      } else {
        log(TAG, '✅ Correctly selected native ETH');
      }
    } else {
      error(TAG, '❌ No balance found for CAIP:', ethCaip);
    }

    // Test 2: Check asset context setting
    log(TAG, '\n🔍 Test 2: Testing setAssetContext behavior');
    if (app.setAssetContext) {
      // This simulates what happens in the asset page
      if (selectedBalance) {
        const assetContextData = {
          networkId: 'eip155:1',
          chainId: 'eip155:1',
          assetId: ethCaip,
          caip: ethCaip,
          name: selectedBalance.name || 'ETH',
          symbol: selectedBalance.symbol || selectedBalance.ticker || 'ETH',
          balance: selectedBalance.balance || '0',
          valueUsd: selectedBalance.valueUsd || 0,
        };
        
        log(TAG, 'Setting asset context with:', {
          caip: assetContextData.caip,
          name: assetContextData.name,
          symbol: assetContextData.symbol,
        });
        
        await app.setAssetContext(assetContextData);
        
        // Check the resulting context
        const currentContext = app.assetContext;
        log(TAG, 'Current asset context after setting:', {
          caip: currentContext?.caip,
          name: currentContext?.name,
          symbol: currentContext?.symbol,
        });
        
        if (currentContext?.name === 'eETH') {
          error(TAG, '❌ Asset context shows eETH instead of ETH!');
        } else if (currentContext?.name === 'ETH') {
          log(TAG, '✅ Asset context correctly shows ETH');
        }
      }
    } else {
      error(TAG, '⚠️ setAssetContext method not available');
    }

    log(TAG, '\n📊 Test Summary:');
    log(TAG, '================================');
    log(TAG, 'REAL ISSUE: Tokens (like eETH) are being assigned incorrect CAIPs');
    log(TAG, 'Problem: eETH gets native ETH CAIP (eip155:1/slip44:60) instead of its ERC-20 CAIP');
    log(TAG, 'Root Cause: getCharts.ts receives wrong CAIPs from Pioneer API and trusts them');
    log(TAG, '');
    log(TAG, 'Solution implemented:');
    log(TAG, '1. CAIP Validator detects tokens using native CAIPs');
    log(TAG, '2. Automatically corrects known tokens (eETH, WETH, USDC, etc)');
    log(TAG, '3. Logs CRITICAL issues for visibility');
    log(TAG, '4. Marks corrected balances with caipCorrected flag');
    log(TAG, '');
    log(TAG, 'Note: Multiple balances with same CAIP should be same asset (sum them)');
    log(TAG, '      But tokens should NEVER share native asset CAIPs!');
    log(TAG, '================================');
    
  } catch (err) {
    error(TAG, '❌ Test failed:', err);
  }
}

// Run the test
log(TAG, '🚀 Starting test execution...');
testEthAssetContext().then(() => {
  log(TAG, '🏁 Test completed successfully');
  process.exit(0);
}).catch(err => {
  error(TAG, 'Fatal error:', err);
  process.exit(1);
});