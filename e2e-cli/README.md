# Pioneer SDK E2E CLI Tests

Clean, focused end-to-end tests for Pioneer SDK with beautiful portfolio display.

## Features

- 📊 **Portfolio Display**: Beautiful table format with native/token separation
- 💰 **Value Summations**: Automatic totals and breakdowns by chain
- 🎨 **Color-Coded Output**: Easy to read terminal output
- ⚡ **Fast Execution**: Optimized for quick testing cycles
- 🔧 **Minimal Setup**: Simple configuration and dependencies

## Quick Start

```bash
# Install dependencies
pnpm install

# Run portfolio display test
pnpm run portfolio
```

## Test Output Example

```
🎯 Pioneer Portfolio Display Test
═══════════════════════════════════════════════════════════════

🪙  NATIVE ASSETS
┌──────────┬──────────┬────────────────────┬───────────────┬───────────────┐
│ Symbol   │ Chain    │ Balance            │ Price         │ Value USD     │
├──────────┼──────────┼────────────────────┼───────────────┼───────────────┤
│ ETH      │ ETH      │ 1.234567           │ $2,345.00     │ $2,895.78     │
│ BTC      │ BTC      │ 0.045678           │ $45,678.00    │ $2,086.34     │
│ AVAX     │ AVAX     │ 45.123456          │ $35.67        │ $1,609.45     │
└──────────┴──────────┴────────────────────┴───────────────┴───────────────┘
  Total Native Assets: $6,591.57

🎯  TOKENS
┌──────────┬──────────┬────────────────────┬───────────────┬───────────────┐
│ Symbol   │ Chain    │ Balance            │ Price         │ Value USD     │
├──────────┼──────────┼────────────────────┼───────────────┼───────────────┤
│ USDC     │ ETH      │ 1,234.567890       │ $1.0000       │ $1,234.57     │
│ USDT     │ BSC      │ 890.123456         │ $0.9999       │ $890.03       │
└──────────┴──────────┴────────────────────┴───────────────┴───────────────┘
  Total Tokens: $2,124.60

📊  CHAIN BREAKDOWN
┌──────────┬───────────────┬───────────────┬───────────────┬───────────────┐
│ Chain    │ Native        │ Tokens        │ Total         │ % of Portfolio│
├──────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ ETH      │ $2,895.78     │ $1,234.57     │ $4,130.35     │ 47.3%         │
│ BTC      │ $2,086.34     │ $0.00         │ $2,086.34     │ 23.9%         │
│ AVAX     │ $1,609.45     │ $0.00         │ $1,609.45     │ 18.4%         │
│ BSC      │ $0.00         │ $890.03       │ $890.03       │ 10.2%         │
└──────────┴───────────────┴───────────────┴───────────────┴───────────────┘

═══════════════════════════════════════════════════════════════
  TOTAL PORTFOLIO VALUE: $8,716.17
═══════════════════════════════════════════════════════════════
  Native: $6,591.57 (75.6%)
  Tokens: $2,124.60 (24.4%)
  Assets: 3 native + 2 tokens = 5 total
═══════════════════════════════════════════════════════════════
```

## Configuration

Set environment variables in `.env`:

```env
VITE_PIONEER_URL_SPEC=https://pioneers.dev/spec/swagger.json
KEEPKEY_API_KEY=your-api-key
```

## Test Structure

```
e2e-cli/
├── src/
│   └── portfolio-display.ts    # Main portfolio display test
├── package.json
├── tsconfig.json
└── README.md
```

## Key Improvements Over Original Tests

1. **Cleaner Code**: Focused, single-purpose test files
2. **Better Display**: Beautiful table formatting with colors
3. **Native vs Token Separation**: Clear distinction between asset types
4. **Chain Breakdown**: See portfolio distribution by chain
5. **Performance Metrics**: Track execution times
6. **Error Handling**: Graceful failure with clear error messages

## Development

```bash
# Run in development mode
pnpm run dev

# Build
pnpm run build

# Clean
pnpm run clean
```

## Future Enhancements

- [ ] Export to CSV/JSON
- [ ] Historical portfolio tracking
- [ ] Transaction history display
- [ ] Gas fee analysis
- [ ] DeFi position tracking
- [ ] Interactive mode with prompts
- [ ] Multiple wallet support