# Pioneer MCP Server

A specialized Model Context Protocol (MCP) server implementation that wraps the Pioneer SDK, enabling AI tools to access cryptocurrency wallets and blockchain functionality.

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

1. Clone the repository
```bash
git clone https://github.com/keepkey/keepkey-stack.git
cd keepkey-stack/projects/pioneer-sdk
```

2. Install dependencies
```bash
pnpm install
```

3. Build the project
```bash
cd packages/pioneer/pioneer-mcp
pnpm build
```

## Configuration

Copy the `.env.example` file to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials and API keys.

## Running the Server

### Simple Start
```bash
pnpm dev
```

### Using PM2 (Recommended for Production)
```bash
pnpm pm2:start  # Start the server with PM2
pnpm pm2:stop   # Stop the server
pnpm pm2:logs   # View logs
pnpm pm2:monit  # Monitor the server
```

### Production Mode
```bash
pnpm start
```

## API Endpoints

### REST API Endpoints
- `POST /pioneer/initialize` - Initialize the Pioneer SDK
- `GET /pioneer/balances` - Get cryptocurrency balances
- `GET /pioneer/pubkeys` - Get public keys
- `GET /pioneer/status` - Check SDK status

### MCP Endpoints
- `GET /` - SSE endpoint for MCP connections
- `POST /message?sessionId={id}` - Message endpoint for MCP

## MCP Tools
The server supports the following MCP tools:

### Pioneer SDK Tools
- `pioneer_sdk_initialize` - Initialize the Pioneer SDK with configuration
- `pioneer_sdk_getBalances` - Get balances for all enabled blockchains
- `pioneer_sdk_getPubkeys` - Get public keys for all enabled blockchains

## Swagger Documentation

REST API documentation is available at:
```
http://localhost:3002/docs
```

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