import console from "console";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const express = require('express');
const cors = require('cors');
const expressApp = express();
const PORT = process.env.PORT || 9005;

// Enable CORS and JSON parsing
expressApp.use(cors());
expressApp.use(express.json());

// Store active SSE sessions
const sessions = new Map();

const log = require("@pioneer-platform/loggerdog")();
const assert = require('assert');
const SDK = require('@coinmasters/pioneer-sdk');
const wait = require('wait-promise');
const {ChainToNetworkId, shortListSymbolToCaip} = require('@pioneer-platform/pioneer-caip');
const sleep = wait.sleep;
import {
    getPaths,
    addressNListToBIP32,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

// Type imports (using require since this is a CommonJS module)
// @ts-ignore
const types = require('@coinmasters/types');
const { WalletOption, getChainEnumValue, NetworkIdToChain, Chain } = types;

// Validate environment variables
if (!process.env.KEEPKEY_API_KEY) {
    console.error("KEEPKEY_API_KEY environment variable is not set. Please set it before running the server.");
    process.exit(1);
}

if (!process.env.ADMIN_USERNAME) {
    console.warn("ADMIN_USERNAME environment variable is not set, using default value.");
}

if (!process.env.ADMIN_KEY) {
    console.warn("ADMIN_KEY environment variable is not set, using default value.");
}

const adminUsername = process.env.ADMIN_USERNAME || 'tester123';
const adminKey = process.env.ADMIN_KEY || '123456';
const keepkeyApiKey = process.env.KEEPKEY_API_KEY;

const TAG = " | pioneer-mcp | ";

let spec = 'https://pioneers.dev/spec/swagger.json';
console.log("spec: ", spec);

// Default supported blockchains
let AllChainsSupported = [
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

let blockchains = AllChainsSupported.map(
    // @ts-ignore
    (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
);

// Custom nodes configuration
let nodes: Array<{
    networkId: string;
    service: string;
    protocol: string;
}> = [];

let node = {
    networkId: 'eip155:534352',
    service: 'https://scroll.drpc.org',
    protocol: 'EVM'
};
nodes.push(node);

// Initialize SDK
const initializeSDK = async () => {
    const tag = TAG + " | initializeSDK | ";
    try {
        // Get paths for the supported blockchains
        let paths = getPaths(blockchains);
        log.info(tag, 'paths:', paths.length);

        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            assert(path.networks);
        }

        // Configure SDK
        let config: any = {
            username: adminUsername,
            queryKey: adminKey,
            spec,
            keepkeyApiKey: keepkeyApiKey,
            paths,
            blockchains,
            nodes,
            pubkeys: [],
            balances: [],
        };

        log.info(tag, 'Initializing SDK with configuration');
        let pioneerSdk = new SDK.SDK(spec, config);
        assert(pioneerSdk.spec);
        assert(pioneerSdk.spec === spec);

        // Initialize SDK
        await pioneerSdk.init({}, {});
        log.info(tag, 'SDK initialization complete');

        // Set up event listener
        pioneerSdk.events.on('message', (event: any) => {
            log.info(tag, 'Event received:', event);
        });

        return pioneerSdk;
    } catch (error) {
        log.error(tag, 'Error initializing SDK:', error);
        throw error;
    }
};

// Initialize SDK instance
let pioneerSdk: any;

// Verbose request logger middleware
expressApp.use((req: any, res: any, next: any) => {
    const timestamp = new Date().toISOString();
    console.log('\n==== INCOMING REQUEST ====', timestamp);
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('==========================\n');

    // Capture and log the response
    const originalSend = res.send;
    res.send = function(body: any) {
        console.log('\n==== OUTGOING RESPONSE ====', new Date().toISOString());
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        console.log('===========================\n');
        return originalSend.call(this, body);
    };

    next();
});

// Keep root endpoint for basic health check
expressApp.get('/', (req: any, res: any) => {
    res.json({
        status: 'running',
        message: 'Pioneer MCP Server',
        sseEndpoint: '/sse',
        mcpEndpoint: '/mcp'
    });
});

// Legacy SSE endpoint (kept for backward compatibility)
expressApp.get('/sse', (req: any, res: any) => {
    // Redirect to the main MCP endpoint
    res.redirect('/mcp');
});

// Message endpoint to handle JSON-RPC over SSE for MCP
expressApp.post('/mcp/message', (req: any, res: any) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        return res.status(400).json({
            jsonrpc: "2.0",
            error: {
                code: -32600,
                message: "Missing sessionId parameter"
            }
        });
    }

    const session = sessions.get(sessionId);
    if (!session) {
        return res.status(404).json({
            jsonrpc: "2.0",
            error: {
                code: -32600,
                message: "Invalid or expired session"
            }
        });
    }

    const sseRes = session.sseRes;
    const rpcRequest = req.body;

    // Send minimal HTTP acknowledgment
    res.json({
        jsonrpc: "2.0",
        id: rpcRequest.id,
        result: { ack: `Received ${rpcRequest.method}` }
    });

    try {
        // Process request and send actual response via SSE
        switch (rpcRequest.method) {
            case 'initialize':
                session.initialized = true;

                // Send ping first to keep connection alive
                sseRes.write(`: initialize ping\n\n`);

                sseRes.write(`event: message\n`);
                sseRes.write(`data: ${JSON.stringify({
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
                })}\n\n`);

                // Send another ping to ensure data flow
                sseRes.write(`: post-initialize ping\n\n`);
                break;

            case 'tools/list':
                sseRes.write(`event: message\n`);
                sseRes.write(`data: ${JSON.stringify({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: {
                        tools: [
                            {
                                name: "keepkey.getInfo",
                                description: "Get general information about the KeepKey SDK",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "keepkey.getPubkeys",
                                description: "Get public keys for configured blockchains",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "keepkey.getBalances",
                                description: "Get balances for all accounts",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "keepkey.getCharts",
                                description: "Get price charts for assets",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "keepkey.getWallets",
                                description: "Get available wallets",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "keepkey.setBlockchains",
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
                                name: "keepkey.getAssets",
                                description: "Get supported asset information",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            },
                            {
                                name: "keepkey.sync",
                                description: "Sync all wallet data",
                                inputSchema: {
                                    type: "object",
                                    properties: {}
                                }
                            }
                        ],
                        count: 8
                    }
                })}\n\n`);
                break;

            case 'tools/call':
                const toolName = rpcRequest.params?.name;
                const toolArgs = rpcRequest.params?.arguments || {};

                // Handle specific tool calls
                switch (toolName) {
                    case 'keepkey.getInfo':
                        sseRes.write(`event: message\n`);
                        sseRes.write(`data: ${JSON.stringify({
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
                        })}\n\n`);
                        break;

                    case 'keepkey.getPubkeys':
                        sseRes.write(`event: message\n`);
                        sseRes.write(`data: ${JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                    type: "text",
                                    text: JSON.stringify(pioneerSdk.pubkeys)
                                }]
                            }
                        })}\n\n`);
                        break;

                    case 'keepkey.getBalances':
                        sseRes.write(`event: message\n`);
                        sseRes.write(`data: ${JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                    type: "text",
                                    text: JSON.stringify(pioneerSdk.balances)
                                }]
                            }
                        })}\n\n`);
                        break;

                    case 'keepkey.getCharts':
                        (async () => {
                            try {
                                await pioneerSdk.getCharts();
                                sseRes.write(`event: message\n`);
                                sseRes.write(`data: ${JSON.stringify({
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
                                })}\n\n`);
                            } catch (error: any) {
                                console.error('Error getting charts:', error);
                                sseRes.write(`event: message\n`);
                                sseRes.write(`data: ${JSON.stringify({
                                    jsonrpc: "2.0",
                                    id: rpcRequest.id,
                                    error: {
                                        code: -32603,
                                        message: "Error getting charts",
                                        data: error.message || String(error)
                                    }
                                })}\n\n`);
                            }
                        })();
                        break;

                    case 'keepkey.getWallets':
                        sseRes.write(`event: message\n`);
                        sseRes.write(`data: ${JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                    type: "text",
                                    text: JSON.stringify(pioneerSdk.wallets)
                                }]
                            }
                        })}\n\n`);
                        break;

                    case 'keepkey.setBlockchains':
                        const newBlockchains = toolArgs.blockchains;
                        if (!newBlockchains || !Array.isArray(newBlockchains)) {
                            sseRes.write(`event: message\n`);
                            sseRes.write(`data: ${JSON.stringify({
                                jsonrpc: "2.0",
                                id: rpcRequest.id,
                                error: {
                                    code: -32602,
                                    message: "Invalid blockchains parameter, must be an array"
                                }
                            })}\n\n`);
                            break;
                        }

                        (async () => {
                            try {
                                await pioneerSdk.setBlockchains(newBlockchains);
                                await pioneerSdk.sync();
                                
                                sseRes.write(`event: message\n`);
                                sseRes.write(`data: ${JSON.stringify({
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
                                })}\n\n`);
                            } catch (error: any) {
                                console.error('Error setting blockchains:', error);
                                sseRes.write(`event: message\n`);
                                sseRes.write(`data: ${JSON.stringify({
                                    jsonrpc: "2.0",
                                    id: rpcRequest.id,
                                    error: {
                                        code: -32603,
                                        message: "Error setting blockchains",
                                        data: error.message || String(error)
                                    }
                                })}\n\n`);
                            }
                        })();
                        break;

                    case 'keepkey.getAssets':
                        const assetsEntries: Array<[string, any]> = Array.from(pioneerSdk.assetsMap.entries() as Iterable<[string, any]>);
                        const assets = assetsEntries.map(([caip, asset]) => {
                            return { caip, ...asset };
                        });
                        
                        sseRes.write(`event: message\n`);
                        sseRes.write(`data: ${JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            result: {
                                content: [{
                                    type: "text",
                                    text: JSON.stringify(assets)
                                }]
                            }
                        })}\n\n`);
                        break;

                    case 'keepkey.sync':
                        (async () => {
                            try {
                                await pioneerSdk.sync();
                                
                                sseRes.write(`event: message\n`);
                                sseRes.write(`data: ${JSON.stringify({
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
                                })}\n\n`);
                            } catch (error: any) {
                                console.error('Error syncing SDK:', error);
                                sseRes.write(`event: message\n`);
                                sseRes.write(`data: ${JSON.stringify({
                                    jsonrpc: "2.0",
                                    id: rpcRequest.id,
                                    error: {
                                        code: -32603,
                                        message: "Error syncing SDK",
                                        data: error.message || String(error)
                                    }
                                })}\n\n`);
                            }
                        })();
                        break;

                    default:
                        sseRes.write(`event: message\n`);
                        sseRes.write(`data: ${JSON.stringify({
                            jsonrpc: "2.0",
                            id: rpcRequest.id,
                            error: {
                                code: -32601,
                                message: `No such tool '${toolName}'`
                            }
                        })}\n\n`);
                }
                break;

            default:
                sseRes.write(`event: message\n`);
                sseRes.write(`data: ${JSON.stringify({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    error: {
                        code: -32601,
                        message: `Method '${rpcRequest.method}' not recognized`
                    }
                })}\n\n`);
        }
    } catch (error: any) {
        console.error('Error processing SSE request:', error);
        sseRes.write(`event: message\n`);
        sseRes.write(`data: ${JSON.stringify({
            jsonrpc: "2.0",
            id: rpcRequest.id,
            error: {
                code: -32603,
                message: "Internal server error",
                data: error.message || String(error)
            }
        })}\n\n`);
    }
});

