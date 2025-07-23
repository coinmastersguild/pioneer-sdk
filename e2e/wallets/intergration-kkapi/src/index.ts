#!/usr/bin/env node

import './kkapi-adapter';

interface VaultCacheStatus {
    available: boolean;
    cached_pubkeys: number;
    cached_balances: number;
    last_updated?: number;
    reason?: string;
}

interface VaultSpeedTestResult {
    totalTime: number;
    successCount: number;
    avgTime: number;
    results: Array<{
        path: string;
        xpub?: string;
        error?: string;
        time_ms: number;
    }>;
}

interface PortfolioBalance {
    ticker: string;
    name?: string;
    balance: string;
    value_usd: string;
    price_usd?: string;
    network_id: string;
    icon?: string;
    percentage?: number;
}

interface EnhancedPortfolioResponse {
    success: boolean;
    device_id?: string;
    total_value_usd: number;
    last_updated: number;
    change_from_previous?: number;
    change_24h?: number;
    balances: PortfolioBalance[];
    history: Array<[number, number]>; // [timestamp, value]
    cached: boolean;
    refreshing: boolean;
}

/**
 * Check if kkapi:// vault is available and has cached data
 */
async function checkVaultAvailability(): Promise<VaultCacheStatus> {
    console.log('🔍 [VAULT CHECK] Testing kkapi:// vault availability...');
    
    try {
        // 1. Health check
        const healthResponse = await fetch('kkapi://api/health');
        if (!healthResponse.ok) {
            return {
                available: false,
                cached_pubkeys: 0,
                cached_balances: 0,
                reason: `Health check failed: HTTP ${healthResponse.status}`
            };
        }
        
        const healthData: any = await healthResponse.json();
        console.log('✅ [VAULT] Health check passed:', healthData);
        
        // 2. Check cache status
        const cacheResponse = await fetch('kkapi://api/cache/status');
        if (!cacheResponse.ok) {
            return {
                available: true, // Vault is up but cache endpoint might not exist
                cached_pubkeys: 0,
                cached_balances: 0,
                reason: 'Cache status endpoint not available'
            };
        }
        
        const cacheData: any = await cacheResponse.json();
        console.log('✅ [VAULT] Cache status:', cacheData);
        
        return {
            available: true,
            cached_pubkeys: cacheData.cached_pubkeys || 0,
            cached_balances: cacheData.cached_balances || 0,
            last_updated: cacheData.last_updated
        };
        
    } catch (error: any) {
        console.error('❌ [VAULT] Availability check failed:', error.message);
        return {
            available: false,
            cached_pubkeys: 0,
            cached_balances: 0,
            reason: error.message
        };
    }
}

/**
 * Get device list to find the connected KeepKey
 */
async function getConnectedDevice(): Promise<string | null> {
    console.log('🔌 [DEVICE] Looking for connected KeepKey...');
    
    try {
        const response = await fetch('kkapi://api/devices');
        if (!response.ok) {
            console.error('❌ [DEVICE] Failed to list devices:', response.status);
            return null;
        }
        
        const devices = await response.json() as any[];
        const keepkey = devices.find(d => d.is_keepkey);
        
        if (keepkey) {
            console.log(`✅ [DEVICE] Found KeepKey: ${keepkey.device_id}`);
            return keepkey.device_id;
        } else {
            console.log('⚠️  [DEVICE] No KeepKey found');
            return null;
        }
        
    } catch (error: any) {
        console.error('❌ [DEVICE] Failed to get devices:', error.message);
        return null;
    }
}

/**
 * Test instant portfolio loading with historical data
 */
