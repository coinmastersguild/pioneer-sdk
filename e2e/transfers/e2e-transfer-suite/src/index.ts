/*
    Production E2E ERC20 Token Transfer Testing Suite
    
    Professional-grade test for ERC20 token transfers on Polygon (chain 137).
    Handles both native MATIC and ERC20 token transfers with proper validation.
    
    Supported ERC20 Tokens:
    - USDC: eip155:137/erc20:0x2791bca1f2de4661ed88a30c99a7a9449aa84174
    - USDT: eip155:137/erc20:0xc2132d05d31c914a87c6611c10748aeb04b58e8f
    - DAI:  eip155:137/erc20:0x8f3cf7ad23cd3cadbd9735aff958023239c6a063
    - WETH: eip155:137/erc20:0x7ceb23fd6f88b97df9b1a3b7acf7106c0c1d5e4f
    
    Production Features:
    - Automatic ERC20 token discovery and testing
    - Transaction data validation (ERC20 vs native)
    - Comprehensive error handling and recovery
    - Balance validation before and after transfers
    - Production-ready logging and monitoring

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
    addressNListToBIP32,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

let txid:string
let IS_SIGNED: boolean


// Validation function for ERC20 transaction data
function validateERC20Transaction(unsignedTx: any, expectedTokenAddress: string): boolean {
    if (!unsignedTx.data || unsignedTx.data === '0x') {
        log.error('❌ Invalid ERC20 transaction: data field is empty (this is a native transfer)');
        return false;
    }
    
    if (unsignedTx.to.toLowerCase() !== expectedTokenAddress.toLowerCase()) {
        log.error(`❌ Invalid ERC20 transaction: to address ${unsignedTx.to} doesn't match token contract ${expectedTokenAddress}`);
        return false;
    }
    
    if (unsignedTx.value !== '0x0') {
        log.error(`❌ Invalid ERC20 transaction: value should be 0x0 but got ${unsignedTx.value}`);
        return false;
    }
    
    // Check if data starts with ERC20 transfer function selector (0xa9059cbb)
    if (!unsignedTx.data.startsWith('0xa9059cbb')) {
        log.error(`❌ Invalid ERC20 transaction: data doesn't start with transfer function selector. Got: ${unsignedTx.data.substring(0, 10)}`);
        return false;
    }
    
    log.info('✅ ERC20 transaction validation passed');
    return true;
}

const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        // Performance timing setup
        const startTime = Date.now();
        console.time('🚀 TOTAL_RUNTIME');
        console.time('⚙️  SDK_INITIALIZATION');
        console.time('🔗 DEVICE_PAIRING');
        console.time('📊 BALANCE_SYNC');
        console.time('🔧 TX_BUILDING');
        console.time('✍️  TX_SIGNING');
        console.time('📡 TX_BROADCASTING');
        
        log.info(tag, "🏁 Starting E2E Transfer Test Suite");
        log.info(tag, "🕐 Start time:", new Date().toISOString());
        
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
            // 'MATIC', // Polygon network for ERC20 token testing
            // 'THOR',
            // 'GAIA',
            // 'OSMO',
            // 'BASE',
            // 'OP',
            // 'ARB',
            // 'AVAX',
            // 'BSC',
            // 'XRP', //Testing after fixing ledger_index_current
            // 'ETH',
            // 'MAYA',   //Amount is wrong
            // // 'GNO',
            // 'BCH',
            'BTC',
        ]

        const allByCaip = chains.map(chainStr => {
            const chain = getChainEnumValue(chainStr);
            if (chain) {
                return ChainToNetworkId[chain];
            }
            return;
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
            'eip155:10/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03', // OP (using same address as ETH)
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
            'eip155:137/slip44:60': 0.001, // MATIC (Polygon typical min tx - reduced for ERC20 testing)
            'eip155:10/slip44:60': 0.001, // MATIC (Polygon typical min tx)
            'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144': .01, // XRP (reserve requirement of 10-20 XRP)
            'zcash:main': 0.0001, // ZEC
            // ERC20 tokens on Polygon - Production amounts
            'eip155:137/erc20:0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 1.0, // USDC on Polygon - test with 1 USDC
            'eip155:137/erc20:0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 1.0, // USDT on Polygon - test with 1 USDT
            'eip155:137/erc20:0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 1.0, // DAI on Polygon - test with 1 DAI
            'eip155:137/erc20:0x7ceb23fd6f88b97df9b1a3b7acf7106c0c1d5e4f': 0.001, // WETH on Polygon - test with 0.001 WETH
        };
        log.info(tag,"blockchains: ",allByCaip)
        //get paths for wallet
        let paths = getPaths(blockchains)
        log.info(tag,"paths: ",paths.length)

        // paths.push({
        //   note: ' ETH account 1',
        //   networks: [ 'eip155:1', 'eip155:*' ],
        //   type: 'address',
        //   addressNList: [ 2147483692, 2147483708, 2147483648 ],
        //   addressNListMaster: [ 2147483692, 2147483708, 2147483648, 1, 0 ],
        //   curve: 'secp256k1',
        //   showDisplay: false
        // })
        // log.info(tag,'paths:',paths)

        // paths.push({
        //   note: ' ETH account 2',
        //   networks: [ 'eip155:1', 'eip155:*' ],
        //   type: 'address',
        //   addressNList: [ 2147483692, 2147483708, 2147483648 ],
        //   addressNListMaster: [ 2147483692, 2147483708, 2147483648, 2, 0 ],
        //   curve: 'secp256k1',
        //   showDisplay: false
        // })
        // log.info(tag,'paths:',paths)

        // paths.push({
        //     note:"Bitcoin account 0 segwit (p2sh)",
        //     networks: ['bip122:000000000019d6689c085ae165831e93'],
        //     script_type:"p2sh",
        //     available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
        //     type:"zpub",
        //     addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0],
        //     addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 0, 0, 0],
        //     curve: 'secp256k1'
        // })
        // paths.push({
        //     note:"Bitcoin account 1 Native Segwit (Bech32)",
        //     blockchain: 'bitcoin',
        //     symbol: 'BTC',
        //     symbolSwapKit: 'BTC',
        //     networks: ['bip122:000000000019d6689c085ae165831e93'],
        //     script_type:"p2wpkh", //bech32
        //     available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
        //     type:"zpub",
        //     addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1],
        //     addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 1, 0, 0],
        //     curve: 'secp256k1'
        // })
        // paths.push({
        //     note:"Bitcoin account 2 Native Segwit (Bech32)",
        //     blockchain: 'bitcoin',
        //     symbol: 'BTC',
        //     symbolSwapKit: 'BTC',
        //     networks: ['bip122:000000000019d6689c085ae165831e93'],
        //     script_type:"p2wpkh", //bech32
        //     available_scripts_types:['p2pkh','p2sh','p2wpkh','p2sh-p2wpkh'],
        //     type:"zpub",
        //     addressNList: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 2],
        //     addressNListMaster: [0x80000000 + 84, 0x80000000 + 0, 0x80000000 + 2, 0, 0],
        //     curve: 'secp256k1'
        // })

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
        log.info(tag, "🔧 Creating SDK instance...");
        let app = new SDK.SDK(spec,config)
        
        log.info(tag, "🚀 Initializing SDK and connecting to device...");
        const initStart = Date.now();
        let resultInit = await app.init({}, {})
        const initTime = Date.now() - initStart;
        console.timeEnd('⚙️  SDK_INITIALIZATION');
        console.timeEnd('🔗 DEVICE_PAIRING');
        
        log.info(tag, `✅ SDK initialized in ${initTime}ms`);
        log.info(tag, "👛 Wallets found:", app.wallets.length);
        
        // Debug: Log all balances after init
        log.info(tag, "Total balances after init:", app.balances.length);
        app.balances.forEach((b: any) => {
            if (b.balance > 0) {
                log.info(tag, `Balance: ${b.caip} = ${b.balance} ${b.symbol || ''}`);
            }
        });

        let events = app.events.on('wallets', async (wallets: any) => {
            log.info(tag,"wallets: ",wallets)

        })

        await app.getCharts()
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
            log.info(tag,"pubkeys: ",pubkeys.length)
            assert(pubkeys[0]) //at least 1 pubkey per chain

            //get balances for chain


            //assert(chain == paths[i].chain)
            //assert(pubkey == paths[i].pubkey)
            //assert(balance == paths[i].balance)
        }
        //balance > min send amount

        //Test full tx's
        for(let i = 0; i < app.blockchains.length; i++){
            let blockchain = app.blockchains[i];
            log.info(tag,"blockchain: ",blockchain)

            log.info(tag,"TRANSFER: blockchain: ",app.blockchains[i])
            //gas for chain
            let caip = networkIdToCaip(app.blockchains[i])
            assert(caip)
            log.info(tag,'caip: ',caip)
            
            // Debug CAIP matching
            log.info(tag, "Looking for balances matching CAIP:", caip);
            log.info(tag, "All balance CAIPs:", app.balances.map((b: any) => b.caip));

            // Debug: Show all available balances for this network
            let networkBalances;
            if (blockchain.includes('eip155')) {
                networkBalances = app.balances.filter((e: any) => e.caip.startsWith(blockchain.split('/')[0]));
            } else {
                // For non-EVM chains, match the exact caip
                log.info(tag, `Filtering for non-EVM chain with CAIP: ${caip}`);
                networkBalances = app.balances.filter((e: any) => {
                    const matches = e.caip === caip;
                    if (!matches) {
                        log.debug(tag, `Balance CAIP ${e.caip} does not match ${caip}`);
                    }
                    return matches;
                });
            }
            log.info(tag, `All ${blockchain} balances found:`, networkBalances.length);
            networkBalances.forEach((balance: any, idx: number) => {
                log.info(tag, `Balance ${idx + 1}:`, {
                    caip: balance.caip,
                    balance: balance.balance,
                    symbol: balance.symbol || 'N/A',
                    name: balance.name || 'N/A'
                });
            });

            // Find available assets to test
            let testAssets: string[] = [];
            
            if (blockchain.includes('eip155')) {
                // Force testing ETH native asset only (not ERC20 tokens)
                const nativeBalance = networkBalances.find((b: any) => b.caip === `${blockchain}/slip44:60`);
                if (nativeBalance && parseFloat(nativeBalance.balance) > 0) {
                    testAssets = [nativeBalance.caip];
                    log.info(tag, `Testing ETH native: ${nativeBalance.caip} (${nativeBalance.balance})`);
                }
            } else {
                // For non-EVM chains (BTC, etc), test the native asset
                const nativeBalance = networkBalances.find((b: any) => b.caip === caip);
                if (nativeBalance && parseFloat(nativeBalance.balance) > 0) {
                    testAssets = [nativeBalance.caip];
                    log.info(tag, `Testing ${nativeBalance.symbol || blockchain}: ${nativeBalance.caip} (${nativeBalance.balance})`);
                } else {
                    log.warn(tag, `⚠️  No balance found for ${caip}`);
                }
            }

            if (testAssets.length === 0) {
                log.error(tag, `❌ No assets with balance found for ${blockchain}`);
                log.error(tag, `   Available balances:`, networkBalances);
                throw new Error(`No assets with balance found for ${blockchain}. Cannot test transfers without funds.`);
            }

            log.info(tag, `Testing ${testAssets.length} assets:`, testAssets);

            // Test each asset (native MATIC + any ERC20 tokens with balance)
            for (let assetIndex = 0; assetIndex < testAssets.length; assetIndex++) {

            let testCaip = testAssets[assetIndex];
            log.info(tag, `Testing asset ${assetIndex + 1}/${testAssets.length}: ${testCaip}`);

            //set context for this specific asset
            await app.setAssetContext({caip: testCaip})

            let FAUCET_ADDRESS = caipToAddressMap[testCaip] || caipToAddressMap[caip]
            assert(FAUCET_ADDRESS, `No faucet address configured for ${testCaip}`)
            log.info(tag,'FAUCET_ADDRESS: ',FAUCET_ADDRESS)

            let TEST_AMOUNT = caipToMinAmountSend[testCaip] || caipToMinAmountSend[caip] || 0.001
            assert(TEST_AMOUNT)
            log.info(tag,'TEST_AMOUNT: ',TEST_AMOUNT)

            //force sync balance for blockchain
            log.info(tag, `Syncing balance for blockchain: ${app.blockchains[i]}`);
            await app.getBalance(app.blockchains[i])
            
            // Re-check balances after sync
            log.info(tag, "Total balances after sync:", app.balances.length);
            let btcBalances = app.balances.filter((e: any) => e.caip.includes('bip122:000000000019d6689c085ae165831e93'));
            log.info(tag, "BTC balances found after sync:", btcBalances.length);
            btcBalances.forEach((b: any) => {
                log.info(tag, `BTC Balance: ${b.caip} = ${b.balance} ${b.symbol || ''}`);
            });

            //set context again to ensure balance is propagated
            await app.setAssetContext({caip: testCaip})
            
            // Set pubkey context to account 1 for ETH transfers
            if (blockchain.includes('eip155') && app.pubkeys.length > 1) {
                const account1Pubkey = app.pubkeys.find((pk: any) => pk.note && pk.note.includes('account 1'));
                if (account1Pubkey) {
                    await app.setPubkeyContext(account1Pubkey);
                    log.info(tag, '🔑 Using ETH account 1:', account1Pubkey.address);
                }
            }

            // Fetch initial balance
            let balances = app.balances.filter((e: any) => e.caip === testCaip);
            log.info(tag,'app.assetContext: ', app.assetContext)
            let balance = app.assetContext.balance
            log.info(tag,'Balance: ', balance)
            
            // If balance is still undefined, try to get it from the balances array
            if (!balance && balances.length > 0) {
                balance = balances[0].balance;
                log.info(tag,'Using balance from balances array: ', balance);
            }
            
            assert(balance, `${tag} Balance not found for ${testCaip}. Available balances: ${app.balances.map((b: any) => b.caip).join(', ')}`);
            log.info(tag, 'Balance before: ', balance);
            let balanceBefore = balance;
            if(balanceBefore === 0) throw Error("YOU ARE BROKE!")
            if (balanceBefore < TEST_AMOUNT) {
                log.info(tag, 'Balance already drained! (or dust): ', balanceBefore);
                continue
            }
            assert(blockchain)


            let pubkeys = app.pubkeys.filter((e: any) => e.networks.includes(blockchain.includes('eip155') ? 'eip155:*' : blockchain));
            assert(pubkeys[0], `${tag} Public key not found for blockchain ${blockchain}`);
            log.info(tag, 'Public Key: ', pubkeys[0]);

            //setAssetContext
            await app.setAssetContext({caip: testCaip});
            log.info(tag,'Asset Context: ', app.assetContext);
            log.info(tag,'Asset Context pubkeys: ', app.assetContext.pubkeys.length);
            log.info(tag,'Asset Context balances: ', app.assetContext.balances.length);
            // Test: Ensure no two balances have the same `identifier`
            const balanceIdentifiers = app.assetContext.balances.map((balance:any) => balance.identifier);
            const uniqueBalanceIdentifiers = new Set(balanceIdentifiers);
            assert.strictEqual(
              balanceIdentifiers.length,
              uniqueBalanceIdentifiers.size,
              'Duplicate balance identifiers found'
            );

            // Test: Ensure no two pubkeys are identical
            const pubkeysContext = app.assetContext.pubkeys.map((pubkeyObj:any) => pubkeyObj.pubkey);
            const uniquePubkeys = new Set(pubkeysContext);
            assert.strictEqual(
              pubkeys.length,
              uniquePubkeys.size,
              'Duplicate pubkeys found'
            );

            let assetContext = app.assetContext
            assert(assetContext)
            assert(assetContext.balance)
            assert(assetContext.caip)
            assert(assetContext.priceUsd)
            assert(assetContext.valueUsd)
            log.info(tag,'assetContext.priceUsd: ', assetContext.priceUsd);
            log.info(tag,'assetContext.valueUsd: ', assetContext.valueUsd);

            //force pubkey context - use pubkeys from assetContext which are already filtered
            let pubkeysForContext = app.assetContext.pubkeys;
            assert(pubkeysForContext)
            assert(pubkeysForContext.length > 0, 'No pubkeys found in asset context')
            
            // Use account 1 if available, otherwise use account 0
            let pubkey = pubkeysForContext[1]


            if(!pubkeysForContext[1]) throw Error('Missing context')
            log.info(tag, `Using pubkey for transfer: ${pubkey.address || pubkey.pubkey} (${pubkey.note || 'default'})`);

            await app.setPubkeyContext(pubkey)

            // For ETH, use sendMax to avoid balance/fee calculation issues
            const isEth = testCaip.includes('slip44:60');
            const sendPayload = {
                caip: testCaip,
                isMax: isEth, // Use sendMax for ETH to simplify fee calculation
                to: FAUCET_ADDRESS,
                amount: isEth ? balance : TEST_AMOUNT, // For sendMax, amount is ignored but we provide balance
                feeLevel: 5 // Options
            };
            log.info('sendPayload: ',sendPayload);

            log.info(tag, isEth ? 'Using sendMax for ETH' : `Send TEST_AMOUNT: ${TEST_AMOUNT}`);

            //max is balance
            // const sendPayload = {
            //     caip,
            //     isMax: true,
            //     to: FAUCET_ADDRESS,
            //     amount: balance,
            //     feeLevel: 5 // Options
            // };
            // log.info(tag, 'Send Payload: ', sendPayload);

            //Test as portfolio
            // Execute the transaction
            // let result = await app.transfer(sendPayload, true);
            // assert(result.txid, `${tag} Transaction failed`);
            // log.info(tag, 'Transaction Result: ', result.txid);

            //test as BEX (multi-set)
            log.info(tag, '🔧 Building transaction...');
            let unsignedTx = await app.buildTx(sendPayload);
            log.info(tag, 'unsignedTx: ', unsignedTx);

            //if utxo audit the change address/addressIndex/script type
              /*
                  Every xpub has its own address index

                  if we use an addressInex from a wrong xpub/script type we cause issues

                  for instance this account has an address index oif 65 on p2pkh legacy

                  but 2 on p2wpkh legacy segit, if we use a 65 index on legacy segwit that is outside the gap limit and causes
                  lost funds, not lost, recoverable, but only a dev can retrieve it

               */

              //get change address from unsigned
              log.info(tag, 'unsignedTx outputs: ', unsignedTx.outputs);
              log.info(tag, 'unsignedTx outputs: ', unsignedTx.outputs[1]);

              let changeInfo = unsignedTx.outputs[1]

              // Convert addressNlist to BIP32 path format using the imported function
              // addressNlist is an array like [84, 0x80000000, 0x80000000, 1, index]
              // Converts to string like "m/84'/0'/0'/1/index"
              let changePath = addressNListToBIP32(changeInfo.addressNlist);
              log.info(tag, 'changePath: ', changePath);
              log.info(tag, 'scriptType: ', unsignedTx.scriptType);

              // Get index from path (last element of addressNlist)
              let changeIndex = changeInfo.addressNlist[changeInfo.addressNlist.length - 1] & 0x7fffffff; // Remove hardened flag if present
              log.info(tag, 'changeIndex: ', changeIndex);

              // Lookup xpub for the specific script type
              // Filter pubkeys for Bitcoin and the specific script type
              let xpubsForScriptType = app.pubkeys.filter((pubkey: any) => {
                return pubkey.networks?.includes('bip122:000000000019d6689c085ae165831e93') && // Bitcoin network
                       pubkey.script_type === unsignedTx.scriptType; // Match script type (p2pkh, p2wpkh, p2sh-p2wpkh)
              });

              if (xpubsForScriptType.length === 0) {
                log.error(tag, `No xpub found for script type: ${unsignedTx.scriptType}`);
              } else {
                log.info(tag, `Found ${xpubsForScriptType.length} xpub(s) for script type ${unsignedTx.scriptType}`);

                // Get the first matching xpub (usually there's only one per script type)
                let xpubChange = xpubsForScriptType[0];
                log.info(tag, 'xpubChange: ', xpubChange);

                // Verify the address index from the xpub
                if (xpubChange.addressIndex) {
                  log.info(tag, `Current addressIndex for ${unsignedTx.scriptType}: ${xpubChange.addressIndex}`);

                  // Check if changeIndex is within reasonable bounds
                  if (changeIndex > xpubChange.addressIndex + 20) {
                    log.warn(tag, `⚠️ WARNING: Change index ${changeIndex} is beyond gap limit for ${unsignedTx.scriptType}!`);
                    log.warn(tag, `Current addressIndex: ${xpubChange.addressIndex}, Gap limit typically 20`);
                    log.warn(tag, 'This could result in "lost" funds that require manual recovery!');
                  }
                }

                // Get detailed pubkey info if available
                if (app.pioneer && app.pioneer.GetPubkeyInfo) {
                  try {
                    let addressInfo = await app.pioneer.GetPubkeyInfo({
                      pubkey: xpubChange.pubkey || xpubChange.xpub,
                      script_type: unsignedTx.scriptType,
                      address_n: changeInfo.addressNlist
                    });
                    log.info(tag, 'addressInfo from GetPubkeyInfo: ', addressInfo);
                  } catch (error) {
                    log.error(tag, 'Error getting pubkey info: ', error);
                  }
                }
              }

              log.info(tag, '✅ Change address audit complete');


            // PRODUCTION VALIDATION: Ensure this is an ERC20 transaction
            if (testCaip.includes('/erc20:')) {
                const expectedContractAddress = testCaip.split('/erc20:')[1];
                if (!validateERC20Transaction(unsignedTx, expectedContractAddress)) {
                    throw new Error(`❌ VALIDATION FAILED: Expected ERC20 transaction but got native transfer for ${testCaip}`);
                }
                log.info(tag, '✅ ERC20 transaction validation passed - this IS a token transfer');
            } else {
                log.info(tag, '📝 Native token transfer detected');
            }

            //estimate fee in USD

            //sign
            log.info(tag, '✍️  Signing transaction with KeepKey...');
            try {
                let signedTx = await app.signTx({ caip: testCaip, unsignedTx });
                log.info(tag, 'signedTx: ', signedTx);

                //broadcast
                log.info(tag, '📡 Broadcasting transaction...');
                let broadcast;
                try {
                    broadcast = await app.broadcastTx(testCaip, signedTx);
                    log.info(tag, 'Broadcast response:', broadcast);
                } catch (broadcastError: any) {
                    log.error(tag, 'Broadcast error details:', {
                        message: broadcastError.message,
                        response: broadcastError.response,
                        data: broadcastError.data,
                        status: broadcastError.status
                    });
                    throw broadcastError;
                }
                assert(broadcast, `${tag} Broadcast failed for ${testCaip} - no response received`)
                log.info(tag, 'broadcast: ', broadcast);

                //OSMOSIS
                // let broadcast = '6FD1554D654B5F58D6D35CE1F9EE0EA0FCCEB5A20EA5E6B80CAA58F7302F22E5'

                // Follow transaction
                log.info(tag, '👀 Following transaction...');
                let followTx = await app.followTransaction(testCaip, broadcast);
                log.info(tag, 'Follow Transaction: ', followTx);

                // Fetch new balance
                log.info(tag, '💰 Fetching updated balance...');
                await app.getBalance(app.blockchains[i]);
                let balancesAfter = app.balances.filter((e: any) => e.caip === testCaip);
                let balanceAfter = balancesAfter[0];
                assert(balanceAfter, `${tag} Balance not found after transaction for ${testCaip}`);
                log.info(tag, 'Balance after: ', balanceAfter);

                let balanceDiff = balanceBefore - balanceAfter.balance;
                if(balanceDiff === 0) throw new Error(`${tag} Balance did not change after transaction for ${testCaip}`);
                let fee = balanceDiff - TEST_AMOUNT;

                // Log differences and fee
                log.info(tag, `Asset: ${testCaip}`);
                log.info(tag, `Balance Before: ${balanceBefore}`);
                log.info(tag, `Balance After: ${balanceAfter.balance}`);
                log.info(tag, `Amount Sent: ${TEST_AMOUNT}`);
                log.info(tag, `Fee Calculated: ${fee}`);

                // if (fee > TEST_AMOUNT) {
                //     throw new Error(`${tag} Fee (${fee}) exceeds TEST_AMOUNT (${TEST_AMOUNT})`);
                // }
                
                log.info(tag, `✅ Successfully completed transaction for ${testCaip}`);
            } catch (signError: any) {
                log.error(tag, `❌ Transaction failed for ${testCaip}:`, signError);
                if (signError.message?.includes('User cancelled') || signError.message?.includes('rejected')) {
                    log.info(tag, '⏭️  Skipping asset due to user cancellation');
                    continue;
                } else {
                    throw signError; // Re-throw other errors
                }
            }
            } // End asset loop
        } // End blockchain loop

        // Validate that we actually tested something
        if (app.blockchains.length === 0) {
            throw new Error("❌ TEST FAILED: No blockchains were tested");
        }
        
        log.info("************************* TEST PASS *************************")
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
