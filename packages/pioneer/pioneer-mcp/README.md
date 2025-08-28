# Pioneer MCP Server

A specialized Model Context Protocol (MCP) server implementation that wraps the Pioneer SDK, enabling AI assistants (Claude, Cursor, Cline) to access cryptocurrency wallets and blockchain functionality through a standardized interface.

## Overview

This project provides an MCP-compliant server built with:
- TypeScript
- Express
- TSOA (TypeScript OpenAPI) for REST API
- MCP (Model Context Protocol) for AI tool integration
- Pioneer SDK for cryptocurrency wallet and blockchain operations

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or pnpm (preferred)
- PM2 for process management (optional)

## Installation

1. Navigate to the pioneer-mcp directory
```bash
cd projects/pioneer-sdk/packages/pioneer/pioneer-mcp
```

2. Install dependencies
```bash
npm install
```

3. Build the project
```bash
npm run build
```

## Configuration

Copy the `.env.example` file to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials and API keys.

## Running the Server

### Development Mode
```bash
npm run dev      # Build and start
npm run watch    # Watch for TypeScript changes
```

### Production Mode
```bash
npm start        # Start the server (requires built files)
npm run start-with-build  # Build and then start
```

### Using PM2 (Recommended for Production)
```bash
npm run pm2:start   # Start the server with PM2
npm run pm2:stop    # Stop the server
npm run pm2:logs    # View logs
npm run pm2:monit   # Monitor the server
```

### Testing
```bash
node test-mcp.js    # Run basic connectivity tests
```

## API Endpoints

### MCP Protocol Endpoints
- `GET /` - Server-Sent Events (SSE) endpoint for MCP connections
- `POST /message?sessionId={id}` - Message endpoint for MCP JSON-RPC calls
- `GET /mcp` - MCP server information
- `POST /mcp` - MCP initialization and tool calls

### Direct JSON-RPC Endpoint
- `POST /mcp/request` - Direct JSON-RPC calls without SSE

## MCP Tools
The server provides the following MCP tools:

### Core Tools
- `pioneer.getInfo` - Get general information about the Pioneer SDK
- `pioneer.getPubkeys` - Get public keys for configured blockchains
- `pioneer.getBalances` - Get balances for all accounts
- `pioneer.getCharts` - Get price charts for assets
- `pioneer.getWallets` - Get available wallets
- `pioneer.setBlockchains` - Configure blockchain support
- `pioneer.getAssets` - Get supported asset information
- `pioneer.sync` - Sync all wallet data

## Server Details

- **Default Port**: 9005 (configurable via PORT env variable)
- **Protocol**: MCP 2024-11-05
- **Transport**: Server-Sent Events (SSE) + HTTP POST

## Project Structure

```
src/
├── controllers/
│   └── PioneerController.ts  # Pioneer SDK controller
├── services/
│   └── PioneerService.ts     # SDK wrapper service
├── routes/                   # Auto-generated routes (via TSOA)
└── app.ts                    # Combined REST API and MCP server
```

## Client Usage Example

```javascript
// Initialize the Pioneer SDK via MCP
const response = await fetch('/message?sessionId=your-session-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "1",
    method: "tools/invoke",
    params: {
      name: "pioneer_sdk_initialize",
      params: {
        username: "myUsername",
        queryKey: "apiKey123",
        blockchains: ["ETH", "BTC", "MATIC"]
      }
    }
  })
});

// Get balances
const balancesResponse = await fetch('/message?sessionId=your-session-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "2",
    method: "tools/invoke",
    params: {
      name: "pioneer_sdk_getBalances",
      params: {
        refresh: true
      }
    }
  })
});
```

## MCP Client Configuration

### For Claude Desktop App
Add to your Claude configuration:
```json
{
  "mcpServers": {
    "pioneer": {
      "command": "node",
      "args": ["/path/to/pioneer-mcp/dist/app.js"]
    }
  }
}
```

### For Cursor/Cline
The server runs as a standalone HTTP service on port 9005.

## Security Considerations

- The MCP server requires API keys for initialization
- All sensitive data is handled securely
- No secrets are stored in the code
- Environment variables are used for configuration

## Contributing

Please follow the Pioneer Guild development principles when contributing to this project:
- Write clean, well-documented code
- Focus on reliability and security
- Create comprehensive tests
- Document all changes and features 