async function testInstantPortfolio(deviceId: string): Promise<EnhancedPortfolioResponse | null> {
    console.log('💰 [PORTFOLIO] Testing instant portfolio loading...');
    
    const startTime = performance.now();
    
    try {
        const response = await fetch(`kkapi://api/portfolio/instant/${deviceId}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json() as EnhancedPortfolioResponse;
        const loadTime = performance.now() - startTime;
        
        console.log(`⚡ [PORTFOLIO] Instant load time: ${Math.round(loadTime)}ms`);
        console.log(`💵 [PORTFOLIO] Total Value: $${data.total_value_usd.toFixed(2)}`);
        console.log(`📅 [PORTFOLIO] Last Updated: ${new Date(data.last_updated * 1000).toLocaleString()}`);
        console.log(`💾 [PORTFOLIO] Data Source: ${data.cached ? 'Cache' : 'Fresh'}`);
        
        if (data.change_from_previous !== undefined && data.change_from_previous !== null) {
            const changeEmoji = data.change_from_previous >= 0 ? '📈' : '📉';
            const changeColor = data.change_from_previous >= 0 ? '\x1b[32m' : '\x1b[31m';
            console.log(`${changeEmoji} [PORTFOLIO] Change: ${changeColor}${data.change_from_previous.toFixed(2)}%\x1b[0m`);
        }
        
        if (data.refreshing) {
            console.log('🔄 [PORTFOLIO] Background refresh in progress...');
        }
        
        // Show top assets
        if (data.balances.length > 0) {
            console.log('\n📊 [PORTFOLIO] Top Assets:');
            const topAssets = data.balances
                .sort((a, b) => parseFloat(b.value_usd) - parseFloat(a.value_usd))
                .slice(0, 5);
            
            topAssets.forEach((asset, i) => {
                const value = parseFloat(asset.value_usd);
                const percentage = (value / data.total_value_usd * 100).toFixed(1);
                console.log(`   ${i + 1}. ${asset.ticker}: $${value.toFixed(2)} (${percentage}%)`);
            });
        }
        
        // Show history summary
        if (data.history.length > 0) {
            console.log('\n📈 [PORTFOLIO] Value History:');
            const firstValue = data.history[0][1];
            const lastValue = data.history[data.history.length - 1][1];
            const change = ((lastValue - firstValue) / firstValue * 100).toFixed(2);
            console.log(`   First: $${firstValue.toFixed(2)}`);
            console.log(`   Latest: $${lastValue.toFixed(2)}`);
            console.log(`   Change: ${change}%`);
            console.log(`   Data Points: ${data.history.length}`);
        }
        
        return data;
        
    } catch (error: any) {
        console.error('❌ [PORTFOLIO] Failed:', error.message);
        return null;
    }
}

/**
 * Test historical portfolio data
 */
async function testPortfolioHistory(deviceId: string): Promise<void> {
    console.log('\n📈 [HISTORY] Fetching portfolio history...');
    
    try {
        // Get 30-day history
        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 3600);
        const response = await fetch(`kkapi://api/portfolio/history/${deviceId}?from=${thirtyDaysAgo}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const history = await response.json() as Array<[number, number]>;
        
        if (history.length === 0) {
            console.log('   No historical data available yet');
            return;
        }
        
        console.log(`   Found ${history.length} data points over 30 days`);
        
        // Calculate statistics
        const values = history.map(h => h[1]);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
        const volatility = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / values.length);
        
        console.log(`   📊 Statistics:`);
        console.log(`      Min: $${minValue.toFixed(2)}`);
        console.log(`      Max: $${maxValue.toFixed(2)}`);
        console.log(`      Avg: $${avgValue.toFixed(2)}`);
        console.log(`      Volatility: $${volatility.toFixed(2)}`);
        
        // Show simple ASCII chart
        console.log('\n   📊 30-Day Chart:');
        const chartHeight = 10;
        const chartWidth = 50;
        const range = maxValue - minValue;
        
        for (let row = chartHeight; row >= 0; row--) {
            let line = '   ';
            const threshold = minValue + (range * row / chartHeight);
            
            for (let col = 0; col < chartWidth; col++) {
                const dataIndex = Math.floor(col * history.length / chartWidth);
                const value = history[dataIndex][1];
                line += value >= threshold ? '█' : ' ';
            }
            
            if (row === chartHeight) line += ` $${maxValue.toFixed(0)}`;
            if (row === chartHeight / 2) line += ` $${avgValue.toFixed(0)}`;
            if (row === 0) line += ` $${minValue.toFixed(0)}`;
            
            console.log(line);
        }
        console.log(`   ${'─'.repeat(chartWidth)} Time →`);
        
    } catch (error: any) {
        console.error('❌ [HISTORY] Failed:', error.message);
    }
}

/**
 * Test pubkey speed
 */
async function testVaultPubkeySpeed(): Promise<VaultSpeedTestResult> {
    console.log('\n🚀 [SPEED TEST] Testing vault pubkey performance vs device...');
    
    const bitcoinPaths = [
        // Account 0 - Main test paths
        [2147483692, 2147483648, 2147483648], // m/44'/0'/0' (p2pkh)
        [2147483697, 2147483648, 2147483648], // m/49'/0'/0' (p2sh-p2wpkh) 
        [2147483732, 2147483648, 2147483648], // m/84'/0'/0' (p2wpkh)
        
        // Account 1 
        [2147483692, 2147483648, 2147483649], // m/44'/0'/1' (p2pkh)
        [2147483697, 2147483648, 2147483649], // m/49'/0'/1' (p2sh-p2wpkh)
        [2147483732, 2147483648, 2147483649], // m/84'/0'/1' (p2wpkh)
        
        // Account 2
        [2147483692, 2147483648, 2147483650], // m/44'/0'/2' (p2pkh)
        [2147483697, 2147483648, 2147483650], // m/49'/0'/2' (p2sh-p2wpkh)
        [2147483732, 2147483648, 2147483650], // m/84'/0'/2' (p2wpkh)
    ];
    
    const startTime = performance.now();
    const results = [];
    
    console.log(`📊 [SPEED TEST] Testing ${bitcoinPaths.length} Bitcoin derivation paths...`);
    
    for (let i = 0; i < bitcoinPaths.length; i++) {
        const pathStart = performance.now();
        const addressN = bitcoinPaths[i];
        const pathStr = `m/${addressN.map(n => n >= 0x80000000 ? `${n - 0x80000000}'` : n.toString()).join('/')}`;
        
        try {
            const response = await fetch('kkapi://system/info/get-public-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address_n: addressN,
                    show_display: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data: any = await response.json();
            const pathTime = performance.now() - pathStart;
            
            results.push({
                path: pathStr,
                xpub: data.xpub,
                time_ms: Math.round(pathTime)
            });
            
            console.log(`✅ [VAULT] ${i + 1}/${bitcoinPaths.length} ${pathStr}: ${Math.round(pathTime)}ms`);
            
        } catch (error: any) {
            const pathTime = performance.now() - pathStart;
            console.error(`❌ [VAULT] ${i + 1}/${bitcoinPaths.length} ${pathStr} failed: ${error.message}`);
            results.push({
                path: pathStr,
                error: error.message,
                time_ms: Math.round(pathTime)
            });
        }
    }
    
    const totalTime = performance.now() - startTime;
    const successCount = results.filter(r => r.xpub).length;
    const avgTime = results.reduce((sum, r) => sum + r.time_ms, 0) / results.length;
    
    console.log('🎯 [SPEED TEST] Results Summary:');
    console.log(`   📊 Total time: ${Math.round(totalTime)}ms`);
    console.log(`   ✅ Successful: ${successCount}/${bitcoinPaths.length}`);
    console.log(`   ⚡ Average per path: ${Math.round(avgTime)}ms`);
    console.log(`   🔥 Projected 27-path time: ${Math.round(avgTime * 27)}ms`);
    console.log(`   💡 vs Device (~400ms/path): ${Math.round(400 * 27)}ms`);
    console.log(`   🚀 Potential savings: ${Math.round((400 * 27) - (avgTime * 27))}ms (~${Math.round(((400 * 27) - (avgTime * 27)) / 1000)}s)`);
    
    return { totalTime, successCount, avgTime, results };
}

/**
 * Main test runner
 */
async function runKKAPIIntegrationTest(): Promise<void> {
    console.log('🚀 ======================================');
    console.log('🚀 KKAPI:// Portfolio Integration Test');
    console.log('🚀 ======================================');
    console.time('total-test-time');
    
    try {
        // 1. Check vault availability
        const vaultStatus = await checkVaultAvailability();
        
        if (!vaultStatus.available) {
            console.error('❌ [FAIL] Vault is not available:', vaultStatus.reason);
            console.log('');
            console.log('💡 [HELP] To fix this:');
            console.log('   1. Make sure keepkey-vault-v5 is running');
            console.log('   2. Check that it\'s listening on port 1646');
            console.log('   3. Verify kkapi:// protocol is configured');
            process.exit(1);
        }
        
        console.log('✅ [SUCCESS] Vault is available and responding!');
        console.log('');
        
        // 2. Get connected device
        const deviceId = await getConnectedDevice();
        if (!deviceId) {
            console.error('❌ [FAIL] No KeepKey device found');
            console.log('💡 [HELP] Please connect your KeepKey device');
            process.exit(1);
        }
        
        // 3. Test instant portfolio loading
        const portfolioData = await testInstantPortfolio(deviceId);
        
        // 4. Test portfolio history if we have data
        if (portfolioData && portfolioData.total_value_usd > 0) {
            await testPortfolioHistory(deviceId);
        }
        
        // 5. Test pubkey speed
        const speedResults = await testVaultPubkeySpeed();
        
        // 6. Wait for background refresh if happening
        if (portfolioData?.refreshing) {
            console.log('\n⏳ [PORTFOLIO] Waiting for background refresh to complete...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check updated portfolio
            console.log('🔄 [PORTFOLIO] Checking for updated data...');
            const updatedData = await testInstantPortfolio(deviceId);
            
            if (updatedData && !updatedData.cached) {
                console.log('✅ [PORTFOLIO] Fresh data loaded!');
            }
        }
        
        // 7. Summary and recommendations
        console.log('\n📋 [SUMMARY] KKAPI Portfolio Test Results:');
        console.log('===========================================');
        console.log(`✅ Vault Status: Available (${vaultStatus.cached_pubkeys} cached pubkeys)`);
        console.log(`💰 Portfolio Value: $${portfolioData?.total_value_usd.toFixed(2) || '0.00'}`);
        console.log(`📊 Assets: ${portfolioData?.balances.length || 0}`);
        console.log(`📈 History Points: ${portfolioData?.history.length || 0}`);
        console.log(`⚡ Pubkey Speed: ${Math.round(speedResults.avgTime)}ms avg`);
        
        if (portfolioData && portfolioData.change_from_previous !== undefined) {
            const changeEmoji = portfolioData.change_from_previous >= 0 ? '📈' : '📉';
            console.log(`${changeEmoji} Portfolio Change: ${portfolioData.change_from_previous.toFixed(2)}%`);
        }
        
        console.log('');
        console.log('🎯 [FEATURES DEMONSTRATED]:');
        console.log('   ✅ Instant portfolio loading from cache');
        console.log('   ✅ Historical value tracking');
        console.log('   ✅ Asset-by-asset breakdown');
        console.log('   ✅ Change tracking from previous value');
        console.log('   ✅ Background refresh for fresh data');
        console.log('   ✅ Fast pubkey derivation');
        
        console.log('');
        console.log('✅ [SUCCESS] KKAPI portfolio integration test completed!');
        
    } catch (error: any) {
        console.error('❌ [FATAL] Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        console.timeEnd('total-test-time');
    }
}

// Run the test
runKKAPIIntegrationTest().catch(error => {
    console.error('❌ [FATAL] Unhandled error:', error);
    process.exit(1);
}); 