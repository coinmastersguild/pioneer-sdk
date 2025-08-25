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
                // console.log('portfolioResponse: ',portfolioResponse)
                if (!portfolioResponse.ok) {
                    console.log('⚠️ [CACHE CHECK] Portfolio cache not available');
                    return { available: false, reason: 'portfolio_not_cached' };
                }
                
                const portfolio: any = await portfolioResponse.json();
                console.log('portfolioResponse: ',portfolio)
                console.log('portfolioResponse: ',JSON.stringify(portfolio))
                console.log('✅ [CACHE CHECK] Found cached portfolio balances:', portfolio.balances?.length || 0);
                
                return { 
                    available: true,
                    devices: portfolio.devices?.length || 0
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
            'ETH',
            // 'ARB',  //BROKE
            'DOGE',
            'OP',    //Fast
            'MATIC', //SLOW charting
            'AVAX',  //fast
            'BASE',  //fast
            'BSC',   //fast
            'BTC',
            'BCH',
            'GAIA',
            'OSMO',
            'XRP',
            'DOGE',
            'DASH',
            'MAYA',
            'LTC',
            'THOR'
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

        // let node = {
        //     networkId:'eip155:534352',
        //     service:'https://scroll.drpc.org',
        //     protocol: 'EVM'
        // }
        // nodes.push(node)
        //
        // //2000
        // // blockchains.push('eip155:2000')
        //
        // //base
        // // blockchains.push('eip155:8453')
        //
        //
        // //add custom path
        // let blockchains = [BLOCKCHAIN]

        // let paths:any = []

        let paths = getPaths(blockchains)
        log.info(tag,'paths:',paths.length)

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
            nodes:[],
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

        // // Verify KeepKey SDK configuration
        // if (app.keepKeySdk && app.keepKeySdk.config) {
        //     const pairingInfo = app.keepKeySdk.config.pairingInfo;
        //     if (pairingInfo && pairingInfo.url) {
        //         if (pairingInfo.url.startsWith('kkapi://')) {
        //             console.log('✅ [SDK] Using kkapi:// protocol');
        //         } else if (pairingInfo.url.includes('localhost:1646')) {
        //             console.log('✅ [SDK] Using HTTP localhost:1646');
        //         }
        //     }
        // }
        //
        // // Add essential event handlers
        // app.events.on('device:connected', (device: any) => {
        //   console.log('🔌 [DEVICE] Connected:', device.name || device.deviceId || 'Unknown')
        // })
        //
        // // Load gas assets
        // console.log('⛽ [ASSETS] Loading gas assets...')
        // await app.getGasAssets()
        // console.log('✅ [ASSETS] Loaded', app.assetsMap ? app.assetsMap.size : 0, 'assets')
        //
        // console.timeEnd('⏱️ 2_GET_GAS_ASSETS');
        // console.log('🎯 [PERF] GetGasAssets completed at:', (performance.now() - perfStart).toFixed(0) + 'ms');
        //
        // // Check if fast portfolio was already loaded during init
        // console.log('🚀 [PORTFOLIO CHECK] Checking if portfolio was loaded during init...');
        // console.time('⏱️ PORTFOLIO_VALIDATION');
        //
        // let portfolioLoadedDuringInit = false;
        //
        // if (app.balances && app.balances.length > 0) {
        //     console.log('✅ [PORTFOLIO CHECK] Portfolio already loaded during init!');
        //     console.log(`📊 [PORTFOLIO CHECK] Current balances: ${app.balances.length} assets`);
        //     if (app.dashboard && app.dashboard.totalValueUsd) {
        //         console.log(`💰 [PORTFOLIO CHECK] Current value: $${app.dashboard.totalValueUsd.toFixed(2)} USD`);
        //     }
        //     console.log('🎯 [PERF] Total time to portfolio:', (performance.now() - perfStart).toFixed(0) + 'ms');
        //     portfolioLoadedDuringInit = true;
        //     console.timeEnd('⏱️ PORTFOLIO_VALIDATION');
        //
        //     // Wait for background sync to complete if it's running
        //     if (app.events) {
        //         console.log('🔄 [BACKGROUND SYNC] Monitoring background sync status...');
        //         await new Promise((resolve) => {
        //             const syncTimeout = setTimeout(() => {
        //                 console.log('⏰ [BACKGROUND SYNC] Timeout reached after 30s, continuing with test');
        //                 fullSyncTime = performance.now() - perfStart;
        //                 resolve(undefined);
        //             }, 30000); // 30 second timeout for background sync to allow getPubkeys to complete
        //
        //             app.events.once('SYNC_COMPLETE', () => {
        //                 clearTimeout(syncTimeout);
        //                 fullSyncTime = performance.now() - perfStart;
        //                 console.log('✅ [BACKGROUND SYNC] Background sync completed');
        //                 console.log(`🔄 [PERFORMANCE] Time to full sync: ${fullSyncTime.toFixed(0)}ms`);
        //                 resolve(undefined);
        //             });
        //         });
        //     }
        // } else {
        //     console.log('⚠️ [PORTFOLIO CHECK] No portfolio data found, using manual sync...');
        //     console.timeEnd('⏱️ PORTFOLIO_VALIDATION');
        // }
        //
        // // Only run manual getPubkeys and getBalances if portfolio wasn't loaded during init
        // if (!portfolioLoadedDuringInit) {
        //     console.log('🔑 [SYNC] Getting pubkeys...')
        //     console.time('⏱️ 3_GET_PUBKEYS');
        //     await app.getPubkeys()
        //     console.timeEnd('⏱️ 3_GET_PUBKEYS');
        //     console.log('✅ [SYNC] Got', app.pubkeys.length, 'pubkeys')
        //
        //     // Mark first portfolio time when we have pubkeys (for manual sync case)
        //     if (!firstPortfolioTime) {
        //         firstPortfolioTime = performance.now() - perfStart;
        //         console.log(`⚡ [PERFORMANCE] Time to first pubkeys: ${firstPortfolioTime.toFixed(0)}ms`)
        //     }
        //
        //     console.log('💰 [SYNC] Getting balances...')
        //     console.time('⏱️ 4_GET_BALANCES');
        //     await app.getBalances()
        //     console.timeEnd('⏱️ 4_GET_BALANCES');
        //     console.log('✅ [SYNC] Got', app.balances.length, 'balances')
        //
        //     // Mark full sync complete
        //     fullSyncTime = performance.now() - perfStart;
        //     console.log(`🔄 [PERFORMANCE] Time to full sync: ${fullSyncTime.toFixed(0)}ms`);
        // }
        //
        // //clear cache
        // app.events.emit('message', 'What up doc!')
        //
        // app.events.on('message', (event: any) => {
        //   log.info(tag,'📨 Message event: ', event)
        // })
        //
        // console.log('🎯 [PERF] Starting validation phase at:', (performance.now() - perfStart).toFixed(0) + 'ms');
        // console.time('⏱️ VALIDATION_ASSETS_MAP');
        //
        // // // log.info(tag,"resultInit: ",resultInit)
        // // console.timeEnd('start2init');
        // log.debug(tag,'🗺️ Getting assetsMap from app...')
        // let assets = app.assetsMap
        // log.info(tag,"📊 Total assets in assetsMap:", assets ? assets.size : 0)
        //
        // // Log first few assets for debugging
        // if (assets && assets.size > 0) {
        //     log.debug(tag,"🔍 First 5 assets in map:")
        //     let count = 0
        //     for(let [caip,asset] of assets){
        //         if (count++ >= 5) break
        //         log.debug(tag,`  ${caip} -> ${asset?.symbol || 'NO_SYMBOL'} (${asset?.name || 'NO_NAME'})`)
        //     }
        // }
        // assert(assets)
        //
        // // Validate assets have required properties
        // log.debug(tag,'🔍 Validating asset properties...')
        // for(let [caip,asset] of assets){
        //     if (!asset) {
        //         log.error(tag,`❌ Null asset found for CAIP: ${caip}`)
        //         continue
        //     }
        //     if (!caip) {
        //         log.error(tag,`❌ Null CAIP found for asset: ${asset}`)
        //         continue
        //     }
        //     if (!asset.caip) {
        //         log.warn(tag,`⚠️ Asset missing caip property: ${caip}`, asset)
        //     }
        // }
        // log.info(tag,' ****** Assets Map Loaded Successfully ******')
        //
        // console.timeEnd('⏱️ VALIDATION_ASSETS_MAP');
        // console.log('🎯 [PERF] Assets map validation completed at:', (performance.now() - perfStart).toFixed(0) + 'ms');
        // console.time('⏱️ VALIDATION_PUBKEYS');
        
        //
        // let pubkeys
        // pubkeys = await app.getPubkeys()
        // if(app.pubkeys.length === 0){
        //     log.info(tag,'cache is empty refreshing... ')
        //     pubkeys = await app.getPubkeys()
        // } else {
        //     pubkeys = app.pubkeys
        //     log.info(tag,'cache found! ', pubkeys.length)
        // }

        // let pubkeys = app.pubkeys
        // log.info(tag,"📊 Total pubkeys retrieved: ",pubkeys.length)
        // log.debug(tag,"🔍 First 3 pubkeys for debugging:", pubkeys.slice(0, 3))
        // assert(pubkeys)
        // assert(pubkeys[0])
        //
        // // Detailed pubkey validation with logging
        // for(let i = 0; i < pubkeys.length; i++){
        //     let pubkey = pubkeys[i]
        //     log.debug(tag,`🔑 Validating pubkey ${i}/${pubkeys.length}:`, {
        //         path: pubkey.path,
        //         type: pubkey.type,
        //         scriptType: pubkey.scriptType,
        //         networks: pubkey.networks,
        //         pubkey: pubkey.pubkey?.substring(0, 10) + '...' // Show first 10 chars only
        //     })
        //
        //     try {
        //         assert(pubkey.pubkey)
        //         assert(pubkey.type)
        //         assert(pubkey.path)
        //         assert(pubkey.scriptType)
        //         assert(pubkey.networks)
        //         assert(pubkey.networks[0])
        //     } catch (error) {
        //         log.error(tag, `❌ Pubkey validation failed for index ${i}:`, pubkey)
        //         throw error
        //     }
        // }
        //
        // log.info(tag,'✅ All pubkeys validated successfully')
        //
        // // Path validation with detailed logging
        // assert(app.paths)
        // log.info(tag,`📊 Total paths to validate: ${app.paths.length}`)
        //
        // for(let i = 0; i < app.paths.length; i++){
        //     let path = app.paths[i]
        //     log.debug(tag,`🛤️ Validating path ${i}/${app.paths.length}:`, {
        //         addressNList: path.addressNList,
        //         networks: path.networks
        //     })
        //
        //     let bip32Path = addressNListToBIP32(path.addressNList)
        //     log.debug(tag,`   BIP32 path: ${bip32Path}`)
        //
        //     let pubkey = app.pubkeys.find((pubkey:any) => pubkey.path === bip32Path)
        //     if (!pubkey) {
        //         log.error(tag,`❌ No pubkey found for path: ${bip32Path}`)
        //         log.error(tag,`   Available pubkey paths:`, app.pubkeys.map((p:any) => p.path))
        //     }
        //     assert(pubkey)
        // }
        // log.info(tag,' ****** Validate Path exists for every path * PASS * ******')
        //
        // // //validate pubkeys
        // for(let i = 0; i < app.pubkeys.length; i++){
        //     let pubkey = app.pubkeys[i]
        //     log.debug(tag,"pubkey: ",pubkey)
        //     assert(pubkey)
        //     assert(pubkey.pubkey)
        //     // log.info(tag,'pubkey: ',pubkey)
        //     assert(pubkey.type)
        // }
        // log.info(tag,' ****** Validate Pubkeys Properties exist * PASS * ******')
        //
        // console.timeEnd('start2Pubkeys');
        // log.info(tag,'app.pubkeys.length: ',app.pubkeys.length)
        // log.info(tag,'app.paths.length: ',app.paths.length)
        // // if(app.pubkeys.length !== app.paths.length) throw Error('Missing pubkeys! failed to sync')
        //
        //
        // tag = tag + " | checkpoint1 | "
        //
        // log.info(tag,'🔍 Starting blockchain asset validation...')
        // for(let i = 0; i < blockchains.length; i++){
        //     let blockchain = blockchains[i]
        //     log.debug(tag,`🔗 Validating blockchain ${i+1}/${blockchains.length}: ${blockchain}`)
        //
        //     //
        //     if(blockchain.indexOf('eip155') >= 0){
        //         //check for gas asset in asset map
        //         let caip = blockchain + "/slip44:60"
        //         log.debug(tag,'  📍 EVM chain - checking for gas asset with CAIP:',caip)
        //         let asset = assets.get(caip)
        //         log.debug(tag,'  💎 Asset found:',asset ? 'YES' : 'NO', asset ? {
        //             name: asset.name,
        //             symbol: asset.symbol,
        //             decimal: asset.decimal
        //         } : null)
        //         assert(asset)
        //         assert(app.assetsMap.get(caip))
        //
        //         let assetInfo = app.assetsMap.get(caip)
        //         log.debug(tag,'  ℹ️ AssetInfo verified:', !!assetInfo)
        //         assert(assetInfo)
        //     }
        //
        //     let chain = NetworkIdToChain[blockchain]
        //     log.debug(tag, '  🏷️ Chain name:',chain)
        //     assert(chain)
        //
        //     let caip = shortListSymbolToCaip[chain]
        //     log.debug(tag, '  📍 Native asset CAIP:',caip)
        //     assert(caip)
        //
        //     let nativeAsset = assets.get(caip)
        //     if (!nativeAsset) {
        //         log.error(tag,`  ❌ Missing native asset for chain ${chain} with CAIP ${caip}`)
        //         log.debug(tag,'  Available assets:', Array.from(assets.keys() as IterableIterator<string>).filter(k => k.includes(blockchain)))
        //     }
        //     assert(assets.get(caip))
        //
        //     //should be a balance for every gas asset
        //     log.debug(tag,`  💰 Checking for balance with CAIP: ${caip}`)
        //     const balanceNative = app.balances.find((balance:any) => balance.caip === caip);
        //     if(!balanceNative) {
        //         log.error(tag,`  ❌ Missing Balance for chain ${chain} CAIP: ${caip}`)
        //         log.debug(tag,'  Available balances for this chain:',
        //             app.balances.filter((b:any) => b.networkId === blockchain).map((b:any) => ({
        //                 caip: b.caip,
        //                 balance: b.balance
        //             }))
        //         )
        //     }
        //     assert(balanceNative)
        //     log.debug(tag,"  ✅ Balance found:",{
        //         caip: balanceNative.caip,
        //         balance: balanceNative.balance,
        //         networkId: balanceNative.networkId
        //     })
        // }
        // log.info(tag,' ****** Validated Assets for each chain exist bro ******')


        tag = tag + " | checkpoint3 | "
        // let balances
        // balances = await app.getBalances()
        // // if(app.balances.length === 0){
        // //     log.info(tag,'balances cache is empty refreshing... ')
        // //     balances = await app.getBalances()
        // //     await app.getCharts();
        // // } else {
        // //     balances = app.balances
        // //     log.info(tag,'balances cache found! ', balances.length)
        // // }
        // assert(balances)

        // log.info(tag,"balances: ",app.balances.length)
        // log.info(tag,"balances: ",app.balances.length)
        //
        // for(let i = 0; i < app.balances.length; i++){
        //     let balance = app.balances[i]
        //     log.info(tag,"balance: ",balance.caip)
        //     log.info(tag,"balance: ",balance)
        //     assert(balance)
        //     assert(balance.balance)
        //     assert(balance.caip)
        //     assert(balance.networkId)
        //     assert(balance.icon)
        //     if(balance.identifier.includes('keepkey')){
        //         throw Error('Invalid legacy identifier found: '+balance.identifier)
        //     }
        // }
        // console.timeEnd('start2BalancesGas');
        //
        // tag = tag + " | checkpoint3 | "
        // log.debug(tag,'balances: ',app.balances)
        //
        // log.debug(tag,'pre : getCharts: ',app.balances)
        // await app.getCharts()
        // //expect at least 1 token
        // log.debug(tag,'post: getCharts: balances: ',app.balances)
        // log.debug(tag,'balances: ',app.balances.length)
        //
        // //Analyitics
        // let totalValueUsd = 0;
        // let networkTotals:any = {}; // Object to hold totals by networkId
        //
        // const seenIdentifiers = new Set<string>(); // Track seen identifiers
        // for (let i = 0; i < app.balances.length; i++) {
        //     let balance = app.balances[i];
        //     // log.info(tag, "balance: ", balance);
        //     // Check for duplicate identifier
        //     if (seenIdentifiers.has(balance.identifier)) {
        //         throw new Error(`Duplicate identifier found: ${balance.identifier}`);
        //     }
        //     seenIdentifiers.add(balance.identifier);
        //
        //     // Check if balance, caip, and valueUsd are valid
        //     assert(balance);
        //     assert(balance.networkId);
        //     assert(balance.caip);
        //
        //     // Parse valueUsd as a float
        //     let valueUsd = parseFloat(balance.valueUsd);
        //     if (isNaN(valueUsd)) {
        //         log.warn(tag, `Skipping balance with invalid valueUsd: ${balance.valueUsd}`);
        //         continue; // Skip balances with invalid valueUsd
        //     }
        //
        //     // Add to total value
        //     totalValueUsd += valueUsd;
        //
        //     // Log networkId and valueUsd for each balance
        //     //log.info(tag, `Processing balance with networkId: ${balance.caip}, valueUsd: ${valueUsd}`);
        //
        //     // Ensure networkId exists and accumulate by networkId
        //     if (balance.networkId) {
        //         if (!networkTotals[balance.networkId]) {
        //             networkTotals[balance.networkId] = 0; // Initialize if not already present
        //         }
        //         networkTotals[balance.networkId] += valueUsd; // Add value to network-specific total
        //     } else {
        //         log.warn(tag, `Skipping balance without networkId: ${JSON.stringify(balance)}`);
        //     }
        // }
        //
        // log.info(tag, 'totalValueUsd: ', totalValueUsd);
        // log.info(tag, 'networkTotals: ', networkTotals);
        // log.info(tag,'dashboard', app.dashboard);
        //
        // // ========================================
        // // DETAILED PORTFOLIO BREAKDOWN (PIONEER SDK)
        // // ========================================
        // console.log('');
        // console.log('📋 [PIONEER SDK] DETAILED BREAKDOWN - Line by line asset breakdown:');
        // console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════');
        // console.log('CAIP                                          | TICKER   | NATIVE BALANCE              | USD VALUE    ');
        // console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════');
        //
        // // Sort by USD value (highest first) and show ALL balances
        // const sortedBalances = app.balances
        //   .filter((balance: any) => parseFloat(balance.valueUsd || '0') > 0) // Only show balances with value
        //   .sort((a: any, b: any) => parseFloat(b.valueUsd || '0') - parseFloat(a.valueUsd || '0'));
        //
        // sortedBalances.forEach((balance: any, index: number) => {
        //   const caip = balance.caip || 'Unknown CAIP';
        //   const ticker = (balance.ticker || balance.symbol || 'UNKNOWN').padEnd(8);
        //   const nativeBalance = balance.balance || '0';
        //   const usdValue = `$${parseFloat(balance.valueUsd || '0').toFixed(2)}`;
        //
        //   // Truncate CAIP if too long for display
        //   const displayCaip = caip.length > 41 ? caip.substring(0, 38) + '...' : caip.padEnd(41);
        //   const displayBalance = nativeBalance.length > 25 ? nativeBalance.substring(0, 22) + '...' : nativeBalance.padEnd(25);
        //   const displayUsdValue = usdValue.padStart(12);
        //
        //   console.log(`${displayCaip} | ${ticker} | ${displayBalance} | ${displayUsdValue}`);
        // });
        //
        // console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════════════');
        // console.log(`📊 [PIONEER SDK] Portfolio Total: $${totalValueUsd.toFixed(2)} USD (${sortedBalances.length} assets with value)`);
        // console.log(`📊 [PIONEER SDK] Total Balances Found: ${app.balances.length} (including zero balances)`);
        //
        // // Show top 5 summary
        // console.log('');
        // console.log('🏆 [PIONEER SDK] TOP 5 HOLDINGS by USD Value:');
        // sortedBalances.slice(0, 5).forEach((balance: any, index: number) => {
        //   const usdValue = parseFloat(balance.valueUsd || '0');
        //   const percentage = totalValueUsd > 0 ? ((usdValue / totalValueUsd) * 100).toFixed(1) : '0.0';
        //   console.log(`   ${index + 1}. ${balance.ticker || balance.symbol || 'UNKNOWN'}: ${balance.balance} = $${usdValue.toFixed(2)} (${percentage}%)`);
        // });
        // console.log('');
        //
        // // Test Direct Cosmos Delegation APIs
        // log.info(tag, ' ****** Testing Direct Cosmos Delegation APIs ******')

        
        // log.info(tag, ' ****** Direct Cosmos Delegation API Tests Complete ******');
        //
        // // Test Cosmos Staking Positions Integration
        // log.info(tag, ' ****** Testing Cosmos Staking Positions Integration ******')
        //
        // // Find cosmos pubkeys for staking tests
        // const cosmosPubkeys = app.pubkeys.filter((pubkey: any) =>
        //     pubkey.networks.some((n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'))
        // );
        
        // if (cosmosPubkeys.length > 0) {
        //     log.info(tag, `Found ${cosmosPubkeys.length} cosmos pubkeys for staking tests`);
        //
        //     // Test staking positions for each cosmos pubkey
        //     for (const cosmosPubkey of cosmosPubkeys) {
        //         if (cosmosPubkey.address) {
        //             log.info(tag, `Testing staking positions for address: ${cosmosPubkey.address}`);
        //
        //             // Check if we have staking positions in balances
        //             const stakingBalances = app.balances.filter((balance: any) =>
        //                 balance.pubkey === cosmosPubkey.address &&
        //                 balance.chart === 'staking'
        //             );
        //
        //             if (stakingBalances.length > 0) {
        //                 log.info(tag, `✅ Found ${stakingBalances.length} staking positions in balances`);
        //
        //                 // Analyze staking positions
        //                 let totalStakingValue = 0;
        //                 const stakingTypes: { [key: string]: number } = {};
        //
        //                 for (const stakingBalance of stakingBalances) {
        //                     log.debug(tag, `Staking position:`, {
        //                         type: stakingBalance.type,
        //                         balance: stakingBalance.balance,
        //                         ticker: stakingBalance.ticker,
        //                         valueUsd: stakingBalance.valueUsd,
        //                         validator: stakingBalance.validator,
        //                         status: stakingBalance.status
        //                     });
        //
        //                     // Validate staking position properties
        //                     assert(stakingBalance.type, 'Staking position must have type');
        //                     assert(stakingBalance.balance, 'Staking position must have balance');
        //                     assert(stakingBalance.ticker, 'Staking position must have ticker');
        //                     assert(stakingBalance.networkId, 'Staking position must have networkId');
        //                     assert(stakingBalance.caip, 'Staking position must have caip');
        //                     assert(stakingBalance.chart === 'staking', 'Chart type must be staking');
        //
        //                     // Accumulate totals
        //                     const valueUsd = parseFloat(stakingBalance.valueUsd) || 0;
        //                     totalStakingValue += valueUsd;
        //
        //                     // Count by type
        //                     if (!stakingTypes[stakingBalance.type]) {
        //                         stakingTypes[stakingBalance.type] = 0;
        //                     }
        //                     stakingTypes[stakingBalance.type]++;
        //                 }
        //
        //                 log.info(tag, `📊 Staking Analysis for ${cosmosPubkey.address}:`);
        //                 log.info(tag, `  Total Staking Value: $${totalStakingValue.toFixed(2)}`);
        //                 log.info(tag, `  Position Types:`, stakingTypes);
        //
        //                 // Verify staking positions are included in total portfolio value
        //                 const originalTotalValue = totalValueUsd;
        //                 log.info(tag, `  Portfolio includes staking value: ${originalTotalValue >= totalStakingValue ? '✅' : '❌'}`);
        //
        //                 // Test specific staking position types
        //                 if (stakingTypes['delegation']) {
        //                     log.info(tag, `  ✅ Found ${stakingTypes['delegation']} delegation positions`);
        //                 }
        //                 if (stakingTypes['reward']) {
        //                     log.info(tag, `  ✅ Found ${stakingTypes['reward']} reward positions`);
        //                 }
        //                 if (stakingTypes['unbonding']) {
        //                     log.info(tag, `  ✅ Found ${stakingTypes['unbonding']} unbonding positions`);
        //                 }
        //
        //             } else {
        //                 log.info(tag, `ℹ️ No staking positions found for ${cosmosPubkey.address} (this is normal if no staking activity)`);
        //             }
        //         }
        //     }
        // } else {
        //     log.info(tag, 'ℹ️ No cosmos pubkeys found - skipping staking position tests');
        // }
        //
        // // Verify staking positions have market pricing
        // const stakingPositions = app.balances.filter((balance: any) => balance.chart === 'staking');
        // if (stakingPositions.length > 0) {
        //     log.info(tag, ' ****** Testing Staking Position Market Pricing ******');
        //
        //     for (const position of stakingPositions) {
        //         log.debug(tag, `Checking pricing for ${position.type} position:`, {
        //             ticker: position.ticker,
        //             balance: position.balance,
        //             priceUsd: position.priceUsd,
        //             valueUsd: position.valueUsd
        //         });
        //
        //         // Verify pricing data exists
        //         if (position.priceUsd && position.priceUsd > 0) {
        //             log.info(tag, `✅ ${position.ticker} has market price: $${position.priceUsd}`);
        //
        //             // Verify value calculation
        //             const expectedValue = parseFloat(position.balance) * parseFloat(position.priceUsd);
        //             const actualValue = parseFloat(position.valueUsd);
        //             const tolerance = 0.01; // 1 cent tolerance
        //
        //             if (Math.abs(expectedValue - actualValue) <= tolerance) {
        //                 log.info(tag, `✅ ${position.ticker} value calculation correct: $${actualValue.toFixed(2)}`);
        //             } else {
        //                 log.warn(tag, `⚠️ ${position.ticker} value calculation mismatch: expected $${expectedValue.toFixed(2)}, got $${actualValue.toFixed(2)}`);
        //             }
        //         } else {
        //             log.warn(tag, `⚠️ ${position.ticker} missing market price data`);
        //         }
        //     }
        // }
        
        // log.info(tag, ' ****** Cosmos Staking Integration Tests Complete ******');

        // Verify delegation positions exist in app.balances
        // log.info(tag, ' ****** Testing Delegation Positions in app.balances ******');
        
        // Check for any staking positions with chart: 'staking' in app.balances
        // const allStakingPositions = app.balances.filter((balance: any) => balance.chart === 'staking');
        // log.info(tag, `Total staking positions found in app.balances: ${allStakingPositions.length}`);
        //
        // if (allStakingPositions.length === 0) {
        //     // Check if we have cosmos pubkeys - if we do but no staking positions, that's an issue
        //     const cosmosAddresses = app.pubkeys.filter((pubkey: any) =>
        //         pubkey.networks.some((n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'))
        //     );
        //
        //     if (cosmosAddresses.length > 0) {
        //         log.error(tag, `❌ CRITICAL FAILURE: Found ${cosmosAddresses.length} cosmos addresses but NO staking positions in app.balances!`);
        //         log.error(tag, `This indicates that getCharts() is not properly populating staking positions.`);
        //         log.error(tag, `Cosmos addresses found:`, cosmosAddresses.map((p: any) => p.address));
        //
        //         // This is a critical failure - the whole point of the fix was to get staking positions
        //         throw new Error(`CRITICAL TEST FAILURE: No staking positions found in app.balances despite having ${cosmosAddresses.length} cosmos addresses. The getCharts() integration is broken.`);
        //     } else {
        //         log.info(tag, `ℹ️ No cosmos addresses found, so no staking positions expected.`);
        //     }
        // } else {
        //     log.info(tag, `✅ SUCCESS: Found ${allStakingPositions.length} staking positions in app.balances!`);
        //
        //     // Log details of found staking positions
        //     const delegationPositions = allStakingPositions.filter((p: any) => p.type === 'delegation');
        //     const rewardPositions = allStakingPositions.filter((p: any) => p.type === 'reward');
        //     const unbondingPositions = allStakingPositions.filter((p: any) => p.type === 'unbonding');
        //
        //     log.info(tag, `  📊 Delegation positions: ${delegationPositions.length}`);
        //     log.info(tag, `  💰 Reward positions: ${rewardPositions.length}`);
        //     log.info(tag, `  ⏳ Unbonding positions: ${unbondingPositions.length}`);
        //
        //     // Log first few positions for verification
        //     for (let i = 0; i < Math.min(allStakingPositions.length, 3); i++) {
        //         const pos = allStakingPositions[i];
        //         log.info(tag, `  Position ${i + 1}:`, {
        //             type: pos.type,
        //             ticker: pos.ticker,
        //             balance: pos.balance,
        //             valueUsd: pos.valueUsd,
        //             validator: pos.validator,
        //             networkId: pos.networkId
        //         });
        //     }
        // }
        
        log.info(tag, ' ****** Delegation Positions Test Complete ******');



        // console.log("************************* TEST PASS *************************")
        // console.timeEnd('start2end');
        //
        // console.timeEnd('⏱️ TOTAL_TEST_TIME');
        //
        // // Performance Summary
        // const totalTime = performance.now() - perfStart;
        // console.log('');
        // console.log('📊 [PERFORMANCE SUMMARY] ===================================');
        // if (firstPortfolioTime) {
        //     console.log(`⚡ Time to first portfolio: ${firstPortfolioTime.toFixed(0)}ms`);
        // }
        // if (fullSyncTime) {
        //     console.log(`🔄 Time to full sync complete: ${fullSyncTime.toFixed(0)}ms`);
        // } else {
        //     console.log(`🔄 Full sync time: ${totalTime.toFixed(0)}ms (fallback)`);
        // }
        // console.log(`🎯 Total test runtime: ${totalTime.toFixed(0)}ms`);
        //
        // // Performance analysis
        // if (firstPortfolioTime && fullSyncTime) {
        //     const improvement = ((fullSyncTime - firstPortfolioTime) / fullSyncTime * 100);
        //     console.log(`💰 Portfolio available ${improvement.toFixed(1)}% faster than full sync`);
        // }
        // console.log('📊 =========================================================');
        
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
