# Pioneer CLI

Command-line interface for the Pioneer SDK, allowing you to interact with cryptocurrency wallets and blockchains from your terminal.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pioneer-sdk.git
cd pioneer-sdk

# Install dependencies
pnpm bootstrap

# Build the CLI
cd packages/pioneer/pioneer-cli
pnpm build
```

For development, you can link the CLI globally:

```bash
npm link
```

## Configuration

Copy the `.env.example` file to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials and API keys.

## Usage

### Basic Command

```bash
# Show help
pioneer --help

# Initialize the SDK (hello world)
pioneer hello

# Initialize with specific blockchains
pioneer hello --blockchains ETH,BTC,THOR

# Show balances
pioneer balances

# Show balances with refresh
pioneer balances --refresh
```

## Available Commands

- `hello`: Initialize the SDK and verify connection
- `balances`: Display cryptocurrency balances for all enabled blockchains

## Development

### Building the CLI

```bash
pnpm build
```

### Running in Development Mode

```bash
pnpm dev -- hello
```

## License

MIT 