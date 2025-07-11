# E2E Staking Test Suite

This test suite provides comprehensive testing for Cosmos staking operations including delegation, undelegation, and reward claiming.

## Configuration

The test suite is fully configurable through the `TEST_CONFIG` object at the top of `src/index.ts`. You can enable/disable specific tests based on what you want to test.

### Configuration Options

```typescript
const TEST_CONFIG = {
    // API Tests
    TEST_VALIDATOR_API: true,           // Test validator fetching APIs
    TEST_STAKING_POSITIONS_API: true,   // Test staking positions detection
    TEST_DIRECT_STAKING_API: true,      // Test direct staking API calls
    
    // Transaction Tests
    TEST_CLAIM_REWARDS: true,           // 🎯 Test reward claiming (RECOMMENDED TO START)
    TEST_DELEGATE: false,               // Test delegation transactions
    TEST_UNDELEGATE: false,             // Test undelegation transactions
    
    // Integration Tests
    TEST_STAKING_INTEGRATION: true,     // Test staking data integration
    
    // Execution Mode
    ACTUALLY_EXECUTE_TRANSACTIONS: false, // ⚠️ Set to true to actually execute transactions
    
    // Network Selection
    NETWORKS: [
        'GAIA',    // Cosmos Hub - has active staking
        'OSMO',    // Osmosis - has active staking
    ]
};
```

## Common Use Cases

### 1. 🎯 Reward Claiming Only (Recommended Starting Point)

```typescript
const TEST_CONFIG = {
    TEST_VALIDATOR_API: false,
    TEST_STAKING_POSITIONS_API: true,
    TEST_DIRECT_STAKING_API: false,
    TEST_CLAIM_REWARDS: true,           // Only test reward claiming
    TEST_DELEGATE: false,
    TEST_UNDELEGATE: false,
    TEST_STAKING_INTEGRATION: true,
    ACTUALLY_EXECUTE_TRANSACTIONS: true,  // Actually claim rewards
    NETWORKS: ['GAIA']                   // Cosmos Hub only
};
```

### 2. 📈 Delegation Testing

```typescript
const TEST_CONFIG = {
    TEST_VALIDATOR_API: true,           // Need validators for delegation
    TEST_STAKING_POSITIONS_API: true,
    TEST_DIRECT_STAKING_API: false,
    TEST_CLAIM_REWARDS: false,
    TEST_DELEGATE: true,                // Test delegation
    TEST_UNDELEGATE: false,
    TEST_STAKING_INTEGRATION: true,
    ACTUALLY_EXECUTE_TRANSACTIONS: false, // Dry run first
    NETWORKS: ['GAIA']
};
```

### 3. 📉 Undelegation Testing

```typescript
const TEST_CONFIG = {
    TEST_VALIDATOR_API: false,
    TEST_STAKING_POSITIONS_API: true,   // Need existing delegations
    TEST_DIRECT_STAKING_API: false,
    TEST_CLAIM_REWARDS: false,
    TEST_DELEGATE: false,
    TEST_UNDELEGATE: true,              // Test undelegation
    TEST_STAKING_INTEGRATION: true,
    ACTUALLY_EXECUTE_TRANSACTIONS: false, // Dry run first
    NETWORKS: ['GAIA']
};
```

### 4. 🔍 Full API Testing (No Transactions)

```typescript
const TEST_CONFIG = {
    TEST_VALIDATOR_API: true,
    TEST_STAKING_POSITIONS_API: true,
    TEST_DIRECT_STAKING_API: true,
    TEST_CLAIM_REWARDS: false,
    TEST_DELEGATE: false,
    TEST_UNDELEGATE: false,
    TEST_STAKING_INTEGRATION: true,
    ACTUALLY_EXECUTE_TRANSACTIONS: false,
    NETWORKS: ['GAIA', 'OSMO']
};
```

### 5. 🚀 Full Transaction Testing

```typescript
const TEST_CONFIG = {
    TEST_VALIDATOR_API: true,
    TEST_STAKING_POSITIONS_API: true,
    TEST_DIRECT_STAKING_API: true,
    TEST_CLAIM_REWARDS: true,
    TEST_DELEGATE: true,
    TEST_UNDELEGATE: true,
    TEST_STAKING_INTEGRATION: true,
    ACTUALLY_EXECUTE_TRANSACTIONS: true,  // ⚠️ Will execute real transactions
    NETWORKS: ['GAIA']
};
```

## Running the Tests

```bash
# Install dependencies
npm install

# Run the test suite
bun run src/index.ts
```

## Safety Notes

- **ALWAYS** test with `ACTUALLY_EXECUTE_TRANSACTIONS: false` first
- **NEVER** set `ACTUALLY_EXECUTE_TRANSACTIONS: true` unless you want to execute real transactions
- Start with reward claiming as it's the safest operation
- Use small amounts for delegation/undelegation testing
- Remember that undelegation has a 21-day unbonding period on Cosmos Hub

## Test Output

The test suite provides detailed logging with emojis for easy reading:

- 🧪 Test sections
- ✅ Successful operations
- ❌ Failed operations
- 🎯 Target operations
- 💰 Balance information
- 📊 Statistics
- 🔨 Transaction building
- 🚀 Transaction execution
- ⏭️ Skipped tests

## Troubleshooting

1. **No staking positions found**: Make sure you have existing delegations or rewards
2. **Validator API errors**: Check network connectivity and API availability
3. **Transaction building errors**: Verify you have sufficient balance and valid validator addresses
4. **KeepKey connection issues**: Ensure your KeepKey is connected and unlocked

## Next Steps

After successful testing, you can integrate the staking functionality into your application using the same transaction builders:

- `app.buildDelegateTx(caip, params)`
- `app.buildUndelegateTx(caip, params)`
- `app.buildClaimRewardsTx(caip, params)` 