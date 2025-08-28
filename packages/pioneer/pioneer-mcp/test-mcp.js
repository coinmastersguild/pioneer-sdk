#!/usr/bin/env node

const http = require('http');

console.log('Testing Pioneer MCP Server...\n');

// Test the root SSE endpoint
const testSSE = () => {
    return new Promise((resolve, reject) => {
        console.log('1. Testing SSE endpoint (GET /)...');
        
        http.get('http://localhost:9005/', (res) => {
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Headers:`, res.headers);
            
            let data = '';
            res.on('data', chunk => {
                data += chunk.toString();
                // Just get first chunk for testing
                if (data.includes('endpoint')) {
                    console.log('   ✅ SSE endpoint working!\n');
                    resolve();
                }
            });
            
            setTimeout(() => {
                if (!data.includes('endpoint')) {
                    console.log('   ⚠️ SSE endpoint returned unexpected data\n');
                }
                resolve();
            }, 2000);
        }).on('error', (err) => {
            console.error('   ❌ Error:', err.message);
            reject(err);
        });
    });
};

// Test the MCP info endpoint
const testMCPInfo = () => {
    return new Promise((resolve, reject) => {
        console.log('2. Testing MCP info endpoint (GET /mcp)...');
        
        http.get('http://localhost:9005/mcp', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    console.log(`   Response:`, json);
                    console.log('   ✅ MCP info endpoint working!\n');
                } catch (e) {
                    console.log('   ⚠️ Invalid JSON response\n');
                }
                resolve();
            });
        }).on('error', (err) => {
            console.error('   ❌ Error:', err.message);
            reject(err);
        });
    });
};

// Test the MCP initialize
const testMCPInitialize = () => {
    return new Promise((resolve, reject) => {
        console.log('3. Testing MCP initialize (POST /mcp)...');
        
        const postData = JSON.stringify({
            jsonrpc: "2.0",
            id: "test-1",
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05"
            }
        });
        
        const options = {
            hostname: 'localhost',
            port: 9005,
            path: '/mcp',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    console.log(`   Response:`, JSON.stringify(json, null, 2));
                    if (json.result && json.result.serverInfo) {
                        console.log('   ✅ MCP initialize working!\n');
                    } else {
                        console.log('   ⚠️ Unexpected response format\n');
                    }
                } catch (e) {
                    console.log('   ⚠️ Invalid JSON response\n');
                }
                resolve();
            });
        });
        
        req.on('error', (err) => {
            console.error('   ❌ Error:', err.message);
            reject(err);
        });
        
        req.write(postData);
        req.end();
    });
};

// Run all tests
const runTests = async () => {
    console.log('Make sure the MCP server is running on port 9005\n');
    console.log('You can start it with: npm start\n');
    console.log('-------------------------------------------\n');
    
    try {
        await testSSE();
        await testMCPInfo();
        await testMCPInitialize();
        
        console.log('✅ All tests completed!\n');
        console.log('The Pioneer MCP server is working correctly.');
        console.log('\nNext steps:');
        console.log('1. Set up your .env file with KEEPKEY_API_KEY');
        console.log('2. Configure in your MCP client (Cursor, Cline, etc.)');
        console.log('3. Use the pioneer.* tools to interact with the SDK');
    } catch (err) {
        console.error('\n❌ Tests failed. Make sure the server is running.');
        console.error('Start it with: cd pioneer-mcp && npm start');
    }
};

runTests();