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
        
        // Check if fast portfolio was already loaded during init
        console.log('🚀 [PORTFOLIO CHECK] Checking if portfolio was loaded during init...');
        console.time('⏱️ PORTFOLIO_VALIDATION');
        
        let portfolioLoadedDuringInit = false;
        
        if (app.balances && app.balances.length > 0) {
            console.log('✅ [PORTFOLIO CHECK] Portfolio already loaded during init!');
            console.log(`📊 [PORTFOLIO CHECK] Current balances: ${app.balances.length} assets`);
            if (app.dashboard && app.dashboard.totalValueUsd) {
                console.log(`💰 [PORTFOLIO CHECK] Current value: $${app.dashboard.totalValueUsd.toFixed(2)} USD`);
            }
            console.log('🎯 [PERF] Total time to portfolio:', (performance.now() - perfStart).toFixed(0) + 'ms');
            portfolioLoadedDuringInit = true;
            console.timeEnd('⏱️ PORTFOLIO_VALIDATION');
            
            // Wait for background sync to complete if it's running
            if (app.events) {
                console.log('🔄 [BACKGROUND SYNC] Monitoring background sync status...');
                await new Promise((resolve) => {
                    const syncTimeout = setTimeout(() => {
                        console.log('⏰ [BACKGROUND SYNC] Timeout reached after 30s, continuing with test');
                        fullSyncTime = performance.now() - perfStart;
                        resolve(undefined);
                    }, 30000); // 30 second timeout for background sync to allow getPubkeys to complete
                    
                    app.events.once('SYNC_COMPLETE', () => {
                        clearTimeout(syncTimeout);
                        fullSyncTime = performance.now() - perfStart;
                        console.log('✅ [BACKGROUND SYNC] Background sync completed');
                        console.log(`🔄 [PERFORMANCE] Time to full sync: ${fullSyncTime.toFixed(0)}ms`);
                        resolve(undefined);
                    });
                });
            }
        } else {
            console.log('⚠️ [PORTFOLIO CHECK] No portfolio data found, using manual sync...');
            console.timeEnd('⏱️ PORTFOLIO_VALIDATION');
        }
        
        // Only run manual getPubkeys and getBalances if portfolio wasn't loaded during init
        if (!portfolioLoadedDuringInit) {
            console.log('🔑 [SYNC] Getting pubkeys...')
            console.time('⏱️ 3_GET_PUBKEYS');
            await app.getPubkeys()
            console.timeEnd('⏱️ 3_GET_PUBKEYS');
            console.log('✅ [SYNC] Got', app.pubkeys.length, 'pubkeys')
            
            // Mark first portfolio time when we have pubkeys (for manual sync case)
            if (!firstPortfolioTime) {
                firstPortfolioTime = performance.now() - perfStart;
                console.log(`⚡ [PERFORMANCE] Time to first pubkeys: ${firstPortfolioTime.toFixed(0)}ms`)
            }
            
            console.log('💰 [SYNC] Getting balances...')
            console.time('⏱️ 4_GET_BALANCES');
            await app.getBalances()
            console.timeEnd('⏱️ 4_GET_BALANCES');
            console.log('✅ [SYNC] Got', app.balances.length, 'balances')
            
            // Mark full sync complete
            fullSyncTime = performance.now() - perfStart;
            console.log(`🔄 [PERFORMANCE] Time to full sync: ${fullSyncTime.toFixed(0)}ms`);
        }
        
        //clear cache
        app.events.emit('message', 'What up doc!')

        app.events.on('message', (event: any) => {
          log.info(tag,'📨 Message event: ', event)
        })

        console.log('🎯 [PERF] Starting validation phase at:', (performance.now() - perfStart).toFixed(0) + 'ms');
        console.time('⏱️ VALIDATION_ASSETS_MAP');

        // // log.info(tag,"resultInit: ",resultInit)
        // console.timeEnd('start2init');
        log.debug(tag,'🗺️ Getting assetsMap from app...')
        let assets = app.assetsMap
        log.info(tag,"📊 Total assets in assetsMap:", assets ? assets.size : 0)
        
        // Log first few assets for debugging
        if (assets && assets.size > 0) {
            log.debug(tag,"🔍 First 5 assets in map:")
            let count = 0
            for(let [caip,asset] of assets){
                if (count++ >= 5) break
                log.debug(tag,`  ${caip} -> ${asset?.symbol || 'NO_SYMBOL'} (${asset?.name || 'NO_NAME'})`)
            }
        }
        assert(assets)

        // Validate assets have required properties
        log.debug(tag,'🔍 Validating asset properties...')
        for(let [caip,asset] of assets){
            if (!asset) {
                log.error(tag,`❌ Null asset found for CAIP: ${caip}`)
                continue
            }
            if (!caip) {
                log.error(tag,`❌ Null CAIP found for asset: ${asset}`)
                continue  
            }
            if (!asset.caip) {
                log.warn(tag,`⚠️ Asset missing caip property: ${caip}`, asset)
            }
        }
        log.info(tag,' ****** Assets Map Loaded Successfully ******')
        
        console.timeEnd('⏱️ VALIDATION_ASSETS_MAP');
        console.log('🎯 [PERF] Assets map validation completed at:', (performance.now() - perfStart).toFixed(0) + 'ms');
        console.time('⏱️ VALIDATION_PUBKEYS');
        
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

        let pubkeys = app.pubkeys
        log.info(tag,"📊 Total pubkeys retrieved: ",pubkeys.length)
        log.debug(tag,"🔍 First 3 pubkeys for debugging:", pubkeys.slice(0, 3))
        assert(pubkeys)
        assert(pubkeys[0])
        
        // Detailed pubkey validation with logging
        for(let i = 0; i < pubkeys.length; i++){
            let pubkey = pubkeys[i]
            log.debug(tag,`🔑 Validating pubkey ${i}/${pubkeys.length}:`, {
                path: pubkey.path,
                type: pubkey.type,
                scriptType: pubkey.scriptType,
                networks: pubkey.networks,
                pubkey: pubkey.pubkey?.substring(0, 10) + '...' // Show first 10 chars only
            })
            
            try {
                assert(pubkey.pubkey)
                assert(pubkey.type)
                assert(pubkey.path)
                assert(pubkey.scriptType)
                assert(pubkey.networks)
                assert(pubkey.networks[0])
            } catch (error) {
                log.error(tag, `❌ Pubkey validation failed for index ${i}:`, pubkey)
                throw error
            }
        }
        
        log.info(tag,'✅ All pubkeys validated successfully')
        
        // Path validation with detailed logging
        assert(app.paths)
        log.info(tag,`📊 Total paths to validate: ${app.paths.length}`)
        
        for(let i = 0; i < app.paths.length; i++){
            let path = app.paths[i]
            log.debug(tag,`🛤️ Validating path ${i}/${app.paths.length}:`, {
                addressNList: path.addressNList,
                networks: path.networks
            })
            
            let bip32Path = addressNListToBIP32(path.addressNList)
            log.debug(tag,`   BIP32 path: ${bip32Path}`)
            
            let pubkey = app.pubkeys.find((pubkey:any) => pubkey.path === bip32Path)
            if (!pubkey) {
                log.error(tag,`❌ No pubkey found for path: ${bip32Path}`)
                log.error(tag,`   Available pubkey paths:`, app.pubkeys.map((p:any) => p.path))
            }
            assert(pubkey)
        }
        log.info(tag,' ****** Validate Path exists for every path * PASS * ******')

        // //validate pubkeys
        for(let i = 0; i < app.pubkeys.length; i++){
            let pubkey = app.pubkeys[i]
            log.debug(tag,"pubkey: ",pubkey)
            assert(pubkey)
            assert(pubkey.pubkey)
            // log.info(tag,'pubkey: ',pubkey)
            assert(pubkey.type)
        }
        log.info(tag,' ****** Validate Pubkeys Properties exist * PASS * ******')

        console.timeEnd('start2Pubkeys');
        log.info(tag,'app.pubkeys.length: ',app.pubkeys.length)
        log.info(tag,'app.paths.length: ',app.paths.length)
        // if(app.pubkeys.length !== app.paths.length) throw Error('Missing pubkeys! failed to sync')


        tag = tag + " | checkpoint1 | "

        log.info(tag,'🔍 Starting blockchain asset validation...')
        for(let i = 0; i < blockchains.length; i++){
            let blockchain = blockchains[i]
            log.debug(tag,`🔗 Validating blockchain ${i+1}/${blockchains.length}: ${blockchain}`)

            //
            if(blockchain.indexOf('eip155') >= 0){
                //check for gas asset in asset map
                let caip = blockchain + "/slip44:60"
                log.debug(tag,'  📍 EVM chain - checking for gas asset with CAIP:',caip)
                let asset = assets.get(caip)
                log.debug(tag,'  💎 Asset found:',asset ? 'YES' : 'NO', asset ? {
                    name: asset.name,
                    symbol: asset.symbol,
                    decimal: asset.decimal
                } : null)
                assert(asset)
                assert(app.assetsMap.get(caip))

                let assetInfo = app.assetsMap.get(caip)
                log.debug(tag,'  ℹ️ AssetInfo verified:', !!assetInfo)
                assert(assetInfo)
            }

            let chain = NetworkIdToChain[blockchain]
            log.debug(tag, '  🏷️ Chain name:',chain)
            assert(chain)
            
            let caip = shortListSymbolToCaip[chain]
            log.debug(tag, '  📍 Native asset CAIP:',caip)
            assert(caip)
            
            let nativeAsset = assets.get(caip)
            if (!nativeAsset) {
                log.error(tag,`  ❌ Missing native asset for chain ${chain} with CAIP ${caip}`)
                log.debug(tag,'  Available assets:', Array.from(assets.keys() as IterableIterator<string>).filter(k => k.includes(blockchain)))
            }
            assert(assets.get(caip))

            //should be a balance for every gas asset
            log.debug(tag,`  💰 Checking for balance with CAIP: ${caip}`)
            const balanceNative = app.balances.find((balance:any) => balance.caip === caip);
            if(!balanceNative) {
                log.error(tag,`  ❌ Missing Balance for chain ${chain} CAIP: ${caip}`)
                log.debug(tag,'  Available balances for this chain:', 
                    app.balances.filter((b:any) => b.networkId === blockchain).map((b:any) => ({
                        caip: b.caip,
                        balance: b.balance
                    }))
                )
            }
            assert(balanceNative)
            log.debug(tag,"  ✅ Balance found:",{
                caip: balanceNative.caip,
                balance: balanceNative.balance,
                networkId: balanceNative.networkId
            })

            //validate we can set context
            await app.setAssetContext({caip:balanceNative.caip})

        }
        log.info(tag,' ****** Validated Assets for each chain exist bro ******')

        //Generate comprehensive PDF reports for all chains
        console.log('📊 [REPORT GENERATION] Starting comprehensive PDF report generation...');
        console.time('⏱️ REPORT_GENERATION');
        
        // Import the PDF report generator
        const { PDFReportGenerator } = await import('./pdf-report-generator');
        const reportGenerator = new PDFReportGenerator('./src/reports');
        
        // Generate individual reports for each chain with balances
        const chainReports: any[] = [];
        const reportPromises: Promise<any>[] = [];
        
        console.log(`📈 [REPORT] Processing ${app.balances.length} assets for report generation...`);
        
        // Group balances by chain/symbol for more organized reports
        const balancesByChain = new Map();
        for (const balance of app.balances) {
          const symbol = balance.symbol || 'UNKNOWN';
          if (!balancesByChain.has(symbol)) {
            balancesByChain.set(symbol, []);
          }
          balancesByChain.get(symbol).push(balance);
        }
        
        console.log(`📊 [REPORT] Found ${balancesByChain.size} unique chains/symbols`);
        
        // Generate reports for each chain
        for (const [symbol, balances] of balancesByChain) {
          if (balances.length === 0) continue;
          
          // Use the first balance as the representative asset context
          const primaryBalance = balances[0];
          
          // Create a comprehensive asset context
          const assetContext = {
            symbol: symbol,
            networkId: primaryBalance.networkId,
            balance: primaryBalance.balance,
            value: primaryBalance.valueUsd || 0,
            pubkeys: app.pubkeys.filter((pk: any) => pk.networks && pk.networks.includes(primaryBalance.networkId))
          };
          
          console.log(`📋 [REPORT] Generating report for ${symbol} (${primaryBalance.networkId})`);
          
          // Generate report data
          const reportPromise = reportGenerator.generateReportData(app, assetContext, 3)
            .then(async (reportData) => {
              // Save as JSON for debugging
              await reportGenerator.saveReportDataAsJSON(reportData, `${symbol}_report_${new Date().toISOString().split('T')[0]}`);
              
              // Generate text report
              await reportGenerator.generateTextReport(reportData, `${symbol}_report_${new Date().toISOString().split('T')[0]}`);
              
              console.log(`✅ [REPORT] Generated report for ${symbol}: ${reportData.summary.totalAccounts} accounts, ${reportData.summary.totalBalance} balance`);
              
              return reportData;
            })
            .catch((error) => {
              console.error(`❌ [REPORT] Failed to generate report for ${symbol}:`, error.message);
              return null;
            });
          
          reportPromises.push(reportPromise);
        }
        
        // Wait for all individual reports to complete
        console.log(`⏳ [REPORT] Waiting for ${reportPromises.length} reports to complete...`);
        const completedReports = await Promise.all(reportPromises);
        
        // Filter out failed reports
        const validReports = completedReports.filter(report => report !== null);
        console.log(`✅ [REPORT] Successfully generated ${validReports.length} individual reports`);
        
        if (validReports.length > 0) {
          // Generate combined portfolio report
          console.log('📚 [COMBINED REPORT] Generating combined portfolio report...');
          try {
            const combinedReportPath = await reportGenerator.generateCombinedReport(
              validReports, 
              `portfolio_report_${new Date().toISOString().split('T')[0]}`
            );
            console.log(`🎉 [COMBINED REPORT] Successfully generated combined report: ${combinedReportPath}`);
            
            // Also save the combined data as JSON
            const combinedData = {
              generatedAt: new Date().toISOString(),
              totalChains: validReports.length,
              summary: {
                totalAccounts: validReports.reduce((sum, r) => sum + r.summary.totalAccounts, 0),
                totalValueUsd: validReports.reduce((sum, r) => sum + (r.summary.totalValueUsd || 0), 0),
                totalTransactions: validReports.reduce((sum, r) => sum + (r.summary.totalTransactions || 0), 0),
                totalAddresses: validReports.reduce((sum, r) => sum + (r.summary.totalAddresses || 0), 0)
              },
              reports: validReports
            };
            
            await reportGenerator.saveReportDataAsJSON(
              combinedData as any, 
              `portfolio_combined_${new Date().toISOString().split('T')[0]}`
            );
            
          } catch (error: any) {
            console.error('❌ [COMBINED REPORT] Failed to generate combined report:', error.message);
          }
        }
        
        console.timeEnd('⏱️ REPORT_GENERATION');
        console.log(`🎯 [PERF] Report generation completed at: ${(performance.now() - perfStart).toFixed(0)}ms`);
        
        // Performance analysis
        if (firstPortfolioTime && fullSyncTime) {
            const improvement = ((fullSyncTime - firstPortfolioTime) / fullSyncTime * 100);
            console.log(`💰 Portfolio available ${improvement.toFixed(1)}% faster than full sync`);
        }
        console.log('📊 =========================================================');
        
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
