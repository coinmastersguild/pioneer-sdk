require('dotenv').config({ path: "./../../.env" });
require("dotenv").config({ path: '../../../.env' });
require("dotenv").config({ path: '../../../../.env' });

const TAG = " | test swap suite | ";
// @ts-ignore
import { shortListSymbolToCaip, caipToNetworkId, networkIdToCaip } from '@pioneer-platform/pioneer-caip';
import { getChainEnumValue, NetworkIdToChain } from '@coinmasters/types';
const log = require("@pioneer-platform/loggerdog")();
const assert = require('assert');
const SDK = require('@coinmasters/pioneer-sdk');
const wait = require('wait-promise');
const { ChainToNetworkId } = require('@pioneer-platform/pioneer-caip');
const sleep = wait.sleep;

import {
    getPaths,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

const test_service = async function () {
    const tag = TAG + " | test_service | ";
    try {
        console.time('start2paired');
        console.time('start2build');
        console.time('start2broadcast');
        console.time('start2end');

        const queryKey = "sdk:pair-keepkey:" + Math.random();
        log.info(tag, "queryKey: ", queryKey);
        assert(queryKey);

        const username = "user:" + Math.random();
        assert(username);

        const chains = [
            // 'DASH',
            'BTC',
            // 'DOGE',
            'ETH',
            // 'THOR',
            // 'XRP',
            // 'OSMO',
            // 'ATOM'
        ];

        const allByCaip = chains.map(chainStr => {
            const chain = getChainEnumValue(chainStr);
            if (chain) {
                return ChainToNetworkId[chain];
            }
            return undefined;
        }).filter(Boolean);

        const blockchains = allByCaip;

        const caipToMinAmountSend:any = {
            'bip122:000000000019d6689c085ae165831e93/slip44:0': 0.0001, // BTC
            'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 0.0001, // DASH
            'eip155:1/slip44:60': 0.0005, // ETH
            'cosmos:thorchain-mainnet-v1/slip44:931': 2, // RUNE
            'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 50, // DOGE
            'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 0.001, // BCH
        };

        const paths = getPaths(blockchains);

        // const spec = process.env.PIONEER_SPEC || 'https://pioneers.dev/spec/swagger.json';
        let spec = 'http://127.0.0.1:9001/spec/swagger.json'
        const config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey: process.env.KEEPKEY_API_KEY,
            blockchains,
            paths,
        };

        const app = new SDK.SDK(spec, config);
        await app.init({}, {});

        //validate pubkeys for all chains
        for(let i = 0; i < blockchains.length; i++){
            let blockchain = blockchains[i]
            log.info(tag,'blockchain: ',blockchain)

            //
            let assets = app.assetsMap
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
            assert(balanceNative)
            log.debug(tag,"balanceNative: ",balanceNative)
        }


        // Test validation: Try to set context for an unsupported asset (should fail)
        console.log('\n🧪 Testing validation for unsupported assets...');

        const hardcodedPermutations:any = [
            // { caipIn: "bip122:00000000001a91e3dace36e2be3bf030/slip44:3", caipOut: "cosmos:thorchain-mainnet-v1/slip44:931" }, // DOGE to RUNE
            // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "eip155:1/slip44:60" }, // RUNE to ETH
            // { caipIn: "eip155:1/slip44:60", caipOut: "bip122:000000000019d6689c085ae165831e93/slip44:0" }, // ETH to BTC
            { caipIn: "bip122:000000000019d6689c085ae165831e93/slip44:0", caipOut: "eip155:1/slip44:60" }, // ETH to BTC
            // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "eip155:1/slip44:60" }, // RUNE to ETH
            // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "bip122:00000000001a91e3dace36e2be3bf030/slip44:3" }, // RUNE to DOGE
            // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "bip122:000000000000000000651ef99cb9fcbe/slip44:145" }, // RUNE to BCH
            // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "bip122:000007d91d1254d60e2dd1ae58038307/slip44:5" }, // RUNE to DASH
        ];


        for (let i = 0; i < hardcodedPermutations.length; i++) {
            const { caipIn, caipOut } = hardcodedPermutations[i];

            const swapPayload:any = {
                caipIn: caipIn,
                caipOut: caipOut,
                //@ts-ignore
                amount: "0.0001", // Default minimal amount if not specified
                slippagePercentage: 5,
            };

            try {
                log.info(tag,'swapPayload: ', swapPayload);
                const txid = await app.swap(swapPayload);
                log.info('txid: ',txid)
                //on prompt to sign

            } catch (error) {
                console.error(`Failed to swap from ${caipIn} to ${caipOut}:`, error);
            }
        }

        console.log("************************* TEST PASS *************************");
    } catch (e) {
        log.error(e);
        process.exit(1);
    }
};
test_service();
