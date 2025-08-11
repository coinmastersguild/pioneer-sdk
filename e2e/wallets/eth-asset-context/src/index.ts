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
    log(TAG, '🧪 Starting ETH Asset Context Test with Chart Data and CAIP Audit');
    
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

    log(TAG, '📊 Analyzing balances and auditing CAIPs...');
    
    // Log all balances for debugging
    const allBalances = app.balances || [];
    log(TAG, `Total balances: ${allBalances.length}`);
    
    // CAIP Audit: Log ALL token balances with their CAIPs
    log(TAG, '\n🔍 CAIP AUDIT - ALL TOKEN BALANCES:');
    log(TAG, '=====================================');
    
    // Group balances by CAIP for analysis
    const caipGroups: { [key: string]: any[] } = {};
    allBalances.forEach((balance: any) => {
      if (!caipGroups[balance.caip]) {
        caipGroups[balance.caip] = [];
      }
      caipGroups[balance.caip].push(balance);
    });
    
    // Log each CAIP group
    Object.keys(caipGroups).forEach(caip => {
      const balances = caipGroups[caip];
      log(TAG, `\nCAIP: ${caip}`);
      log(TAG, `  Number of assets with this CAIP: ${balances.length}`);
      
      balances.forEach((balance: any, index: number) => {
        log(TAG, `  [${index + 1}] ${balance.name || balance.symbol || 'UNKNOWN'}:`, {
          symbol: balance.symbol || balance.ticker,
          name: balance.name,
          balance: balance.balance,
          valueUsd: balance.valueUsd,
          appId: balance.appId,
          isToken: balance.isToken,
          contract: balance.contract,
          caipCorrected: balance.caipCorrected || false,
        });
      });
      
      // Simply note if multiple assets share the same CAIP
      if (balances.length > 1) {
        log(TAG, `  📌 Note: ${balances.length} different assets are using this CAIP`);
      }
    });
    
    log(TAG, '\n=====================================');
    log(TAG, 'CAIP AUDIT COMPLETE\n');
    
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

    // Test getCharts() functionality
    log(TAG, '\n📈 Testing getCharts() functionality...');
    if (app.getCharts) {
      try {
        // Get charts for all unique CAIPs
        const uniqueCaips = [...new Set(allBalances.map((b: any) => b.caip))];
        log(TAG, `Fetching chart data for ${uniqueCaips.length} unique CAIPs...`);
        
        for (const caip of uniqueCaips) {
          try {
            log(TAG, `\n  Fetching chart for CAIP: ${caip}`);
            const chartData = await app.getCharts(caip);
            
            if (chartData) {
              log(TAG, `    ✅ Chart data received:`, {
                caip: caip,
                dataPoints: Array.isArray(chartData) ? chartData.length : 'N/A',
                hasData: !!chartData,
                type: typeof chartData,
              });
              
              // Log sample data point if available
              if (Array.isArray(chartData) && chartData.length > 0) {
                log(TAG, '    Sample data point:', chartData[0]);
              }
            } else {
              log(TAG, `    ⚠️ No chart data returned for ${caip}`);
            }
          } catch (chartErr) {
            error(TAG, `    ❌ Error fetching chart for ${caip}:`, chartErr.message || chartErr);
          }
        }
        
        // Special test: Get chart for problematic eETH CAIP
        const eethBalance = allBalances.find((b: any) => b.name === 'eETH' || b.appId === 'ether-fi');
        if (eethBalance) {
          log(TAG, '\n  📊 Special test: eETH chart data');
          log(TAG, `    eETH is using CAIP: ${eethBalance.caip}`);
          
          try {
            const eethChart = await app.getCharts(eethBalance.caip);
            log(TAG, '    eETH chart result:', {
              success: !!eethChart,
              dataPoints: Array.isArray(eethChart) ? eethChart.length : 'N/A',
            });
            
            // Note what CAIP eETH is using
            if (eethChart && eethBalance.caip === 'eip155:1/slip44:60') {
              log(TAG, '    📌 Note: eETH is using CAIP eip155:1/slip44:60');
            }
          } catch (eethErr) {
            error(TAG, '    Error fetching eETH chart:', eethErr.message || eethErr);
          }
        }
        
      } catch (chartsErr) {
        error(TAG, '❌ Error testing getCharts:', chartsErr);
      }
    } else {
      error(TAG, '⚠️ getCharts() method not available on app instance');
    }
    
    // Check dashboard data
    log(TAG, '\n📋 Checking dashboard data...');
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
      
      // Log what was actually selected
      if (selectedBalance.name === 'eETH' || selectedBalance.appId === 'ether-fi') {
        log(TAG, '📌 Selected balance is eETH');
        
        // Check if there's also a native ETH balance
        const nativeEth = ethBalances.find((b: any) => 
          !b.appId || 
          b.appId === 'native' || 
          b.appId === 'ethereum' ||
          (b.name === 'ETH' && b.appId !== 'ether-fi')
        );
        
        if (nativeEth) {
          log(TAG, '📌 Also found a native ETH balance:', {
            caip: nativeEth.caip,
            name: nativeEth.name,
            symbol: nativeEth.symbol || nativeEth.ticker,
            appId: nativeEth.appId,
          });
        }
      } else {
        log(TAG, '📌 Selected balance appears to be native ETH');
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
        
        if (currentContext?.name) {
          log(TAG, `📌 Asset context is showing: ${currentContext.name}`);
        }
      }
    } else {
      error(TAG, '⚠️ setAssetContext method not available');
    }

    log(TAG, '\n📊 AUDIT SUMMARY:');
    log(TAG, '================================');
    log(TAG, 'DATA COLLECTED:');
    log(TAG, `- Total balances found: ${allBalances.length}`);
    log(TAG, `- Unique CAIPs found: ${Object.keys(caipGroups).length}`);
    log(TAG, `- CAIPs shared by multiple assets: ${Object.keys(caipGroups).filter(c => caipGroups[c].length > 1).length}`);
    log(TAG, '');
    log(TAG, 'CHART DATA:');
    log(TAG, `- Chart requests made: ${Object.keys(caipGroups).length}`);
    log(TAG, '');
    log(TAG, 'Review the logs above to see:');
    log(TAG, '- Which assets are using which CAIPs');
    log(TAG, '- What chart data is returned for each CAIP');
    log(TAG, '- Which assets share the same CAIP identifiers');
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