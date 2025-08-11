# Polygon ERC20 Transfer Test

This test suite is configured to test ERC20 token transfers on Polygon (chain 137).

## Test Configuration

- **Network**: Polygon (MATIC)
- **Chain ID**: 137
- **Test Tokens**: 
  - USDC: `eip155:137/erc20:0x2791bca1f2de4661ed88a30c99a7a9449aa84174`
  - USDT: `eip155:137/erc20:0xc2132d05d31c914a87c6611c10748aeb04b58e8f`

## Prerequisites

1. KeepKey device connected and initialized
2. Polygon network configured in your wallet
3. Some MATIC for gas fees
4. Some ERC20 tokens (USDC or USDT) on Polygon network
5. Environment variables configured (see `.env` file)

## Required Environment Variables

```bash
KEEPKEY_API_KEY=your_api_key_here
```

## Running the Test

From the project root:
```bash
cd projects/pioneer-sdk/e2e/transfers/e2e-transfer-suite
pnpm install
pnpm run dev
```

## What the Test Does

1. **Initialize SDK**: Creates Pioneer SDK instance with Polygon configuration
2. **Device Connection**: Connects to KeepKey device and syncs wallets
3. **Balance Sync**: Retrieves current balances for configured ERC20 tokens
4. **Transaction Flow**: For each available token:
   - Sets asset context to the specific ERC20 token
   - Builds unsigned transaction
   - Signs transaction with KeepKey
   - Broadcasts transaction to network
   - Follows transaction status
   - Verifies balance changes

## Expected Output

The test will show:
- ✅ SDK initialization time
- 📊 Wallet and balance information
- 🔧 Transaction building details
- ✍️  Transaction signing confirmation
- 📡 Broadcast results
- 💰 Balance changes before/after transaction

## Troubleshooting

1. **"Balance not found"**: Ensure you have ERC20 tokens in your wallet
2. **"Transaction failed"**: Check gas fees and token approvals
3. **"Device not connected"**: Ensure KeepKey is connected and unlocked
4. **"Insufficient balance"**: You need both ERC20 tokens and MATIC for gas

## Test Results

The test validates:
- ✅ Successful transaction broadcasting
- ✅ Balance changes reflect sent amount + fees
- ✅ Transaction can be followed on-chain
- ✅ All assertions pass for ERC20 token handling