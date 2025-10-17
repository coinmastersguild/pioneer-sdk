# UTXO Change Address Comprehensive Test Specification

## Overview

This test suite validates the UTXO transaction builder's change address handling across all supported UTXO chains. It tests the fixes for coin type, script type matching, and xpub validation.

## Test Coverage

### 1. **Coin Type Verification** ✅

Tests that change addresses use the correct SLIP-44 coin type for each chain:

| Chain | Expected Coin Type | Test Path Example |
|-------|-------------------|-------------------|
| BTC   | 0                 | `m/44'/0'/0'/1/X` |
| LTC   | 2                 | `m/44'/2'/0'/1/X` |
| DOGE  | 3                 | `m/44'/3'/0'/1/X` |
| DASH  | 5                 | `m/44'/5'/0'/1/X` |
| BCH   | 145               | `m/44'/145'/0'/1/X` |

**Critical Bug Fixed**: Previously used coin type `0` for all chains.

**Test Method**:
- Parse BIP path from change output's `addressNList`
- Extract coin type from path
- Compare against expected SLIP-44 value
- **FAIL FAST** on mismatch

### 2. **Script Type Consistency** ✅

Tests that change addresses match input UTXO script types:

#### Test Scenarios

**Scenario 1: Default Behavior (No Explicit Preference)**
- Build transaction without `changeScriptType` parameter
- Analyze input UTXOs for script type distribution
- Verify change matches most common input type
- **Expected**: Auto-match to inputs

**Scenario 2: Explicit Legacy (p2pkh)**
- Set `changeScriptType: 'p2pkh'` in sendPayload
- Verify change output uses p2pkh
- Verify BIP path uses `m/44'/X/0'/1/Y`
- **Expected**: Exact match to preference

**Scenario 3: Explicit Wrapped SegWit (p2sh-p2wpkh)**
- Set `changeScriptType: 'p2sh-p2wpkh'` in sendPayload
- Verify change output uses p2sh-p2wpkh
- Verify BIP path uses `m/49'/X/0'/1/Y`
- **Expected**: Exact match to preference

**Scenario 4: Explicit Native SegWit (p2wpkh)**
- Set `changeScriptType: 'p2wpkh'` in sendPayload
- Verify change output uses p2wpkh
- Verify BIP path uses `m/84'/X/0'/1/Y`
- **Expected**: Exact match to preference

**Critical Bug Fixed**: Previously defaulted to p2wpkh even when using legacy addresses.

### 3. **BIP Purpose Validation** ✅

Tests that BIP purpose matches script type:

| Script Type | Expected BIP | Expected Path Prefix |
|-------------|--------------|---------------------|
| p2pkh       | BIP44 (44)   | `m/44'/X'/0'/1/Y`  |
| p2sh-p2wpkh | BIP49 (49)   | `m/49'/X'/0'/1/Y`  |
| p2wpkh      | BIP84 (84)   | `m/84'/X'/0'/1/Y`  |

**Test Method**:
- Extract BIP purpose from change path
- Compare against expected value for script type
- **FAIL FAST** on mismatch

### 4. **xpub Validation** ✅

Tests that the correct xpub is used for change address derivation:

**Test Steps**:
1. Identify script type of change output
2. Filter pubkeys for matching script type
3. Verify at least one matching xpub exists
4. Query Pioneer API for change index using correct xpub
5. Verify transaction uses correct/next sequential index
6. **FAIL FAST** if no matching xpub found

**Critical Bug Fixed**: Previously could select wrong xpub, causing wrong change index lookup.

### 5. **Mixed Input UTXO Testing** ✅

Tests behavior when inputs have mixed script types:

**Test Method**:
- Collect all input UTXOs
- Analyze script type distribution
- Calculate percentage of each type
- Verify change matches most common type (when no preference)
- Log warning if inputs are mixed

**Example Output**:
```
📊 Input script type distribution:
   p2pkh: 3/5 (60.0%)
   p2wpkh: 2/5 (40.0%)
⚠️  Mixed script types in inputs!
   Change should match most common input type
```

### 6. **Change Index Tracking** ✅

Tests proper change address index management:

**Test Steps**:
1. Query backend for current change index
2. Compare with transaction's change index
3. Verify index is current or next sequential
4. Check against gap limit (20 addresses)
5. **FAIL FAST** if beyond gap limit or unexpected jump

**Critical Validation**:
```typescript
if (changeIndex !== backendIndex && changeIndex !== backendIndex + 1) {
  // FAIL FAST - Index mismatch
}

if (changeIndex > backendIndex + GAP_LIMIT) {
  // CRITICAL - Would cause fund loss
}
```

## Test Execution

### Running Tests

```bash
cd projects/pioneer-sdk/e2e/transfers/e2e-transfer-suite
pnpm run dev
```

### Test Rotation

Tests cycle through all scenarios automatically:
- **Rotation Interval**: Every 10 seconds
- **Total Scenarios**: 4 per chain
- **Chains Tested**: BTC, LTC, DOGE, DASH, BCH

### Expected Output

