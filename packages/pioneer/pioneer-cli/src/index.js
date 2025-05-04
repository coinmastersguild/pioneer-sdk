#!/usr/bin/env node
"use strict";
// @ts-nocheck
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
var commander_1 = require("commander");
var chalk_1 = require("chalk");
var dotenv = require("dotenv");
var pioneer_sdk_1 = require("@coinmasters/pioneer-sdk");
// @ts-ignore - Using any types for fastest build
var pioneer_caip_1 = require("@pioneer-platform/pioneer-caip");
var pioneer_coins_1 = require("@pioneer-platform/pioneer-coins");
var ora_1 = require("ora");
// Define a local getChainEnumValue function to replace the one from @coinmasters/types
var getChainEnumValue = function (chain) {
    return chain.toUpperCase();
};
// Load environment variables
dotenv.config();
dotenv.config({ path: '../../.env' });
dotenv.config({ path: './.env' });
// Set up the command-line program
var program = new commander_1.Command();
// Version and description
program
    .name('pioneer')
    .description('Command-line interface for Pioneer SDK')
    .version('0.1.0');
// Initialize SDK function
function initializeSdk(options) {
    if (options === void 0) { options = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var spinner, spec, username, queryKey, supportedChains, chainsList, blockchains, paths, config, app, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    spinner = (0, ora_1.default)('Initializing Pioneer SDK...').start();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    spec = process.env.PIONEER_API_SPEC || 'https://pioneers.dev/spec/swagger.json';
                    username = process.env.PIONEER_USERNAME || "user:".concat(Math.random()).substring(0, 13);
                    queryKey = process.env.PIONEER_QUERY_KEY || "sdk:cli:".concat(Math.random());
                    supportedChains = [
                        'ETH',
                        'BTC',
                        'AVAX',
                        'MATIC',
                        'THOR',
                        'DOGE',
                        'BCH',
                        'LTC',
                        'GAIA',
                        'OSMO'
                    ];
                    chainsList = options.blockchains || supportedChains;
                    blockchains = chainsList.map(function (chainStr) { return pioneer_caip_1.ChainToNetworkId[getChainEnumValue(chainStr)]; });
                    spinner.text = 'Generating paths for blockchains...';
                    paths = (0, pioneer_coins_1.getPaths)(blockchains);
                    config = {
                        username: username,
                        queryKey: queryKey,
                        spec: spec,
                        keepkeyApiKey: process.env.KEEPKEY_API_KEY || 'e4ea6479-5ea4-4c7d-b824-e075101bf9fd',
                        paths: paths,
                        blockchains: blockchains,
                        nodes: [],
                        pubkeys: [],
                        balances: [],
                    };
                    spinner.text = 'Creating SDK instance...';
                    app = new pioneer_sdk_1.default(spec, config);
                    // Initialize the SDK
                    spinner.text = 'Connecting to Pioneer API...';
                    return [4 /*yield*/, app.init({}, {})];
                case 2:
                    result = _a.sent();
                    spinner.succeed('Pioneer SDK initialized successfully!');
                    // Display success information
                    console.log('\n' + chalk_1.default.green('✓') + ' Connected to Pioneer API');
                    console.log(chalk_1.default.green('✓') + ' Username: ' + chalk_1.default.cyan(username));
                    console.log(chalk_1.default.green('✓') + ' Blockchains: ' + chalk_1.default.cyan(chainsList.join(', ')));
                    console.log(chalk_1.default.green('✓') + ' Paths: ' + chalk_1.default.cyan(paths.length.toString()));
                    // Return the SDK instance
                    return [2 /*return*/, app];
                case 3:
                    error_1 = _a.sent();
                    spinner.fail('Failed to initialize Pioneer SDK');
                    console.error(chalk_1.default.red('Error:'), error_1 instanceof Error ? error_1.message : 'Unknown error');
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Hello world command
program
    .command('hello')
    .description('Initialize the SDK and display connection details')
    .option('-b, --blockchains <chains>', 'Comma-separated list of blockchains to enable (e.g., ETH,BTC,THOR)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var blockchains, sdk, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                blockchains = options.blockchains ? options.blockchains.split(',') : undefined;
                return [4 /*yield*/, initializeSdk({ blockchains: blockchains })];
            case 1:
                sdk = _a.sent();
                console.log('\n' + chalk_1.default.yellow('Pioneer SDK is ready to use!'));
                console.log(chalk_1.default.yellow('Try other commands to explore more functionality.'));
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error(chalk_1.default.red('Error:'), error_2 instanceof Error ? error_2.message : 'Unknown error');
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Add a command to show balances
program
    .command('balances')
    .description('Display balances for all enabled blockchains')
    .option('-b, --blockchains <chains>', 'Comma-separated list of blockchains to enable (e.g., ETH,BTC,THOR)')
    .option('-r, --refresh', 'Force refresh balances instead of using cache')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var blockchains, sdk, spinner, balances, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                blockchains = options.blockchains ? options.blockchains.split(',') : undefined;
                return [4 /*yield*/, initializeSdk({ blockchains: blockchains })];
            case 1:
                sdk = _a.sent();
                spinner = (0, ora_1.default)('Fetching balances...').start();
                if (!options.refresh) return [3 /*break*/, 3];
                return [4 /*yield*/, sdk.refresh()];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                balances = sdk.balances;
                spinner.succeed('Balances retrieved successfully!');
                // Display balances
                console.log('\n' + chalk_1.default.yellow('Your Balances:'));
                console.log('---------------------------------------');
                console.log(chalk_1.default.cyan('Symbol') + '\t' + chalk_1.default.cyan('Amount') + '\t\t' + chalk_1.default.cyan('Value (USD)'));
                console.log('---------------------------------------');
                if (balances.length === 0) {
                    console.log(chalk_1.default.gray('No balances found'));
                }
                else {
                    balances.forEach(function (balance) {
                        var symbol = balance.symbol || 'Unknown';
                        var amount = balance.balance || '0';
                        var value = balance.valueUsd ? "$".concat(parseFloat(balance.valueUsd).toFixed(2)) : 'N/A';
                        console.log("".concat(symbol, "\t").concat(amount, "\t\t").concat(value));
                    });
                }
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                console.error(chalk_1.default.red('Error:'), error_3 instanceof Error ? error_3.message : 'Unknown error');
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Parse command-line arguments
program.parse(process.argv);
// If no command is provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
