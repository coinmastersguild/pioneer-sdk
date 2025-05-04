"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var console_1 = require("console");
var dotenv = require("dotenv");
// Load environment variables from .env file
dotenv.config();
var express = require('express');
var cors = require('cors');
var expressApp = express();
var PORT = process.env.PORT || 3001;
// Enable CORS and JSON parsing
expressApp.use(cors());
expressApp.use(express.json());
// Store active SSE sessions
var sessions = new Map();
var log = require("@pioneer-platform/loggerdog")();
var assert = require('assert');
var SDK = require('@coinmasters/pioneer-sdk');
var wait = require('wait-promise');
var _a = require('@pioneer-platform/pioneer-caip'), ChainToNetworkId = _a.ChainToNetworkId, shortListSymbolToCaip = _a.shortListSymbolToCaip;
var sleep = wait.sleep;
var pioneer_coins_1 = require("@pioneer-platform/pioneer-coins");
// Type imports (using require since this is a CommonJS module)
// @ts-ignore
var types = require('@coinmasters/types');
var WalletOption = types.WalletOption, getChainEnumValue = types.getChainEnumValue, NetworkIdToChain = types.NetworkIdToChain, Chain = types.Chain;
// Validate environment variables
if (!process.env.KEEPKEY_API_KEY) {
    console_1.default.error("KEEPKEY_API_KEY environment variable is not set. Please set it before running the server.");
    process.exit(1);
}
if (!process.env.ADMIN_USERNAME) {
    console_1.default.warn("ADMIN_USERNAME environment variable is not set, using default value.");
}
if (!process.env.ADMIN_KEY) {
    console_1.default.warn("ADMIN_KEY environment variable is not set, using default value.");
}
var adminUsername = process.env.ADMIN_USERNAME || 'tester123';
var adminKey = process.env.ADMIN_KEY || '123456';
var keepkeyApiKey = process.env.KEEPKEY_API_KEY;
var TAG = " | pioneer-mcp | ";
var spec = 'https://pioneers.dev/spec/swagger.json';
console_1.default.log("spec: ", spec);
// Default supported blockchains
var AllChainsSupported = [
    'ETH',
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
    'DASH',
    'MAYA',
    'LTC',
    'THOR'
];
var blockchains = AllChainsSupported.map(
// @ts-ignore
function (chainStr) { return ChainToNetworkId[getChainEnumValue(chainStr)]; });
// Custom nodes configuration
var nodes = [];
var node = {
    networkId: 'eip155:534352',
    service: 'https://scroll.drpc.org',
    protocol: 'EVM'
};
nodes.push(node);
// Initialize SDK
var initializeSDK = function () { return __awaiter(void 0, void 0, void 0, function () {
    var tag, paths, i, path, config, pioneerSdk_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tag = TAG + " | initializeSDK | ";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                paths = (0, pioneer_coins_1.getPaths)(blockchains);
                log.info(tag, 'paths:', paths.length);
                for (i = 0; i < paths.length; i++) {
                    path = paths[i];
                    assert(path.networks);
                }
                config = {
                    username: adminUsername,
                    queryKey: adminKey,
                    spec: spec,
                    keepkeyApiKey: keepkeyApiKey,
                    paths: paths,
                    blockchains: blockchains,
                    nodes: nodes,
                    pubkeys: [],
                    balances: [],
                };
                log.info(tag, 'Initializing SDK with configuration');
                pioneerSdk_1 = new SDK.SDK(spec, config);
                assert(pioneerSdk_1.spec);
                assert(pioneerSdk_1.spec === spec);
                // Initialize SDK
                return [4 /*yield*/, pioneerSdk_1.init({}, {})];
            case 2:
                // Initialize SDK
                _a.sent();
                log.info(tag, 'SDK initialization complete');
                // Set up event listener
                pioneerSdk_1.events.on('message', function (event) {
                    log.info(tag, 'Event received:', event);
                });
                return [2 /*return*/, pioneerSdk_1];
            case 3:
                error_1 = _a.sent();
                log.error(tag, 'Error initializing SDK:', error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
// Initialize SDK instance
var pioneerSdk;
// Verbose request logger middleware
expressApp.use(function (req, res, next) {
    var timestamp = new Date().toISOString();
    console_1.default.log('\n==== INCOMING REQUEST ====', timestamp);
    console_1.default.log("".concat(req.method, " ").concat(req.url));
    console_1.default.log('Headers:', JSON.stringify(req.headers, null, 2));
    console_1.default.log('Body:', JSON.stringify(req.body, null, 2));
    console_1.default.log('Query:', JSON.stringify(req.query, null, 2));
    console_1.default.log('==========================\n');
    // Capture and log the response
    var originalSend = res.send;
    res.send = function (body) {
        console_1.default.log('\n==== OUTGOING RESPONSE ====', new Date().toISOString());
        console_1.default.log('Status:', res.statusCode);
        console_1.default.log('Body:', body);
        console_1.default.log('===========================\n');
        return originalSend.call(this, body);
    };
    next();
});
// SSE endpoint at root path
expressApp.get('/', function (req, res) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    // Generate a session ID
    var sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    console_1.default.log("[SSE] New connection established with sessionId: ".concat(sessionId));
    // Store the SSE response object for later use
    sessions.set(sessionId, {
        sseRes: res,
        initialized: false
    });
    // First send a comment to keep the connection alive
    res.write(": ping\n\n");
    // Send the endpoint event with message path
    res.write("event: endpoint\n");
    res.write("data: /message?sessionId=".concat(sessionId, "\n\n"));
    // Heartbeat every 3 seconds to keep connection alive
    var heartbeat = setInterval(function () {
        res.write(": heartbeat\n\n");
    }, 3000);
    // Clean up on connection close
    req.on('close', function () {
        clearInterval(heartbeat);
        sessions.delete(sessionId);
        console_1.default.log("[SSE] Connection closed for sessionId: ".concat(sessionId));
    });
});
// Message endpoint to handle JSON-RPC over SSE
expressApp.post('/message', function (req, res) {
    var _a, _b;
    var sessionId = req.query.sessionId;
    if (!sessionId) {
        return res.status(400).json({
            jsonrpc: "2.0",
            error: {
                code: -32600,
                message: "Missing sessionId parameter"
            }
        });
    }
    var session = sessions.get(sessionId);
    if (!session) {
        return res.status(404).json({
            jsonrpc: "2.0",
            error: {
                code: -32600,
                message: "Invalid or expired session"
            }
        });
    }
    var sseRes = session.sseRes;
    var rpcRequest = req.body;
    // Send minimal HTTP acknowledgment
    res.json({
        jsonrpc: "2.0",
        id: rpcRequest.id,
        result: { ack: "Received ".concat(rpcRequest.method) }
    });
    try {
        // Process request and send actual response via SSE
        switch (rpcRequest.method) {
            case 'initialize':
                session.initialized = true;
                // Send ping first to keep connection alive
                sseRes.write(": initialize ping\n\n");
                sseRes.write("event: message\n");
                sseRes.write("data: ".concat(JSON.stringify({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: {
                        protocolVersion: "2024-11-05",
                        capabilities: {
                            tools: { listChanged: true },
                            resources: { listChanged: true },
                            prompts: { listChanged: false },
                            logging: {}
                        },
                        serverInfo: {
                            name: "Pioneer MCP Server",
                            version: "1.0.0"
                        }
                    }
                }), "\n\n"));
                // Send another ping to ensure data flow
                sseRes.write(": post-initialize ping\n\n");
                break;
            case 'tools/list':
                sseRes.write("event: message\n");
                sseRes.write("data: ".concat(JSON.stringify({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: {
                        tools: [
                            {
                                name: "pioneer.getInfo",
                                description: "Get general information about the Pioneer SDK",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "pioneer.getPubkeys",
                                description: "Get public keys for configured blockchains",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "pioneer.getBalances",
                                description: "Get balances for all accounts",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "pioneer.getCharts",
                                description: "Get price charts for assets",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "pioneer.getWallets",
                                description: "Get available wallets",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "pioneer.setBlockchains",
                                description: "Configure blockchain support",
                                inputSchema: {
                                    type: "object",
                                    properties: {
                                        blockchains: {
                                            type: "array",
                                            items: {
                                                type: "string"
                                            },
                                            description: "Array of blockchain networkIds"
                                        }
                                    },
                                    required: ["blockchains"]
                                }
                            },
                            {
                                name: "pioneer.getAssets",
                                description: "Get supported asset information",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "pioneer.sync",
                                description: "Sync all wallet data",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            }
                        ],
                        count: 8
                    }
                }), "\n\n"));
                break;
            case 'tools/call':
                var toolName = (_a = rpcRequest.params) === null || _a === void 0 ? void 0 : _a.name;
                var toolArgs = ((_b = rpcRequest.params) === null || _b === void 0 ? void 0 : _b.arguments) || {};
                // Handle specific tool calls
                switch (toolName) {
                    case 'pioneer.getInfo':
                        sseRes.write("event: message\n");
                        sseRes.write("data: ".concat(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                        type: "text",
                                        text: JSON.stringify({
                                            username: pioneerSdk.username,
                                            blockchains: pioneerSdk.blockchains,
                                            pubkeysCount: pioneerSdk.pubkeys.length,
                                            balancesCount: pioneerSdk.balances.length,
                                            assetsCount: pioneerSdk.assetsMap.size,
                                            pathsCount: pioneerSdk.paths.length
                                        })
                                    }]
                            }
                        }), "\n\n"));
                        break;
                    case 'pioneer.getPubkeys':
                        sseRes.write("event: message\n");
                        sseRes.write("data: ".concat(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                        type: "text",
                                        text: JSON.stringify(pioneerSdk.pubkeys)
                                    }]
                            }
                        }), "\n\n"));
                        break;
                    case 'pioneer.getBalances':
                        sseRes.write("event: message\n");
                        sseRes.write("data: ".concat(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                        type: "text",
                                        text: JSON.stringify(pioneerSdk.balances)
                                    }]
                            }
                        }), "\n\n"));
                        break;
                    case 'pioneer.getCharts':
                        (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, pioneerSdk.getCharts()];
                                    case 1:
                                        _a.sent();
                                        sseRes.write("event: message\n");
                                        sseRes.write("data: ".concat(JSON.stringify({
                                            jsonrpc: "2.0",
                                            id: rpcRequest.id,
                                            result: {
                                                content: [{
                                                        type: "text",
                                                        text: JSON.stringify({
                                                            message: "Charts refreshed successfully",
                                                            balancesCount: pioneerSdk.balances.length
                                                        })
                                                    }]
                                            }
                                        }), "\n\n"));
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_2 = _a.sent();
                                        console_1.default.error('Error getting charts:', error_2);
                                        sseRes.write("event: message\n");
                                        sseRes.write("data: ".concat(JSON.stringify({
                                            jsonrpc: "2.0",
                                            id: rpcRequest.id,
                                            error: {
                                                code: -32603,
                                                message: "Error getting charts",
                                                data: error_2.message || String(error_2)
                                            }
                                        }), "\n\n"));
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); })();
                        break;
                    case 'pioneer.getWallets':
                        sseRes.write("event: message\n");
                        sseRes.write("data: ".concat(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                        type: "text",
                                        text: JSON.stringify(pioneerSdk.wallets)
                                    }]
                            }
                        }), "\n\n"));
                        break;
                    case 'pioneer.setBlockchains':
                        var newBlockchains_1 = toolArgs.blockchains;
                        if (!newBlockchains_1 || !Array.isArray(newBlockchains_1)) {
                            sseRes.write("event: message\n");
                            sseRes.write("data: ".concat(JSON.stringify({
                                jsonrpc: "2.0",
                                id: rpcRequest.id,
                                error: {
                                    code: -32602,
                                    message: "Invalid blockchains parameter, must be an array"
                                }
                            }), "\n\n"));
                            break;
                        }
                        (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var error_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 3, , 4]);
                                        return [4 /*yield*/, pioneerSdk.setBlockchains(newBlockchains_1)];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, pioneerSdk.sync()];
                                    case 2:
                                        _a.sent();
                                        sseRes.write("event: message\n");
                                        sseRes.write("data: ".concat(JSON.stringify({
                                            jsonrpc: "2.0",
                                            id: rpcRequest.id,
                                            result: {
                                                content: [{
                                                        type: "text",
                                                        text: JSON.stringify({
                                                            message: "Blockchains updated successfully",
                                                            blockchains: pioneerSdk.blockchains
                                                        })
                                                    }]
                                            }
                                        }), "\n\n"));
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_3 = _a.sent();
                                        console_1.default.error('Error setting blockchains:', error_3);
                                        sseRes.write("event: message\n");
                                        sseRes.write("data: ".concat(JSON.stringify({
                                            jsonrpc: "2.0",
                                            id: rpcRequest.id,
                                            error: {
                                                code: -32603,
                                                message: "Error setting blockchains",
                                                data: error_3.message || String(error_3)
                                            }
                                        }), "\n\n"));
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); })();
                        break;
                    case 'pioneer.getAssets':
                        var assetsEntries = Array.from(pioneerSdk.assetsMap.entries());
                        var assets = assetsEntries.map(function (_a) {
                            var caip = _a[0], asset = _a[1];
                            return __assign({ caip: caip }, asset);
                        });
                        sseRes.write("event: message\n");
                        sseRes.write("data: ".concat(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                        type: "text",
                                        text: JSON.stringify(assets)
                                    }]
                            }
                        }), "\n\n"));
                        break;
                    case 'pioneer.sync':
                        (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var error_4;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, pioneerSdk.sync()];
                                    case 1:
                                        _a.sent();
                                        sseRes.write("event: message\n");
                                        sseRes.write("data: ".concat(JSON.stringify({
                                            jsonrpc: "2.0",
                                            id: rpcRequest.id,
                                            result: {
                                                content: [{
                                                        type: "text",
                                                        text: JSON.stringify({
                                                            message: "Sync completed successfully",
                                                            pubkeysCount: pioneerSdk.pubkeys.length,
                                                            balancesCount: pioneerSdk.balances.length
                                                        })
                                                    }]
                                            }
                                        }), "\n\n"));
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_4 = _a.sent();
                                        console_1.default.error('Error syncing SDK:', error_4);
                                        sseRes.write("event: message\n");
                                        sseRes.write("data: ".concat(JSON.stringify({
                                            jsonrpc: "2.0",
                                            id: rpcRequest.id,
                                            error: {
                                                code: -32603,
                                                message: "Error syncing SDK",
                                                data: error_4.message || String(error_4)
                                            }
                                        }), "\n\n"));
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); })();
                        break;
                    default:
                        sseRes.write("event: message\n");
                        sseRes.write("data: ".concat(JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            error: {
                                code: -32601,
                                message: "No such tool '".concat(toolName, "'")
                            }
                        }), "\n\n"));
                }
                break;
            default:
                sseRes.write("event: message\n");
                sseRes.write("data: ".concat(JSON.stringify({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    error: {
                        code: -32601,
                        message: "Method '".concat(rpcRequest.method, "' not recognized")
                    }
                }), "\n\n"));
        }
    }
    catch (error) {
        console_1.default.error('Error processing SSE request:', error);
        sseRes.write("event: message\n");
        sseRes.write("data: ".concat(JSON.stringify({
            jsonrpc: "2.0",
            id: rpcRequest.id,
            error: {
                code: -32603,
                message: "Internal server error",
                data: error.message || String(error)
            }
        }), "\n\n"));
    }
});
// Start the server and initialize the SDK
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, initializeSDK()];
                case 1:
                    // Initialize the SDK first
                    pioneerSdk = _a.sent();
                    // Start the Express server
                    expressApp.listen(PORT, function () {
                        console_1.default.log("Pioneer MCP server running at http://localhost:".concat(PORT));
                        console_1.default.log('Available endpoints:');
                        console_1.default.log('  POST /mcp/request - JSON-RPC endpoint for direct method calls');
                        console_1.default.log('  GET/POST /mcp - MCP protocol endpoints for Cursor integration');
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console_1.default.error('Failed to start server:', error_5);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Main MCP endpoint for JSON-RPC requests
expressApp.post('/mcp/request', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var rpcRequest, _a, newBlockchains, assetsEntries2, assets2, error_6;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console_1.default.log('Received request:', req.body);
                rpcRequest = req.body;
                // Basic validation
                if (!rpcRequest || !rpcRequest.method) {
                    return [2 /*return*/, res.status(400).json({
                            jsonrpc: "2.0",
                            id: (rpcRequest === null || rpcRequest === void 0 ? void 0 : rpcRequest.id) || null,
                            error: {
                                code: -32600,
                                message: "Invalid request"
                            }
                        })];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 16, , 17]);
                _a = rpcRequest.method;
                switch (_a) {
                    case 'pioneer.getInfo': return [3 /*break*/, 2];
                    case 'pioneer.getPubkeys': return [3 /*break*/, 3];
                    case 'pioneer.getBalances': return [3 /*break*/, 4];
                    case 'pioneer.getCharts': return [3 /*break*/, 5];
                    case 'pioneer.getWallets': return [3 /*break*/, 7];
                    case 'pioneer.setBlockchains': return [3 /*break*/, 8];
                    case 'pioneer.getAssets': return [3 /*break*/, 11];
                    case 'pioneer.sync': return [3 /*break*/, 12];
                }
                return [3 /*break*/, 14];
            case 2: return [2 /*return*/, res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: {
                        username: pioneerSdk.username,
                        blockchains: pioneerSdk.blockchains,
                        pubkeysCount: pioneerSdk.pubkeys.length,
                        balancesCount: pioneerSdk.balances.length,
                        assetsCount: pioneerSdk.assetsMap.size,
                        pathsCount: pioneerSdk.paths.length
                    }
                })];
            case 3: return [2 /*return*/, res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: pioneerSdk.pubkeys
                })];
            case 4: return [2 /*return*/, res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: pioneerSdk.balances
                })];
            case 5: return [4 /*yield*/, pioneerSdk.getCharts()];
            case 6:
                _c.sent();
                return [2 /*return*/, res.json({
                        jsonrpc: "2.0",
                        id: rpcRequest.id,
                        result: {
                            message: "Charts refreshed successfully",
                            balancesCount: pioneerSdk.balances.length
                        }
                    })];
            case 7: return [2 /*return*/, res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: pioneerSdk.wallets
                })];
            case 8:
                newBlockchains = (_b = rpcRequest.params) === null || _b === void 0 ? void 0 : _b.blockchains;
                if (!newBlockchains || !Array.isArray(newBlockchains)) {
                    return [2 /*return*/, res.json({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            error: {
                                code: -32602,
                                message: "Invalid blockchains parameter, must be an array"
                            }
                        })];
                }
                return [4 /*yield*/, pioneerSdk.setBlockchains(newBlockchains)];
            case 9:
                _c.sent();
                return [4 /*yield*/, pioneerSdk.sync()];
            case 10:
                _c.sent();
                return [2 /*return*/, res.json({
                        jsonrpc: "2.0",
                        id: rpcRequest.id,
                        result: {
                            message: "Blockchains updated successfully",
                            blockchains: pioneerSdk.blockchains
                        }
                    })];
            case 11:
                assetsEntries2 = Array.from(pioneerSdk.assetsMap.entries());
                assets2 = assetsEntries2.map(function (_a) {
                    var caip = _a[0], asset = _a[1];
                    return __assign({ caip: caip }, asset);
                });
                return [2 /*return*/, res.json({
                        jsonrpc: "2.0",
                        id: rpcRequest.id,
                        result: assets2
                    })];
            case 12: return [4 /*yield*/, pioneerSdk.sync()];
            case 13:
                _c.sent();
                return [2 /*return*/, res.json({
                        jsonrpc: "2.0",
                        id: rpcRequest.id,
                        result: {
                            message: "Sync completed successfully",
                            pubkeysCount: pioneerSdk.pubkeys.length,
                            balancesCount: pioneerSdk.balances.length
                        }
                    })];
            case 14: return [2 /*return*/, res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    error: {
                        code: -32601,
                        message: "Method '".concat(rpcRequest.method, "' not found")
                    }
                })];
            case 15: return [3 /*break*/, 17];
            case 16:
                error_6 = _c.sent();
                console_1.default.error('Error processing request:', error_6);
                return [2 /*return*/, res.status(500).json({
                        jsonrpc: "2.0",
                        id: rpcRequest.id,
                        error: {
                            code: -32603,
                            message: "Internal server error",
                            data: error_6.message || String(error_6)
                        }
                    })];
            case 17: return [2 /*return*/];
        }
    });
}); });
// MCP protocol endpoints
expressApp.get('/mcp', function (req, res) {
    res.json({
        jsonrpc: "2.0",
        result: {
            description: "Pioneer MCP Server",
            version: "1.0.0"
        }
    });
});
expressApp.post('/mcp', function (req, res) {
    console_1.default.log('Received request to /mcp:', req.body);
    var rpcRequest = req.body;
    // If it's an initialize request
    if (rpcRequest.method === 'initialize') {
        return res.json({
            jsonrpc: "2.0",
            id: rpcRequest.id,
            result: {
                protocolVersion: "2025-03-26",
                capabilities: {
                    tools: { listChanged: false },
                    resources: { subscribe: false, listChanged: false },
                    prompts: { listChanged: false }
                },
                serverInfo: {
                    name: "Pioneer MCP Server",
                    version: "1.0.0"
                }
            }
        });
    }
    // For tools/list
    if (rpcRequest.method === 'tools/list') {
        return res.json({
            jsonrpc: "2.0",
            id: rpcRequest.id,
            result: {
                tools: [
                    {
                        name: "pioneer.getInfo",
                        description: "Get general information about the Pioneer SDK",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "pioneer.getPubkeys",
                        description: "Get public keys for configured blockchains",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "pioneer.getBalances",
                        description: "Get balances for all accounts",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "pioneer.getCharts",
                        description: "Get price charts for assets",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "pioneer.getWallets",
                        description: "Get available wallets",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "pioneer.setBlockchains",
                        description: "Configure blockchain support",
                        inputSchema: {
                            type: "object",
                            properties: {
                                blockchains: {
                                    type: "array",
                                    items: {
                                        type: "string"
                                    },
                                    description: "Array of blockchain networkIds"
                                }
                            },
                            required: ["blockchains"]
                        }
                    },
                    {
                        name: "pioneer.getAssets",
                        description: "Get supported asset information",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "pioneer.sync",
                        description: "Sync all wallet data",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    }
                ],
                count: 8
            }
        });
    }
    // Forward other requests to the main handler
    return expressApp._router.handle(req, res, function () { });
});
// Start the server
startServer();
