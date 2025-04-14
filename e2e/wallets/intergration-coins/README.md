# MCP Server Integration Test

This is an E2E testing framework for the MCP server targeting Node.js containers.

## Environment Variables

Set the following environment variables before running:

- `KEEPKEY_API_KEY` (Required) - API key for KeepKey integration
- `ADMIN_USERNAME` - Admin username for authentication (defaults to 'tester123')
- `ADMIN_KEY` - Admin key for authentication (defaults to '123456')

## Running the test

```bash
# Set required environment variables
export KEEPKEY_API_KEY="your-keepkey-api-key"
export ADMIN_USERNAME="your-admin-username"
export ADMIN_KEY="your-admin-key"

# Run the test
npm run test
```

## Features

- Integration testing for all supported blockchains
- Automatic pubkey and balance validation
- Comprehensive asset validation
- Blockchain reconfiguration testing

## Security Practices

- Environment variables used for all authentication
- No hardcoded API keys
- Proper validation of credentials

## Pioneer Guild Compliance

This implementation follows Pioneer Guild development and protocol guidelines:
- Uses environment variables for security
- Implements proper error handling
- Follows validation best practices 