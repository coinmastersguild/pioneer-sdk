# UTXO Change Address Test - Quick Reference

## What Was Fixed

### 🐛 Bug 1: Hardcoded Bitcoin Coin Type
**Before**: All chains used coin type `0` (Bitcoin)
```typescript
bipPath = `m/44'/0'/0'/1/${index}`  // ❌ Wrong for LTC, DOGE, DASH, BCH
```

**After**: Dynamic coin type lookup
```typescript
const coinType = getCoinTypeFromNetworkId(networkId);
bipPath = `m/44'/${coinType}'/0'/1/${index}`  // ✅ Correct for all chains
```

### 🐛 Bug 2: Wrong Script Type Preference
**Before**: Preferred SegWit even for legacy addresses
```typescript
changeScriptType = preferSegwit || inputs[0].scriptType  // ❌ Forced SegWit
```

**After**: Match input types by default
```typescript
changeScriptType = preference || mostCommonInputType || 'p2pkh'  // ✅ Matches inputs
```

### 🐛 Bug 3: Missing xpub Validation
**Before**: Could use wrong xpub silently
```typescript
const xpub = pubkeys[0].pubkey  // ❌ Might be wrong script type
```

**After**: Validates xpub matches script type
```typescript
const xpubInfo = pubkeys.find(pk => pk.scriptType === changeScriptType);
if (!xpubInfo) throw Error('No matching xpub');  // ✅ Fail fast
```

## Test Scenarios

### Automatic Rotation (Every 10 seconds)

| # | Scenario | changeScriptType | Expected Behavior |
|---|----------|------------------|-------------------|
| 1 | Default  | `undefined`      | Auto-match inputs |
| 2 | Legacy   | `'p2pkh'`        | Force legacy      |
| 3 | Wrapped  | `'p2sh-p2wpkh'`  | Force wrapped     |
| 4 | Native   | `'p2wpkh'`       | Force native      |

## Test Validations

### ✅ Coin Type Check
```
Expected for LTC: 2
Got: 2
✅ PASS
```

### ✅ Script Type Check
```
Requested: p2pkh
Received: p2pkh
✅ PASS
```

### ✅ BIP Purpose Check
```
Script type: p2pkh
Expected BIP: 44
Got BIP: 44
✅ PASS
```

### ✅ xpub Match Check
```
Found xpub for p2pkh
✅ PASS
```

### ✅ Change Index Check
```
Transaction: 5
Backend: 5
✅ PASS (sequential)
```

## Coin Type Reference

| Chain | Symbol | Coin Type | Example Path |
|-------|--------|-----------|--------------|
| Bitcoin | BTC | 0 | `m/44'/0'/0'/1/X` |
| Litecoin | LTC | 2 | `m/44'/2'/0'/1/X` |
| Dogecoin | DOGE | 3 | `m/44'/3'/0'/1/X` |
| Dash | DASH | 5 | `m/44'/5'/0'/1/X` |
| Bitcoin Cash | BCH | 145 | `m/44'/145'/0'/1/X` |

## Script Type Reference

| Type | Prefix | BIP | Path | Use Case |
|------|--------|-----|------|----------|
| p2pkh | `1...` / `L...` | 44 | `m/44'/X/0'/1/Y` | Legacy |
| p2sh-p2wpkh | `3...` / `M...` | 49 | `m/49'/X/0'/1/Y` | Wrapped SegWit |
| p2wpkh | `bc1...` / `ltc1...` | 84 | `m/84'/X/0'/1/Y` | Native SegWit |

## Running Tests

```bash
# Single run
cd projects/pioneer-sdk/e2e/transfers/e2e-transfer-suite
pnpm run dev

# Watch for failures
pnpm run dev | grep "CRITICAL\|FAIL"

# Test specific chain (edit src/index.ts)
let chains = ['LTC']  // Test only LTC
```

## Expected Test Output

```
🧪 UTXO CHANGE ADDRESS TEST SUITE
==================================
📋 Test Scenario 2/4: Explicit Legacy (p2pkh)

🔍 ===== INPUT UTXO ANALYSIS =====
Total inputs: 3
📊 Input script type distribution:
   p2pkh: 3/3 (100.0%)

🔍 ===== CHANGE ADDRESS AUDIT =====
📍 Change path: m/44'/2'/0'/1/5
✅ Coin type matches LTC: 2
✅ BIP purpose matches script type: BIP44 = p2pkh

🧪 ===== CHANGE SCRIPT TYPE VALIDATION =====
✅ PASS: Change script type preference respected

📊 ===== CHANGE ADDRESS AUDIT SUMMARY =====
✅ All validations passed:
   ✓ Coin type: 2 (LTC)
   ✓ Script type: p2pkh
   ✓ Change path: m/44'/2'/0'/1/5
   ✓ Preference respected: p2pkh
```

## Common Issues

### ❌ No Balance
```
YOU ARE BROKE!
```
**Solution**: Send test funds to faucet addresses

### ❌ Coin Type Mismatch
```
CRITICAL: Coin type mismatch! LTC should use 2, not 0
```
**Solution**: Code bug - getCoinTypeFromNetworkId not working

### ❌ Script Type Not Respected
```
CRITICAL: Change script type mismatch! Requested p2pkh but got p2wpkh
```
**Solution**: Backend not respecting `changeScriptType` parameter

### ❌ Gap Limit Exceeded
```
CRITICAL FUND LOSS: Change index 25 exceeds gap limit
```
**Solution**: Backend API returning wrong change index

## Success Indicators

- ✅ All coin types correct for each chain
- ✅ Change matches input types (default mode)
- ✅ Preferences respected (explicit mode)
- ✅ All change indices sequential
- ✅ Zero critical errors
- ✅ All transactions sign and broadcast

## Debug Tips

### View Full Change Address Info
```typescript
console.log('Change output:', unsignedTx.outputs[1]);
console.log('Change path:', addressNListToBIP32(changeInfo.addressNList));
console.log('Change script type:', changeInfo.scriptType);
```

### Check Available Pubkeys
```typescript
const chainPubkeys = app.pubkeys.filter(pk =>
  pk.networks?.includes(networkId)
);
console.log('Available pubkeys:', chainPubkeys.map(pk => ({
  scriptType: pk.scriptType,
  pubkey: pk.pubkey.substring(0, 15) + '...'
})));
```

### Monitor Backend Change Index
```typescript
const response = await app.pioneer.GetChangeAddress({
  network: assetSymbol,
  xpub: correctXpub
});
console.log('Backend change index:', response.data.changeIndex);
```

## Test Coverage Matrix

| Chain | Default | p2pkh | p2sh-p2wpkh | p2wpkh | Mixed Inputs |
|-------|---------|-------|-------------|--------|--------------|
| BTC   | ✅      | ✅    | ✅          | ✅     | ✅           |
| LTC   | ✅      | ✅    | ✅          | ✅     | ✅           |
| DOGE  | ✅      | ✅    | N/A         | N/A    | ✅           |
| DASH  | ✅      | ✅    | N/A         | N/A    | ✅           |
| BCH   | ✅      | ✅    | N/A         | N/A    | ✅           |

**Legend**:
- ✅ Test runs and validates
- N/A: Chain doesn't support this script type

## Quick Validation Checklist

Before merging:
- [ ] All 5 UTXO chains pass tests
- [ ] All 4 test scenarios cycle correctly
- [ ] Coin type validation passes for each chain
- [ ] Script type preferences are respected
- [ ] Change indices are sequential
- [ ] No critical errors in logs
- [ ] Transactions successfully broadcast
