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
let spec = 'https://pioneers.dev/spec/swagger.json'
// let spec = 'http://127.0.0.1:9001/spec/swagger.json'
// const DB = require('@coinmasters/pioneer-db-sql');
console.log("spec: ",spec)



let txid:string
let IS_SIGNED: boolean



const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
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
            wss:'ws://127.0.0.1:9001',
            keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
            paths,
            blockchains,
            nodes,
            pubkeys:[],
            balances:[],
        };

        //console.log(tag,' CHECKPOINT 2');
        //console.log(tag,' config: ',config);
        let app = new SDK.SDK(spec,config)
        log.debug('app: ',app.spec)
        assert(app.spec)
        assert(app.spec,spec)

        let resultInit = await app.init({ } , {})
        log.info(tag,' ****** Init Complete ******')
        // log.info('apiKey: ',app);
        log.info('apiKey: ',app.keepkeyApiKey);

        //force verify
        // await app.getGasAssets()
        // await app.getPubkeys()
        // await app.getBalances()
        //clear cache
        app.events.emit('message', 'What up doc!')

        app.events.on('message', (event: any) => {
          log.info(tag,'event: ', event)
        })

        // // log.info(tag,"resultInit: ",resultInit)
        // console.timeEnd('start2init');
        let assets = app.assetsMap
        // log.info(tag,"assets: START: ",assets)
        assert(assets)
        //
        // // //iterate over each asset
        // for(let [caip,asset] of assets){
        //     // log.info(tag,"asset: ",asset)
        //     // log.info(tag,"caip: ",caip)
        //     assert(asset)
        //     assert(caip)
        //     assert(asset.caip)
        // }
        // log.info(tag,' ****** Validated Assets for caips ******')
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
        log.info(tag,"pubkeys: ",pubkeys.length)
        assert(pubkeys)
        assert(pubkeys[0])
        for(let i = 0; i < pubkeys.length; i++){
            let pubkey = pubkeys[i]
            log.info(tag,"pubkey: ",pubkey)
            assert(pubkey.pubkey)
            assert(pubkey.type)
            assert(pubkey.path)
            assert(pubkey.scriptType)
            assert(pubkey.networks)
            assert(pubkey.networks[0])
        }
        assert(app.paths)
        for(let i = 0; i < app.paths.length; i++){
            let path = app.paths[i]
            // log.info(tag,' path: ',path)
            let pubkey = app.pubkeys.find((pubkey:any) => pubkey.path === addressNListToBIP32(path.addressNList))
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

        for(let i = 0; i < blockchains.length; i++){
            let blockchain = blockchains[i]
            log.debug(tag,'blockchain: ',blockchain)

            //
            if(blockchain.indexOf('eip155') >= 0){
                //check for gas asset in asset map
                let caip = blockchain + "/slip44:60"
                // log.info(tag,'caip: ',caip)
                let asset = assets.get(caip)
                // log.info(tag,'asset: ',asset)
                assert(asset)
                assert(app.assetsMap.get(caip))

                let assetInfo = app.assetsMap.get(caip)
                // console.log(tag,'assetInfo: ',assetInfo)
                assert(assetInfo)
            }

            let chain = NetworkIdToChain[blockchain]
            assert(chain)
            log.debug(tag, 'chain: ',chain)
            let caip = shortListSymbolToCaip[chain]
            log.debug(tag, 'caip: ',caip)
            assert(caip)
            assert(assets.get(caip))

            //should be a balance for every gas asset
            const balanceNative = app.balances.find((balance:any) => balance.caip === caip);
            if(!balanceNative) log.error(tag,'Missing Balance for CAIP: ',caip)
            assert(balanceNative)
            log.debug(tag,"balanceNative: ",balanceNative)
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
        // await app.clearCache()


        //app.dashboard

        log.info(tag,'dashboard', app.dashboard);

        console.log("************************* TEST PASS *************************")
        console.timeEnd('start2end');
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
