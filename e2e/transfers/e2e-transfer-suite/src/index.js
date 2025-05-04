"use strict";
/*
    E2E testing

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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
require('dotenv').config({ path: "../../.env" });
require('dotenv').config({ path: "./../../.env" });
require("dotenv").config({ path: '../../../.env' });
require("dotenv").config({ path: '../../../../.env' });
var TAG = " | intergration-test | ";
// @ts-ignore - Using any types for fastest build
var pioneer_caip_1 = require("@pioneer-platform/pioneer-caip");
// Define a local getChainEnumValue function to replace the one from @coinmasters/types
var getChainEnumValue = function (chain) {
    return chain.toUpperCase();
};
var log = require("@pioneer-platform/loggerdog")();
var assert = require('assert');
var SDK = require('@coinmasters/pioneer-sdk');
var wait = require('wait-promise');
var ChainToNetworkId = require('@pioneer-platform/pioneer-caip').ChainToNetworkId;
var sleep = wait.sleep;
var pioneer_coins_1 = require("@pioneer-platform/pioneer-coins");
var txid;
var IS_SIGNED;
var test_service = function () {
    return __awaiter(this, void 0, void 0, function () {
        var tag, queryKey, username, spec, chains, allByCaip, blockchains, caipToAddressMap, caipToMinAmountSend, paths, config, app, resultInit, events, _loop_1, i, _loop_2, i, e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = TAG + " | test_service | ";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    //(tag,' CHECKPOINT 1');
                    console.time('start2paired');
                    console.time('start2build');
                    console.time('start2broadcast');
                    console.time('start2end');
                    queryKey = "sdk:pair-keepkey:" + Math.random();
                    log.info(tag, "queryKey: ", queryKey);
                    // const queryKey = "key:66fefdd6-7ea9-48cf-8e69-fc74afb9c45412"
                    assert(queryKey);
                    username = "user:" + Math.random();
                    assert(username);
                    spec = 'http://127.0.0.1:9001/spec/swagger.json';
                    chains = [
                        // 'DOGE',
                        // 'DASH',
                        // 'LTC', //BROKE "Missing inputs
                        // 'MATIC',
                        // 'THOR',
                        // 'GAIA',
                        // 'OSMO',
                        // 'BASE',
                        // 'OP',
                        // 'ARB',
                        // 'AVAX',
                        // 'BSC',
                        // 'XRP', //BROKE unable to broadcast
                        // 'ETH',
                        // 'MAYA',   //Amount is wrong
                        // // 'GNO',
                        // 'BCH',
                        'BTC',
                    ];
                    allByCaip = chains.map(function (chainStr) {
                        var chain = getChainEnumValue(chainStr);
                        if (chain) {
                            return ChainToNetworkId[chain];
                        }
                        return;
                    });
                    blockchains = allByCaip;
                    caipToAddressMap = {
                        'bip122:000000000019d6689c085ae165831e93/slip44:0': 'bc1qu3ghkz8788ysk7gqcvke5l0mr7skhgvpuk6dk4',
                        'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 'qpd00ucur9gl7rzwe7lqmu9yljr9ajv92q09a0jdrl',
                        'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 'XetjxEsGXKLV4mHiWPLscuNFABu9K5eVDd',
                        'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 'DNchRDXhaW2uPusLVQWZZbQ5QQnzYmarWJ',
                        'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2': 'LMcHLHjcAhMtM6SPQ7Da9acBQWcviaX2Fu',
                        'cosmos:mayachain-mainnet-v1/slip44:931': 'maya14jutklw4xaawvx0p90m45nur64mmhjz3mwmvvs',
                        'cosmos:osmosis-1/slip44:118': 'osmo1hp7gnr07wprd75f4j4aze9a94aejfcqdccqdht',
                        'cosmos:cosmoshub-4/slip44:118': 'cosmos1hp7gnr07wprd75f4j4aze9a94aejfcqdsrnape',
                        'cosmos:kaiyo-1/slip44:118': 'cosmos1hp7gnr07wprd75f4j4aze9a94aejfcqdsrnape',
                        'cosmos:thorchain-mainnet-v1/slip44:931': 'thor10t3zmsks33mgf7ajkmzj2elt553ufrxgav90ms',
                        'eip155:1/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03',
                        'eip155:8453/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03',
                        'eip155:137/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03',
                        'eip155:10/slip44:60': '0x658DE0443259a1027caA976ef9a42E6982037A03',
                        'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144': 'rGdMfVVZwUbqAxs5zucKHUpFgFTcPPj5Cn',
                        'zcash:main': 't1arQZhpGdBVRhTybXpeoDFgyNJXFEWDTaP', // ZEC
                    };
                    caipToMinAmountSend = {
                        'bip122:000000000019d6689c085ae165831e93/slip44:0': 0.0001,
                        'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 0.00001,
                        'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 0.0001,
                        'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 2,
                        'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2': 0.001,
                        'cosmos:mayachain-mainnet-v1/slip44:931': 0.01,
                        'cosmos:osmosis-1/slip44:118': 0.01,
                        'cosmos:cosmoshub-4/slip44:118': 0.01,
                        'cosmos:kaiyo-1/slip44:118': 0.01,
                        'cosmos:thorchain-mainnet-v1/slip44:931': 0.02,
                        'eip155:1/slip44:60': 0.0005,
                        'eip155:8453/slip44:60': 0.0005,
                        'eip155:137/slip44:60': 0.01,
                        'eip155:10/slip44:60': 0.001,
                        'ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144': .01,
                        'zcash:main': 0.0001, // ZEC
                    };
                    log.info(tag, "blockchains: ", allByCaip);
                    paths = (0, pioneer_coins_1.getPaths)(blockchains);
                    log.info(tag, "paths: ", paths.length);
                    config = {
                        username: username,
                        queryKey: queryKey,
                        spec: spec,
                        keepkeyApiKey: process.env.KEEPKEY_API_KEY,
                        blockchains: blockchains,
                        paths: paths,
                    };
                    app = new SDK.SDK(spec, config);
                    return [4 /*yield*/, app.init({}, {})
                        // log.info(tag,"resultInit: ",resultInit)
                    ];
                case 2:
                    resultInit = _a.sent();
                    // log.info(tag,"resultInit: ",resultInit)
                    log.info(tag, "wallets: ", app.wallets.length);
                    events = app.events.on('wallets', function (wallets) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            log.info(tag, "wallets: ", wallets);
                            return [2 /*return*/];
                        });
                    }); });
                    // await app.getCharts()
                    // //connect
                    assert(app.blockchains);
                    assert(app.blockchains[0]);
                    assert(app.pubkeys);
                    assert(app.pubkeys[0]);
                    assert(app.balances);
                    assert(app.balances[0]);
                    _loop_1 = function (i) {
                        var blockchain = app.blockchains[i];
                        log.info(tag, "blockchain: ", blockchain);
                        //get pubkeys for chain
                        if (blockchain.indexOf('eip155') > -1)
                            blockchain = "eip155:*";
                        log.info(tag, "blockchain: ", blockchain);
                        var pubkeys = app.pubkeys.filter(function (e) { return e.networks.includes((0, pioneer_caip_1.caipToNetworkId)(blockchain)); });
                        log.info(tag, "pubkeys: ", pubkeys);
                        assert(pubkeys[0]); //at least 1 pubkey per chain
                    };
                    //check pairing
                    // // //context should match first account
                    // let context = await app.context
                    // log.info(tag,"context: ",context)
                    // assert(context)
                    //for each chain
                    for (i = 0; i < app.blockchains.length; i++) {
                        _loop_1(i);
                    }
                    _loop_2 = function (i) {
                        var blockchain, caip, FAUCET_ADDRESS, TEST_AMOUNT, balances, balance, balanceBefore, pubkeys, balanceIdentifiers, uniqueBalanceIdentifiers, pubkeysContext, uniquePubkeys, assetContext, sendPayload, unsignedTx, signedTx, broadcast, followTx, balancesAfter, balanceAfter, balanceDiff, fee;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    blockchain = app.blockchains[i];
                                    log.info(tag, "blockchain: ", blockchain);
                                    log.info(tag, "TRANSFER: blockchain: ", app.blockchains[i]);
                                    caip = (0, pioneer_caip_1.networkIdToCaip)(app.blockchains[i]);
                                    assert(caip);
                                    log.info(tag, 'caip: ', caip);
                                    //set context
                                    return [4 /*yield*/, app.setAssetContext({ caip: caip })];
                                case 1:
                                    //set context
                                    _b.sent();
                                    FAUCET_ADDRESS = caipToAddressMap[caip];
                                    assert(FAUCET_ADDRESS);
                                    log.info(tag, 'FAUCET_ADDRESS: ', FAUCET_ADDRESS);
                                    TEST_AMOUNT = caipToMinAmountSend[caip];
                                    assert(TEST_AMOUNT);
                                    log.info(tag, 'TEST_AMOUNT: ', TEST_AMOUNT);
                                    //force sync balance for asset
                                    return [4 /*yield*/, app.getBalance(app.blockchains[i])
                                        // Fetch initial balance
                                    ];
                                case 2:
                                    //force sync balance for asset
                                    _b.sent();
                                    balances = app.balances.filter(function (e) { return e.caip === caip; });
                                    log.info(tag, 'app.assetContext: ', app.assetContext);
                                    balance = app.assetContext.balance;
                                    log.info(tag, 'Balance: ', balance);
                                    assert(balance, "".concat(tag, " Balance not found for ").concat(caip));
                                    log.info(tag, 'Balance before: ', balance);
                                    balanceBefore = balance;
                                    if (balanceBefore === 0)
                                        throw Error("YOU ARE BROKE!");
                                    if (balanceBefore < TEST_AMOUNT) {
                                        log.info(tag, 'Balance already drained! (or dust): ', balanceBefore);
                                        return [2 /*return*/, "continue"];
                                    }
                                    assert(blockchain);
                                    pubkeys = app.pubkeys.filter(function (e) { return e.networks.includes(blockchain.includes('eip155') ? 'eip155:*' : blockchain); });
                                    assert(pubkeys[0], "".concat(tag, " Public key not found for blockchain ").concat(blockchain));
                                    log.info(tag, 'Public Key: ', pubkeys[0]);
                                    //setAssetContext
                                    return [4 /*yield*/, app.setAssetContext({ caip: caip })];
                                case 3:
                                    //setAssetContext
                                    _b.sent();
                                    log.info(tag, 'Asset Context: ', app.assetContext);
                                    log.info(tag, 'Asset Context pubkeys: ', app.assetContext.pubkeys.length);
                                    log.info(tag, 'Asset Context balances: ', app.assetContext.balances.length);
                                    balanceIdentifiers = app.assetContext.balances.map(function (balance) { return balance.identifier; });
                                    uniqueBalanceIdentifiers = new Set(balanceIdentifiers);
                                    assert.strictEqual(balanceIdentifiers.length, uniqueBalanceIdentifiers.size, 'Duplicate balance identifiers found');
                                    pubkeysContext = app.assetContext.pubkeys.map(function (pubkeyObj) { return pubkeyObj.pubkey; });
                                    uniquePubkeys = new Set(pubkeysContext);
                                    assert.strictEqual(pubkeys.length, uniquePubkeys.size, 'Duplicate pubkeys found');
                                    assetContext = app.assetContext;
                                    assert(assetContext);
                                    assert(assetContext.balance);
                                    assert(assetContext.caip);
                                    assert(assetContext.priceUsd);
                                    assert(assetContext.valueUsd);
                                    log.info(tag, 'assetContext.priceUsd: ', assetContext.priceUsd);
                                    log.info(tag, 'assetContext.valueUsd: ', assetContext.valueUsd);
                                    // const sendPayload = {
                                    //     caip,
                                    //     isMax: true,
                                    //     to: FAUCET_ADDRESS,
                                    //     amount: balance,
                                    //     feeLevel: 5 // Options
                                    // };
                                    log.info(tag, 'Send balance: ', balance);
                                    sendPayload = {
                                        caip: caip,
                                        isMax: true,
                                        to: FAUCET_ADDRESS,
                                        amount: balance,
                                        feeLevel: 5 // Options
                                    };
                                    log.info(tag, 'Send Payload: ', sendPayload);
                                    return [4 /*yield*/, app.buildTx(sendPayload)];
                                case 4:
                                    unsignedTx = _b.sent();
                                    log.info(tag, 'unsignedTx: ', unsignedTx);
                                    return [4 /*yield*/, app.signTx({ caip: caip, unsignedTx: unsignedTx })];
                                case 5:
                                    signedTx = _b.sent();
                                    log.info(tag, 'signedTx: ', signedTx);
                                    return [4 /*yield*/, app.broadcastTx(caip, signedTx)];
                                case 6:
                                    broadcast = _b.sent();
                                    assert(broadcast);
                                    log.info(tag, 'broadcast: ', broadcast);
                                    return [4 /*yield*/, app.followTransaction(caip, broadcast)];
                                case 7:
                                    followTx = _b.sent();
                                    log.info(tag, 'Follow Transaction: ', followTx);
                                    // Fetch new balance
                                    return [4 /*yield*/, app.getBalance(app.blockchains[i])];
                                case 8:
                                    // Fetch new balance
                                    _b.sent();
                                    balancesAfter = app.balances.filter(function (e) { return e.caip === caip; });
                                    balanceAfter = balancesAfter[0];
                                    assert(balanceAfter, "".concat(tag, " Balance not found after transaction"));
                                    log.info(tag, 'Balance after: ', balanceAfter);
                                    balanceDiff = balanceBefore - balanceAfter.balance;
                                    if (balanceDiff === 0)
                                        throw new Error("".concat(tag, " Balance did not change after transaction"));
                                    fee = balanceDiff - TEST_AMOUNT;
                                    // Log differences and fee
                                    log.info(tag, "Balance Before: ".concat(balanceBefore));
                                    log.info(tag, "Balance After: ".concat(balanceAfter.balance));
                                    log.info(tag, "Amount Sent: ".concat(TEST_AMOUNT));
                                    log.info(tag, "Fee Calculated: ".concat(fee));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 3;
                case 3:
                    if (!(i < app.blockchains.length)) return [3 /*break*/, 6];
                    return [5 /*yield**/, _loop_2(i)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 3];
                case 6:
                    log.info("************************* TEST PASS *************************");
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _a.sent();
                    log.error(e_1);
                    //process
                    process.exit(666);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
};
test_service();
