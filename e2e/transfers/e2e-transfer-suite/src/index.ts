/*
    E2E testing

 */

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test | "
// @ts-ignore
import { shortListSymbolToCaip, caipToNetworkId, networkIdToCaip } from '@pioneer-platform/pioneer-caip';
import { getChainEnumValue  } from "@coinmasters/types";
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;


import {
    getPaths,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

let txid:string
let IS_SIGNED: boolean


const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        //(tag,' CHECKPOINT 1');
        console.time('start2paired');
        console.time('start2build');
        console.time('start2broadcast');
        console.time('start2end');
        //if force new user
        const queryKey = "sdk:pair-keepkey:"+Math.random();
        log.info(tag,"queryKey: ",queryKey)
        // const queryKey = "key:66fefdd6-7ea9-48cf-8e69-fc74afb9c45412"
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        //get all blockchains

        let spec = 'https://pioneers.dev/spec/swagger.json'
        // let spec = 'http://127.0.0.1:9001/spec/swagger.json'


        let chains = [
            // 'DOGE',
            // 'DASH',
            // 'LTC', //BROKE "Missing inputs
            // 'MATIC',
            // 'THOR',
            // 'GAIA',
            'OSMO',
            // 'BASE',
            // 'OP',
            // 'ARB',
            // 'AVAX',
            // 'BSC',
            // 'XRP',
            // 'ETH',

            // 'MAYA', //MARKET INFO BROKE
            // 'GNO',
            // 'BCH',
            // 'BTC',
        ]

        const allByCaip = chains.map(chainStr => {
            const chain = getChainEnumValue(chainStr);
            if (chain) {
                return ChainToNetworkId[chain];
            }
            return undefined;
        });
        let blockchains = allByCaip

        // //
        // 'bip122:000000000019d6689c085ae165831e93/slip44:0', // BTC
        //   'bip122:000000000000000000651ef99cb9fcbe/slip44:145', // BCH
        //   'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5', // DASH
        //   'bip122:00000000001a91e3dace36e2be3bf030/slip44:3', // DOGE
        //   'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2', // LTC
        //   'cosmos:mayachain-mainnet-v1/slip44:931',
        //   'cosmos:osmosis-1/slip44:118',
        //   'cosmos:cosmoshub-4/slip44:118',
        //   'cosmos:kaiyo-1/slip44:118',
        //   'cosmos:thorchain-mainnet-v1/slip44:931', // supportedCaips.ts
        // //
        // FAUCET_BITCOIN_ADDRESS=bc1qu3ghkz8788ysk7gqcvke5l0mr7skhgvpuk6dk4
        // FAUCET_ETH_ADDRESS=0x658DE0443259a1027caA976ef9a42E6982037A03
        // FAUCET_BASE_ADDRESS=0x658DE0443259a1027caA976ef9a42E6982037A03
        // FAUCET_DASH_ADDRESS=XetjxEsGXKLV4mHiWPLscuNFABu9K5eVDd
        // FAUCET_BCH_ADDRESS=qpd00ucur9gl7rzwe7lqmu9yljr9ajv92q09a0jdrl
        // FAUCET_DOGE_ADDRESS=DNchRDXhaW2uPusLVQWZZbQ5QQnzYmarWJ
        // FAUCET_ZEC_ADDRESS=t1arQZhpGdBVRhTybXpeoDFgyNJXFEWDTaP
        // FAUCET_MAYA_ADDRESS=maya14jutklw4xaawvx0p90m45nur64mmhjz3mwmvvs
        // FAUCET_RUNE_ADDRESS=thor1x9cxamvvc9tu8w0j56grufvntuz0gdhk7hh74u
        // FAUCET_OSMO_ADDRESS=osmo1hp7gnr07wprd75f4j4aze9a94aejfcqdccqdht
        // FAUCET_XRP_ADDRESS=rGdMfVVZwUbqAxs5zucKHUpFgFTcPPj5Cn
        // FAUCET_ATOM_ADDRESS=cosmos1hp7gnr07wprd75f4j4aze9a94aejfcqdsrnape

        const caipToAddressMap:any = {
            'bip122:000000000019d6689c085ae165831e93/slip44:0': 'bc1qu3ghkz8788ysk7gqcvke5l0mr7skhgvpuk6dk4', // BTC
            'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 'qpd00ucur9gl7rzwe7lqmu9yljr9ajv92q09a0jdrl', // BCH
            'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 'XetjxEsGXKLV4mHiWPLscuNFABu9K5eVDd', // DASH
            'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 'DNchRDXhaW2uPusLVQWZZbQ5QQnzYmarWJ', // DOGE
            'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2': 'LMcHLHjcAhMtM6SPQ7Da9acBQWcviaX2Fu', // LTC
            'cosmos:mayachain-mainnet-v1/slip44:931': 'maya14jutklw4xaawvx0p90m45nur64mmhjz3mwmvvs', // MAYA
            'cosmos:osmosis-1/slip44:118': 'osmo1hp7gnr07wprd75f4j4aze9a94aejfcqdccqdht', // OSMO
            'cosmos:cosmoshub-4/slip44:118': 'cosmos1hp7gnr07wprd75f4j4aze9a94aejfcqdsrnape', // ATOM
            'cosmos:kaiyo-1/slip44:118': 'cosmos1hp7gnr07wprd75f4j4aze9a94aejfcqdsrnape', // KAIYO (ATOM)
            'cosmos:thorchain-mainnet-v1/slip44:931': 'thor10t3zmsks33mgf7ajkmzj2elt553ufrxgav90ms', // RUNE
            'eip155:1/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03', // ETH
            'eip155:8453/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03', // ETH
            'eip155:137/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03', // MATIC (using same address as ETH)
            'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144': 'rGdMfVVZwUbqAxs5zucKHUpFgFTcPPj5Cn', // XRP
            'zcash:main': 't1arQZhpGdBVRhTybXpeoDFgyNJXFEWDTaP', // ZEC
        };

        const caipToMinAmountSend:any = {
            'bip122:000000000019d6689c085ae165831e93/slip44:0': 0.0001, // BTC
            'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 0.00001, // BCH
            'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 0.0001, // DASH
            'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 2, // DOGE (high volume, lower min tx)
            'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2': 0.001, // LTC
            'cosmos:mayachain-mainnet-v1/slip44:931': 0.01, // MAYA (assumed average Cosmos fee)
            'cosmos:osmosis-1/slip44:118': 0.01, // OSMO
            'cosmos:cosmoshub-4/slip44:118': 0.01, // ATOM
            'cosmos:kaiyo-1/slip44:118': 0.01, // KAIYO (ATOM)
            'cosmos:thorchain-mainnet-v1/slip44:931': 0.02, // RUNE (Thorchain tends to have higher fees)
            'eip155:1/slip44:60': 0.0005, // ETH (depending on network conditions)
            'eip155:8453/slip44:60': 0.0005, // ETH (depending on network conditions)
            'eip155:137/slip44:60': 0.01, // MATIC (Polygon typical min tx)
            'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144': .01, // XRP (reserve requirement of 10-20 XRP)
            'zcash:main': 0.0001, // ZEC
        };

        log.info(tag,"blockchains: ",allByCaip)


        //get paths for wallet
        let paths = getPaths(blockchains)
        log.info("paths: ",paths.length)

        paths.push({
            note:"Bitcoin account 0 segwit (p2sh)",
            networks: ['bip122:000000000019d6689c085ae165831e93'],
            script_type:"p2sh",
            available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
            type:"zpub",
            addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0],
            addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
            curve: 'secp256k1'
        })


        let config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey:process.env.KEEPKEY_API_KEY,
            blockchains,
            paths,
        };

        //log.info(tag,' CHECKPOINT 2');
        //log.info(tag,' config: ',config);
        let app = new SDK.SDK(spec,config)
        let resultInit = await app.init({}, {})
        // log.info(tag,"resultInit: ",resultInit)
        log.info(tag,"wallets: ",app.wallets.length)

        let events = app.events.on('wallets', async (wallets: any) => {
            log.info(tag,"wallets: ",wallets)

        })

        // await app.getCharts()
        // //connect
        assert(app.blockchains)
        assert(app.blockchains[0])
        assert(app.pubkeys)
        assert(app.pubkeys[0])
        assert(app.balances)
        assert(app.balances[0])

        //check pairing

        // // //context should match first account
        // let context = await app.context
        // log.info(tag,"context: ",context)
        // assert(context)

        //for each chain
        for(let i = 0; i < app.blockchains.length; i++){
            let blockchain = app.blockchains[i]
            log.info(tag,"blockchain: ",blockchain)
            //get pubkeys for chain
            if (blockchain.indexOf('eip155') > -1) blockchain = "eip155:*";
            log.info(tag,"blockchain: ",blockchain)
            let pubkeys = app.pubkeys.filter((e: any) => e.networks.includes(caipToNetworkId(blockchain)));
            log.info(tag,"pubkeys: ",pubkeys)
            assert(pubkeys[0]) //at least 1 pubkey per chain

            //get balances for chain


            //assert(chain == paths[i].chain)
            //assert(pubkey == paths[i].pubkey)
            //assert(balance == paths[i].balance)
        }
        //balance > min send amount

        //Test full tx's
        for(let i = 0; i < app.blockchains.length; i++){
            log.info(tag,"TRANSFER: blockchain: ",app.blockchains[i])
            //gas for chain
            let caip = networkIdToCaip(app.blockchains[i])
            assert(caip)
            log.info(tag,'caip: ',caip)

            let FAUCET_ADDRESS = caipToAddressMap[caip]
            assert(FAUCET_ADDRESS)
            log.info(tag,'FAUCET_ADDRESS: ',FAUCET_ADDRESS)

            let TEST_AMOUNT = caipToMinAmountSend[caip]
            assert(TEST_AMOUNT)
            log.info(tag,'TEST_AMOUNT: ',TEST_AMOUNT)

            //force sync balance for asset
            await app.getBalance(app.blockchains[i])

            // Fetch initial balance
            let balances = app.balances.filter((e: any) => e.caip === caip);
            let balance = balances[0];
            assert(balance, `${tag} Balance not found for ${caip}`);
            log.info(tag, 'Balance before: ', balance);
            let balanceBefore = balance.balance;

            if (balanceBefore < TEST_AMOUNT) throw new Error('YOU ARE BROKE!!!!!');

            let blockchain = app.blockchains[i];
            if (blockchain.includes('eip155')) blockchain = "eip155:*";

            let pubkeys = app.pubkeys.filter((e: any) => e.networks.includes(blockchain));
            assert(pubkeys[0], `${tag} Public key not found for blockchain ${blockchain}`);
            log.info(tag, 'Public Key: ', pubkeys[0]);

            if (!TEST_AMOUNT) throw new Error(`caip: ${caip} Missing Setting for TEST_AMOUNT`);

            // const sendPayload = {
            //     caip,
            //     isMax: true,
            //     to: FAUCET_ADDRESS,
            //     amount: balance,
            //     feeLevel: 5 // Options
            // };

            log.info(tag, 'Send balance: ', balance);

            //max is balance
            const sendPayload = {
                caip,
                isMax: true,
                to: FAUCET_ADDRESS,
                amount: balance.balance,
                feeLevel: 5 // Options
            };
            log.info(tag, 'Send Payload: ', sendPayload);

            //Test as portfolio
            // Execute the transaction
            // let result = await app.transfer(sendPayload, true);
            // assert(result.txid, `${tag} Transaction failed`);
            // log.info(tag, 'Transaction Result: ', result.txid);

            //test as BEX (multi-set)
            let unsignedTx = await app.buildTx(sendPayload);
            log.info(tag, 'unsignedTx: ', unsignedTx);

            //sign
            let signedTx = await app.signTx({ caip, unsignedTx });
            log.info(tag, 'signedTx: ', signedTx);

            //broadcast
            let broadcast = await app.broadcastTx(caipToNetworkId(caip), signedTx);
            log.info(tag, 'broadcast: ', broadcast);

            // Follow transaction
            let followTx = await app.followTransaction(caip, broadcast);
            log.info(tag, 'Follow Transaction: ', followTx);

            // Fetch new balance
            await app.getBalance(app.blockchains[i]);
            let balancesAfter = app.balances.filter((e: any) => e.caip === caip);
            let balanceAfter = balancesAfter[0];
            assert(balanceAfter, `${tag} Balance not found after transaction`);
            log.info(tag, 'Balance after: ', balanceAfter);

            let balanceDiff = balanceBefore - balanceAfter.balance;
            if(balanceDiff === 0) throw new Error(`${tag} Balance did not change after transaction`);
            let fee = balanceDiff - TEST_AMOUNT;

            // Log differences and fee
            log.info(tag, `Balance Before: ${balanceBefore}`);
            log.info(tag, `Balance After: ${balanceAfter.balance}`);
            log.info(tag, `Amount Sent: ${TEST_AMOUNT}`);
            log.info(tag, `Fee Calculated: ${fee}`);

            if (fee > TEST_AMOUNT) {
                throw new Error(`${tag} Fee (${fee}) exceeds TEST_AMOUNT (${TEST_AMOUNT})`);
            }
        }

        log.info("************************* TEST PASS *************************")
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
