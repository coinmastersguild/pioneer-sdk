# ERC-20 Token Transfer Failure Analysis

## Transaction Details
- **Transaction Hash**: `0x00ba81ce6135c4617deb857a835fb4f3016d2bda9f66a049693dd043415b5ef7`
- **Status**: FAILED ❌
- **Block**: 75089835
- **Network**: Polygon (Chain 137)
- **Timestamp**: Aug-11-2025 10:27:00 PM UTC

## Parties Involved
- **From**: `0x141D9959cAe3853b035000490C03991eB70Fc4aC`
- **To (Token Contract)**: `0x65A05DB8322701724c197AF82C9CaE41195B0aA8` (FOX Token on Polygon)
- **Intended Recipient**: `0x658DE0443259a1027caA976ef9a42E6982037A03` (Faucet address)

## Error Details
- **Primary Error**: "ERC-20 Token Transfer Error (Unable to locate corresponding Transfer Event Logs)"
- **KeepKey Display**: "Unknown Amount" 
- **Explorer Message**: "Check with Sender"

## Root Cause Analysis - CONFIRMED ✅

### PRIMARY CAUSE: Out of Gas Error
**The transaction failed because it ran out of gas at 52,655/60,000 (88% usage)**

From the Polygon explorer trace:
- Error Message: **"out of gas"**
- Gas Used: 52,655
- Gas Limit: 60,000  
- Failed at: `_balances[recipient] = _balances[recipient].add(amount);` 

The transaction nearly completed but ran out of gas during the final SSTORE operation to update the recipient's balance.

### 2. Transaction Data Analysis
From the logs, we can see:
```javascript
// Token amount calculation looked correct:
Token amount calculation: {
  inputAmount: 0.001,
  decimals: 18,
  multiplier: 1000000000000000000,
  resultWei: '1000000000000000'
}
```

The amount calculation (0.001 tokens = 1000000000000000 wei) appears correct for an 18-decimal token.

### 3. Data Encoding Verification
The transaction was built with:
- Contract Address: `0x65A05DB8322701724c197AF82C9CaE41195B0aA8` (FOX token)
- Function: `transfer(address,uint256)` with selector `0xa9059cbb`
- Recipient: `0x658DE0443259a1027caA976ef9a42E6982037A03`
- Amount: `1000000000000000` wei (0.001 FOX)

### 4. Possible Issues Identified

#### Issue 1: Token Decimals Mismatch
The code assumes 18 decimals for all ERC-20 tokens:
```javascript
const tokenDecimals = assetInfo?.decimals || 18;
```
If FOX token on Polygon doesn't have 18 decimals, this would cause an incorrect amount.

#### Issue 2: Insufficient Token Balance
The test shows the wallet had only `0.07775943` FOX tokens, and we tried to send `0.001`. While this should be sufficient, there might be a balance check issue.

#### Issue 3: Gas Estimation
The transaction might have run out of gas. The code uses a fixed gas limit:
```javascript
let gasLimit = BigInt(60000);
```
This might be insufficient for some token transfers.

#### Issue 4: Token Contract Issues
The FOX token contract might have additional requirements (paused, allowlist, etc.) that weren't met.

## Debugging Steps Performed

1. **Fixed Portfolio API Balance Retrieval**: 
   - Modified `getBalancesForNetworks` to include ERC-20 tokens in queries
   - Successfully retrieved FOX token balance

2. **Fixed Token Price Fetching**:
   - Made price fetching network-aware (Polygon vs Ethereum)
   - Made price fetching non-blocking (returns 0 instead of throwing)

3. **Transaction Building**:
   - Verified data encoding follows ERC-20 standard
   - Confirmed amount calculation for 18 decimals

## Recommendations for Fix

### 1. Verify Token Decimals
```javascript
// Add actual decimal fetching from contract
const getTokenDecimals = async (contractAddress, networkId) => {
  // Call decimals() function on the contract
  const decimalsData = await pioneer.CallContract({
    networkId,
    contractAddress,
    data: '0x313ce567' // decimals() selector
  });
  return parseInt(decimalsData, 16);
};
```

### 2. Increase Gas Limit for Token Transfers
```javascript
// Use higher gas limit for token transfers
let gasLimit = BigInt(100000); // Increase from 60000
```

### 3. Add Token Balance Validation
```javascript
// Verify token balance before transaction
const tokenBalance = await pioneer.GetTokenBalance({
  networkId,
  address: fromAddress,
  contractAddress
});
if (tokenBalance < amount) {
  throw new Error(`Insufficient token balance: ${tokenBalance} < ${amount}`);
}
```

### 4. Improve KeepKey Display
The "unknown amount" issue suggests the KeepKey firmware might not recognize the token. Need to:
- Verify token metadata is passed correctly
- Ensure decimals are included in the signing request
- Check if token needs to be whitelisted in KeepKey

## Test Data for Reproduction
```javascript
const testTransaction = {
  from: "0x141D9959cAe3853b035000490C03991eB70Fc4aC",
  to: "0x65A05DB8322701724c197AF82C9CaE41195B0aA8", // FOX token contract
  data: "0xa9059cbb" + // transfer function
        "000000000000000000000000658de0443259a1027caa976ef9a42e6982037a03" + // recipient
        "00000000000000000000000000000000000000000000000000038d7ea4c68000", // amount (0.001 * 10^18)
  value: "0x0",
  gasLimit: "0xea60", // 60000
  gasPrice: "0x07735940", // from logs
  chainId: 137
};
```

## Next Steps

1. **Check actual FOX token decimals on Polygon**:
   ```bash
   cast call 0x65A05DB8322701724c197AF82C9CaE41195B0aA8 "decimals()" --rpc-url polygon
   ```

2. **Verify token balance**:
   ```bash
   cast call 0x65A05DB8322701724c197AF82C9CaE41195B0aA8 \
     "balanceOf(address)" 0x141D9959cAe3853b035000490C03991eB70Fc4aC \
     --rpc-url polygon
   ```

3. **Simulate transaction locally** to identify exact failure point

4. **Review KeepKey firmware logs** for why amount shows as "unknown"

5. **Test with different token** to isolate if issue is FOX-specific

## Summary
The transaction failed due to an ERC-20 transfer error. The main symptoms are:
1. KeepKey displayed "unknown amount" 
2. Transaction reverted on-chain
3. No Transfer event logs were emitted

Most likely causes:
1. Token decimals mismatch (assumed 18, might be different)
2. Insufficient gas limit (60000 might be too low)
3. KeepKey firmware issue with token recognition

The fix requires:
1. Dynamic token decimal detection
2. Higher gas limits for token transfers  
3. Better token metadata handling for KeepKey display