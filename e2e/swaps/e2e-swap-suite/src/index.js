"use strict";
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
require('dotenv').config({ path: "./../../.env" });
require("dotenv").config({ path: '../../../.env' });
require("dotenv").config({ path: '../../../../.env' });
var TAG = " | test swap suite | ";
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
var test_service = function () {
    return __awaiter(this, void 0, void 0, function () {
        var tag, queryKey, username, chains, allByCaip, blockchains, caipToMinAmountSend, paths, spec, config, app, _loop_1, i, hardcodedPermutations, i, _a, caipIn, caipOut, swapPayload, txid, error_1, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    tag = TAG + " | test_service | ";
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    console.time('start2paired');
                    console.time('start2build');
                    console.time('start2broadcast');
                    console.time('start2end');
                    queryKey = "sdk:pair-keepkey:" + Math.random();
                    log.info(tag, "queryKey: ", queryKey);
                    assert(queryKey);
                    username = "user:" + Math.random();
                    assert(username);
                    chains = [
                        'DASH',
                        'BTC',
                        'DOGE',
                        'ETH',
                        'THOR'
                    ];
                    allByCaip = chains.map(function (chainStr) {
                        var chain = getChainEnumValue(chainStr);
                        if (chain) {
                            return ChainToNetworkId[chain];
                        }
                        return undefined;
                    }).filter(Boolean);
                    blockchains = allByCaip;
                    caipToMinAmountSend = {
                        'bip122:000000000019d6689c085ae165831e93/slip44:0': 0.0001,
                        'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 0.0001,
                        'eip155:1/slip44:60': 0.0005,
                        'cosmos:thorchain-mainnet-v1/slip44:931': 2,
                        'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 50,
                        'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 0.001, // BCH
                    };
                    paths = (0, pioneer_coins_1.getPaths)(blockchains);
                    spec = 'http://127.0.0.1:9001/spec/swagger.json';
                    config = {
                        username: username,
                        queryKey: queryKey,
                        spec: spec,
                        keepkeyApiKey: process.env.KEEPKEY_API_KEY,
                        blockchains: blockchains,
                        paths: paths,
                    };
                    app = new SDK.SDK(spec, config);
                    return [4 /*yield*/, app.init({}, {})];
                case 2:
                    _b.sent();
                    _loop_1 = function (i) {
                        var blockchain = blockchains[i];
                        log.info(tag, 'blockchain: ', blockchain);
                        //
                        var assets = app.assetsMap;
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
                        var caip = pioneer_caip_1.shortListSymbolToCaip[chain];
                        log.debug(tag, 'caip: ', caip);
                        assert(caip);
                        assert(assets.get(caip));
                        //should be a balance for every gas asset
                        var balanceNative = app.balances.find(function (balance) { return balance.caip === caip; });
                        assert(balanceNative);
                        log.debug(tag, "balanceNative: ", balanceNative);
                    };
                    //validate pubkeys for all chains
                    for (i = 0; i < blockchains.length; i++) {
                        _loop_1(i);
                    }
                    hardcodedPermutations = [
                        // { caipIn: "bip122:00000000001a91e3dace36e2be3bf030/slip44:3", caipOut: "cosmos:thorchain-mainnet-v1/slip44:931" }, // DOGE to RUNE
                        { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "eip155:1/slip44:60" }, // RUNE to ETH
                        // { caipIn: "eip155:1/slip44:60", caipOut: "bip122:000000000019d6689c085ae165831e93/slip44:0" }, // ETH to BTC
                        // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "eip155:1/slip44:60" }, // RUNE to ETH
                        // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "bip122:00000000001a91e3dace36e2be3bf030/slip44:3" }, // RUNE to DOGE
                        // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "bip122:000000000000000000651ef99cb9fcbe/slip44:145" }, // RUNE to BCH
                        // { caipIn: "cosmos:thorchain-mainnet-v1/slip44:931", caipOut: "bip122:000007d91d1254d60e2dd1ae58038307/slip44:5" }, // RUNE to DASH
                    ];
                    i = 0;
                    _b.label = 3;
                case 3:
                    if (!(i < hardcodedPermutations.length)) return [3 /*break*/, 8];
                    _a = hardcodedPermutations[i], caipIn = _a.caipIn, caipOut = _a.caipOut;
                    swapPayload = {
                        caipIn: caipIn,
                        caipOut: caipOut,
                        //@ts-ignore
                        amount: caipToMinAmountSend[caipIn] || 0.0001,
                        slippagePercentage: 5,
                    };
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    log.info(tag, 'swapPayload: ', swapPayload);
                    return [4 /*yield*/, app.swap(swapPayload)];
                case 5:
                    txid = _b.sent();
                    log.info('txid: ', txid);
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _b.sent();
                    console.error("Failed to swap from ".concat(caipIn, " to ").concat(caipOut, ":"), error_1);
                    return [3 /*break*/, 7];
                case 7:
                    i++;
                    return [3 /*break*/, 3];
                case 8:
                    console.log("************************* TEST PASS *************************");
                    return [3 /*break*/, 10];
                case 9:
                    e_1 = _b.sent();
                    log.error(e_1);
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
};
test_service();
