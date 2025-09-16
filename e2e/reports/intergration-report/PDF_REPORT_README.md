# PDF Report Generation E2E Testing

This module provides comprehensive PDF report generation and testing for the Pioneer SDK integration, extracting the functionality from the KeepKey Vault ReportDialog component.

## Features

- **Multi-Chain Support**: Generate reports for Bitcoin, Ethereum, Cosmos, and other supported chains
- **Bitcoin XPUB Reports**: Comprehensive Bitcoin reports with multiple account types (Legacy, SegWit, Native SegWit)
- **Individual Chain Reports**: Generate separate reports for each supported chain
- **Combined Portfolio Reports**: Create unified reports combining all chains
- **Multiple Output Formats**: JSON (for debugging) and text reports
- **Automated Testing**: Validate report structure, content, and file generation

## File Structure

```
src/
├── pdf-report-generator.ts    # Core PDF report generation logic
├── pdf-report-test.ts         # Standalone test runner
├── index.ts                   # Integration with main e2e test
└── kkapi-adapter.ts          # KeepKey API adapter
```

## Quick Start

### Run PDF Report Tests

```bash
# Build and run PDF report tests
pnpm run test:pdf-reports

# Run with debugging
pnpm run test:pdf-reports-debug
```

### Run Integrated Tests (with PDF reports)

```bash
# Full integration test including PDF reports
pnpm run dev
```

## Report Types

### 1. Bitcoin/UTXO Chain Reports

For Bitcoin and other UTXO chains, reports include:

- **Account Information**: Multiple accounts (0, 1, 2) with different derivation paths
- **XPUB Types**: Legacy (BIP44), SegWit (BIP49), Native SegWit (BIP84)
- **Address Data**: Receive/change indices, used addresses, address lists
- **Transaction Data**: Transaction count, transaction IDs with explorer links
- **Balance Information**: Current balance, total received, total sent
- **Explorer Links**: Direct links to view XPUBs and transactions on block explorers

Example Bitcoin report structure:
```
BTC Account Report
Generated: 12/9/2024, 10:30:45 AM
Network: bip122:000000000019d6689c085ae165831e93
Chain Type: bitcoin
==================================================

SUMMARY STATISTICS
--------------------
Total Accounts: 9
Total Balance: 0.12345678 BTC
Total Transactions: 15
Total Addresses: 42

ACCOUNT DETAILS
--------------------

Legacy Account 0 (BIP44)
Path: m/44'/0'/0'
XPUB: xpub6C...
Balance: 0.04567890 BTC
Receive Index: 5
Change Index: 2
...
```

### 2. Ethereum/EVM Chain Reports

For Ethereum and EVM-compatible chains:

- **Asset Information**: Symbol, network ID, contract details
- **Balance Data**: Native token balance and USD value
- **Address Information**: Account address and public key
- **Network Details**: Chain-specific information

### 3. Cosmos Chain Reports

For Cosmos ecosystem chains:

- **Chain Information**: Cosmos chain details and network ID
- **Account Data**: Address, public key, balance
- **Delegation Information**: If available from the Pioneer API

### 4. Combined Portfolio Reports

Unified reports that include:

- **Portfolio Summary**: Total chains, accounts, transactions, and USD value
- **Chain Breakdown**: Summary for each individual chain
- **Detailed Reports**: Full individual reports for each chain

## Configuration

### Environment Variables

```bash
# KeepKey API configuration
KEEPKEY_API_KEY=your-api-key

# Pioneer API configuration
VITE_PIONEER_URL_SPEC=https://pioneers.dev/spec/swagger.json
VITE_PIONEER_URL_WSS=wss://pioneers.dev
```

### Chain Selection

The test supports all Pioneer SDK chains. You can modify the chain list in `pdf-report-test.ts`:

```typescript
let testChains = [
    'BTC',   // Bitcoin - UTXO chain with XPUB support
    'ETH',   // Ethereum - EVM chain
    'GAIA',  // Cosmos - Cosmos chain
    'LTC',   // Litecoin - Another UTXO chain
    'DOGE',  // Dogecoin - UTXO chain
];
```

## Output Files

### Report Directory Structure

```
pdf-reports-test/
├── BTC_report_2024-12-09.json       # Bitcoin report data
├── BTC_report_2024-12-09.txt        # Bitcoin readable report
├── ETH_report_2024-12-09.json       # Ethereum report data
├── ETH_report_2024-12-09.txt        # Ethereum readable report
├── portfolio_combined_2024-12-09.txt # Combined portfolio report
└── portfolio_combined_2024-12-09.json # Combined portfolio data
```

### File Types

