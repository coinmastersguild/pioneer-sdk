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
Object.defineProperty(exports, "__esModule", { value: true });
var console = require("console");
require("dotenv").config();
require('dotenv').config({ path: "../../.env" });
require('dotenv').config({ path: "./../../.env" });
require("dotenv").config({ path: '../../../.env' });
require("dotenv").config({ path: '../../../../.env' });
var TAG = " | intergration-test | ";
// import { AssetValue as AssetValueType } from '@coinmasters/core';
var log = require("@pioneer-platform/loggerdog")();
var assert = require('assert');
var SDK = require('@coinmasters/pioneer-sdk');
var wait = require('wait-promise');
var _a = require('@pioneer-platform/pioneer-caip'), ChainToNetworkId = _a.ChainToNetworkId, shortListSymbolToCaip = _a.shortListSymbolToCaip;
var sleep = wait.sleep;
//let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
// let spec = 'https://pioneers.dev/spec/swagger.json'
var spec = 'http://127.0.0.1:9001/spec/swagger.json';
// const DB = require('@coinmasters/pioneer-db-sql');
console.log("spec: ", spec);
var txid;
var IS_SIGNED;
var test_service = function () {
    return __awaiter(this, void 0, void 0, function () {
        var tag, queryKey, username, AllChainsSupported, blockchains, config, app, resultInit, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tag = TAG + " | test_service | ";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
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
                        'BTC',
                    ];
                    blockchains = AllChainsSupported.map(
                    // @ts-ignore
                    function (chainStr) { return ChainToNetworkId[getChainEnumValue(chainStr)]; });
                    log.debug(tag, "blockchains: ", blockchains);
                    log.debug(tag, "blockchains: ", blockchains.length);
                    config = {
                        username: username,
                        queryKey: queryKey,
                        spec: spec,
                        keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
                        paths: [],
                        blockchains: blockchains,
                        nodes: [],
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
                    //clear cache
                    //createPassword
                    //create mnemonic
                    //create recovery file
                    console.log("************************* TEST PASS *************************");
                    console.timeEnd('start2end');
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    log.error(e_1);
                    //process
                    process.exit(666);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
};
test_service();
