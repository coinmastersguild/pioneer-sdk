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
// let spec = 'http://127.0.0.1:9001/spec/swagger.json'
// Use local kkcli-v2 server for testing
let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
// const DB = require('@coinmasters/pioneer-db-sql');
console.log("spec: ",spec)



let txid:string
let IS_SIGNED: boolean



const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        console.log('🚀 [DEBUG] Starting integration test with enhanced logging...')
        console.log('🚀 [DEBUG] Looking for "verified" logs during execution...')
        // const pioneerDB = new DB.DB({ });
        // await pioneerDB.init();

        //(tag,' CHECKPOINT 1');
        console.time('start2init');
        console.time('start2pair');
        console.time('start2Pubkeys');
        console.time('start2BalancesGas');
        console.time('start2BalancesTokens');
        console.time('start2end');

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
            // Use local fixed keepkey-vault server for device operations
            keepkeyEndpoint: 'http://127.0.0.1:1647',
            paths,
            blockchains,
            nodes,
            pubkeys:[],
            balances:[],
        };

        //console.log(tag,' CHECKPOINT 2');
        //console.log(tag,' config: ',config);
        
        // Log the actual WebSocket URL being used
        log.info(tag, '🌐 WebSocket URL configured:', config.wss)
        console.log('🚀 [DEBUG] WebSocket URL:', config.wss)
        console.log('🚀 [DEBUG] KeepKey API Key configured:', config.keepkeyApiKey ? 'YES' : 'NO')
        
        let app = new SDK.SDK(spec,config)
        log.debug('app: ',app.spec)
        assert(app.spec)
        assert(app.spec,spec)

        // Add detailed init logging
        log.debug(tag, '🔍 Starting app.init()...')
        console.log('🚀 [DEBUG] About to call app.init()...')
        console.log('🚀 [DEBUG] Config passed to app:', JSON.stringify({
            ...config,
            keepkeyApiKey: config.keepkeyApiKey ? '***REDACTED***' : 'NOT_SET'
        }, null, 2))
        
        // Add timeout for init
        const initTimeout = setTimeout(() => {
            console.error('🚀 [DEBUG] ⏰ app.init() seems to be hanging for more than 60 seconds!')
            console.error('🚀 [DEBUG] This might indicate a device connection issue')
            console.error('🚀 [DEBUG] WebSocket URL attempted:', config.wss)
            console.error('🚀 [DEBUG] Spec URL attempted:', spec)
        }, 60000)
        
        let resultInit
        try {
            resultInit = await app.init({ } , {})
            clearTimeout(initTimeout)
            console.log('🚀 [DEBUG] ✅ app.init() completed!')
            console.log('🚀 [DEBUG] Init result:', resultInit)
        } catch (error) {
            clearTimeout(initTimeout)
            const err = error as Error
            console.error('🚀 [DEBUG] ❌ app.init() failed with error:', error)
            console.error('🚀 [DEBUG] Error details:')
            console.error('🚀 [DEBUG]   - Message:', err.message || 'Unknown error')
            console.error('🚀 [DEBUG]   - Stack:', err.stack || 'No stack trace')
            console.error('🚀 [DEBUG]   - WebSocket URL:', config.wss)
            console.error('🚀 [DEBUG]   - Spec URL:', spec)
            console.error('🚀 [DEBUG]   - KeepKey API Key configured:', !!config.keepkeyApiKey)
            throw error
        }
        
        log.info(tag,' ****** Init Complete ******')
        log.debug(tag, '🔍 Init result:', resultInit)
        // log.info('apiKey: ',app);
        log.info('apiKey: ',app.keepkeyApiKey);

        // Add event handlers for debugging
        app.events.on('device:connected', (device: any) => {
          log.info(tag,'🔌 Device connected event:', device)
          console.log('🚀 [DEBUG] Device connected:', device)
        })
        
        app.events.on('device:error', (error: any) => {
          log.error(tag,'❌ Device error event:', error)
          console.error('🚀 [DEBUG] Device error:', error)
        })
        
        app.events.on('pubkey:discovered', (pubkey: any) => {
          log.debug(tag,'🔑 Pubkey discovered:', pubkey.path, pubkey.networks)
          console.log('🚀 [DEBUG] Pubkey discovered:', pubkey.path, pubkey.networks)
        })
        
        app.events.on('balance:discovered', (balance: any) => {
          log.debug(tag,'💰 Balance discovered:', balance.caip, balance.balance)
          console.log('🚀 [DEBUG] Balance discovered:', balance.caip, balance.balance)
        })
        
        // Add more event listeners to catch any other events
        app.events.on('*', (eventName: string, ...args: any[]) => {
          if (!['message', 'device:connected', 'device:error', 'pubkey:discovered', 'balance:discovered'].includes(eventName)) {
            console.log('🚀 [DEBUG] Unknown event:', eventName, args)
          }
        })
        
        //force verify with debugging
        log.debug(tag, '🔍 Starting getGasAssets()...')
        console.log('🚀 [DEBUG] About to call app.getGasAssets()...')
        
        const gasTimeout = setTimeout(() => {
            console.error('🚀 [DEBUG] ⏰ getGasAssets() hanging for more than 15 seconds!')
        }, 15000)
        
        try {
            await app.getGasAssets()
            clearTimeout(gasTimeout)
            console.log('🚀 [DEBUG] ✅ getGasAssets() completed!')
            console.log('🚀 [DEBUG] Assets map size:', app.assetsMap ? app.assetsMap.size : 0)
        } catch (error) {
            clearTimeout(gasTimeout)
            console.error('🚀 [DEBUG] ❌ getGasAssets() failed:', error)
            throw error
        }
        
        log.debug(tag, '✅ getGasAssets() complete')
        
        log.debug(tag, '🔍 Starting getPubkeys()...')
        console.log('🚀 [DEBUG] About to call app.getPubkeys()...')
        console.log('🚀 [DEBUG] Current app.paths length:', app.paths.length)
        console.log('🚀 [DEBUG] Current app.blockchains:', app.blockchains)
        console.log('🚀 [DEBUG] KeepKey SDK status:', app.keepKeySdk ? 'INITIALIZED' : 'NOT_INITIALIZED')
        
        try {
            await app.getPubkeys()
            console.log('🚀 [DEBUG] ✅ getPubkeys() completed successfully!')
            console.log('🚀 [DEBUG] Final pubkeys count:', app.pubkeys.length)
        } catch (error) {
            console.error('🚀 [DEBUG] ❌ getPubkeys() failed with error:', error)
            throw error
        }
        
        log.debug(tag, '✅ getPubkeys() complete, pubkeys count:', app.pubkeys.length)
        
        log.debug(tag, '🔍 Starting getBalances()...')
        console.log('🚀 [DEBUG] About to call app.getBalances()...')
        console.log('🚀 [DEBUG] Current pubkeys available for balances:', app.pubkeys.length)
        console.log('🚀 [DEBUG] Networks to get balances for:', app.blockchains)
        
        // Add timeout detection
        const balanceTimeout = setTimeout(() => {
            console.error('🚀 [DEBUG] ⏰ getBalances() seems to be hanging for more than 30 seconds!')
            console.error('🚀 [DEBUG] This might indicate a network issue or API problem')
        }, 30000)
        
        try {
            await app.getBalances()
            clearTimeout(balanceTimeout)
            console.log('🚀 [DEBUG] ✅ getBalances() completed successfully!')
            console.log('🚀 [DEBUG] Final balances count:', app.balances.length)
        } catch (error) {
            clearTimeout(balanceTimeout)
            console.error('🚀 [DEBUG] ❌ getBalances() failed with error:', error)
            throw error
        }
        
        log.debug(tag, '✅ getBalances() complete, balances count:', app.balances.length)
        
        //clear cache
        app.events.emit('message', 'What up doc!')

        app.events.on('message', (event: any) => {
          log.info(tag,'📨 Message event: ', event)
        })

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
        }
        log.info(tag,' ****** Validated Assets for each chain exist ******')


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

        log.info(tag,"balances: ",app.balances.length)
        log.info(tag,"balances: ",app.balances.length)

        for(let i = 0; i < app.balances.length; i++){
            let balance = app.balances[i]
            log.info(tag,"balance: ",balance.caip)
            assert(balance)
            assert(balance.balance)
            assert(balance.caip)
            assert(balance.networkId)
            assert(balance.icon)
            if(balance.identifier.includes('keepkey')){
                throw Error('Invalid legacy identifier found: '+balance.identifier)
            }
        }
        console.timeEnd('start2BalancesGas');

        tag = tag + " | checkpoint3 | "
        log.debug(tag,'balances: ',app.balances)

        await app.getCharts()
        //expect at least 1 token
        log.debug(tag,'balances: ',app.balances)
        log.debug(tag,'balances: ',app.balances.length)

        //Analyitics
        let totalValueUsd = 0;
        let networkTotals:any = {}; // Object to hold totals by networkId

        const seenIdentifiers = new Set<string>(); // Track seen identifiers
        for (let i = 0; i < app.balances.length; i++) {
            let balance = app.balances[i];
            // log.info(tag, "balance: ", balance);
            // Check for duplicate identifier
            if (seenIdentifiers.has(balance.identifier)) {
                throw new Error(`Duplicate identifier found: ${balance.identifier}`);
            }
            seenIdentifiers.add(balance.identifier);

            // Check if balance, caip, and valueUsd are valid
            assert(balance);
            assert(balance.networkId);
            assert(balance.caip);

            // Parse valueUsd as a float
            let valueUsd = parseFloat(balance.valueUsd);
            if (isNaN(valueUsd)) {
                log.warn(tag, `Skipping balance with invalid valueUsd: ${balance.valueUsd}`);
                continue; // Skip balances with invalid valueUsd
            }

            // Add to total value
            totalValueUsd += valueUsd;

            // Log networkId and valueUsd for each balance
            //log.info(tag, `Processing balance with networkId: ${balance.caip}, valueUsd: ${valueUsd}`);

            // Ensure networkId exists and accumulate by networkId
            if (balance.networkId) {
                if (!networkTotals[balance.networkId]) {
                    networkTotals[balance.networkId] = 0; // Initialize if not already present
                }
                networkTotals[balance.networkId] += valueUsd; // Add value to network-specific total
            } else {
                log.warn(tag, `Skipping balance without networkId: ${JSON.stringify(balance)}`);
            }
        }

        log.info(tag, 'totalValueUsd: ', totalValueUsd);
        log.info(tag, 'networkTotals: ', networkTotals);
        log.info(tag,'dashboard', app.dashboard);

        // Test Direct Cosmos Delegation APIs
        log.info(tag, ' ****** Testing Direct Cosmos Delegation APIs ******')
        
        // Find cosmos pubkeys for direct API testing
        const cosmosApiPubkeys = app.pubkeys.filter((pubkey: any) => 
            pubkey.networks.some((n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'))
        );
        
        if (cosmosApiPubkeys.length > 0) {
            log.info(tag, `Found ${cosmosApiPubkeys.length} cosmos pubkeys for delegation testing`);
            
            for (const cosmosPubkey of cosmosApiPubkeys) {
                if (cosmosPubkey.address) {
                    log.info(tag, `Testing delegation APIs for address: ${cosmosPubkey.address}`);
                    
                    // Find the cosmos networks this pubkey supports
                    const cosmosNetworks = cosmosPubkey.networks.filter((n: string) => 
                        n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis')
                    );
                    
                    for (const networkId of cosmosNetworks) {
                        if (app.blockchains.includes(networkId)) {
                            log.info(tag, `Testing ${networkId} delegation APIs for ${cosmosPubkey.address}`);
                            
                            try {
                                // Test getDelegations API
                                log.info(tag, `Calling app.pioneer.GetDelegations for ${networkId}...`);
                                
                                // Note: GetDelegations requires a validator parameter, but we're testing GetStakingPositions
                                // which gets all delegations. Skipping GetDelegations test for now.
                                log.info(tag, `Skipping GetDelegations test (requires validator parameter)`);
                                
                                // Test getStakingPositions API
                                log.info(tag, `Calling app.pioneer.GetStakingPositions for ${networkId}...`);
                                
                                // Convert networkId to network name for API
                                let network;
                                if (networkId === 'cosmos:cosmoshub-4') {
                                    network = 'cosmos';
                                } else if (networkId === 'cosmos:osmosis-1') {
                                    network = 'osmosis';
                                } else {
                                    log.error(tag, `Unsupported networkId for staking: ${networkId}`);
                                    continue;
                                }
                                
                                const stakingResponse = await app.pioneer.GetStakingPositions({
                                    network: network,
                                    address: cosmosPubkey.address
                                });
                                
                                if (stakingResponse && stakingResponse.data) {
                                    log.info(tag, `✅ GetStakingPositions SUCCESS: Found ${stakingResponse.data.length} staking positions`);
                                    
                                    // Analyze position types
                                    const positionTypes: { [key: string]: number } = {};
                                    let totalStakingValue = 0;
                                    
                                    for (const position of stakingResponse.data) {
                                        if (!positionTypes[position.type]) {
                                            positionTypes[position.type] = 0;
                                        }
                                        positionTypes[position.type]++;
                                        
                                        const valueUsd = parseFloat(position.valueUsd) || 0;
                                        totalStakingValue += valueUsd;
                                        
                                        log.debug(tag, `  ${position.type} position:`, {
                                            balance: position.balance,
                                            ticker: position.ticker || position.symbol,
                                            valueUsd: position.valueUsd,
                                            validator: position.validator,
                                            status: position.status
                                        });
                                    }
                                    
                                    log.info(tag, `  📊 Position Summary: ${JSON.stringify(positionTypes)}`);
                                    log.info(tag, `  💰 Total Staking Value: $${totalStakingValue.toFixed(2)}`);
                                    
                                    // Validate position structure
                                    for (const position of stakingResponse.data) {
                                        // DEBUG: Log the actual position structure
                                        log.info(tag, `🔍 DEBUG: Raw position data from API:`, JSON.stringify(position, null, 2));
                                        
                                        assert(position.type, 'Position must have type');
                                        assert(position.balance, 'Position must have balance');
                                        assert(position.networkId, 'Position must have networkId');
                                        assert(position.caip, 'Position must have caip');
                                        
                                        // CRITICAL TEST: Check for validator information
                                        if (position.type === 'delegation') {
                                            log.info(tag, `🔍 DEBUG: Checking delegation position for validator info:`, {
                                                type: position.type,
                                                validator: position.validator,
                                                validatorAddress: position.validatorAddress,
                                                validatorMoniker: position.validatorMoniker,
                                                validatorName: position.validatorName,
                                                allKeys: Object.keys(position)
                                            });
                                            
                                            // Check all possible validator field names
                                            const hasValidatorInfo = position.validator || 
                                                                   position.validatorAddress || 
                                                                   position.validatorMoniker || 
                                                                   position.validatorName;
                                            
                                            if (!hasValidatorInfo) {
                                                log.error(tag, `❌ CRITICAL FAILURE: Delegation position missing validator information!`);
                                                log.error(tag, `Position data:`, position);
                                                throw new Error(`CRITICAL: Delegation position missing validator information. This will cause "Unknown Validator" in UI and prevent undelegation.`);
                                            }
                                            
                                            log.info(tag, `✅ Delegation position has validator info: ${hasValidatorInfo}`);
                                        }
                                        
                                        if (position.type === 'reward') {
                                            const hasValidatorInfo = position.validator || 
                                                                   position.validatorAddress || 
                                                                   position.validatorMoniker || 
                                                                   position.validatorName;
                                            
                                            if (!hasValidatorInfo) {
                                                log.error(tag, `❌ CRITICAL FAILURE: Reward position missing validator information!`);
                                                log.error(tag, `Position data:`, position);
                                                throw new Error(`CRITICAL: Reward position missing validator information. This will cause "Unknown Validator" in UI and prevent reward claiming.`);
                                            }
                                        }
                                    }
                                    
                                    log.info(tag, `✅ All staking positions validated for ${networkId}`);
                                } else {
                                    log.info(tag, `ℹ️ GetStakingPositions: No staking positions found for ${cosmosPubkey.address} on ${networkId}`);
                                }
                                
                            } catch (error) {
                                log.error(tag, `❌ Error testing delegation APIs for ${networkId}:`, error);
                                // Don't throw here, continue with other networks
                            }
                        }
                    }
                }
            }
        } else {
            log.info(tag, 'ℹ️ No cosmos pubkeys found - skipping delegation API tests');
        }
        
        log.info(tag, ' ****** Direct Cosmos Delegation API Tests Complete ******');

        // Test Cosmos Staking Positions Integration
        log.info(tag, ' ****** Testing Cosmos Staking Positions Integration ******')
        
        // Find cosmos pubkeys for staking tests
        const cosmosPubkeys = app.pubkeys.filter((pubkey: any) => 
            pubkey.networks.some((n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'))
        );
        
        if (cosmosPubkeys.length > 0) {
            log.info(tag, `Found ${cosmosPubkeys.length} cosmos pubkeys for staking tests`);
            
            // Test staking positions for each cosmos pubkey
            for (const cosmosPubkey of cosmosPubkeys) {
                if (cosmosPubkey.address) {
                    log.info(tag, `Testing staking positions for address: ${cosmosPubkey.address}`);
                    
                    // Check if we have staking positions in balances
                    const stakingBalances = app.balances.filter((balance: any) => 
                        balance.pubkey === cosmosPubkey.address && 
                        balance.chart === 'staking'
                    );
                    
                    if (stakingBalances.length > 0) {
                        log.info(tag, `✅ Found ${stakingBalances.length} staking positions in balances`);
                        
                        // Analyze staking positions
                        let totalStakingValue = 0;
                        const stakingTypes: { [key: string]: number } = {};
                        
                        for (const stakingBalance of stakingBalances) {
                            log.debug(tag, `Staking position:`, {
                                type: stakingBalance.type,
                                balance: stakingBalance.balance,
                                ticker: stakingBalance.ticker,
                                valueUsd: stakingBalance.valueUsd,
                                validator: stakingBalance.validator,
                                status: stakingBalance.status
                            });
                            
                            // Validate staking position properties
                            assert(stakingBalance.type, 'Staking position must have type');
                            assert(stakingBalance.balance, 'Staking position must have balance');
                            assert(stakingBalance.ticker, 'Staking position must have ticker');
                            assert(stakingBalance.networkId, 'Staking position must have networkId');
                            assert(stakingBalance.caip, 'Staking position must have caip');
                            assert(stakingBalance.chart === 'staking', 'Chart type must be staking');
                            
                            // Accumulate totals
                            const valueUsd = parseFloat(stakingBalance.valueUsd) || 0;
                            totalStakingValue += valueUsd;
                            
                            // Count by type
                            if (!stakingTypes[stakingBalance.type]) {
                                stakingTypes[stakingBalance.type] = 0;
                            }
                            stakingTypes[stakingBalance.type]++;
                        }
                        
                        log.info(tag, `📊 Staking Analysis for ${cosmosPubkey.address}:`);
                        log.info(tag, `  Total Staking Value: $${totalStakingValue.toFixed(2)}`);
                        log.info(tag, `  Position Types:`, stakingTypes);
                        
                        // Verify staking positions are included in total portfolio value
                        const originalTotalValue = totalValueUsd;
                        log.info(tag, `  Portfolio includes staking value: ${originalTotalValue >= totalStakingValue ? '✅' : '❌'}`);
                        
                        // Test specific staking position types
                        if (stakingTypes['delegation']) {
                            log.info(tag, `  ✅ Found ${stakingTypes['delegation']} delegation positions`);
                        }
                        if (stakingTypes['reward']) {
                            log.info(tag, `  ✅ Found ${stakingTypes['reward']} reward positions`);
                        }
                        if (stakingTypes['unbonding']) {
                            log.info(tag, `  ✅ Found ${stakingTypes['unbonding']} unbonding positions`);
                        }
                        
                    } else {
                        log.info(tag, `ℹ️ No staking positions found for ${cosmosPubkey.address} (this is normal if no staking activity)`);
                    }
                }
            }
        } else {
            log.info(tag, 'ℹ️ No cosmos pubkeys found - skipping staking position tests');
        }
        
        // Verify staking positions have market pricing
        const stakingPositions = app.balances.filter((balance: any) => balance.chart === 'staking');
        if (stakingPositions.length > 0) {
            log.info(tag, ' ****** Testing Staking Position Market Pricing ******');
            
            for (const position of stakingPositions) {
                log.debug(tag, `Checking pricing for ${position.type} position:`, {
                    ticker: position.ticker,
                    balance: position.balance,
                    priceUsd: position.priceUsd,
                    valueUsd: position.valueUsd
                });
                
                // Verify pricing data exists
                if (position.priceUsd && position.priceUsd > 0) {
                    log.info(tag, `✅ ${position.ticker} has market price: $${position.priceUsd}`);
                    
                    // Verify value calculation
                    const expectedValue = parseFloat(position.balance) * parseFloat(position.priceUsd);
                    const actualValue = parseFloat(position.valueUsd);
                    const tolerance = 0.01; // 1 cent tolerance
                    
                    if (Math.abs(expectedValue - actualValue) <= tolerance) {
                        log.info(tag, `✅ ${position.ticker} value calculation correct: $${actualValue.toFixed(2)}`);
                    } else {
                        log.warn(tag, `⚠️ ${position.ticker} value calculation mismatch: expected $${expectedValue.toFixed(2)}, got $${actualValue.toFixed(2)}`);
                    }
                } else {
                    log.warn(tag, `⚠️ ${position.ticker} missing market price data`);
                }
            }
        }
        
        log.info(tag, ' ****** Cosmos Staking Integration Tests Complete ******');

        // CRITICAL TEST: Verify delegation positions exist in app.balances
        log.info(tag, ' ****** Testing Delegation Positions in app.balances ******');
        
        // Check for any staking positions with chart: 'staking' in app.balances
        const allStakingPositions = app.balances.filter((balance: any) => balance.chart === 'staking');
        log.info(tag, `Total staking positions found in app.balances: ${allStakingPositions.length}`);
        
        if (allStakingPositions.length === 0) {
            // Check if we have cosmos pubkeys - if we do but no staking positions, that's an issue
            const cosmosAddresses = app.pubkeys.filter((pubkey: any) => 
                pubkey.networks.some((n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'))
            );
            
            if (cosmosAddresses.length > 0) {
                log.error(tag, `❌ CRITICAL FAILURE: Found ${cosmosAddresses.length} cosmos addresses but NO staking positions in app.balances!`);
                log.error(tag, `This indicates that getCharts() is not properly populating staking positions.`);
                log.error(tag, `Cosmos addresses found:`, cosmosAddresses.map((p: any) => p.address));
                
                // This is a critical failure - the whole point of the fix was to get staking positions
                throw new Error(`CRITICAL TEST FAILURE: No staking positions found in app.balances despite having ${cosmosAddresses.length} cosmos addresses. The getCharts() integration is broken.`);
            } else {
                log.info(tag, `ℹ️ No cosmos addresses found, so no staking positions expected.`);
            }
        } else {
            log.info(tag, `✅ SUCCESS: Found ${allStakingPositions.length} staking positions in app.balances!`);
            
            // Log details of found staking positions
            const delegationPositions = allStakingPositions.filter((p: any) => p.type === 'delegation');
            const rewardPositions = allStakingPositions.filter((p: any) => p.type === 'reward');
            const unbondingPositions = allStakingPositions.filter((p: any) => p.type === 'unbonding');
            
            log.info(tag, `  📊 Delegation positions: ${delegationPositions.length}`);
            log.info(tag, `  💰 Reward positions: ${rewardPositions.length}`);
            log.info(tag, `  ⏳ Unbonding positions: ${unbondingPositions.length}`);
            
            // Log first few positions for verification
            for (let i = 0; i < Math.min(allStakingPositions.length, 3); i++) {
                const pos = allStakingPositions[i];
                log.info(tag, `  Position ${i + 1}:`, {
                    type: pos.type,
                    ticker: pos.ticker,
                    balance: pos.balance,
                    valueUsd: pos.valueUsd,
                    validator: pos.validator,
                    networkId: pos.networkId
                });
            }
        }
        
        log.info(tag, ' ****** Delegation Positions Test Complete ******');

        // Test blockchain reconfiguration to Bitcoin only
        log.info(tag, ' ****** Testing Blockchain Reconfiguration to Bitcoin Only ******')
        
        // Save initial state for comparison
        const initialBlockchains = [...app.blockchains]
        const initialPubkeys = [...app.pubkeys]
        const initialBalances = [...app.balances]
        
        // Reconfigure to Bitcoin only
        const bitcoinOnly = ['bip122:000000000019d6689c085ae165831e93']  // Bitcoin mainnet networkId
        console.log('🚀 [DEBUG] Setting blockchains to Bitcoin only...')
        await app.setBlockchains(bitcoinOnly)
        
        // Force sync to update all state
        console.log('🚀 [DEBUG] About to call app.sync() for Bitcoin-only config...')
        const syncTimeout = setTimeout(() => {
            console.error('🚀 [DEBUG] ⏰ app.sync() hanging for more than 45 seconds!')
            console.error('🚀 [DEBUG] This might indicate device communication issues')
        }, 45000)
        
        try {
            await app.sync()
            clearTimeout(syncTimeout)
            console.log('🚀 [DEBUG] ✅ app.sync() completed for Bitcoin-only!')
        } catch (error) {
            clearTimeout(syncTimeout)
            console.error('🚀 [DEBUG] ❌ app.sync() failed:', error)
            throw error
        }
        
        // Verify blockchain configuration
        assert.strictEqual(app.blockchains.length, 1, 'Should only have one blockchain configured')
        assert.strictEqual(app.blockchains[0], bitcoinOnly[0], 'Should be configured for Bitcoin only')
        
        // Verify that we have at least one Bitcoin pubkey
        const bitcoinPubkeys = app.pubkeys.filter((pubkey: { networks: string[] }) => 
            pubkey.networks.includes(bitcoinOnly[0])
        );
        assert(bitcoinPubkeys.length > 0, 'Should have at least one Bitcoin pubkey')
        
        // Log pubkey information for debugging
        log.info(tag, 'Bitcoin pubkeys:', bitcoinPubkeys.map((p: { networks: string[], pubkey: string }) => ({ 
            networks: p.networks,
            pubkey: p.pubkey
        })))
        
        // Verify balances are only for Bitcoin
        const bitcoinBalances = app.balances.filter((balance: { networkId: string; caip: string }) => 
            balance.networkId === bitcoinOnly[0] || 
            balance.caip.toLowerCase().startsWith('bip122:000000000019d6689c085ae165831e93')
        );
        assert(bitcoinBalances.length > 0, 'Should have at least one Bitcoin balance')
        
        // Verify dashboard reflects Bitcoin only
        assert(app.dashboard.networks.length === 1, 'Dashboard should only show one network')
        assert(app.dashboard.networks[0].networkId === bitcoinOnly[0], 'Dashboard network should be Bitcoin')
        
        log.info(tag, ' ****** Successfully Verified Bitcoin-Only Configuration ******')
        
        // Log the changes
        log.info(tag, 'Blockchains reduced from', initialBlockchains.length, 'to', app.blockchains.length)
        log.info(tag, 'Bitcoin pubkeys found:', bitcoinPubkeys.length)
        log.info(tag, 'Bitcoin balances found:', bitcoinBalances.length)

        console.log("************************* TEST PASS *************************")
        console.timeEnd('start2end');
        
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