// Start the server and initialize the SDK
async function startServer() {
    try {
        // Initialize the SDK first
        pioneerSdk = await initializeSDK();
        
        // Start the Express server
        expressApp.listen(PORT, () => {
            // ASCII Art Banner
            console.log('\n');
            console.log('╔══════════════════════════════════════════════════════════════╗');
            console.log('║                                                              ║');
            console.log('║     🚀  PIONEER MCP SERVER  🚀                              ║');
            console.log('║     Model Context Protocol for Cryptocurrency Operations    ║');
            console.log('║                                                              ║');
            console.log('╚══════════════════════════════════════════════════════════════╝');
            console.log('');
            console.log('✅ Server Status: RUNNING');
            console.log(`📍 Port: ${PORT}`);
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('                         ENDPOINTS                              ');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log('🌐 SSE Endpoint (for MCP clients):');
            console.log(`   http://localhost:${PORT}/`);
            console.log('');
            console.log('📡 MCP Protocol Endpoints:');
            console.log(`   GET  http://localhost:${PORT}/mcp         (Server Info)`);
            console.log(`   POST http://localhost:${PORT}/mcp         (Initialize & Tools)`);
            console.log(`   POST http://localhost:${PORT}/message     (SSE Message Handler)`);
            console.log('');
            console.log('🔧 Direct JSON-RPC Endpoint:');
            console.log(`   POST http://localhost:${PORT}/mcp/request (Direct Tool Calls)`);
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('                      SDK INFORMATION                           ');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log(`👤 Username: ${pioneerSdk.username || 'Not configured'}`);
            console.log(`🔗 Blockchains: ${pioneerSdk.blockchains?.length || 0} configured`);
            console.log(`🔑 Pubkeys: ${pioneerSdk.pubkeys?.length || 0} loaded`);
            console.log(`💰 Balances: ${pioneerSdk.balances?.length || 0} tracked`);
            console.log(`📦 Assets: ${pioneerSdk.assetsMap?.size || 0} supported`);
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log('📝 Available MCP Tools:');
            console.log('   • keepkey.getInfo      - Get SDK information');
            console.log('   • keepkey.getPubkeys   - Get public keys');
            console.log('   • keepkey.getBalances  - Get account balances');
            console.log('   • keepkey.getCharts    - Get price charts');
            console.log('   • keepkey.getWallets   - Get available wallets');
            console.log('   • keepkey.setBlockchains - Configure blockchains');
            console.log('   • keepkey.getAssets    - Get asset information');
            console.log('   • keepkey.sync         - Sync wallet data');
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('                    CLAUDE INTEGRATION                          ');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log('🤖 Add to Claude Desktop (copy & paste):');
            console.log('');
            console.log(`   claude mcp add pioneer-mcp http://localhost:${PORT}/mcp --transport sse`);
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log('💡 Quick Test Commands:');
            console.log(`   curl http://localhost:${PORT}/mcp`);
            console.log(`   node test-mcp.js`);
            console.log('');
            console.log('🚀 Ready to accept connections!');
            console.log('');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Main MCP endpoint for JSON-RPC requests
expressApp.post('/mcp/request', async (req: any, res: any) => {
    console.log('Received request:', req.body);

    const rpcRequest = req.body;

    // Basic validation
    if (!rpcRequest || !rpcRequest.method) {
        return res.status(400).json({
            jsonrpc: "2.0",
            id: rpcRequest?.id || null,
            error: {
                code: -32600,
                message: "Invalid request"
            }
        });
    }

    try {
        // Process different methods
        switch (rpcRequest.method) {
            case 'keepkey.getInfo':
                return res.json({
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
                });

            case 'keepkey.getPubkeys':
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: pioneerSdk.pubkeys
                });

            case 'keepkey.getBalances':
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: pioneerSdk.balances
                });

            case 'keepkey.getCharts':
                await pioneerSdk.getCharts();
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: {
                        message: "Charts refreshed successfully",
                        balancesCount: pioneerSdk.balances.length
                    }
                });

            case 'keepkey.getWallets':
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: pioneerSdk.wallets
                });

            case 'keepkey.setBlockchains':
                const newBlockchains = rpcRequest.params?.blockchains;
                if (!newBlockchains || !Array.isArray(newBlockchains)) {
                    return res.json({
                        jsonrpc: "2.0",
                        id: rpcRequest.id,
                        error: {
                            code: -32602,
                            message: "Invalid blockchains parameter, must be an array"
                        }
                    });
                }

                await pioneerSdk.setBlockchains(newBlockchains);
                await pioneerSdk.sync();
                
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: {
                        message: "Blockchains updated successfully",
                        blockchains: pioneerSdk.blockchains
                    }
                });

            case 'keepkey.getAssets':
                const assetsEntries2: Array<[string, any]> = Array.from(pioneerSdk.assetsMap.entries() as Iterable<[string, any]>);
                const assets2 = assetsEntries2.map(([caip, asset]) => {
                    return { caip, ...asset };
                });
                
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: assets2
                });

            case 'keepkey.sync':
                await pioneerSdk.sync();
                
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    result: {
                        message: "Sync completed successfully",
                        pubkeysCount: pioneerSdk.pubkeys.length,
                        balancesCount: pioneerSdk.balances.length
                    }
                });

            default:
                return res.json({
                    jsonrpc: "2.0",
                    id: rpcRequest.id,
                    error: {
                        code: -32601,
                        message: `Method '${rpcRequest.method}' not found`
                    }
                });
        }
    } catch (error: any) {
        console.error('Error processing request:', error);
        return res.status(500).json({
            jsonrpc: "2.0",
            id: rpcRequest.id,
            error: {
                code: -32603,
                message: "Internal server error",
                data: error.message || String(error)
            }
        });
    }
});

