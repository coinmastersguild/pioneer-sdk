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
        log.info(tag,"blockchains: ",blockchains)
        log.info(tag,"blockchains: ",blockchains.length)

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

        // ========================================
        // MAYA MULTI-PATH TEST (Indices 0-7)
        // ========================================
        console.log('\n🔱 [MAYA MULTI-PATH TEST] Testing 8 Maya accounts (indices 0-7)...\n');

        // Generate 8 Maya paths for indices 0-7
        const mayaPaths: any[] = [];
        for (let accountIndex = 0; accountIndex < 8; accountIndex++) {
            const mayaPath = {
                note: `MAYA Account ${accountIndex}`,
                type: "address",
                addressNList: [0x80000000 + 44, 0x80000000 + 931, 0x80000000 + 0, 0, accountIndex],
                addressNListMaster: [0x80000000 + 44, 0x80000000 + 931, 0x80000000 + 0, 0, accountIndex],
                curve: 'secp256k1',
                script_type: "mayachain",
                showDisplay: false,
                networks: ['cosmos:mayachain-mainnet-v1'],
            };
            mayaPaths.push(mayaPath);
        }

        console.log(`📊 [MAYA PATHS] Generated ${mayaPaths.length} Maya paths:`);
        console.log('┌─────────┬───────────────────────────────┐');
        console.log('│ Account │ Path                          │');
        console.log('├─────────┼───────────────────────────────┤');
        for (const path of mayaPaths) {
            const accountIdx = path.addressNList[4]; // Last element is the account index
            const pathStr = addressNListToBIP32(path.addressNList);
            console.log(`│    ${accountIdx}    │ ${pathStr.padEnd(29)} │`);
        }
        console.log('└─────────┴───────────────────────────────┘\n');

        // Capture state before adding paths
        const pathsBeforeMaya = app.paths.length;
        const pubkeysBeforeMaya = app.pubkeys.length;
        const balancesBeforeMaya = app.balances?.length || 0;

        console.log('📋 [BEFORE ADD] State:');
        console.log(`   Paths: ${pathsBeforeMaya}`);
        console.log(`   Pubkeys: ${pubkeysBeforeMaya}`);
        console.log(`   Balances: ${balancesBeforeMaya}\n`);

        // Add all Maya paths using batch addPaths
        console.log('🚀 [ADDING MAYA PATHS] Using batch addPaths()...');
        try {
            const addPathsResult = await app.addPaths(mayaPaths);

            console.log('\n✅ [ADD PATHS RESULT]:', JSON.stringify(addPathsResult, null, 2));

            const pathsAfterMaya = app.paths.length;
            const pubkeysAfterMaya = app.pubkeys.length;
            const balancesAfterMaya = app.balances?.length || 0;

            console.log('\n📋 [AFTER ADD] State:');
            console.log(`   Paths: ${pathsBeforeMaya} → ${pathsAfterMaya} (+${pathsAfterMaya - pathsBeforeMaya})`);
            console.log(`   Pubkeys: ${pubkeysBeforeMaya} → ${pubkeysAfterMaya} (+${pubkeysAfterMaya - pubkeysBeforeMaya})`);
            console.log(`   Balances: ${balancesBeforeMaya} → ${balancesAfterMaya} (+${balancesAfterMaya - balancesBeforeMaya})`);

            // AUDIT: Check what happened to balances
            if (balancesAfterMaya < balancesBeforeMaya) {
                console.log('\n⚠️ [AUDIT WARNING] Balances DECREASED after adding paths!');
                console.log(`   This suggests balances were cleared or overwritten`);
                console.log(`   Expected: balances to increase or stay the same`);
                console.log(`   Actual: ${balancesBeforeMaya} → ${balancesAfterMaya} (${balancesAfterMaya - balancesBeforeMaya})`);
            }

            // AUDIT: Check if we got pubkeys for all paths
            const expectedNewPubkeys = mayaPaths.length;
            const actualNewPubkeys = pubkeysAfterMaya - pubkeysBeforeMaya;
            if (actualNewPubkeys < expectedNewPubkeys) {
                console.log(`\n⚠️ [AUDIT WARNING] Did not get pubkeys for all paths!`);
                console.log(`   Expected new pubkeys: ${expectedNewPubkeys}`);
                console.log(`   Actual new pubkeys: ${actualNewPubkeys}`);
                console.log(`   Missing: ${expectedNewPubkeys - actualNewPubkeys} pubkeys`);
            }

            // AUDIT: Inspect the newly added pubkeys
            console.log('\n🔍 [AUDIT] Inspecting newly added Maya pubkeys:');
            const mayaPubkeys = app.pubkeys.filter((p: any) =>
                p.networks && p.networks.includes('cosmos:mayachain-mainnet-v1')
            );

            console.log(`   Found ${mayaPubkeys.length} Maya pubkeys total`);
            console.log('\n┌─────────┬──────────────────────────────────────────────────┬─────────┐');
            console.log('│ Account │ Address                                          │ Symbol  │');
            console.log('├─────────┼──────────────────────────────────────────────────┼─────────┤');
            for (const pubkey of mayaPubkeys) {
                const accountIdx = pubkey.addressNList ? pubkey.addressNList[4] : '?';
                const address = (pubkey.master || pubkey.address || 'N/A').padEnd(48);
                const symbol = (pubkey.symbol || '???').padEnd(7);
                console.log(`│    ${accountIdx}    │ ${address} │ ${symbol} │`);
            }
            console.log('└─────────┴──────────────────────────────────────────────────┴─────────┘\n');

            // AUDIT: Check for balances on Maya addresses
            console.log('🔍 [AUDIT] Checking for balances on Maya addresses:');
            const mayaBalances = app.balances?.filter((b: any) =>
                b.caip && b.caip.includes('mayachain') ||
                b.symbol === 'MAYA' ||
                mayaPubkeys.some((p: any) => {
                    const addr = p.master || p.address;
                    return b.address === addr || b.pubkey === addr || b.master === addr;
                })
            ) || [];

            console.log(`   Found ${mayaBalances.length} Maya balance entries`);

            if (mayaBalances.length > 0) {
                console.log('\n   Maya Balances:');
                for (const bal of mayaBalances) {
                    console.log(`   - Address: ${bal.address || bal.pubkey}`);
                    console.log(`     Balance: ${bal.balance || bal.value} ${bal.symbol}`);
                    console.log(`     Value: $${bal.valueUsd || bal.priceUsd || '0'}`);
                }
            } else {
                console.log('\n   ⚠️ NO MAYA BALANCES FOUND!');
                console.log('\n   Possible reasons:');
                console.log('   1. Balance fetch failed or timed out');
                console.log('   2. Pioneer API not returning Maya balances');
                console.log('   3. Addresses have zero balance (expected for new accounts)');
                console.log('   4. Balance data structure mismatch');

                // Try to manually check one address
                if (mayaPubkeys.length > 0) {
                    const testPubkey = mayaPubkeys[0];
                    const testAddr = testPubkey.master || testPubkey.address;
                    console.log(`\n   🔬 [MANUAL CHECK] Testing first address: ${testAddr}`);

                    try {
                        const balanceUrl = `${spec.replace('/spec/swagger.json', '')}/api/v1/balance/cosmos:mayachain-mainnet-v1/${testAddr}`;
                        console.log(`   Fetching: ${balanceUrl}`);
                        const response = await fetch(balanceUrl);

                        if (response.ok) {
                            const data = await response.json();
                            console.log('   ✅ Manual balance check result:', JSON.stringify(data, null, 2));
                        } else {
                            console.log(`   ❌ Manual balance check failed: ${response.status} ${response.statusText}`);
                            const errorText = await response.text();
                            console.log(`   Error response: ${errorText}`);
                        }
                    } catch (error: any) {
                        console.log(`   ❌ Manual balance check error: ${error.message}`);
                    }
                }
            }

            // AUDIT: Check app.balances structure
            console.log('\n🔍 [AUDIT] Inspecting app.balances array:');
            console.log(`   Total balances: ${app.balances?.length || 0}`);
            if (app.balances && app.balances.length > 0) {
                console.log('   Sample balance entry (first):');
                console.log(JSON.stringify(app.balances[0], null, 2));
            } else {
                console.log('   ⚠️ app.balances is empty or undefined');
            }

        } catch (error: any) {
            console.error('\n❌ [ADD PATHS FAILED]', error.message);
            console.error('   Stack trace:', error.stack);
        }

        console.log('\n🔱 [MAYA MULTI-PATH TEST] Complete\n');

        // ========================================
        // CHART DATA VALIDATION (Maya + All Chains)
        // ========================================
        console.log('\n📊 [CHART DATA] Fetching chart data for portfolio...\n');

        try {
            const startCharts = performance.now();
            const chartData = await app.getCharts();
            const chartTime = performance.now() - startCharts;

            console.log(`✅ [CHART DATA] Fetched chart data in ${chartTime.toFixed(0)}ms`);
            console.log(`📈 [CHART DATA] Chart entries: ${chartData?.length || 0}`);

            if (chartData && chartData.length > 0) {
                console.log('\n┌─────────────────────────────────────────────────────────────────────────────────────┐');
                console.log('│                                CHART DATA SUMMARY                                   │');
                console.log('├────────┬──────────┬─────────────────┬─────────────────┬──────────────────────────┤');
                console.log('│ Chain  │ Symbol   │ Current Price   │ 24h Change      │ Market Cap               │');
                console.log('├────────┼──────────┼─────────────────┼─────────────────┼──────────────────────────┤');

                // Find Maya chart data specifically
                let mayaChartFound = false;

                for (const chart of chartData.slice(0, 20)) {
                    const symbol = (chart.symbol || '???').padEnd(8);
                    const chain = (chart.chain || chart.networkId || 'Unknown').substring(0, 6).padEnd(6);
                    const price = chart.priceUsd ? `$${parseFloat(chart.priceUsd).toFixed(4)}` : 'N/A';
                    const change24h = chart.change24h ? `${parseFloat(chart.change24h).toFixed(2)}%` : 'N/A';
                    const marketCap = chart.marketCap ? `$${(parseFloat(chart.marketCap) / 1000000).toFixed(2)}M` : 'N/A';

                    console.log(`│ ${chain} │ ${symbol} │ ${price.padEnd(15)} │ ${change24h.padEnd(15)} │ ${marketCap.padEnd(24)} │`);

                    if (chart.symbol === 'CACAO' || chart.symbol === 'MAYA') {
                        mayaChartFound = true;
                    }
                }

                console.log('└────────┴──────────┴─────────────────┴─────────────────┴──────────────────────────┘\n');

                // Validate Maya chart data
                if (mayaChartFound) {
                    console.log('✅ [MAYA CHART] Maya/CACAO price data found in charts');
                } else {
                    console.log('⚠️ [MAYA CHART] WARNING: No Maya/CACAO price data in charts');
                    console.log('   This may affect portfolio value calculations for Maya balances');
                }

                // Cross-reference with Maya balances
                const mayaBalancesWithChart = app.balances?.filter((b: any) =>
                    (b.symbol === 'CACAO' || b.symbol === 'MAYA') && parseFloat(b.balance || '0') > 0
                ) || [];

                if (mayaBalancesWithChart.length > 0) {
                    console.log(`\n💰 [MAYA BALANCES WITH CHART DATA] Found ${mayaBalancesWithChart.length} Maya balances with value:`);
                    for (const bal of mayaBalancesWithChart) {
                        const nativeBalance = parseFloat(bal.balance || '0');
                        const valueUsd = parseFloat(bal.valueUsd || '0');
                        const priceUsd = parseFloat(bal.priceUsd || '0');

                        console.log(`   Address: ${bal.address || bal.pubkey}`);
                        console.log(`   Balance: ${nativeBalance.toFixed(8)} ${bal.symbol}`);
                        console.log(`   Price: $${priceUsd.toFixed(4)} USD`);
                        console.log(`   Value: $${valueUsd.toFixed(2)} USD`);
                        console.log(`   Chart data present: ${priceUsd > 0 ? '✅' : '❌'}`);
                        console.log('');
                    }
                }
            } else {
                console.log('⚠️ [CHART DATA] No chart data returned');
            }

        } catch (error: any) {
            console.error('❌ [CHART DATA] Failed to fetch chart data:', error.message);
            console.error('   This may affect price calculations for portfolio balances');
        }

        // ========================================
        // TOKEN BALANCE VALIDATION
        // ========================================
        console.log('\n🎯 [TOKEN VALIDATION] Checking for token balances...\n');

        const tokenBalances = app.balances?.filter((b: any) =>
            b.contract || b.isToken ||
            (b.type && b.type.toLowerCase() === 'token') ||
            (b.caip && !['BTC', 'ETH', 'AVAX', 'BNB', 'MATIC', 'BCH', 'LTC', 'DOGE', 'DASH', 'CACAO', 'MAYA', 'RUNE'].includes(b.symbol))
        ) || [];

        const nativeBalances = app.balances?.filter((b: any) =>
            !b.contract && !b.isToken &&
            ['BTC', 'ETH', 'AVAX', 'BNB', 'MATIC', 'BCH', 'LTC', 'DOGE', 'DASH', 'CACAO', 'MAYA', 'RUNE'].includes(b.symbol)
        ) || [];

        console.log(`📊 [TOKEN SUMMARY]`);
        console.log(`   Native Assets: ${nativeBalances.length}`);
        console.log(`   Token Assets: ${tokenBalances.length}`);
        console.log(`   Total Assets: ${app.balances?.length || 0}`);

        if (tokenBalances.length > 0) {
            console.log('\n┌────────────────────────────────────────────────────────────────────────────────────────┐');
            console.log('│                                    TOKEN BALANCES                                      │');
            console.log('├──────────────┬─────────────────┬─────────────────┬────────────────┬───────────────────┤');
            console.log('│ Symbol       │ Chain           │ Balance         │ Price USD      │ Value USD         │');
            console.log('├──────────────┼─────────────────┼─────────────────┼────────────────┼───────────────────┤');

            let totalTokenValueUsd = 0;

            for (const token of tokenBalances.slice(0, 20)) {
                const symbol = (token.symbol || '???').padEnd(12);
                const chain = (token.networkName || token.chainId || 'Unknown').substring(0, 15).padEnd(15);
                const balance = parseFloat(token.balance || '0').toFixed(6).padEnd(15);
                const priceUsd = token.priceUsd ? `$${parseFloat(token.priceUsd).toFixed(4)}` : 'N/A';
                const valueUsd = parseFloat(token.valueUsd || '0');
                totalTokenValueUsd += valueUsd;
                const valueUsdStr = `$${valueUsd.toFixed(2)}`.padEnd(17);

                console.log(`│ ${symbol} │ ${chain} │ ${balance} │ ${priceUsd.padEnd(14)} │ ${valueUsdStr} │`);
            }

            if (tokenBalances.length > 20) {
                console.log(`│              │                 │                 │                │ ... +${tokenBalances.length - 20} more │`);
            }

            console.log('├──────────────┴─────────────────┴─────────────────┴────────────────┴───────────────────┤');
            console.log(`│ TOTAL TOKEN VALUE:${(' '.repeat(62) + '$' + totalTokenValueUsd.toFixed(2)).slice(-68)} │`);
            console.log('└────────────────────────────────────────────────────────────────────────────────────────┘\n');
        } else {
            console.log('\n   ℹ️ No token balances found (only native assets present)\n');
        }

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
        const chainsToTest:any = []
        // const chainsToTest = [
        //     { name: 'Bitcoin', symbol: 'BTC', coinType: 0, networkId: 'bip122:000000000019d6689c085ae165831e93' },
        //     { name: 'Litecoin', symbol: 'LTC', coinType: 2, networkId: 'bip122:12a765e31ffd4059bada1e25190f6e98' },
        //     { name: 'Dogecoin', symbol: 'DOGE', coinType: 3, networkId: 'bip122:1a91e3dace36e2be3bf030a65679fe82' },
        // ];

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
        // ADD PATHS AND GET PUBKEYS (BATCH MODE)
        // ========================================
        // Only add paths if we have any to add (don't call with empty array!)
        if (pathsToTest.length > 0) {
            console.log('🔑 [ADDING PATHS] Adding all generated paths to SDK in batch mode...');
            const pathsBeforeAdd = app.paths.length;
            const pubkeysBeforeAdd = app.pubkeys.length;
            const balancesBeforeAdd = app.balances?.length || 0;

            try {
                // Use batch addPaths() method - single API call for all paths!
                const result = await app.addPaths(pathsToTest);

                console.log(`✅ [BATCH ADD COMPLETE]`);
                console.log(`   Paths: ${pathsBeforeAdd} → ${app.paths.length} (+${app.paths.length - pathsBeforeAdd})`);
                console.log(`   Pubkeys: ${pubkeysBeforeAdd} → ${app.pubkeys.length} (+${app.pubkeys.length - pubkeysBeforeAdd})`);
                console.log(`   Balances: ${balancesBeforeAdd} → ${app.balances?.length || 0} (+${(app.balances?.length || 0) - balancesBeforeAdd})`);
                console.log(`   ✨ Single API call replaced ${pathsToTest.length} individual calls!`);
            } catch (error: any) {
                console.error(`❌ [BATCH ADD FAILED] ${error.message}`);
            }
        } else {
            console.log('ℹ️ [SKIPPING] No paths to add for Bitcoin test (chainsToTest is empty)');
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


        // ========================================
        // BALANCE PORTFOLIO OVERVIEW TABLE
        // ========================================
        console.log('\n💼 [PORTFOLIO OVERVIEW] Complete wallet balance summary:\n');

        // Helper function to create middle ellipsis for long strings
        const ellipsisMiddle = (str: string, maxLen: number = 40): string => {
            if (str.length <= maxLen) return str.padEnd(maxLen);
            const sideLen = Math.floor((maxLen - 3) / 2);
            return str.substring(0, sideLen) + '...' + str.substring(str.length - sideLen);
        };

        // Separate native and token entries
        const nativeEntries: any[] = [];
        const tokenEntries: any[] = [];
        let grandTotalUsd = 0;
        let nativeTotalUsd = 0;
        let tokenTotalUsd = 0;

        // DEBUG: Log balances structure - DEEP AUDIT
        console.log('\n🔍 [DEEP AUDIT] Analyzing app.balances structure:');
        console.log(`   Total balances: ${app.balances?.length || 0}`);

        if (app.balances && app.balances.length > 0) {
            // Find all CACAO/MAYA balances
            const mayaBalances = app.balances.filter((b: any) =>
                b.symbol === 'CACAO' || b.symbol === 'MAYA' ||
                (b.caip && b.caip.includes('mayachain'))
            );

            console.log(`\n   Found ${mayaBalances.length} CACAO/MAYA balance entries:`);

            for (let i = 0; i < mayaBalances.length; i++) {
                const bal = mayaBalances[i];
                console.log(`\n   [${i}] CACAO/MAYA Balance Entry:`);
                console.log(`      symbol: ${bal.symbol}`);
                console.log(`      balance: ${bal.balance} (type: ${typeof bal.balance})`);
                console.log(`      value: ${bal.value}`);
                console.log(`      valueUsd: ${bal.valueUsd}`);
                console.log(`      priceUsd: ${bal.priceUsd}`);
                console.log(`      address: ${bal.address}`);
                console.log(`      pubkey: ${bal.pubkey}`);
                console.log(`      master: ${bal.master}`);
                console.log(`      caip: ${bal.caip}`);
                console.log(`      networkId: ${bal.networkId}`);
                console.log(`      All fields:`, Object.keys(bal));
            }

            console.log(`\n   First balance (any asset) structure:`);
            console.log(JSON.stringify(app.balances[0], null, 2));
        }

        for (const pubkey of app.pubkeys) {
            // Find balances for this pubkey
            const address = pubkey.master || pubkey.address || pubkey.pubkey;

            // DEBUG: Log matching attempt
            console.log(`\n🔍 [DEBUG] Matching for address: ${address}`);
            console.log(`   pubkey.master: ${pubkey.master}`);
            console.log(`   pubkey.address: ${pubkey.address}`);
            console.log(`   pubkey.pubkey: ${pubkey.pubkey}`);

            const matchingBalances = app.balances?.filter((b: any) => {
                const matches = b.address === address || b.pubkey === address || b.master === address;
                if (matches) {
                    console.log(`   ✅ MATCH FOUND: b.pubkey=${b.pubkey}, balance=${b.balance}`);
                }
                return matches;
            }) || [];

            console.log(`   Matching balances found: ${matchingBalances.length}`);

            // Get the path in BIP32 format
            const pathStr = pubkey.path || addressNListToBIP32(pubkey.addressNList || []);
            const symbol = pubkey.symbol || '???';

            // If we have balances, add each one as an entry
            if (matchingBalances.length > 0) {
                for (const balance of matchingBalances) {
                    // Handle balance field variations
                    let balanceNative = 0;
                    if (balance.balance) {
                        balanceNative = parseFloat(balance.balance);
                    } else if (balance.value) {
                        balanceNative = parseFloat(balance.value);
                    } else if (balance.valueUsd && balance.priceUsd) {
                        // Calculate native balance from USD values if missing
                        const price = parseFloat(balance.priceUsd);
                        if (price > 0) {
                            balanceNative = parseFloat(balance.valueUsd) / price;
                        }
                    }

                    const balanceUsd = parseFloat(balance.valueUsd || balance.priceUsd || '0');

                    // Skip entries with zero balance AND zero value (truly empty)
                    if (balanceNative === 0 && balanceUsd === 0) {
                        console.log(`   ⚠️ Skipping zero-balance entry for ${balance.symbol || symbol}`);
                        continue;
                    }

                    // Debug suspicious entries (USD value but no native balance)
                    if (balanceNative === 0 && balanceUsd > 0) {
                        console.log(`   🔍 [SUSPICIOUS] ${balance.symbol} has $${balanceUsd} USD but 0 native balance!`);
                        console.log(`      Raw balance data:`, JSON.stringify({
                            balance: balance.balance,
                            value: balance.value,
                            valueUsd: balance.valueUsd,
                            priceUsd: balance.priceUsd
                        }, null, 2));
                    }

                    grandTotalUsd += balanceUsd;

                    const isToken = balance.contract || balance.isToken ||
                                  (balance.type && balance.type.toLowerCase() === 'token') ||
                                  (balance.caip && !['BTC', 'ETH', 'AVAX', 'BNB', 'MATIC', 'BCH', 'LTC', 'DOGE', 'DASH', 'CACAO', 'MAYA', 'RUNE'].includes(balance.symbol));

                    const entry = {
                        path: pathStr,
                        address: address || 'N/A',
                        symbol: balance.symbol || symbol,
                        balanceNative: balanceNative,
                        balanceUsd: balanceUsd,
                        note: pubkey.note || balance.networkName || '',
                        isToken: isToken
                    };

                    if (isToken) {
                        tokenEntries.push(entry);
                        tokenTotalUsd += balanceUsd;
                    } else {
                        nativeEntries.push(entry);
                        nativeTotalUsd += balanceUsd;
                    }
                }
            } else {
                // Show path even if no balance (helps identify unused accounts)
                nativeEntries.push({
                    path: pathStr,
                    address: address || 'N/A',
                    symbol: symbol,
                    balanceNative: 0,
                    balanceUsd: 0,
                    note: pubkey.note || '',
                    isToken: false
                });
            }
        }

        // Sort by USD value descending (highest balances first)
        nativeEntries.sort((a, b) => b.balanceUsd - a.balanceUsd);
        tokenEntries.sort((a, b) => b.balanceUsd - a.balanceUsd);

        // Combine for full portfolio view
        const portfolioEntries = [...nativeEntries, ...tokenEntries];

        // Better table rendering function
        function renderPortfolioTable(headers: string[], rows: any[][], title?: string) {
            const colWidths = headers.map((h, i) => {
                const maxWidth = Math.max(
                    h.length,
                    ...rows.map(r => String(r[i] || '').length)
                );
                return maxWidth + 2;
            });

            const separator = '─';
            const totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + colWidths.length + 1;
            const topLine = '┌' + separator.repeat(totalWidth - 2) + '┐';
            const midLine = '├' + colWidths.map(w => separator.repeat(w)).join('┼') + '┤';
            const bottomLine = '└' + colWidths.map(w => separator.repeat(w)).join('┴') + '┘';

            console.log(topLine);
            if (title) {
                const titlePadding = Math.floor((totalWidth - title.length - 2) / 2);
                console.log('│' + ' '.repeat(titlePadding) + title + ' '.repeat(totalWidth - titlePadding - title.length - 2) + '│');
                console.log(midLine);
            }
            console.log('│' + headers.map((h, i) => ` ${h.padEnd(colWidths[i] - 2)} `).join('│') + '│');
            console.log(midLine);

            rows.forEach(row => {
                console.log('│' + row.map((cell, i) => ` ${String(cell).padEnd(colWidths[i] - 2)} `).join('│') + '│');
            });

            console.log(bottomLine);
        }

        // Display the table - only show non-zero balances
        const displayEntries = portfolioEntries.filter(e => e.balanceNative > 0 || e.balanceUsd > 0);

        if (displayEntries.length > 0) {
            const portfolioRows = displayEntries.map(entry => [
                entry.path.substring(0, 20),
                ellipsisMiddle(entry.address, 35),
                entry.symbol.substring(0, 8),
                entry.balanceNative.toFixed(8),
                `$${entry.balanceUsd.toFixed(2)}`
            ]);

            renderPortfolioTable(
                ['Path', 'Address', 'Asset', 'Balance', 'Value USD'],
                portfolioRows,
                'PORTFOLIO OVERVIEW'
            );

            console.log(`\n💰 TOTAL PORTFOLIO VALUE: $${grandTotalUsd.toFixed(2)}\n`);
        } else {
            console.log('⚠️ No balances with value found in portfolio\n');
        }

        // Summary statistics with native/token breakdown
        const nonZeroNative = nativeEntries.filter(e => e.balanceUsd > 0);
        const nonZeroTokens = tokenEntries.filter(e => e.balanceUsd > 0);
        const nonZeroEntries = portfolioEntries.filter(e => e.balanceUsd > 0);

        console.log('📊 [PORTFOLIO STATS]');
        console.log(`   Total Addresses: ${portfolioEntries.length} (${nativeEntries.length} native + ${tokenEntries.length} tokens)`);
        console.log(`   Addresses with Balance: ${nonZeroEntries.length} (${nonZeroNative.length} native + ${nonZeroTokens.length} tokens)`);
        console.log(`   Total Value: $${grandTotalUsd.toFixed(2)} USD`);
        console.log(`   Native Value: $${nativeTotalUsd.toFixed(2)} USD (${grandTotalUsd > 0 ? ((nativeTotalUsd / grandTotalUsd) * 100).toFixed(1) : '0'}%)`);
        console.log(`   Token Value: $${tokenTotalUsd.toFixed(2)} USD (${grandTotalUsd > 0 ? ((tokenTotalUsd / grandTotalUsd) * 100).toFixed(1) : '0'}%)`);
        if (nonZeroEntries.length > 0) {
            const avgBalance = grandTotalUsd / nonZeroEntries.length;
            console.log(`   Average Balance: $${avgBalance.toFixed(2)} USD`);
        }

        // Maya-specific summary
        const mayaEntries = portfolioEntries.filter(e => e.symbol === 'CACAO' || e.symbol === 'MAYA');
        const mayaTotalUsd = mayaEntries.reduce((sum, e) => sum + e.balanceUsd, 0);
        const mayaTotalNative = mayaEntries.reduce((sum, e) => sum + e.balanceNative, 0);

        if (mayaEntries.length > 0) {
            console.log(`\n🔱 [MAYA SUMMARY]`);
            console.log(`   Maya Addresses: ${mayaEntries.length}`);
            console.log(`   Maya Addresses with Balance: ${mayaEntries.filter(e => e.balanceUsd > 0).length}`);
            console.log(`   Total CACAO: ${mayaTotalNative.toFixed(8)} CACAO`);
            console.log(`   Total Maya Value: $${mayaTotalUsd.toFixed(2)} USD`);
            console.log(`   Maya % of Portfolio: ${grandTotalUsd > 0 ? ((mayaTotalUsd / grandTotalUsd) * 100).toFixed(2) : '0'}%`);
        }

        console.log('');

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

// Start the test
test_service().catch((error) => {
    console.error('❌ Unhandled test error:', error);
    process.exit(1);
});
