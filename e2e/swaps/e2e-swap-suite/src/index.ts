require('dotenv').config({ path: "./../../.env" });
require("dotenv").config({ path: '../../../.env' });
require("dotenv").config({ path: '../../../../.env' });

const TAG = " | test swap suite | ";
// @ts-ignore
import { shortListSymbolToCaip, caipToNetworkId, networkIdToCaip } from '@pioneer-platform/pioneer-caip';
import { getChainEnumValue, NetworkIdToChain } from '@coinmasters/types';
//
import { bip32ToAddressNList, COIN_MAP_KEEPKEY_LONG } from '@pioneer-platform/pioneer-coins'
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

            //
            log.info(tag,"app.pubkeys: ",app.pubkeys)
            const pubkey = app.pubkeys.find((p:any) => p.networks?.includes(blockchain));
            assert(pubkey)

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

            //confirm UX flow
            //TODO a user might want to specify FROM what pubkey* (multiple for a caip)
            //set input
            await app.setAssetContext({caip:caipIn});
            console.log("assetContext: ",app.assetContext)
            //TODO validate "from" address

            //TODO a user might specify TO what pubkey (multiple for a caip)
            //set output
            await app.setOutboundAssetContext({caip:caipOut});
            console.log("outboundAssetContext: ",app.outboundAssetContext)
            assert(app.outboundAssetContext)
            assert(app.outboundAssetContext.address)

            /*

                  outboundAssetContext:  {
                  assetId: 'eip155:1/slip44:60',
                  chainId: 'eip155:1',
                  symbol: 'ETH',
                  name: 'Ethereum',
                  networkName: 'Ethereum',
                  precision: 18,
                  color: '#5C6BC0',
                  icon: 'https://assets.coincap.io/assets/icons/256/eth.png',
                  explorer: 'https://etherscan.io',
                  explorerAddressLink: 'https://etherscan.io/address/',
                  explorerTxLink: 'https://etherscan.io/tx/',
                  relatedAssetKey: 'eip155:1/slip44:60',
                  caip: 'eip155:1/slip44:60',
                  networkId: 'eip155:1',
                  priceUsd: '3520.20',
                  balance: '0.04880758',
                  valueUsd: '171.81',
                  type: 'address',
                  master: '0x141D9959cAe3853b035000490C03991eB70Fc4aC',
                  address: '0x141D9959cAe3853b035000490C03991eB70Fc4aC',
                  pubkey: '0x141D9959cAe3853b035000490C03991eB70Fc4aC',
                  path: "m/44'/60'/0'",
                  scriptType: 'ethereum',
                  note: ' ETH primary (default)',
                  available_scripts_types: undefined,
                  context: 'keepkey:undefined.json',
                  networks: [ 'eip155:1', 'eip155:*' ]

                }




             */
            assert(app.keepKeySdk)

          // AddressInfo prepared
          const networkIdToType: any = {
            'bip122:000000000019d6689c085ae165831e93': 'UTXO',
            'bip122:000000000000000000651ef99cb9fcbe': 'UTXO',
            'bip122:000007d91d1254d60e2dd1ae58038307': 'UTXO',
            'bip122:00000000001a91e3dace36e2be3bf030': 'UTXO',
            'bip122:12a765e31ffd4059bada1e25190f6e98': 'UTXO',
            'cosmos:mayachain-mainnet-v1': 'MAYACHAIN',
            'cosmos:osmosis-1': 'OSMOSIS',
            'cosmos:cosmoshub-4': 'COSMOS',
            'cosmos:kaiyo-1': 'COSMOS',
            'cosmos:thorchain-mainnet-v1': 'THORCHAIN',
            'eip155:1': 'EVM',
            'eip155:137': 'EVM',
            'eip155:*': 'EVM',
            'ripple:4109c6f2045fc7eff4cde8f9905d19c2': 'XRP',
            'zcash:main': 'UTXO',
          }
          let networkType = networkIdToType[app.outboundAssetContext.networkId]

          let addressInfo = {
            address_n: bip32ToAddressNList(app.outboundAssetContext.pathMaster),
            script_type:app.outboundAssetContext.scriptType,
            // @ts-ignore
            coin:COIN_MAP_KEEPKEY_LONG[NetworkIdToChain[app.outboundAssetContext.networkId]],
            show_display: true
          }
          console.log('addressInfo: ',addressInfo)
          let address
          switch (networkType) {
            case 'UTXO':
              ({ address } = await app.address.utxoGetAddress(addressInfo));
              break;
            case 'EVM':
              ({ address } = await app.keepKeySdk.address.ethereumGetAddress(addressInfo));
              break;
            case 'OSMOSIS':
              ({ address } = await app.keepKeySdk.address.osmosisGetAddress(addressInfo));
              break;
            case 'COSMOS':
              ({ address } = await app.keepKeySdk.address.cosmosGetAddress(addressInfo));
              break;
            case 'MAYACHAIN':
              ({ address } = await app.keepKeySdk.address.mayachainGetAddress(addressInfo));
              break;
            case 'THORCHAIN':
              ({ address } = await app.keepKeySdk.address.thorchainGetAddress(addressInfo));
              break;
            case 'XRP':
              ({ address } = await app.keepKeySdk.address.xrpGetAddress(addressInfo));
              break;
            default:
              throw new Error(`Unsupported network type for networkId: ${app.outboundAssetContext.networkId}`);
          }

            console.log('deviceProffAddress: ',address)
            console.log('app.outboundAssetContext.address: ',app.outboundAssetContext.address)
            if(address !== app.outboundAssetContext.address) throw Error('Invalid proff address')

            //TODO Audit deposit conensus

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