- **`.json` files**: Machine-readable report data for debugging and further processing
- **`.txt` files**: Human-readable reports with formatted tables and summaries

## Validation

The test suite validates:

1. **Data Structure**: Ensures all required fields are present
2. **File Generation**: Verifies files are created and have content
3. **Balance Accuracy**: Validates balance calculations and formatting
4. **XPUB Extraction**: For Bitcoin chains, ensures XPUBs are properly retrieved
5. **Explorer Links**: Validates explorer URLs are generated correctly
6. **Combined Reports**: Tests multi-chain report aggregation

## Integration with KeepKey Vault

This module is designed to work with:

- **KeepKey Vault v7**: Via `kkapi://` protocol for optimal performance
- **Legacy KeepKey Desktop**: Fallback support for existing installations
- **No Device Mode**: Generates reports with available cached data

### KeepKey Device Integration

When a KeepKey device is connected:

- **XPUB Extraction**: Real XPUBs are fetched from the device for Bitcoin chains
- **Address Generation**: Receive and change indices are queried from Pioneer API
- **Balance Queries**: Live balance data is retrieved and validated

### Offline Mode

Without a connected device:

- **Cached Data**: Uses existing Pioneer SDK cache when available
- **Error Handling**: Gracefully handles missing device with clear error messages
- **Partial Reports**: Generates reports with available data

## Error Handling

The system handles various error conditions:

- **Device Not Connected**: Continues with cached data, marks XPUBs as unavailable
- **API Failures**: Graceful degradation with error logging
- **Invalid Data**: Validates and sanitizes all inputs
- **File System Errors**: Proper error reporting for write failures

## Performance Considerations

- **Concurrent Generation**: Reports are generated in parallel for multiple chains
- **Caching**: Reuses SDK data across multiple report generations  
- **Optimized Queries**: Minimizes API calls through intelligent batching
- **Memory Management**: Processes chains sequentially to avoid memory issues

## Testing Strategy

The test suite uses a 50% success rate threshold:

- **Individual Chain Tests**: Each chain report is tested independently
- **Combined Report Test**: Tests multi-chain aggregation
- **File Validation**: Ensures all generated files exist and have content
- **Data Validation**: Checks report structure and required fields
- **Error Resilience**: Continues testing even if some chains fail

## Future Enhancements

Potential improvements:

1. **PDF Generation**: Add actual PDF generation using pdfmake (currently text-based)
2. **Chart Generation**: Include balance history and transaction charts
3. **Template System**: Customizable report templates
4. **Scheduled Reports**: Automated report generation on schedule
5. **Email Integration**: Automatic report delivery via email
6. **Advanced Filtering**: Filter reports by date range, balance threshold, etc.

## Troubleshooting

### Common Issues

1. **No Reports Generated**
   - Check if Pioneer SDK initialized successfully
   - Verify balances are loaded (`app.balances.length > 0`)
   - Ensure proper environment variables are set

2. **Missing XPUBs for Bitcoin**
   - Verify KeepKey device is connected and unlocked
   - Check `kkapi://` protocol availability
   - Confirm proper API key configuration

3. **Empty Reports**
   - Check if pubkeys were retrieved (`app.pubkeys.length > 0`)  
   - Verify blockchain configuration includes target chains
   - Ensure proper path generation for target chains

4. **File Write Errors**
   - Check write permissions for output directory
   - Ensure sufficient disk space
   - Verify directory path exists

### Debug Mode

Use debug mode for detailed logging:

```bash
pnpm run test:pdf-reports-debug
```

This provides:
- Detailed API call logging
- Step-by-step report generation progress
- File system operation details
- Error stack traces

## API Reference

### PDFReportGenerator Class

#### Constructor
```typescript
new PDFReportGenerator(outputDir?: string)
```

#### Methods

**generateReportData(app, assetContext, accountCount?)**
- Generates report data structure for a single chain
- Returns: `Promise<ReportData>`

**saveReportDataAsJSON(reportData, filename)**
- Saves report data as JSON file
- Returns: `Promise<string>` (file path)

**generateTextReport(reportData, filename)**
- Generates human-readable text report
- Returns: `Promise<string>` (file path)

**generateCombinedReport(allReports, filename)**
- Creates combined multi-chain report
- Returns: `Promise<string>` (file path)

### Data Types

```typescript
interface ReportData {
  chainType: 'bitcoin' | 'ethereum' | 'cosmos' | 'utxo' | 'other';
  symbol: string;
  networkId: string;
  accountData: AssetData[] | BitcoinAccountData[];
  summary: {
    totalAccounts: number;
    totalBalance: string;
    totalValueUsd?: number;
    totalTransactions?: number;
    totalAddresses?: number;
  };
}
```