```
🧪 UTXO CHANGE ADDRESS TEST SUITE
==================================
📋 Test Scenario 2/4: Explicit Legacy (p2pkh)
🔧 Testing explicit preference: changeScriptType = p2pkh
⚠️  Backend MUST respect this preference or transaction will be aborted

📝 Available script types for LTC:
   1. p2pkh (Legacy)
   2. p2wpkh (Native SegWit)

🔍 ===== INPUT UTXO ANALYSIS =====
Total inputs: 3
📊 Input script type distribution:
   p2pkh: 3/3 (100.0%)
✅ All inputs use same script type: p2pkh

🔍 ===== CHANGE ADDRESS AUDIT =====
📍 Change path: m/44'/2'/0'/1/5
📊 Path components:
   Purpose: 44' (BIP44)
   Coin Type: 2' (SLIP-44)
   Account: 0'
   Change: 1 (0=receive, 1=change)
   Index: 5
✅ Coin type matches LTC: 2
✅ BIP purpose matches script type: BIP44 = p2pkh

🧪 ===== CHANGE SCRIPT TYPE VALIDATION =====
🎯 Explicit preference test: p2pkh
✅ PASS: Change script type preference respected
   Requested: p2pkh
   Received: p2pkh

📊 ===== CHANGE ADDRESS AUDIT SUMMARY =====
✅ All validations passed:
   ✓ Coin type: 2 (LTC)
   ✓ Script type: p2pkh
   ✓ BIP purpose: 44
   ✓ Change path: m/44'/2'/0'/1/5
   ✓ Change index: 5 (backend: 5)
   ✓ xpub match: Ltub5ZkKuYrNpe...
   ✓ Preference respected: p2pkh
========================================
```

## Test Failures

### Critical Failures (Transaction Aborted)

**1. Coin Type Mismatch**
```
❌ CRITICAL: Coin type mismatch!
   Expected for LTC: 2
   Got: 0
CRITICAL: Coin type mismatch! LTC should use 2, not 0
```

**2. Script Type Preference Not Respected**
```
❌ FAIL: Change script type mismatch!
   Requested: p2pkh
   Got: p2wpkh
   This could result in funds going to unexpected address type!
CRITICAL: Change script type mismatch! Requested p2pkh but got p2wpkh. Transaction aborted for safety.
```

**3. BIP Purpose Mismatch**
```
❌ CRITICAL: BIP purpose mismatch!
   Script type: p2pkh
   Expected BIP: 44
   Got BIP: 84
CRITICAL: BIP purpose 84 doesn't match script type p2pkh
```

**4. No Matching xpub**
```
❌ CRITICAL: No xpub found for script type: p2pkh
⚠️ This is the exact bug we were worried about!
Change output wants p2pkh but no matching xpub found
CRITICAL: No xpub found for script type p2pkh. Cannot derive change address safely. Transaction aborted.
```

**5. Change Index Beyond Gap Limit**
```
❌ CRITICAL: Change index mismatch!
   Transaction wants to use index: 25
   Backend's current index: 3
   Expected: 3 or 4
💀 FUNDS WOULD BE LOST - Index 25 is beyond gap limit!
CRITICAL FUND LOSS: Change index 25 exceeds gap limit (backend: 3, gap: 20)
```

## Test Assets

### Asset Configuration

Each chain has faucet address and minimum send amount:

```typescript
const caipToAddressMap = {
  'bip122:000000000019d6689c085ae165831e93/slip44:0': 'bc1qu3ghkz8788ysk7gqcvke5l0mr7skhgvpuk6dk4', // BTC
  'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2': 'LMcHLHjcAhMtM6SPQ7Da9acBQWcviaX2Fu', // LTC
  'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 'DNchRDXhaW2uPusLVQWZZbQ5QQnzYmarWJ', // DOGE
  'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 'XetjxEsGXKLV4mHiWPLscuNFABu9K5eVDd', // DASH
  'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 'qpd00ucur9gl7rzwe7lqmu9yljr9ajv92q09a0jdrl', // BCH
};

const caipToMinAmountSend = {
  'bip122:000000000019d6689c085ae165831e93/slip44:0': 0.00005, // BTC
  'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2': 0.001,   // LTC
  'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 2,       // DOGE
  'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 0.0001,  // DASH
  'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 0.00001, // BCH
};
```

## Success Criteria

✅ **All Tests Pass**:
- Correct coin type for all chains
- Change matches input script types by default
- Explicit preferences are respected
- BIP purpose matches script type
- Correct xpub is used
- Change index is sequential and within gap limit

✅ **Zero Fund Loss**:
- No transactions with mismatched coin types
- No transactions with wrong xpub
- No transactions beyond gap limit
- All change addresses are recoverable

✅ **Coverage**:
- All UTXO chains tested (BTC, LTC, DOGE, DASH, BCH)
- All script types tested (p2pkh, p2sh-p2wpkh, p2wpkh)
- All scenarios tested (default + 3 explicit preferences)
- Mixed input scenarios validated

## Future Enhancements

### Additional Test Cases

1. **Multi-Account Testing**: Test change addresses across multiple accounts
2. **Large Transaction Testing**: Test with 10+ input UTXOs
3. **Dust Handling**: Test behavior with very small change amounts
4. **Fee Adjustment**: Test change address with different fee levels
5. **RBF Transactions**: Test replace-by-fee scenarios

### Performance Testing

- Measure transaction build time with change validation
- Benchmark xpub lookup performance
- Test with 100+ available UTXOs

### Integration Testing

- Test with real hardware wallet signing
- Verify broadcast success rates
- Monitor actual blockchain confirmations
- Track recovery success for change addresses

## References

- [BIP32 - Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP44 - Multi-Account Hierarchy](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [BIP49 - Derivation for P2WPKH-nested-in-P2SH](https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki)
- [BIP84 - Derivation for P2WPKH](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki)
- [SLIP-44 - Registered coin types](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