// MCP SSE endpoint - this is what Claude connects to
expressApp.get('/mcp', (req: any, res: any) => {
    // Set SSE headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Generate a session ID
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    console.log(`[SSE] New MCP connection established with sessionId: ${sessionId}`);

    // Store the SSE response object for later use
    sessions.set(sessionId, {
        sseRes: res,
        initialized: false
    });

    // Send initial ping to establish connection
    res.write(`: ping\n\n`);

    // Send the endpoint event with message path
    res.write(`event: endpoint\n`);
    res.write(`data: /mcp/message?sessionId=${sessionId}\n\n`);

    // Heartbeat every 3 seconds to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(`: heartbeat\n\n`);
    }, 3000);

    // Clean up on connection close
    req.on('close', () => {
        clearInterval(heartbeat);
        sessions.delete(sessionId);
        console.log(`[SSE] MCP connection closed for sessionId: ${sessionId}`);
    });
});

expressApp.post('/mcp', (req: any, res: any) => {
    console.log('Received request to /mcp:', req.body);

    const rpcRequest = req.body;

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
                        name: "keepkey.getInfo",
                        description: "Get general information about the KeepKey SDK",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "keepkey.getPubkeys",
                        description: "Get public keys for configured blockchains",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "keepkey.getBalances",
                        description: "Get balances for all accounts",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "keepkey.getCharts",
                        description: "Get price charts for assets",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "keepkey.getWallets",
                        description: "Get available wallets",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "keepkey.setBlockchains",
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
                        name: "keepkey.getAssets",
                        description: "Get supported asset information",
                        inputSchema: {
                            type: "object",
                            properties: {}
                        }
                    },
                    {
                        name: "keepkey.sync",
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
    return expressApp._router.handle(req, res, () => {});
});

// Start the server
startServer();
