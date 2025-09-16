# Change Address Handling Documentation

## Overview

This document describes the proper handling of change addresses in Bitcoin UTXO transactions, including user preferences, defaults, and override mechanisms.

## Current Issue

The transaction builder currently doesn't accept user preference for change address script type, leading to potential mismatches between user expectations and actual change outputs.

## Proposed Solution

### Transaction Object Enhancement

The transaction payload should be expanded to include:

```typescript
interface TransactionPayload {
  // ... existing fields ...

  // Change address preferences
  changeScriptType?: 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh';  // User override
  preferNativeSegwit?: boolean;  // Default to true for lower fees
  enforceConsistency?: boolean;  // Ensure change matches input type (default: true)
}
```

### Default Behavior

1. **If no preference specified**: Default to `p2wpkh` (native segwit) for:
   - Lower transaction fees
   - Better privacy
   - Modern best practices

2. **Consistency Rule**: Change address script type should match the input UTXOs:
   - If spending from `p2wpkh` → change to `p2wpkh`
   - If spending from `p2pkh` → change to `p2pkh`
   - If spending from mixed types → use preference or default to `p2wpkh`

### Override Mechanism

Users can explicitly set their preference:

```javascript
// Example 1: Force legacy addresses
const sendPayload = {
  from: "bitcoin address",
  to: "recipient address",
  amount: "0.001",
  changeScriptType: 'p2pkh'  // Override to legacy
};

// Example 2: Use native segwit (default)
const sendPayload = {
  from: "bitcoin address",
  to: "recipient address",
  amount: "0.001"
  // changeScriptType not specified, defaults to p2wpkh
};

// Example 3: Force wrapped segwit
const sendPayload = {
  from: "bitcoin address",
  to: "recipient address",
  amount: "0.001",
  changeScriptType: 'p2sh-p2wpkh'  // 3... addresses
};
```

## Test Cases

### Test 1: Default Behavior (Native Segwit)

**Setup**: Send transaction without specifying changeScriptType
**Expected**:
- Change address should be `p2wpkh` (bc1... address)
- Path should be m/84'/0'/0'/1/[index]
- Should match against zpub

### Test 2: Override to Legacy

**Setup**: Send transaction with `changeScriptType: 'p2pkh'`
**Expected**:
- Change address should be `p2pkh` (1... address)
- Path should be m/44'/0'/0'/1/[index]
- Should match against xpub

### Test 3: Override to Wrapped Segwit

**Setup**: Send transaction with `changeScriptType: 'p2sh-p2wpkh'`
**Expected**:
- Change address should be `p2sh-p2wpkh` (3... address)
- Path should be m/49'/0'/0'/1/[index]
- Should match against ypub

### Test 4: Consistency Enforcement

**Setup**: Send from p2wpkh inputs with `enforceConsistency: true`
**Expected**:
- Change should automatically be p2wpkh regardless of preference
- Should log that consistency rule was applied

### Test 5: Mixed Input Types

**Setup**: Send from mixed p2pkh and p2wpkh inputs
**Expected**:
- Should use preference if specified
- Should default to p2wpkh if no preference
- Should warn about mixed input types

## Implementation Checklist

- [x] Fix bug: Read scriptType from change output, not unsignedTx
- [x] Match xpubs by correct script type
- [x] Display actual change address for verification
- [ ] Add changeScriptType to transaction payload interface
- [ ] Implement default to p2wpkh when not specified
- [ ] Add consistency enforcement logic
- [ ] Add comprehensive logging for audit trail
- [ ] Test all scenarios listed above

## Security Considerations

1. **Never mix script types**: Always verify xpub matches the intended script type
2. **Validate indices**: Ensure change index is within gap limit (typically 20)
3. **Display change address**: Always log the actual change address for user verification
4. **Fail loudly**: If no matching xpub found, abort with clear error message

## Example Audit Output

```
✅ Change Address Audit:
💰 ACTUAL CHANGE ADDRESS: bc1qxyz...
📍 Change path: m/84'/0'/0'/1/79
📝 Script type: p2wpkh
💵 Amount returning: 260734712 satoshis
✅ Change index 79 is within safe bounds (addressIndex: 100)
```

## References

- BIP 44 (Legacy): m/44'/0'/0'/change/index
- BIP 49 (Wrapped Segwit): m/49'/0'/0'/change/index
- BIP 84 (Native Segwit): m/84'/0'/0'/change/index