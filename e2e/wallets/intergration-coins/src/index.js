"use strict";
/*
    E2E testing

       This an e2e testing framework targeting node.js containers

       it is the equivalent of the pioneer-react file for a web browser.

       it is the building blocks of a pioneer-cli that run perform transfers as a "skill"
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var console = require("console");
require("dotenv").config();
require('dotenv').config({ path: "../../.env" });
require('dotenv').config({ path: "./../../.env" });
require("dotenv").config({ path: '../../../.env' });
require("dotenv").config({ path: '../../../../.env' });
var TAG = " | intergration-test | ";
// @ts-ignore - Using any types for fastest build
var pioneer_caip_1 = require("@pioneer-platform/pioneer-caip");
// import { AssetValue as AssetValueType } from '@coinmasters/core';
var log = require("@pioneer-platform/loggerdog")();
var assert = require('assert');
var SDK = require('@coinmasters/pioneer-sdk');
var wait = require('wait-promise');
var _a = require('@pioneer-platform/pioneer-caip'), ChainToNetworkId = _a.ChainToNetworkId, shortListSymbolToCaip = _a.shortListSymbolToCaip;
var sleep = wait.sleep;
var pioneer_coins_1 = require("@pioneer-platform/pioneer-coins");
//let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
var spec = 'https://pioneers.dev/spec/swagger.json';
// let spec = 'http://127.0.0.1:9001/spec/swagger.json'
// const DB = require('@coinmasters/pioneer-db-sql');
console.log("spec: ", spec);
var txid;
var IS_SIGNED;
var test_service = function () {
    return __awaiter(this, void 0, void 0, function () {
        var tag, queryKey, username, AllChainsSupported, blockchains, nodes, node, paths, i, path, config, app, resultInit, assets, pubkeys, i, pubkey, _loop_1, i, i, pubkey, _loop_2, i, i, balance, totalValueUsd, networkTotals, seenIdentifiers, i, balance, valueUsd, initialBlockchains, initialPubkeys, initialBalances, bitcoinOnly_1, bitcoinPubkeys, bitcoinBalances, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = TAG + " | test_service | ";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    // const pioneerDB = new DB.DB({ });
                    // await pioneerDB.init();
                    //(tag,' CHECKPOINT 1');
                    console.time('start2init');
                    console.time('start2pair');
                    console.time('start2Pubkeys');
                    console.time('start2BalancesGas');
                    console.time('start2BalancesTokens');
                    console.time('start2end');
                    queryKey = "sdk:pair-keepkey:" + Math.random();
                    log.debug(tag, "queryKey: ", queryKey);
                    assert(queryKey);
                    username = "user:" + Math.random();
                    assert(username);
                    AllChainsSupported = [
                        'ETH',
                        // 'ARB',  //BROKE
                        'DOGE',
                        'OP',
                        'MATIC',
                        'AVAX',
                        'BASE',
                        'BSC',
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
                    ];
                    blockchains = AllChainsSupported.map(
                    // @ts-ignore
                    function (chainStr) { return ChainToNetworkId[getChainEnumValue(chainStr)]; });
                    log.debug(tag, "blockchains: ", blockchains);
                    log.debug(tag, "blockchains: ", blockchains.length);
                    nodes = [];
                    node = {
                        networkId: 'eip155:534352',
                        service: 'https://scroll.drpc.org',
                        protocol: 'EVM'
                    };
                    nodes.push(node);
                    paths = (0, pioneer_coins_1.getPaths)(blockchains);
                    log.info(tag, 'paths:', paths);
                    for (i = 0; i < paths.length; i++) {
                        path = paths[i];
                        assert(path.networks);
                    }
                    log.info(tag, 'paths: ', paths.length);
                    config = {
                        username: 'tester123',
                        queryKey: '123456',
                        spec: spec,
                        wss: 'ws://127.0.0.1:9001',
                        keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
                        paths: paths,
                        blockchains: blockchains,
                        nodes: nodes,
                        pubkeys: [],
                        balances: [],
                    };
                    app = new SDK.SDK(spec, config);
                    log.debug('app: ', app.spec);
                    assert(app.spec);
                    assert(app.spec, spec);
                    return [4 /*yield*/, app.init({}, {})];
                case 2:
                    resultInit = _a.sent();
                    log.info(tag, ' ****** Init Complete ******');
                    // log.info('apiKey: ',app);
                    log.info('apiKey: ', app.keepkeyApiKey);
                    //force verify
                    // await app.getGasAssets()
                    // await app.getPubkeys()
                    // await app.getBalances()
                    //clear cache
                    app.events.emit('message', 'What up doc!');
                    app.events.on('message', function (event) {
                        log.info(tag, 'event: ', event);
                    });
                    assets = app.assetsMap;
                    // log.info(tag,"assets: START: ",assets)
                    assert(assets);
                    pubkeys = app.pubkeys;
                    log.info(tag, "pubkeys: ", pubkeys.length);
                    assert(pubkeys);
                    assert(pubkeys[0]);
                    for (i = 0; i < pubkeys.length; i++) {
                        pubkey = pubkeys[i];
                        log.info(tag, "pubkey: ", pubkey);
                        assert(pubkey.pubkey);
                        assert(pubkey.type);
                        assert(pubkey.path);
                        assert(pubkey.scriptType);
                        assert(pubkey.networks);
                        assert(pubkey.networks[0]);
                    }
                    assert(app.paths);
                    _loop_1 = function (i) {
                        var path = app.paths[i];
                        // log.info(tag,' path: ',path)
                        var pubkey = app.pubkeys.find(function (pubkey) { return pubkey.path === (0, pioneer_coins_1.addressNListToBIP32)(path.addressNList); });
                        assert(pubkey);
                    };
                    for (i = 0; i < app.paths.length; i++) {
                        _loop_1(i);
                    }
                    log.info(tag, ' ****** Validate Path exists for every path * PASS * ******');
                    // //validate pubkeys
                    for (i = 0; i < app.pubkeys.length; i++) {
                        pubkey = app.pubkeys[i];
                        log.debug(tag, "pubkey: ", pubkey);
                        assert(pubkey);
                        assert(pubkey.pubkey);
                        // log.info(tag,'pubkey: ',pubkey)
                        assert(pubkey.type);
                    }
                    log.info(tag, ' ****** Validate Pubkeys Properties exist * PASS * ******');
                    console.timeEnd('start2Pubkeys');
                    log.info(tag, 'app.pubkeys.length: ', app.pubkeys.length);
                    log.info(tag, 'app.paths.length: ', app.paths.length);
                    // if(app.pubkeys.length !== app.paths.length) throw Error('Missing pubkeys! failed to sync')
                    tag = tag + " | checkpoint1 | ";
                    _loop_2 = function (i) {
                        var blockchain = blockchains[i];
                        log.debug(tag, 'blockchain: ', blockchain);
                        //
                        if (blockchain.indexOf('eip155') >= 0) {
                            //check for gas asset in asset map
                            var caip_1 = blockchain + "/slip44:60";
                            // log.info(tag,'caip: ',caip)
                            var asset = assets.get(caip_1);
                            // log.info(tag,'asset: ',asset)
                            assert(asset);
                            assert(app.assetsMap.get(caip_1));
                            var assetInfo = app.assetsMap.get(caip_1);
                            // console.log(tag,'assetInfo: ',assetInfo)
                            assert(assetInfo);
                        }
                        var chain = pioneer_caip_1.NetworkIdToChain[blockchain];
                        assert(chain);
                        log.debug(tag, 'chain: ', chain);
                        var caip = shortListSymbolToCaip[chain];
                        log.debug(tag, 'caip: ', caip);
                        assert(caip);
                        assert(assets.get(caip));
                        //should be a balance for every gas asset
                        var balanceNative = app.balances.find(function (balance) { return balance.caip === caip; });
                        if (!balanceNative)
                            log.error(tag, 'Missing Balance for CAIP: ', caip);
                        assert(balanceNative);
                        log.debug(tag, "balanceNative: ", balanceNative);
                    };
                    for (i = 0; i < blockchains.length; i++) {
                        _loop_2(i);
                    }
                    log.info(tag, ' ****** Validated Assets for each chain exist ******');
                    tag = tag + " | checkpoint3 | ";
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
                    log.info(tag, "balances: ", app.balances.length);
                    log.info(tag, "balances: ", app.balances.length);
                    for (i = 0; i < app.balances.length; i++) {
                        balance = app.balances[i];
                        log.info(tag, "balance: ", balance.caip);
                        assert(balance);
                        assert(balance.balance);
                        assert(balance.caip);
                        assert(balance.networkId);
                        assert(balance.icon);
                        if (balance.identifier.includes('keepkey')) {
                            throw Error('Invalid legacy identifier found: ' + balance.identifier);
                        }
                    }
                    console.timeEnd('start2BalancesGas');
                    tag = tag + " | checkpoint3 | ";
                    log.debug(tag, 'balances: ', app.balances);
                    return [4 /*yield*/, app.getCharts()
                        //expect at least 1 token
                    ];
                case 3:
                    _a.sent();
                    //expect at least 1 token
                    log.debug(tag, 'balances: ', app.balances);
                    log.debug(tag, 'balances: ', app.balances.length);
                    totalValueUsd = 0;
                    networkTotals = {};
                    seenIdentifiers = new Set();
                    for (i = 0; i < app.balances.length; i++) {
                        balance = app.balances[i];
                        // log.info(tag, "balance: ", balance);
                        // Check for duplicate identifier
                        if (seenIdentifiers.has(balance.identifier)) {
                            throw new Error("Duplicate identifier found: ".concat(balance.identifier));
                        }
                        seenIdentifiers.add(balance.identifier);
                        // Check if balance, caip, and valueUsd are valid
                        assert(balance);
                        assert(balance.networkId);
                        assert(balance.caip);
                        valueUsd = parseFloat(balance.valueUsd);
                        if (isNaN(valueUsd)) {
                            log.warn(tag, "Skipping balance with invalid valueUsd: ".concat(balance.valueUsd));
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
                        }
                        else {
                            log.warn(tag, "Skipping balance without networkId: ".concat(JSON.stringify(balance)));
                        }
                    }
                    log.info(tag, 'totalValueUsd: ', totalValueUsd);
                    log.info(tag, 'networkTotals: ', networkTotals);
                    log.info(tag, 'dashboard', app.dashboard);
                    // Test blockchain reconfiguration to Bitcoin only
                    log.info(tag, ' ****** Testing Blockchain Reconfiguration to Bitcoin Only ******');
                    initialBlockchains = __spreadArray([], app.blockchains, true);
                    initialPubkeys = __spreadArray([], app.pubkeys, true);
                    initialBalances = __spreadArray([], app.balances, true);
                    bitcoinOnly_1 = ['bip122:000000000019d6689c085ae165831e93'] // Bitcoin mainnet networkId
                    ;
                    return [4 /*yield*/, app.setBlockchains(bitcoinOnly_1)
                        // Force sync to update all state
                    ];
                case 4:
                    _a.sent();
                    // Force sync to update all state
                    return [4 /*yield*/, app.sync()
                        // Verify blockchain configuration
                    ];
                case 5:
                    // Force sync to update all state
                    _a.sent();
                    // Verify blockchain configuration
                    assert.strictEqual(app.blockchains.length, 1, 'Should only have one blockchain configured');
                    assert.strictEqual(app.blockchains[0], bitcoinOnly_1[0], 'Should be configured for Bitcoin only');
                    bitcoinPubkeys = app.pubkeys.filter(function (pubkey) {
                        return pubkey.networks.includes(bitcoinOnly_1[0]);
                    });
                    assert(bitcoinPubkeys.length > 0, 'Should have at least one Bitcoin pubkey');
                    // Log pubkey information for debugging
                    log.info(tag, 'Bitcoin pubkeys:', bitcoinPubkeys.map(function (p) { return ({
                        networks: p.networks,
                        pubkey: p.pubkey
                    }); }));
                    bitcoinBalances = app.balances.filter(function (balance) {
                        return balance.networkId === bitcoinOnly_1[0] ||
                            balance.caip.toLowerCase().startsWith('bip122:000000000019d6689c085ae165831e93');
                    });
                    assert(bitcoinBalances.length > 0, 'Should have at least one Bitcoin balance');
                    // Verify dashboard reflects Bitcoin only
                    assert(app.dashboard.networks.length === 1, 'Dashboard should only show one network');
                    assert(app.dashboard.networks[0].networkId === bitcoinOnly_1[0], 'Dashboard network should be Bitcoin');
                    log.info(tag, ' ****** Successfully Verified Bitcoin-Only Configuration ******');
                    // Log the changes
                    log.info(tag, 'Blockchains reduced from', initialBlockchains.length, 'to', app.blockchains.length);
                    log.info(tag, 'Bitcoin pubkeys found:', bitcoinPubkeys.length);
                    log.info(tag, 'Bitcoin balances found:', bitcoinBalances.length);
                    console.log("************************* TEST PASS *************************");
                    console.timeEnd('start2end');
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    log.error(e_1);
                    //process
                    process.exit(666);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
};
test_service();
