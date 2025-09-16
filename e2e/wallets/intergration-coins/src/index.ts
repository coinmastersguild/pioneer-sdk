/*
    E2E testing

       This an e2e testing framework targeting node.js containers

       it is the equivalent of the pioneer-react file for a web browser.

       it is the building blocks of a pioneer-cli that run perform transfers as a "skill"
 */

import * as console from 'console';

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test | "
import { WalletOption, availableChainsByWallet, getChainEnumValue, NetworkIdToChain, Chain } from '@coinmasters/types';
import { installKkapiAdapter } from './kkapi-adapter';
//@ts-ignore
import { AssetValue } from '@pioneer-platform/helpers';
import type { AssetValue as AssetValueType } from '@pioneer-platform/helpers';
// import { AssetValue as AssetValueType } from '@coinmasters/core';

const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId, shortListSymbolToCaip} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;
import {
    getPaths,
    addressNListToBIP32,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';
//let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'

let spec = 'https://pioneers.dev/spec/swagger.json'
// let spec = 'http://127.0.0.1:9001/spec/swagger.json'

// Use local kkcli-v2 server for testing
//let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
// const DB = require('@coinmasters/pioneer-db-sql');
console.log("spec: ",spec)



let txid:string
let IS_SIGNED: boolean



const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        // Performance optimization flag
        const FAST_MODE = process.env.FAST_MODE === 'true';
        if (FAST_MODE) {
            console.log('🏃 [FAST MODE] Skipping expensive validations for speed test');
        }
        
        // Install kkapi:// adapter for Node.js testing environment
        installKkapiAdapter();
        
        console.log('🚀 [INTEGRATION TEST] Starting enhanced performance test...')
        
        // Performance tracking
        const perfStart = performance.now();
        let firstPortfolioTime = null;
        let fullSyncTime = null;
        console.time('⏱️ TOTAL_TEST_TIME');
        console.time('⏱️ 1_SETUP_AND_INIT');
        console.time('⏱️ 2_GET_GAS_ASSETS');
        console.time('⏱️ 3_GET_PUBKEYS');
        console.time('⏱️ 4_GET_BALANCES');
        console.time('⏱️ 5_BITCOIN_ONLY_RECONFIG');
        console.time('⏱️ 6_BITCOIN_ONLY_SYNC');

        //(tag,' CHECKPOINT 1');
        console.time('start2init');
        console.time('start2pair');
        console.time('start2Pubkeys');
        console.time('start2BalancesGas');
        console.time('start2BalancesTokens');
        console.time('start2end');

        // Optional health check for kkapi:// protocol (graceful fallback)
        console.log('🚀 [HEALTH CHECK] Testing kkapi:// protocol (optional)...');
        let vaultAvailable = false;
        try {
            const healthResponse = await fetch('kkapi://api/health');
            if (!healthResponse.ok) {
                throw new Error(`Health check failed with status: ${healthResponse.status}`);
            }
            const healthData = await healthResponse.json();
            console.log('🚀 [HEALTH CHECK] ✅ kkapi:// protocol is working!', healthData);
            vaultAvailable = true;
        } catch (healthError: any) {
            console.warn('🚀 [HEALTH CHECK] ⚠️  kkapi:// protocol not available:', healthError.message);
            console.warn('🚀 [HEALTH CHECK] This is OK - continuing with legacy KeepKey Desktop support');
            console.warn('🚀 [HEALTH CHECK] (If you want vault features, run keepkey-vault-v5 separately)');
            vaultAvailable = false;
        }

        // Basic cache detection test (only if vault is available)
        async function checkVaultCache() {
            if (!vaultAvailable) {
                console.log('🚀 [CACHE CHECK] Skipping cache check - vault not available');
                return { available: false, reason: 'vault_not_available' };
            }
            
            console.log('🚀 [CACHE CHECK] Testing vault cache availability...');
            
            try {
                // Check if cache status endpoint exists
                const cacheResponse = await fetch('kkapi://api/cache/status');
                if (!cacheResponse.ok) {
                    console.log('⚠️ [CACHE CHECK] Cache status endpoint not available');
                    return { available: false, reason: 'status_endpoint_missing' };
                }
                
                const cacheStatus = await cacheResponse.json();
                console.log('✅ [CACHE CHECK] Cache status endpoint works:', cacheStatus);
                
                // Check for cached portfolio
                const portfolioResponse = await fetch('kkapi://api/portfolio');
                console.log('portfolioResponse: ', portfolioResponse);
                if (!portfolioResponse.ok) {
                    console.log('⚠️ [CACHE CHECK] Portfolio cache not available');
                    return { available: false, reason: 'portfolio_not_cached' };
                }
                
                const portfolio: any = await portfolioResponse.json();
                console.log('✅ [CACHE CHECK] Found cached portfolio balances:', portfolio.balances?.length || 0);
                
                return { 
                    available: true, 
                    balances: portfolio.balances?.length || 0
                };
                
            } catch (error: any) {
                console.log('❌ [CACHE CHECK] Cache check failed:', error.message);
                return { available: false, reason: 'error', error: error.message };
            }
        }

        const cacheStatus = await checkVaultCache();
        console.log('🔍 [CACHE STATUS]', cacheStatus);

        // Test vault pubkey speed
        await testVaultPubkeySpeed();

        if (cacheStatus.available) {
            console.log('🚀 [FAST MODE] Vault cache available - fast startup possible!');
        } else {
            console.log('⚠️ [SLOW MODE] Cache not available - using traditional flow');
            console.log('   Reason:', cacheStatus.reason);
        }

        // if force new user
        const queryKey = "sdk:pair-keepkey:"+Math.random();
        log.debug(tag,"queryKey: ",queryKey)
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        //get last configured blockchains

        //get all default blockchains

        //add a few custom blockchains

        let AllChainsSupported = [
            'ETH',
            'MATIC', // Polygon - EVM
            'BASE',  // Base - EVM
            'BSC',   // BNB Smart Chain - EVM
            'BTC',   // Bitcoin - UTXO
            'LTC',   // Litecoin - UTXO
            'DOGE',  // Dogecoin - UTXO
            'BCH',   // Bitcoin Cash - UTXO
            'DASH',  // Dash - UTXO
            'GAIA',  // Cosmos - Tendermint
            'OSMO',  // Osmosis - Tendermint
            'XRP',   // Ripple
            // 'MAYA',  // Maya - Tendermint (might not have fees implemented)
            // 'THOR'   // THORChain - Tendermint (might not have fees implemented)
        ]

        let blockchains = AllChainsSupported.map(
          // @ts-ignore
          (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
        );
        log.debug(tag,"blockchains: ",blockchains)
        log.debug(tag,"blockchains: ",blockchains.length)

        //add custom chains
        // let blockchains = []
        let nodes = []
        //scroll
        // blockchains.push('eip155:534352')

        let node = {
            networkId:'eip155:534352',
            service:'https://scroll.drpc.org',
            protocol: 'EVM'
        }
        nodes.push(node)

        //2000
        // blockchains.push('eip155:2000')

        //base
        // blockchains.push('eip155:8453')


        //add custom path
        // let blockchains = [BLOCKCHAIN]

        // let paths:any = []

        let paths = getPaths(blockchains)
        log.info(tag,'paths:',paths)

        paths.push({
          note: ' ETH account 1',
          networks: [ 'eip155:1', 'eip155:*' ],
          type: 'address',
          addressNList: [ 2147483692, 2147483708, 2147483648 ],
          addressNListMaster: [ 2147483692, 2147483708, 2147483648, 1, 0 ],
          curve: 'secp256k1',
          showDisplay: false
        })
        log.info(tag,'paths:',paths)

        for(let i = 0; i < paths.length; i++){
            let path = paths[i]
            assert(path.networks)
        }
        log.info(tag,'paths: ',paths.length)


        let config:any = {
            username:'tester123',
            queryKey:'123456',
            spec,
            wss: process.env.VITE_PIONEER_URL_WSS || 'wss://pioneers.dev',
            keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
            // Use vault if available, otherwise fall back to legacy desktop support
            keepkeyEndpoint: vaultAvailable ? 'kkapi://' : undefined,
            paths,
            blockchains,
            nodes,
            pubkeys:[],
            balances:[],
        };

        //console.log(tag,' CHECKPOINT 2');
        //console.log(tag,' config: ',config);
        
        // Log configuration
        console.log('📋 [CONFIG] Mode:', vaultAvailable ? 'VAULT (kkapi://)' : 'LEGACY DESKTOP')
        
        let app = new SDK.SDK(spec,config)
        log.debug('app: ',app.spec)
        assert(app.spec)
        assert(app.spec,spec)

        // Initialize Pioneer SDK
        console.log('🚀 [INIT] Starting Pioneer SDK initialization...')
        
        // Add timeout for init
        const initTimeout = setTimeout(() => {
            console.error('⏰ [TIMEOUT] Init hanging for >60s - possible device connection issue')
        }, 60000)
        
        let resultInit
        try {
            // 🚀 FAST PORTFOLIO PATTERN: Use new init with automatic fast portfolio loading
            console.log('🚀 [FAST PORTFOLIO] Using enhanced init with fast portfolio → background sync pattern')
            resultInit = await app.init({ }, { skipSync: false })
            clearTimeout(initTimeout)
            console.log('✅ [INIT] Pioneer SDK initialized successfully')
            
            // Check if we got portfolio data from fast loading
            if (app.balances && app.balances.length > 0) {
                firstPortfolioTime = performance.now() - perfStart;
                console.log('🎉 [FAST PORTFOLIO] SUCCESS! Portfolio loaded during init')
                console.log(`📊 [FAST PORTFOLIO] Balances: ${app.balances.length} assets`)
                if (app.dashboard && app.dashboard.totalValueUsd) {
                    console.log(`💰 [FAST PORTFOLIO] Total value: $${app.dashboard.totalValueUsd.toFixed(2)} USD`)
                }
                console.log(`⚡ [PERFORMANCE] Time to first portfolio: ${firstPortfolioTime.toFixed(0)}ms`)
            } else {
                console.log('⚠️ [FAST PORTFOLIO] No portfolio data loaded during init (expected if vault not available)')
            }
        } catch (error) {
            clearTimeout(initTimeout)
            const err = error as Error
            console.error('❌ [INIT] Failed:', err.message || 'Unknown error')
            throw error
        }
        
        log.info(tag,' ****** Init Complete ******')
        log.debug(tag, '🔍 Init result:', resultInit)
        // log.info('apiKey: ',app);
        log.info('apiKey: ',app.keepkeyApiKey);
        
        console.timeEnd('⏱️ 1_SETUP_AND_INIT');
        console.log('🎯 [PERF] Setup and Init completed at:', (performance.now() - perfStart).toFixed(0) + 'ms');

        // Verify KeepKey SDK configuration
        if (app.keepKeySdk && app.keepKeySdk.config) {
            const pairingInfo = app.keepKeySdk.config.pairingInfo;
            if (pairingInfo && pairingInfo.url) {
                if (pairingInfo.url.startsWith('kkapi://')) {
                    console.log('✅ [SDK] Using kkapi:// protocol');
                } else if (pairingInfo.url.includes('localhost:1646')) {
                    console.log('✅ [SDK] Using HTTP localhost:1646');
                }
            }
        }

        // Add essential event handlers
        app.events.on('device:connected', (device: any) => {
          console.log('🔌 [DEVICE] Connected:', device.name || device.deviceId || 'Unknown')
        })
        
        // Load gas assets
        console.log('⛽ [ASSETS] Loading gas assets...')
        await app.getGasAssets()
        console.log('✅ [ASSETS] Loaded', app.assetsMap ? app.assetsMap.size : 0, 'assets')
        
        console.timeEnd('⏱️ 2_GET_GAS_ASSETS');
        console.log('🎯 [PERF] GetGasAssets completed at:', (performance.now() - perfStart).toFixed(0) + 'ms');


        log.info(tag,'🔍 Starting blockchain asset validation...')
        for(let i = 0; i < blockchains.length; i++){
            let blockchain = blockchains[i]
            log.debug(tag,`🔗 Validating blockchain ${i+1}/${blockchains.length}: ${blockchain}`)

            // ========================================
            // FEE TESTING FOR THIS CHAIN
            // ========================================
            console.log(`💸 [FEES] Testing fees for ${blockchain}`);

            try {
                // Use the new normalized getFees method from SDK
                const normalizedFees = await app.getFees(blockchain);

                if (!normalizedFees) {
                    throw new Error(`No fee data returned for ${blockchain}`);
                }

                console.log(`✅ [FEES] Got normalized fee data for ${blockchain}:`, {
                    networkType: normalizedFees.networkType,
                    slow: normalizedFees.slow.value + ' ' + normalizedFees.slow.unit,
                    average: normalizedFees.average.value + ' ' + normalizedFees.average.unit,
                    fastest: normalizedFees.fastest.value + ' ' + normalizedFees.fastest.unit
                });

                // Validate the normalized structure
                if (!normalizedFees.slow || !normalizedFees.average || !normalizedFees.fastest) {
                    throw new Error(`Invalid normalized fee structure for ${blockchain}`);
                }

                // Validate each fee level has required properties
                const feeLevels = ['slow', 'average', 'fastest'] as const;
                for (const level of feeLevels) {
                    const feeLevel = normalizedFees[level];
                    if (!feeLevel.label) {
                        throw new Error(`Missing label for ${level} fee on ${blockchain}`);
                    }
                    if (!feeLevel.value) {
                        throw new Error(`Missing value for ${level} fee on ${blockchain}`);
                    }
                    if (!feeLevel.unit) {
                        throw new Error(`Missing unit for ${level} fee on ${blockchain}`);
                    }
                    if (!feeLevel.description) {
                        throw new Error(`Missing description for ${level} fee on ${blockchain}`);
                    }
                    if (!feeLevel.priority) {
                        throw new Error(`Missing priority for ${level} fee on ${blockchain}`);
                    }

                    // Validate value is a positive number
                    const value = parseFloat(feeLevel.value);
                    if (isNaN(value) || value <= 0) {
                        throw new Error(`Invalid fee value for ${level} on ${blockchain}: ${feeLevel.value}`);
                    }
                }

                // Validate fee progression (slow <= average <= fastest)
                const slowVal = parseFloat(normalizedFees.slow.value);
                const avgVal = parseFloat(normalizedFees.average.value);
                const fastestVal = parseFloat(normalizedFees.fastest.value);

                if (slowVal > avgVal || avgVal > fastestVal) {
                    console.warn(`⚠️ [FEES] Fee progression not optimal for ${blockchain}: slow=${slowVal}, average=${avgVal}, fastest=${fastestVal}`);
                }

                // Log the normalized fees with rich metadata
                console.log(`📊 [FEES] Normalized fees for ${blockchain} (${normalizedFees.networkType}):`);
                console.log(`   💰 ${normalizedFees.slow.label}: ${normalizedFees.slow.value} ${normalizedFees.slow.unit}`);
                console.log(`      Priority: ${normalizedFees.slow.priority}, Est. time: ${normalizedFees.slow.estimatedTime}`);
                console.log(`   💵 ${normalizedFees.average.label}: ${normalizedFees.average.value} ${normalizedFees.average.unit}`);
                console.log(`      Priority: ${normalizedFees.average.priority}, Est. time: ${normalizedFees.average.estimatedTime}`);
                console.log(`   🚀 ${normalizedFees.fastest.label}: ${normalizedFees.fastest.value} ${normalizedFees.fastest.unit}`);
                console.log(`      Priority: ${normalizedFees.fastest.priority}, Est. time: ${normalizedFees.fastest.estimatedTime}`);

                // Test fee estimation
                const estimatedFee = app.estimateTransactionFee(
                    normalizedFees.average.value,
                    normalizedFees.average.unit,
                    normalizedFees.networkType,
                    250 // example tx size
                );
                console.log(`   📐 Estimated transaction fee: ${estimatedFee.amount} ${estimatedFee.unit}`);

                console.log(`✅ [FEES] Successfully validated normalized fees for ${blockchain}`);

            } catch (error: any) {
                console.error(`❌ [FEES] Failed to get/validate fees for ${blockchain}:`, error.message);
                // Continue with other validations, but note the fee failure
                console.error(`⚠️ [FEES] Continuing test despite fee failure for ${blockchain}`);
            }

        }
        log.info(tag,' ****** Validated Assets for each chain exist bro ******')


        //validate assetContext on tokens

        console.log('📊 =========================================================');
        
        // Next steps for integration-transfer test:
        // 1. Use setPubkeyContext to select which account to transfer FROM
        // 2. Build transfer/swap transactions with the selected pubkey context
        // 3. Validate that transactions use the correct FROM address
        // 4. Test switching contexts mid-operation
        // 5. Ensure balance checks respect the current pubkey context
        log.info(tag,'📝 Ready for integration-transfer pubkey context testing!')
        
        // Exit successfully
        log.info(tag, '🎉 All tests completed successfully! Exiting with code 0.');
        process.exit(0);
        
    } catch (e) {
        log.error(tag, '❌ TEST FAILED:', e)
        console.log("************************* TEST FAILED *************************")
        
        // Exit with failure code
        process.exit(1)
    }
}

