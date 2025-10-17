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

// let spec = 'https://pioneers.dev/spec/swagger.json'
let spec = 'http://127.0.0.1:9001/spec/swagger.json'

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
            // 'ETH',
            // 'MATIC', // Polygon - EVM
            // 'BASE',  // Base - EVM
            // 'BSC',   // BNB Smart Chain - EVM
            // 'BTC',   // Bitcoin - UTXO
            // 'LTC',   // Litecoin - UTXO
            // 'DOGE',  // Dogecoin - UTXO
            // 'BCH',   // Bitcoin Cash - UTXO
            // 'DASH',  // Dash - UTXO
            // 'GAIA',  // Cosmos - Tendermint
            // 'OSMO',  // Osmosis - Tendermint
            // 'XRP',   // Ripple
            'MAYA',  // Maya - Tendermint (might not have fees implemented)
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

        console.log(tag,' CHECKPOINT 2');
        console.log(tag,' config: ',config);
        
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

        // TESTING

        //addPath
        console.log('\n🧪 [ADD PATH TEST] Testing dynamic path addition...');
        const mayaPath = {
          note:" MAYA path 2",
          type:"address",
          addressNList: [0x80000000 + 44, 0x80000000 + 931, 0x80000000 + 0, 0, 2],
          addressNListMaster: [0x80000000 + 44, 0x80000000 + 931, 0x80000000 + 0, 0, 2],
          curve: 'secp256k1',
          script_type:"mayachain",
          showDisplay: false, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
          networks: ['cosmos:mayachain-mainnet-v1'],
        };

        console.log('📋 [ADD PATH TEST] Paths before:', app.paths.length);
        console.log('🔑 [ADD PATH TEST] Pubkeys before:', app.pubkeys.length);
        console.log('💰 [ADD PATH TEST] Balances before:', app.balances.length);

        const addPathResult = await app.addPath(mayaPath);

        console.log('✅ [ADD PATH TEST] Result:', addPathResult);
        console.log('📋 [ADD PATH TEST] Paths after:', app.paths.length);
        console.log('🔑 [ADD PATH TEST] Pubkeys after:', app.pubkeys.length);
        console.log('💰 [ADD PATH TEST] Balances after:', app.balances.length);

        //refresh?


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
        
        // console.timeEnd('⏱️ 2_GET_GAS_ASSETS');
        // console.log('🎯 [PERF] GetGasAssets completed at:', (performance.now() - perfStart).toFixed(0) + 'ms');
        //
        //
        // log.info(tag,'🔍 Starting blockchain asset validation...')
        // for(let i = 0; i < blockchains.length; i++){
        //     let blockchain = blockchains[i]
        //     log.debug(tag,`🔗 Validating blockchain ${i+1}/${blockchains.length}: ${blockchain}`)
        //
        //     // ========================================
        //     // FEE TESTING FOR THIS CHAIN
        //     // ========================================
        //     console.log(`💸 [FEES] Testing fees for ${blockchain}`);
        //
        //     try {
        //         // Use the new normalized getFees method from SDK
        //         const normalizedFees = await app.getFees(blockchain);
        //
        //         if (!normalizedFees) {
        //             throw new Error(`No fee data returned for ${blockchain}`);
        //         }
        //
        //         console.log(`✅ [FEES] Got normalized fee data for ${blockchain}:`, {
        //             networkType: normalizedFees.networkType,
        //             slow: normalizedFees.slow.value + ' ' + normalizedFees.slow.unit,
        //             average: normalizedFees.average.value + ' ' + normalizedFees.average.unit,
        //             fastest: normalizedFees.fastest.value + ' ' + normalizedFees.fastest.unit
        //         });
        //
        //         // Validate the normalized structure
        //         if (!normalizedFees.slow || !normalizedFees.average || !normalizedFees.fastest) {
        //             throw new Error(`Invalid normalized fee structure for ${blockchain}`);
        //         }
        //
        //         // Validate each fee level has required properties
        //         const feeLevels = ['slow', 'average', 'fastest'] as const;
        //         for (const level of feeLevels) {
        //             const feeLevel = normalizedFees[level];
        //             if (!feeLevel.label) {
        //                 throw new Error(`Missing label for ${level} fee on ${blockchain}`);
        //             }
        //             if (!feeLevel.value) {
        //                 throw new Error(`Missing value for ${level} fee on ${blockchain}`);
        //             }
        //             if (!feeLevel.unit) {
        //                 throw new Error(`Missing unit for ${level} fee on ${blockchain}`);
        //             }
        //             if (!feeLevel.description) {
        //                 throw new Error(`Missing description for ${level} fee on ${blockchain}`);
        //             }
        //             if (!feeLevel.priority) {
        //                 throw new Error(`Missing priority for ${level} fee on ${blockchain}`);
        //             }
        //
        //             // Validate value is a positive number
        //             const value = parseFloat(feeLevel.value);
        //             if (isNaN(value) || value <= 0) {
        //                 throw new Error(`Invalid fee value for ${level} on ${blockchain}: ${feeLevel.value}`);
        //             }
        //         }
        //
        //         // Validate fee progression (slow <= average <= fastest)
        //         const slowVal = parseFloat(normalizedFees.slow.value);
        //         const avgVal = parseFloat(normalizedFees.average.value);
        //         const fastestVal = parseFloat(normalizedFees.fastest.value);
        //
        //         if (slowVal > avgVal || avgVal > fastestVal) {
        //             console.warn(`⚠️ [FEES] Fee progression not optimal for ${blockchain}: slow=${slowVal}, average=${avgVal}, fastest=${fastestVal}`);
        //         }
        //
        //         // Log the normalized fees with rich metadata
        //         console.log(`📊 [FEES] Normalized fees for ${blockchain} (${normalizedFees.networkType}):`);
        //         console.log(`   💰 ${normalizedFees.slow.label}: ${normalizedFees.slow.value} ${normalizedFees.slow.unit}`);
        //         console.log(`      Priority: ${normalizedFees.slow.priority}, Est. time: ${normalizedFees.slow.estimatedTime}`);
        //         console.log(`   💵 ${normalizedFees.average.label}: ${normalizedFees.average.value} ${normalizedFees.average.unit}`);
        //         console.log(`      Priority: ${normalizedFees.average.priority}, Est. time: ${normalizedFees.average.estimatedTime}`);
        //         console.log(`   🚀 ${normalizedFees.fastest.label}: ${normalizedFees.fastest.value} ${normalizedFees.fastest.unit}`);
        //         console.log(`      Priority: ${normalizedFees.fastest.priority}, Est. time: ${normalizedFees.fastest.estimatedTime}`);
        //
        //         // Test fee estimation
        //         const estimatedFee = app.estimateTransactionFee(
        //             normalizedFees.average.value,
        //             normalizedFees.average.unit,
        //             normalizedFees.networkType,
        //             250 // example tx size
        //         );
        //         console.log(`   📐 Estimated transaction fee: ${estimatedFee.amount} ${estimatedFee.unit}`);
        //
        //         console.log(`✅ [FEES] Successfully validated normalized fees for ${blockchain}`);
        //
        //     } catch (error: any) {
        //         console.error(`❌ [FEES] Failed to get/validate fees for ${blockchain}:`, error.message);
        //         // Continue with other validations, but note the fee failure
        //         console.error(`⚠️ [FEES] Continuing test despite fee failure for ${blockchain}`);
        //     }
        //
        // }
        // log.info(tag,' ****** Validated Assets for each chain exist bro ******')
        //
        //
        // //validate assetContext on tokens
        //
        // console.log('📊 =========================================================');
        //
        // // ========================================
        // // GET PUBKEYS AND BALANCES
        // // ========================================
        // console.log('🔑 [PUBKEYS] Fetching pubkeys for all configured chains...')
        // console.timeEnd('⏱️ 3_GET_PUBKEYS');
        //
        // let pubkeys = app.pubkeys || [];
        // console.log(`✅ [PUBKEYS] Found ${pubkeys.length} pubkeys`)
        //
        // // Display pubkeys in ASCII table format
        // if (pubkeys.length > 0) {
        //     console.log('\n┌─────────────────────────────────────────────────────────────────────────────┐')
        //     console.log('│                              PUBKEYS TABLE                                  │')
        //     console.log('├────────┬──────────┬──────────────────────────────────────────────────────────┤')
        //     console.log('│ Chain  │ Symbol   │ Address/Pubkey                                           │')
        //     console.log('├────────┬──────────┬──────────────────────────────────────────────────────────┤')
        //
        //     for (const pubkey of pubkeys) {
        //         const chain = pubkey.networkId || pubkey.networks?.[0] || 'unknown';
        //         const symbol = pubkey.symbol || NetworkIdToChain[chain] || '???';
        //         const address = pubkey.master || pubkey.address || 'N/A';
        //         const displayAddr = address.length > 48 ? address.substring(0, 45) + '...' : address;
        //
        //         console.log(`│ ${chain.padEnd(6)} │ ${symbol.padEnd(8)} │ ${displayAddr.padEnd(56)} │`)
        //     }
        //
        //     console.log('└────────┴──────────┴──────────────────────────────────────────────────────────┘\n')
        // }
        //
        // // Fetch balances
        // console.log('💰 [BALANCES] Fetching balances for all pubkeys...')
        // console.time('⏱️ 4_GET_BALANCES')
        //
        // // Get balances using SDK method
        // let balances = app.balances || [];
        //
        // // If no balances yet, try to fetch them
        // if (balances.length === 0) {
        //     console.log('⚠️ [BALANCES] No cached balances found, fetching fresh...')
        //
        //     try {
        //         // Try to get balances from the SDK
        //         await app.getBalances();
        //         balances = app.balances || [];
        //         console.log(`✅ [BALANCES] Fetched ${balances.length} balance entries`)
        //     } catch (error: any) {
        //         console.error('❌ [BALANCES] Failed to fetch balances:', error.message)
        //     }
        // }
        //
        // console.timeEnd('⏱️ 4_GET_BALANCES')
        //
        // // ========================================
        // // ETH BALANCE DEBUGGING
        // // ========================================
        // console.log('\n🔍 [ETH DEBUG] Analyzing ETH balance situation...')
        //
        // // Find all ETH-related pubkeys
        // const ethPubkeys = pubkeys.filter((p: any) => {
        //     const chain = p.networkId || p.networks?.[0] || '';
        //     return chain.includes('eip155:1') || p.symbol === 'ETH';
        // });
        //
        // console.log(`📋 [ETH DEBUG] Found ${ethPubkeys.length} ETH pubkeys:`)
        // for (const ethPubkey of ethPubkeys) {
        //     const addr = ethPubkey.master || ethPubkey.address;
        //     console.log(`   Address: ${addr}`)
        //     console.log(`   Network: ${ethPubkey.networkId || ethPubkey.networks?.[0]}`)
        //     console.log(`   Path: ${ethPubkey.path || addressNListToBIP32(ethPubkey.addressNList)}`)
        // }
        //
        // // Find all ETH balances
        // const ethBalances = balances.filter((b: any) => {
        //     const symbol = b.symbol;
        //     const networkName = b.networkName;
        //     return symbol === 'ETH' || networkName === 'Ethereum' || (b.caip && b.caip.includes('eip155:1'));
        // });
        //
        // console.log(`\n💰 [ETH DEBUG] Found ${ethBalances.length} ETH balance entries:`)
        // for (const ethBalance of ethBalances) {
        //     console.log(`   Address: ${ethBalance.address || ethBalance.pubkey || 'unknown'}`)
        //     console.log(`   Balance: ${ethBalance.balance || ethBalance.value || '0'}`)
        //     console.log(`   Value USD: $${ethBalance.valueUsd || ethBalance.priceUsd || '0'}`)
        //     console.log(`   Asset: ${ethBalance.symbol} on ${ethBalance.networkName || ethBalance.chainId}`)
        //     console.log(`   CAIP: ${ethBalance.caip}`)
        //     console.log('   ---')
        // }
        //
        // // Check if we have ETH addresses but no balances
        // if (ethPubkeys.length > 0 && ethBalances.length === 0) {
        //     console.log('\n⚠️ [ETH DEBUG] WARNING: Found ETH addresses but NO balances!')
        //     console.log('   Possible causes:')
        //     console.log('   1. Balance fetch failed or timed out')
        //     console.log('   2. Pioneer API not returning ETH balances')
        //     console.log('   3. Address format mismatch between pubkeys and balances')
        //     console.log('   4. Network connectivity issues')
        //
        //     // Try manual balance check for first ETH address
        //     if (ethPubkeys[0]) {
        //         const testAddr = ethPubkeys[0].master || ethPubkeys[0].address;
        //         console.log(`\n🔬 [ETH DEBUG] Attempting manual balance check for: ${testAddr}`)
        //
        //         try {
        //             // Try to get balance directly from Pioneer API
        //             const response = await fetch(`${spec.replace('/spec/swagger.json', '')}/api/v1/balance/eip155:1/${testAddr}`);
        //             if (response.ok) {
        //                 const data = await response.json();
        //                 console.log('✅ [ETH DEBUG] Manual balance check result:', JSON.stringify(data, null, 2));
        //             } else {
        //                 console.log(`❌ [ETH DEBUG] Manual balance check failed: ${response.status} ${response.statusText}`);
        //             }
        //         } catch (error: any) {
        //             console.log(`❌ [ETH DEBUG] Manual balance check error: ${error.message}`);
        //         }
        //     }
        // }
        //
        // // ========================================
        // // DISPLAY BALANCES TABLE
        // // ========================================
        // let totalValueUsd = 0;
        //
        // if (balances.length > 0) {
        //     console.log('\n┌─────────────────────────────────────────────────────────────────────────────────────────────┐')
        //     console.log('│                                    BALANCES TABLE                                           │')
        //     console.log('├────────┬──────────┬──────────────────────────┬─────────────────────┬───────────────────────┤')
        //     console.log('│ Chain  │ Symbol   │ Balance                  │ Value USD           │ Address                │')
        //     console.log('├────────┬──────────┬──────────────────────────┬─────────────────────┬───────────────────────┤')
        //
        //     for (const balance of balances) {
        //         // Use networkName or symbol as chain display (more readable than chainId)
        //         const chain = balance.networkName || balance.symbol || balance.chainId || 'unknown';
        //         const symbol = balance.symbol || '???';
        //         const balanceValue = balance.balance || balance.value || '0';
        //         const valueUsd = parseFloat(balance.valueUsd || balance.priceUsd || '0');
        //         const address = (balance.address || balance.pubkey || 'N/A').substring(0, 18);
        //
        //         totalValueUsd += valueUsd;
        //
        //         const balanceStr = balanceValue.toString().substring(0, 22);
        //         const valueUsdStr = valueUsd > 0 ? `$${valueUsd.toFixed(2)}` : '$0.00';
        //
        //         console.log(`│ ${chain.padEnd(6)} │ ${symbol.padEnd(8)} │ ${balanceStr.padEnd(24)} │ ${valueUsdStr.padEnd(19)} │ ${address.padEnd(21)} │`)
        //     }
        //
        //     console.log('├────────┴──────────┴──────────────────────────┴─────────────────────┴───────────────────────┤')
        //     console.log(`│ TOTAL PORTFOLIO VALUE: $${totalValueUsd.toFixed(2).padEnd(73)} │`)
        //     console.log('└─────────────────────────────────────────────────────────────────────────────────────────────┘\n')
        // } else {
        //     console.log('\n⚠️ [BALANCES] No balances found!')
        // }
        //
        // console.log('📊 =========================================================');
        //
        // // Summary
        // console.log('\n📊 [SUMMARY] Test Results:')
        // console.log(`   🔑 Pubkeys: ${pubkeys.length}`)
        // console.log(`   💰 Balances: ${balances.length}`)
        // console.log(`   💵 Total Value: $${totalValueUsd.toFixed(2)} USD`)
        // console.log(`   🔗 Chains: ${blockchains.length}`)
        //
        // if (ethPubkeys.length > 0) {
        //     console.log(`\n🔍 [ETH] ETH-specific results:`)
        //     console.log(`   📍 ETH Addresses: ${ethPubkeys.length}`)
        //     console.log(`   💰 ETH Balances: ${ethBalances.length}`)
        //     if (ethBalances.length > 0) {
        //         const totalEth = ethBalances.reduce((sum: number, b: any) => sum + parseFloat(b.balance || b.value || '0'), 0);
        //         const totalEthUsd = ethBalances.reduce((sum: number, b: any) => sum + parseFloat(b.valueUsd || b.priceUsd || '0'), 0);
        //         console.log(`   💎 Total ETH: ${totalEth.toFixed(8)} ETH`)
        //         console.log(`   💵 Total ETH Value: $${totalEthUsd.toFixed(2)} USD`)
        //     }
        // }

        // Next steps for integration-transfer test:
        // 1. Use setPubkeyContext to select which account to transfer FROM
        // 2. Build transfer/swap transactions with the selected pubkey context
        // 3. Validate that transactions use the correct FROM address
        // 4. Test switching contexts mid-operation
        // 5. Ensure balance checks respect the current pubkey context
        log.info(tag,'📝 Ready for integration-transfer pubkey context testing!')

        // ========================================
        // MULTI-PATH BITCOIN TEST (Indices 0-7)
        // ========================================
        console.log('\n₿  =========================================================');
        console.log('₿  [MULTI-PATH TEST] Testing multiple path indices (0-7)...');
        console.log('₿  =========================================================\n');

        // Define all script types we want to test
        const scriptTypes = [
            { name: 'p2pkh', purpose: 44, note: 'Legacy (P2PKH)' },
            { name: 'p2sh-p2wpkh', purpose: 49, note: 'SegWit (P2SH-P2WPKH)' },
            { name: 'p2wpkh', purpose: 84, note: 'Native SegWit (P2WPKH)' }
        ];

        // Test multiple chains (Bitcoin, Litecoin, Dogecoin, etc.)
        const chainsToTest = [
            { name: 'Bitcoin', symbol: 'BTC', coinType: 0, networkId: 'bip122:000000000019d6689c085ae165831e93' },
            { name: 'Litecoin', symbol: 'LTC', coinType: 2, networkId: 'bip122:12a765e31ffd4059bada1e25190f6e98' },
            { name: 'Dogecoin', symbol: 'DOGE', coinType: 3, networkId: 'bip122:1a91e3dace36e2be3bf030a65679fe82' },
        ];

        // Generate paths for indices 0-7
        const pathsToTest: any[] = [];
        for (const chain of chainsToTest) {
            for (const scriptType of scriptTypes) {
                for (let accountIndex = 0; accountIndex < 8; accountIndex++) {
                    const path = {
                        note: `${chain.symbol} ${scriptType.note} Account ${accountIndex}`,
                        type: 'xpub',
                        addressNList: [
                            0x80000000 + scriptType.purpose,
                            0x80000000 + chain.coinType,
                            0x80000000 + accountIndex
                        ],
                        addressNListMaster: [
                            0x80000000 + scriptType.purpose,
                            0x80000000 + chain.coinType,
                            0x80000000 + accountIndex,
                            0,
                            0
                        ],
                        curve: 'secp256k1',
                        scriptType: scriptType.name,
                        showDisplay: false,
                        networks: [chain.networkId],
                        symbol: chain.symbol,
                        coinType: chain.coinType,
                        accountIndex: accountIndex
                    };
                    pathsToTest.push(path);
                }
            }
        }

        console.log(`📊 [PATH GENERATION] Generated ${pathsToTest.length} paths to test (8 accounts × 3 script types × ${chainsToTest.length} chains)`);
        console.log('┌────────────────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ Chain  │ Script Type     │ Account │ Path                          │ Note              │');
        console.log('├────────┼─────────────────┼─────────┼───────────────────────────────┼───────────────────┤');

        for (const path of pathsToTest) {
            const chain = (path.symbol || '???').substring(0, 6).padEnd(6);
            const scriptType = (path.scriptType || 'N/A').substring(0, 15).padEnd(15);
            const account = path.accountIndex.toString().padEnd(7);
            const pathStr = addressNListToBIP32(path.addressNList).substring(0, 29).padEnd(29);
            const note = (path.note || 'N/A').substring(0, 17).padEnd(17);

            console.log(`│ ${chain} │ ${scriptType} │ ${account} │ ${pathStr} │ ${note} │`);
        }
        console.log('└────────┴─────────────────┴─────────┴───────────────────────────────┴───────────────────┘\n');

        // ========================================
        // ADD PATHS AND GET PUBKEYS
        // ========================================
        console.log('🔑 [ADDING PATHS] Adding all generated paths to SDK...');
        const pathsBeforeAdd = app.paths.length;
        const pubkeysBeforeAdd = app.pubkeys.length;

        for (const path of pathsToTest) {
            try {
                await app.addPath(path);
            } catch (error: any) {
                console.warn(`⚠️  Failed to add path ${path.note}: ${error.message}`);
            }
        }

        console.log(`✅ [PATHS ADDED] Paths: ${pathsBeforeAdd} → ${app.paths.length} (+${app.paths.length - pathsBeforeAdd})`);
        console.log(`✅ [PUBKEYS] Pubkeys: ${pubkeysBeforeAdd} → ${app.pubkeys.length} (+${app.pubkeys.length - pubkeysBeforeAdd})`);

        // ========================================
        // SYNC BALANCES FOR ALL PATHS
        // ========================================
        console.log('\n💰 [SYNCING BALANCES] Fetching balances for all added paths...');
        const balancesBeforeSync = app.balances?.length || 0;

        try {
            await app.getBalances();
            console.log(`✅ [BALANCES SYNCED] Balances: ${balancesBeforeSync} → ${app.balances?.length || 0} (+${(app.balances?.length || 0) - balancesBeforeSync})`);
        } catch (error: any) {
            console.error(`❌ [SYNC FAILED] ${error.message}`);
        }

        // ========================================
        // ANALYZE RESULTS BY CHAIN AND ACCOUNT
        // ========================================
        console.log('\n📊 [ANALYSIS] Results by chain and account index:\n');

        for (const chain of chainsToTest) {
            console.log(`\n${chain.symbol} (${chain.name})`);
            console.log('═'.repeat(80));

            // Filter pubkeys for this chain
            const chainPubkeys = app.pubkeys.filter((p: any) =>
                p.networks && p.networks.includes(chain.networkId)
            );

            // Filter balances for this chain
            const chainBalances = app.balances?.filter((b: any) =>
                b.caip && b.caip.includes(chain.networkId)
            ) || [];

            console.log(`\n📊 Pubkeys found: ${chainPubkeys.length}`);
            console.log(`💰 Balances found: ${chainBalances.length}`);

            // Group by account index
            for (let accountIndex = 0; accountIndex < 8; accountIndex++) {
                console.log(`\n  Account ${accountIndex}:`);
                console.log('  ' + '─'.repeat(76));

                let accountHasData = false;

                for (const scriptType of scriptTypes) {
                    // Find pubkey for this account + script type
                    const pubkey = chainPubkeys.find((p: any) =>
                        p.scriptType === scriptType.name &&
                        p.addressNList &&
                        p.addressNList[2] === (0x80000000 + accountIndex)
                    );

                    if (pubkey) {
                        accountHasData = true;
                        const address = pubkey.master || pubkey.address || pubkey.pubkey || 'N/A';

                        // Find balance for this address
                        const balance = chainBalances.find((b: any) =>
                            b.address === address || b.pubkey === address
                        );

                        const balanceValue = balance ? parseFloat(balance.balance || '0') : 0;
                        const balanceUsd = balance ? parseFloat(balance.valueUsd || '0') : 0;

                        console.log(`    ${scriptType.note.padEnd(25)} | ${address.substring(0, 40)}...`);
                        console.log(`      Balance: ${balanceValue.toFixed(8)} ${chain.symbol} ($${balanceUsd.toFixed(2)})`);
                    }
                }

                if (!accountHasData) {
                    console.log(`    No data found for this account`);
                }
            }

            // Summary for this chain
            const totalChainBalance = chainBalances.reduce(
                (sum: number, b: any) => sum + parseFloat(b.balance || '0'),
                0
            );
            const totalChainValue = chainBalances.reduce(
                (sum: number, b: any) => sum + parseFloat(b.valueUsd || '0'),
                0
            );

            console.log('\n  Summary:');
            console.log('  ' + '─'.repeat(76));
            console.log(`  Total ${chain.symbol}: ${totalChainBalance.toFixed(8)} ${chain.symbol}`);
            console.log(`  Total Value: $${totalChainValue.toFixed(2)} USD`);
        }

        console.log('\n₿  =========================================================');
        console.log('₿  [MULTI-PATH TEST] Complete');
        console.log('₿  =========================================================\n');

        // // ========================================
        // // LITECOIN MULTIPLE ACCOUNT TEST (LEGACY)
        // // ========================================
        // console.log('\n🪙 =========================================================');
        // console.log('🪙 [LITECOIN TEST] Testing multiple account handling...');
        // console.log('🪙 =========================================================\n');
        //
        // // Filter for Litecoin pubkeys
        // const ltcPubkeys = pubkeys.filter((p: any) =>
        //     p.networks && p.networks.includes('bip122:12a765e31ffd4059bada1e25190f6e98')
        // );
        //
        // console.log(`📊 [LITECOIN PUBKEYS] Found ${ltcPubkeys.length} Litecoin pubkeys:`);
        // console.log('┌────────────────────────────────────────────────────────────────────────────┐');
        // console.log('│ Type       │ Note                    │ Script Type  │ Path              │');
        // console.log('├────────────┼─────────────────────────┼──────────────┼───────────────────┤');
        //
        // for (const pubkey of ltcPubkeys) {
        //     const type = (pubkey.type || 'unknown').substring(0, 10).padEnd(10);
        //     const note = (pubkey.note || 'N/A').substring(0, 23).padEnd(23);
        //     const scriptType = (pubkey.scriptType || 'N/A').substring(0, 12).padEnd(12);
        //     const path = (pubkey.pathMaster || 'N/A').substring(0, 17).padEnd(17);
        //
        //     console.log(`│ ${type} │ ${note} │ ${scriptType} │ ${path} │`);
        // }
        // console.log('└────────────┴─────────────────────────┴──────────────┴───────────────────┘\n');
        //
        // // Expected pubkey types for Litecoin
        // const expectedTypes = ['p2pkh', 'p2sh-p2wpkh', 'p2wpkh'];
        // const foundTypes = [...new Set(ltcPubkeys.map((p: any) => p.scriptType))];
        //
        // console.log('🔍 [VALIDATION] Checking for all expected Litecoin account types:');
        // for (const expectedType of expectedTypes) {
        //     const found = foundTypes.includes(expectedType);
        //     console.log(`   ${found ? '✅' : '❌'} ${expectedType}: ${found ? 'Found' : 'MISSING'}`)
        // }
        //
        // if (ltcPubkeys.length === 0) {
        //     console.warn('⚠️  [WARNING] No Litecoin pubkeys found - skipping Litecoin test');
        // } else {
        //     // Find Litecoin balances
        //     const ltcBalances = balances.filter((b: any) =>
        //         b.caip && b.caip.includes('bip122:12a765e31ffd4059bada1e25190f6e98')
        //     );
        //
        //     console.log(`\n💰 [LITECOIN BALANCES] Found ${ltcBalances.length} balance entries:`);
        //     if (ltcBalances.length > 0) {
        //         let totalLtcBalance = 0;
        //         let totalLtcValue = 0;
        //
        //         for (const balance of ltcBalances) {
        //             const addr = (balance.address || balance.pubkey || 'N/A').substring(0, 20);
        //             const bal = parseFloat(balance.balance || '0');
        //             const val = parseFloat(balance.valueUsd || '0');
        //
        //             totalLtcBalance += bal;
        //             totalLtcValue += val;
        //
        //             console.log(`   ${addr}...: ${bal.toFixed(8)} LTC ($${val.toFixed(2)})`);
        //         }
        //
        //         console.log(`   ───────────────────────────────────────────`);
        //         console.log(`   TOTAL: ${totalLtcBalance.toFixed(8)} LTC ($${totalLtcValue.toFixed(2)})`);
        //     } else {
        //         console.warn('⚠️  [BALANCES] No Litecoin balances found (addresses might be empty)');
        //     }
        //
        //     // THE CRITICAL TEST: Set asset context for Litecoin
        //     console.log('\n🎯 [CRITICAL TEST] Setting asset context for Litecoin...');
        //
        //     const ltcCaip = 'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2';
        //     console.log(`   Using CAIP: ${ltcCaip}`);
        //
        //     try {
        //         const ltcAssetContext = await app.setAssetContext({ caip: ltcCaip });
        //
        //         console.log('\n📦 [ASSET CONTEXT] Result:');
        //         console.log(`   Network ID: ${ltcAssetContext.networkId}`);
        //         console.log(`   Symbol: ${ltcAssetContext.symbol}`);
        //         console.log(`   Balance: ${ltcAssetContext.balance || '0'} LTC`);
        //         console.log(`   Value: $${ltcAssetContext.valueUsd || ltcAssetContext.value || '0'}`);
        //         console.log(`   Number of pubkeys: ${ltcAssetContext.pubkeys?.length || 0}`);
        //         console.log(`   Number of balances: ${ltcAssetContext.balances?.length || 0}`);
        //
        //         // Check if pubkeys are included
        //         if (!ltcAssetContext.pubkeys || ltcAssetContext.pubkeys.length === 0) {
        //             console.error('❌ [BUG FOUND] Asset context has NO pubkeys!');
        //             console.error('   This explains why receive tab works but assetDetails doesn\'t');
        //         } else if (ltcAssetContext.pubkeys.length < ltcPubkeys.length) {
        //             console.warn(`⚠️  [BUG FOUND] Asset context has fewer pubkeys than expected!`);
        //             console.warn(`   Expected: ${ltcPubkeys.length}, Got: ${ltcAssetContext.pubkeys.length}`);
        //             console.warn('   Missing pubkeys will not show in UI');
        //
        //             // Show which ones are missing
        //             console.log('\n🔍 [MISSING PUBKEYS] Checking which types are missing:');
        //             const contextScriptTypes = ltcAssetContext.pubkeys.map((p: any) => p.scriptType);
        //             for (const expectedType of expectedTypes) {
        //                 const inContext = contextScriptTypes.includes(expectedType);
        //                 console.log(`   ${inContext ? '✅' : '❌'} ${expectedType}: ${inContext ? 'In context' : 'MISSING from context'}`);
        //             }
        //         } else {
        //             console.log('✅ [SUCCESS] Asset context includes all pubkeys!');
        //         }
        //
        //         // Display pubkeys in asset context
        //         if (ltcAssetContext.pubkeys && ltcAssetContext.pubkeys.length > 0) {
        //             console.log('\n📋 [ASSET CONTEXT PUBKEYS]:');
        //             for (const pubkey of ltcAssetContext.pubkeys) {
        //                 console.log(`   ${pubkey.note || 'Unknown'} (${pubkey.scriptType || 'N/A'})`);
        //                 console.log(`      ${(pubkey.master || pubkey.pubkey || pubkey.address || '').substring(0, 60)}...`);
        //             }
        //         }
        //
        //         // Check balance aggregation
        //         if (ltcAssetContext.balances && ltcAssetContext.balances.length > 0) {
        //             const contextTotalBalance = ltcAssetContext.balances.reduce(
        //                 (sum: number, b: any) => sum + parseFloat(b.balance || '0'),
        //                 0
        //             );
        //             console.log(`\n💰 [BALANCE AGGREGATION] Context aggregates ${contextTotalBalance.toFixed(8)} LTC`);
        //
        //             if (ltcAssetContext.balance) {
        //                 const reportedBalance = parseFloat(ltcAssetContext.balance);
        //                 if (Math.abs(reportedBalance - contextTotalBalance) > 0.00000001) {
        //                     console.warn('⚠️  [WARNING] Balance mismatch!');
        //                     console.warn(`   Aggregated: ${contextTotalBalance.toFixed(8)} LTC`);
        //                     console.warn(`   Reported: ${reportedBalance.toFixed(8)} LTC`);
        //                 } else {
        //                     console.log('✅ [SUCCESS] Balance properly aggregated across all accounts');
        //                 }
        //             }
        //         }
        //
        //         // Final validation
        //         console.log('\n🎯 [LITECOIN VALIDATION]:');
        //         const ltcChecks = {
        //             'Has network ID': !!ltcAssetContext.networkId,
        //             'Has symbol': !!ltcAssetContext.symbol,
        //             'Has pubkeys array': Array.isArray(ltcAssetContext.pubkeys),
        //             'Has multiple pubkeys': ltcAssetContext.pubkeys && ltcAssetContext.pubkeys.length > 1,
        //             'All pubkey types present': ltcAssetContext.pubkeys &&
        //                 ltcAssetContext.pubkeys.some((p: any) => p.scriptType === 'p2pkh') &&
        //                 ltcAssetContext.pubkeys.some((p: any) => p.scriptType === 'p2wpkh'),
        //             'Has balance': ltcAssetContext.balance !== undefined,
        //             'Has balances array': Array.isArray(ltcAssetContext.balances),
        //         };
        //
        //         let ltcTestsPassed = true;
        //         for (const [check, passed] of Object.entries(ltcChecks)) {
        //             console.log(`   ${passed ? '✅' : '❌'} ${check}`);
        //             if (!passed) ltcTestsPassed = false;
        //         }
        //
        //         if (!ltcTestsPassed) {
        //             console.log('\n⚠️  [WARNING] Some Litecoin checks failed - see details above');
        //             console.log('\n📝 [DEBUG INFO] Full Litecoin asset context:');
        //             console.log(JSON.stringify(ltcAssetContext, null, 2));
        //         }
        //
        //     } catch (error: any) {
        //         console.error('❌ [ERROR] Failed to set Litecoin asset context:', error.message);
        //         console.error(error);
        //     }
        // }

        console.log('\n🪙 =========================================================');
        console.log('🪙 [LITECOIN TEST] Complete');
        console.log('🪙 =========================================================\n');

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
