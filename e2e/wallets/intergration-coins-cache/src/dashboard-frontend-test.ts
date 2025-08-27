/*
    Frontend Dashboard Integration Test
    
    This test validates that the Pioneer SDK provides all the data structures 
    that the KeepKey Vault frontend Dashboard.tsx component expects.
    
    Specifically tests:
    1. Dashboard object structure
    2. Network aggregation with colors/icons
    3. Network percentage calculations
    4. Chart data preparation
    5. Token detection and categorization
*/

// Use require instead of import for pioneer-caip to avoid TypeScript declaration issues
const { caipToNetworkId } = require('@pioneer-platform/pioneer-caip');

interface Network {
  networkId: string;
  totalValueUsd: number;
  gasAssetCaip: string;
  gasAssetSymbol: string;
  icon: string;
  color: string;
  totalNativeBalance: string;
}

interface NetworkPercentage {
  networkId: string;
  percentage: number;
}

interface Dashboard {
  networks: Network[];
  totalValueUsd: number;
  networkPercentages: NetworkPercentage[];
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const TAG = " | frontend-dashboard-test | ";

export const validateFrontendDashboard = async (app: any) => {
  const tag = TAG + " validateFrontendDashboard | ";
  
  console.log('');
  console.log('🎨 [FRONTEND DASHBOARD] Starting comprehensive frontend validation...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Test 1: Validate Dashboard Object Structure
  console.log('📋 [TEST 1] Validating Dashboard Object Structure...');
  
  if (!app.dashboard) {
    throw new Error('❌ CRITICAL: app.dashboard is missing! Frontend will show empty state.');
  }
  
  const dashboard = app.dashboard;
  
  // Validate required dashboard properties
  const requiredDashboardProps = ['networks', 'totalValueUsd', 'networkPercentages'];
  for (const prop of requiredDashboardProps) {
    if (dashboard[prop] === undefined) {
      throw new Error(`❌ CRITICAL: dashboard.${prop} is missing! Frontend requires this field.`);
    }
  }
  
  console.log('✅ [TEST 1] Dashboard object structure is valid');
  console.log(`   Networks: ${dashboard.networks?.length || 0}`);
  console.log(`   Total Value: $${dashboard.totalValueUsd || 0}`);
  console.log(`   Network Percentages: ${dashboard.networkPercentages?.length || 0}`);
  
  // Test 2: Validate Network Objects
  console.log('');
  console.log('🌐 [TEST 2] Validating Network Objects...');
  
  if (!Array.isArray(dashboard.networks)) {
    throw new Error('❌ CRITICAL: dashboard.networks is not an array!');
  }
  
  const requiredNetworkProps = ['networkId', 'totalValueUsd', 'gasAssetCaip', 'gasAssetSymbol', 'icon', 'color', 'totalNativeBalance'];
  
  let networksWithValue = 0;
  let networksWithMissingColors = 0;
  let networksWithMissingIcons = 0;
  
  for (let i = 0; i < dashboard.networks.length; i++) {
    const network = dashboard.networks[i];
    
    // Check required properties
    for (const prop of requiredNetworkProps) {
      if (network[prop] === undefined || network[prop] === null) {
        console.warn(`⚠️ [TEST 2] Network ${network.networkId || i} missing ${prop}: ${network[prop]}`);
        
        if (prop === 'color') networksWithMissingColors++;
        if (prop === 'icon') networksWithMissingIcons++;
      }
    }
    
    // Check if network has meaningful value
    if (network.totalValueUsd > 0) {
      networksWithValue++;
      
      // Log first 3 networks with value for debugging
      if (networksWithValue <= 3) {
        console.log(`   Network ${networksWithValue}: ${network.gasAssetSymbol} = $${network.totalValueUsd.toFixed(2)} (${network.color || 'NO_COLOR'})`);
      }
    }
  }
  
  console.log(`✅ [TEST 2] Network validation completed`);
  console.log(`   Networks with value: ${networksWithValue}/${dashboard.networks.length}`);
  console.log(`   Networks missing colors: ${networksWithMissingColors}`);
  console.log(`   Networks missing icons: ${networksWithMissingIcons}`);
  
  if (networksWithMissingColors > 0) {
    console.warn(`⚠️ [WARNING] ${networksWithMissingColors} networks missing colors - frontend charts will be broken!`);
  }
  
  // Test 3: Validate Network Percentages
  console.log('');
  console.log('📊 [TEST 3] Validating Network Percentages...');
  
  if (!Array.isArray(dashboard.networkPercentages)) {
    throw new Error('❌ CRITICAL: dashboard.networkPercentages is not an array!');
  }
  
  let totalPercentage = 0;
  let percentagesWithValue = 0;
  
  for (const percentage of dashboard.networkPercentages) {
    if (percentage.percentage === undefined || percentage.networkId === undefined) {
      console.error(`❌ [TEST 3] Invalid percentage object:`, percentage);
      continue;
    }
    
    if (percentage.percentage > 0) {
      percentagesWithValue++;
      totalPercentage += percentage.percentage;
      
      // Log first few percentages
      if (percentagesWithValue <= 5) {
        console.log(`   ${percentage.networkId}: ${percentage.percentage}%`);
      }
    }
  }
  
  console.log(`✅ [TEST 3] Network percentages validation completed`);
  console.log(`   Percentages with value: ${percentagesWithValue}/${dashboard.networkPercentages.length}`);
  console.log(`   Total percentage: ${totalPercentage.toFixed(1)}% (should be ~100%)`);
  
  // 🚨 CRITICAL ISSUE DETECTION
  if (percentagesWithValue === 0) {
    console.error('🚨 [CRITICAL ERROR] ALL NETWORK PERCENTAGES ARE 0%!');
    console.error('   This explains why the frontend donut chart is empty!');
    console.error('   The dashboard aggregation logic is broken.');
    
    // Debug the aggregation issue
    console.log('');
    console.log('🔍 [DEBUG] Analyzing aggregation failure...');
    console.log(`   Dashboard total value: $${dashboard.totalValueUsd}`);
    console.log(`   Networks with total value > 0: ${dashboard.networks.filter((n: any) => n.totalValueUsd > 0).length}`);
    
    // Check if balances exist but aren't being aggregated properly
    if (app.balances && app.balances.length > 0) {
      const balancesByNetwork: { [key: string]: number } = {};
      let totalFromBalances = 0;
      
      for (const balance of app.balances) {
        const networkId = caipToNetworkId(balance.caip);
        const valueUsd = parseFloat(balance.valueUsd || '0');
        
        if (!balancesByNetwork[networkId]) {
          balancesByNetwork[networkId] = 0;
        }
        balancesByNetwork[networkId] += valueUsd;
        totalFromBalances += valueUsd;
      }
      
      console.log(`   Raw balances total: $${totalFromBalances.toFixed(2)}`);
      console.log(`   Networks from raw balances: ${Object.keys(balancesByNetwork).length}`);
      console.log(`   Top networks from balances:`, 
        Object.entries(balancesByNetwork)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([net, val]) => `${net}: $${val.toFixed(2)}`)
      );
      
      // Compare with dashboard networks
      const dashboardNetworkIds = dashboard.networks.map((n: any) => n.networkId);
      const balanceNetworkIds = Object.keys(balancesByNetwork);
      
      const missingFromDashboard = balanceNetworkIds.filter((id: string) => !dashboardNetworkIds.includes(id));
      const missingFromBalances = dashboardNetworkIds.filter((id: string) => !balanceNetworkIds.includes(id));
      
      if (missingFromDashboard.length > 0) {
        console.error(`❌ [DEBUG] Networks in balances but missing from dashboard: ${missingFromDashboard.join(', ')}`);
      }
      if (missingFromBalances.length > 0) {
        console.error(`❌ [DEBUG] Networks in dashboard but missing from balances: ${missingFromBalances.join(', ')}`);
      }
    }
    
    throw new Error('CRITICAL FAILURE: Network percentages are all 0% - frontend will show empty donut chart');
  }
  
  if (Math.abs(totalPercentage - 100) > 5) {
    console.warn(`⚠️ [WARNING] Total percentages (${totalPercentage.toFixed(1)}%) don't add up to 100%`);
  }
  
  // Test 4: Validate Chart Data Preparation (Mirror Frontend Logic)
  console.log('');
  console.log('🍩 [TEST 4] Validating Chart Data Preparation...');
  
  // This mirrors the exact logic from Dashboard.tsx lines 275-282
  const chartData: ChartData[] = dashboard.networks
    .filter((network: Network) => parseFloat(network.totalNativeBalance) > 0)
    .map((network: Network) => ({
      name: network.gasAssetSymbol,
      value: network.totalValueUsd,
      color: network.color,
    })) || [];
  
  console.log(`✅ [TEST 4] Chart data prepared: ${chartData.length} slices`);
  
  let chartDataWithColors = 0;
  let totalChartValue = 0;
  
  for (const slice of chartData) {
    if (slice.color && slice.color !== null && slice.color !== 'null') {
      chartDataWithColors++;
    }
    totalChartValue += slice.value || 0;
    
    // Log first few slices
    if (chartDataWithColors <= 3) {
      console.log(`   Slice: ${slice.name} = $${(slice.value || 0).toFixed(2)} (${slice.color || 'NO_COLOR'})`);
    }
  }
  
  console.log(`   Chart slices with colors: ${chartDataWithColors}/${chartData.length}`);
  console.log(`   Total chart value: $${totalChartValue.toFixed(2)}`);
  
  if (chartData.length === 0) {
    console.error('🚨 [CRITICAL ERROR] Chart data is empty! Frontend donut chart will be blank.');
    throw new Error('CRITICAL FAILURE: Chart data is empty - frontend will show no chart');
  }
  
  if (chartDataWithColors === 0) {
    console.error('🚨 [CRITICAL ERROR] No chart slices have colors! Frontend donut chart will be colorless.');
  }
  
  // Test 5: Validate Token Detection (for tokens section)
  console.log('');
  console.log('🪙 [TEST 5] Validating Token Detection...');
  
  let tokenCount = 0;
  let nativeAssetCount = 0;
  
  if (app.balances) {
    for (const balance of app.balances) {
      // Mirror the frontend token detection logic from Dashboard.tsx lines 752-774
      const isToken = (caip: string): boolean => {
        if (!caip) return false;
        
        // Explicit token type
        if (caip.includes('erc20') || caip.includes('eip721')) return true;
        
        // ERC20 tokens have contract addresses (0x followed by 40 hex chars)
        if (caip.includes('eip155:') && /0x[a-fA-F0-9]{40}/.test(caip)) return true;
        
        // Maya tokens: denom:maya identifies Maya tokens
        if (caip.includes('cosmos:mayachain-mainnet-v1/denom:maya')) return true;
        
        // Cosmos ecosystem tokens
        if (caip.includes('MAYA.') || caip.includes('THOR.') || caip.includes('OSMO.')) return true;
        
        // Cosmos tokens using denom or ibc format
        if (caip.includes('/denom:') || caip.includes('/ibc:')) return true;
        
        // Any CAIP that doesn't use slip44 format is likely a token
        if (!caip.includes('slip44:') && caip.includes('.')) return true;
        
        return false;
      };
      
      if (isToken(balance.caip)) {
        tokenCount++;
      } else {
        nativeAssetCount++;
      }
    }
  }
  
  console.log(`✅ [TEST 5] Token detection completed`);
  console.log(`   Native assets: ${nativeAssetCount}`);
  console.log(`   Tokens detected: ${tokenCount}`);
  
  // Test 6: Performance and UX Validation
  console.log('');
  console.log('⚡ [TEST 6] Performance and UX Validation...');
  
  const hasInstantData = dashboard.totalValueUsd > 0 && chartData.length > 0;
  const hasColors = chartDataWithColors > 0;
  const hasPercentages = percentagesWithValue > 0;
  const hasTokens = tokenCount > 0;
  
  console.log(`✅ [TEST 6] Frontend UX readiness check:`);
  console.log(`   ✅ Portfolio value: ${hasInstantData ? '$' + dashboard.totalValueUsd.toFixed(2) : '❌ Missing'}`);
  console.log(`   ${hasColors ? '✅' : '❌'} Chart colors: ${chartDataWithColors}/${chartData.length}`);
  console.log(`   ${hasPercentages ? '✅' : '❌'} Donut percentages: ${percentagesWithValue} networks`);
  console.log(`   ${hasTokens ? '✅' : 'ℹ️ '} Token detection: ${tokenCount} tokens found`);
  
  // Final verdict
  console.log('');
  console.log('🏆 [FINAL VERDICT] Frontend Dashboard Validation Complete');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const criticalIssues = [];
  
  if (!hasInstantData) criticalIssues.push('No portfolio data');
  if (!hasColors) criticalIssues.push('No chart colors');
  if (!hasPercentages) criticalIssues.push('No percentages (empty donut)');
  if (chartData.length === 0) criticalIssues.push('No chart data');
  
  if (criticalIssues.length === 0) {
    console.log('🎉 [SUCCESS] All frontend requirements satisfied! Dashboard should render perfectly.');
    return {
      success: true,
      dashboard,
      chartData,
      metrics: {
        networksWithValue,
        percentagesWithValue,
        chartDataWithColors,
        tokenCount,
        totalValue: dashboard.totalValueUsd
      }
    };
  } else {
    console.error(`❌ [FAILURE] ${criticalIssues.length} critical issues found:`);
    criticalIssues.forEach((issue, i) => {
      console.error(`   ${i + 1}. ${issue}`);
    });
    
    throw new Error(`Frontend validation failed: ${criticalIssues.join(', ')}`);
  }
};
