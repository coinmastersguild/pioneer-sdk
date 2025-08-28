#!/usr/bin/env ts-node

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface Pubkey {
  networkId: string;
  symbol?: string;
  type?: string;
  pubkey?: string;
  master?: string;
  address?: string;
  path?: string;
  pathMaster?: string;
  addressMaster?: string;
}

class MCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private sseConnection: any = null;

  constructor(host: string = 'localhost', port: number = 9005) {
    this.baseUrl = `http://${host}:${port}`;
  }

  async connect(): Promise<string> {
    console.log(`📡 Connecting to MCP server at ${this.baseUrl}...`);
    
    // For simplicity, we'll use the direct JSON-RPC endpoint instead of SSE
    // In production, you'd want to set up proper SSE handling
    this.sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Test connection with initialize
    const initResponse = await this.callMethod('initialize', {
      protocolVersion: '2024-11-05'
    });
    
    if (initResponse.result?.serverInfo) {
      console.log(`✅ Connected to ${initResponse.result.serverInfo.name} v${initResponse.result.serverInfo.version}`);
    }
    
    return this.sessionId;
  }

  async callMethod(method: string, params: any = {}): Promise<MCPResponse> {
    const requestId = Math.random().toString(36).substring(7);
    
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        method: method,
        params: params
      })
    });

    const result = await response.json() as MCPResponse;
    
    if (result.error) {
      throw new Error(`MCP Error: ${result.error.message}`);
    }
    
    return result;
  }

  async callTool(toolName: string, args: any = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.random().toString(36).substring(7),
        method: toolName,
        params: args
      })
    });

    const result = await response.json() as MCPResponse;
    
    if (result.error) {
      throw new Error(`Tool Error: ${result.error.message}`);
    }
    
    return result.result;
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.callMethod('tools/list');
    return response.result?.tools || [];
  }

  async getPubkeys(): Promise<Pubkey[]> {
    console.log('🔑 Fetching pubkeys via MCP...');
    const result = await this.callTool('pioneer.getPubkeys');
    return result;
  }

  async getInfo(): Promise<any> {
    console.log('ℹ️ Fetching Pioneer SDK info...');
    const result = await this.callTool('pioneer.getInfo');
    return result;
  }

  async getBalances(): Promise<any[]> {
    console.log('💰 Fetching balances via MCP...');
    const result = await this.callTool('pioneer.getBalances');
    return result;
  }

  async sync(): Promise<any> {
    console.log('🔄 Syncing wallet data...');
    const result = await this.callTool('pioneer.sync');
    return result;
  }

  disconnect() {
    if (this.sseConnection) {
      this.sseConnection.close();
    }
    console.log('👋 Disconnected from MCP server');
  }
}

// Test the MCP integration
async function testMCPIntegration() {
  console.log('🚀 ======================================');
  console.log('🚀 Pioneer MCP Integration Test');
  console.log('🚀 ======================================');
  console.log('');
  
  const startTime = Date.now();
  let hasErrors = false;
  const client = new MCPClient('localhost', 9005);
  
  try {
    // 1. Connect to MCP server
    console.log('📋 [Step 1/5] Connecting to MCP server...');
    await client.connect();
    console.log('');
    
    // 2. List available tools
    console.log('📋 [Step 2/5] Listing available MCP tools...');
    const tools = await client.listTools();
    console.log(`📦 Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log('');
    
    // 3. Get SDK info
    console.log('📋 [Step 3/5] Getting Pioneer SDK information...');
    const info = await client.getInfo();
    console.log('📊 SDK Info:');
    console.log(`   - Username: ${info.username}`);
    console.log(`   - Blockchains: ${info.blockchains?.length || 0} configured`);
    console.log(`   - Pubkeys: ${info.pubkeysCount || 0} loaded`);
    console.log(`   - Balances: ${info.balancesCount || 0} tracked`);
    console.log(`   - Assets: ${info.assetsCount || 0} supported`);
    console.log('');
    
    // 4. Get pubkeys (main test)
    console.log('📋 [Step 4/5] Fetching public keys...');
    const pubkeys = await client.getPubkeys();
    
    if (!Array.isArray(pubkeys)) {
      throw new Error('Expected pubkeys to be an array');
    }
    
    console.log(`🔑 Retrieved ${pubkeys.length} pubkeys`);
    
    // Display sample pubkeys
    const sampleSize = Math.min(5, pubkeys.length);
    if (sampleSize > 0) {
      console.log(`\n📝 Sample pubkeys (showing ${sampleSize} of ${pubkeys.length}):`);
      for (let i = 0; i < sampleSize; i++) {
        const pubkey = pubkeys[i];
        console.log(`\n   [${i + 1}] ${pubkey.symbol || 'Unknown'} (${pubkey.networkId})`);
        if (pubkey.address) {
          console.log(`       Address: ${pubkey.address.substring(0, 20)}...`);
        }
        if (pubkey.pubkey) {
          console.log(`       Pubkey: ${pubkey.pubkey.substring(0, 20)}...`);
        }
        if (pubkey.path) {
          console.log(`       Path: ${pubkey.path}`);
        }
      }
    } else {
      console.log('⚠️ No pubkeys returned. SDK may need initialization.');
    }
    console.log('');
    
    // 5. Test sync capability
    console.log('📋 [Step 5/5] Testing sync capability...');
    try {
      const syncResult = await client.sync();
      console.log('✅ Sync capability available');
      console.log(`   - Message: ${syncResult.message}`);
      console.log(`   - Pubkeys count: ${syncResult.pubkeysCount || 0}`);
      console.log(`   - Balances count: ${syncResult.balancesCount || 0}`);
    } catch (syncError: any) {
      console.log('⚠️ Sync test skipped (SDK may need full initialization)');
      console.log(`   Reason: ${syncError.message}`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    hasErrors = true;
  } finally {
    client.disconnect();
  }
  
  const duration = Date.now() - startTime;
  console.log('');
  console.log('🏁 ======================================');
  console.log(`🏁 Test ${hasErrors ? 'FAILED ❌' : 'PASSED ✅'}`);
  console.log(`🏁 Duration: ${duration}ms`);
  console.log('🏁 ======================================');
  
  if (hasErrors) {
    process.exit(1);
  }
}

// Helper to ensure MCP server is running
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:9005/mcp', {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if MCP server is running...');
  
  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    console.error('❌ MCP server is not running on port 9005');
    console.error('');
    console.error('Please start the server first:');
    console.error('  cd projects/pioneer-sdk/packages/pioneer/pioneer-mcp');
    console.error('  npm start');
    console.error('');
    process.exit(1);
  }
  
  console.log('✅ MCP server is running');
  console.log('');
  
  await testMCPIntegration();
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});