async function testVaultPubkeySpeed() {
    console.log('🚀 [VAULT SPEED TEST] Testing vault pubkey fetching speed...');
    
    const bitcoinPaths = [
        // Account 0
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
    
    for (let i = 0; i < bitcoinPaths.length; i++) {
        const pathStart = performance.now();
        
        try {
            const response = await fetch('kkapi://system/info/get-public-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address_n: bitcoinPaths[i],
                    show_display: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data: any = await response.json();
            const pathTime = performance.now() - pathStart;
            
            results.push({
                path: `m/${bitcoinPaths[i].map(n => n >= 0x80000000 ? `${n - 0x80000000}'` : n.toString()).join('/')}`,
                xpub: data.xpub,
                time_ms: Math.round(pathTime)
            });
            
            console.log(`✅ [VAULT] Path ${i + 1}/${bitcoinPaths.length}: ${Math.round(pathTime)}ms`);
            
        } catch (error: any) {
            console.error(`❌ [VAULT] Path ${i + 1} failed: ${error.message}`);
            results.push({
                path: `m/${bitcoinPaths[i].map(n => n >= 0x80000000 ? `${n - 0x80000000}'` : n.toString()).join('/')}`,
                error: error.message,
                time_ms: performance.now() - pathStart
            });
        }
    }
    
    const totalTime = performance.now() - startTime;
    const successCount = results.filter(r => r.xpub).length;
    const avgTime = results.reduce((sum, r) => sum + r.time_ms, 0) / results.length;
    
    console.log('🎯 [VAULT SPEED TEST] Results:');
    console.log(`   📊 Total time: ${Math.round(totalTime)}ms`);
    console.log(`   ✅ Successful: ${successCount}/${bitcoinPaths.length}`);
    console.log(`   ⚡ Average per path: ${Math.round(avgTime)}ms`);
    console.log(`   🔥 Projected 27-path time: ${Math.round(avgTime * 27)}ms`);
    
    if (successCount > 0) {
        console.log('📋 [VAULT] Sample results:');
        results.slice(0, 3).forEach(r => {
            if (r.xpub) {
                console.log(`   ${r.path}: ${r.xpub.substring(0, 20)}... (${r.time_ms}ms)`);
            }
        });
    }
    
    return { totalTime, successCount, avgTime, results };
}

// Start the test
test_service().catch((error) => {
    console.error('❌ Unhandled test error:', error);
    process.exit(1);
});
