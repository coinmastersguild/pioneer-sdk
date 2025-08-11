/**
 * CAIP Validator and Corrector
 * 
 * This module provides validation and correction for CAIP identifiers
 * to prevent incorrect asset identification, especially for ERC-20 tokens
 * being assigned native asset CAIPs.
 */

const TAG = ' | CAIP-Validator | ';

// Known contract addresses for common tokens
const KNOWN_TOKENS: Record<string, { address: string; symbol: string; name: string }> = {
  // Ethereum Mainnet
  'eETH': { 
    address: '0x35fa164735182de50811e8e2e824cfb9b6118ac2', 
    symbol: 'eETH', 
    name: 'Ether.fi Staked ETH' 
  },
  'USDC': { 
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 
    symbol: 'USDC', 
    name: 'USD Coin' 
  },
  'USDT': { 
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7', 
    symbol: 'USDT', 
    name: 'Tether USD' 
  },
  'WETH': { 
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 
    symbol: 'WETH', 
    name: 'Wrapped Ether' 
  },
};

// Native asset CAIPs for different networks
const NATIVE_CAIPS: Record<string, string> = {
  'eip155:1': 'eip155:1/slip44:60',           // ETH on Ethereum
  'eip155:137': 'eip155:137/slip44:60',       // MATIC on Polygon
  'eip155:43114': 'eip155:43114/slip44:60',   // AVAX on Avalanche
  'eip155:56': 'eip155:56/slip44:60',         // BNB on BSC
  'eip155:10': 'eip155:10/slip44:60',         // ETH on Optimism
  'eip155:42161': 'eip155:42161/slip44:60',   // ETH on Arbitrum
  'eip155:8453': 'eip155:8453/slip44:60',     // ETH on Base
  'bip122:000000000019d6689c085ae165831e93': 'bip122:000000000019d6689c085ae165831e93/slip44:0', // BTC
  'cosmos:cosmoshub-4': 'cosmos:cosmoshub-4/slip44:118',  // ATOM
  'cosmos:osmosis-1': 'cosmos:osmosis-1/slip44:118',      // OSMO
  'cosmos:mayachain-mainnet-v1': 'cosmos:mayachain-mainnet-v1/slip44:931', // CACAO
  'cosmos:thorchain-mainnet-v1': 'cosmos:thorchain-mainnet-v1/slip44:931', // RUNE
};

export interface BalanceValidation {
  isValid: boolean;
  issues: string[];
  suggestedCaip?: string;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * Validates a CAIP identifier for correctness
 */
export function validateCaip(balance: any): BalanceValidation {
  const issues: string[] = [];
  let suggestedCaip: string | undefined;
  let severity: 'critical' | 'warning' | 'info' = 'info';
  
  try {
    const { caip, networkId, contractAddress, appId, symbol, name, type } = balance;
    
    if (!caip) {
      issues.push('Missing CAIP identifier');
      severity = 'critical';
      return { isValid: false, issues, severity };
    }
    
    // Parse CAIP
    const [network, assetType] = caip.split('/');
    
    if (!network || !assetType) {
      issues.push(`Invalid CAIP format: ${caip}`);
      severity = 'critical';
      return { isValid: false, issues, severity };
    }
    
    // Determine if this should be a token
    const isToken = !!(
      contractAddress || 
      appId || 
      type === 'token' ||
      type === 'erc20' ||
      type === 'erc721' ||
      (name && name !== symbol && name.toLowerCase().includes('token'))
    );
    
    // Special check for known tokens that shouldn't have native CAIPs
    const isKnownToken = !!(
      (symbol === 'eETH' || name === 'eETH') ||
      (symbol === 'WETH' || name === 'Wrapped Ether') ||
      (appId === 'ether-fi') ||
      (name && name.toLowerCase().includes('wrapped')) ||
      (name && name.toLowerCase().includes('staked'))
    );
    
    if (isKnownToken && assetType.includes('slip44')) {
      issues.push(`Known token "${name || symbol}" using native asset CAIP`);
      severity = 'critical';
      
      // Try to find the correct contract address
      const tokenInfo = Object.values(KNOWN_TOKENS).find(
        t => t.symbol === symbol || t.name === name
      );
      if (tokenInfo) {
        suggestedCaip = `${network}/erc20:${tokenInfo.address.toLowerCase()}`;
      }
    }
    
    if (isToken) {
      // Tokens should NOT use slip44
      if (assetType.includes('slip44')) {
        issues.push('Token using native asset CAIP (slip44)');
        severity = 'critical';
        
        if (contractAddress) {
          suggestedCaip = `${network}/erc20:${contractAddress.toLowerCase()}`;
        }
      }
      
      // ERC tokens MUST have contract address
      if ((assetType.includes('erc20') || assetType.includes('erc721')) && !assetType.includes('0x')) {
        issues.push('ERC token missing contract address in CAIP');
        severity = 'critical';
        
        if (contractAddress) {
          const tokenType = assetType.includes('erc721') ? 'erc721' : 'erc20';
          suggestedCaip = `${network}/${tokenType}:${contractAddress.toLowerCase()}`;
        }
      }
    } else {
      // Native assets should use slip44 (with some exceptions for cosmos denoms)
      if (!assetType.includes('slip44') && !assetType.includes('denom:')) {
        issues.push('Native asset not using slip44 CAIP format');
        severity = 'warning';
        
        // Suggest correct native CAIP
        suggestedCaip = NATIVE_CAIPS[network];
      }
    }
    
    // Check for duplicate native asset CAIPs (this is always critical)
    if (assetType.includes('slip44')) {
      const nativeCaip = NATIVE_CAIPS[network];
      if (caip === nativeCaip && isKnownToken) {
        issues.push('Token incorrectly using native asset CAIP');
        severity = 'critical';
      }
    }
    
    const isValid = issues.length === 0;
    return { isValid, issues, suggestedCaip, severity };
    
  } catch (error) {
    console.error(TAG, 'Error validating CAIP:', error);
    return { 
      isValid: false, 
      issues: ['Error during validation: ' + error], 
      severity: 'critical' 
    };
  }
}

/**
 * Attempts to correct an invalid CAIP
 */
export function correctCaip(balance: any): string {
  const { networkId, contractAddress, symbol, appId, name, type, caip } = balance;
  
  try {
    // For known tokens, use their correct contract addresses
    if (symbol || name) {
      const tokenInfo = Object.values(KNOWN_TOKENS).find(
        t => t.symbol === symbol || t.name === name
      );
      if (tokenInfo && networkId === 'eip155:1') {
        return `eip155:1/erc20:${tokenInfo.address.toLowerCase()}`;
      }
    }
    
    // For ERC-20/721 tokens with contract address
    if (contractAddress && networkId?.startsWith('eip155:')) {
      const tokenType = type === 'erc721' ? 'erc721' : 'erc20';
      return `${networkId}/${tokenType}:${contractAddress.toLowerCase()}`;
    }
    
    // For native assets
    if (!contractAddress && !appId && !type) {
      const nativeCaip = NATIVE_CAIPS[networkId];
      if (nativeCaip) {
        return nativeCaip;
      }
    }
    
    // Special case for cosmos denoms
    if (networkId?.includes('cosmos:') && caip?.includes('/denom:')) {
      // These are usually correct, return as-is
      return caip;
    }
    
    // Default to original if we can't determine correct CAIP
    console.warn(TAG, 'Could not determine correct CAIP for:', balance);
    return caip;
    
  } catch (error) {
    console.error(TAG, 'Error correcting CAIP:', error);
    return caip;
  }
}

/**
 * Checks if a balance array contains duplicate native asset CAIPs
 */
export function detectDuplicateNativeCAIPs(balances: any[]): Map<string, any[]> {
  const duplicates = new Map<string, any[]>();
  const seen = new Map<string, any>();
  
  for (const balance of balances) {
    if (!balance.caip) continue;
    
    // Only check native asset CAIPs
    if (balance.caip.includes('slip44')) {
      const key = `${balance.caip}:${balance.pubkey || balance.address}`;
      
      if (seen.has(key)) {
        // Found duplicate
        if (!duplicates.has(key)) {
          duplicates.set(key, [seen.get(key)]);
        }
        duplicates.get(key)!.push(balance);
      } else {
        seen.set(key, balance);
      }
    }
  }
  
  return duplicates;
}

/**
 * Validates and corrects all balances in an array
 */
export function validateAndCorrectBalances(balances: any[]): {
  corrected: any[];
  issues: Array<{ balance: any; validation: BalanceValidation }>;
} {
  const corrected: any[] = [];
  const issues: Array<{ balance: any; validation: BalanceValidation }> = [];
  
  for (const balance of balances) {
    const validation = validateCaip(balance);
    
    if (!validation.isValid) {
      issues.push({ balance, validation });
      
      // Log critical issues
      if (validation.severity === 'critical') {
        console.error(TAG, 'CRITICAL CAIP ISSUE:', {
          original: balance.caip,
          suggested: validation.suggestedCaip,
          issues: validation.issues,
          balance: {
            symbol: balance.symbol,
            name: balance.name,
            appId: balance.appId,
            contractAddress: balance.contractAddress
          }
        });
      }
      
      // Attempt correction
      if (validation.suggestedCaip) {
        balance.caip = validation.suggestedCaip;
        balance.caipCorrected = true;
        console.warn(TAG, 'Corrected CAIP:', {
          from: balance.caip,
          to: validation.suggestedCaip
        });
      }
    }
    
    corrected.push(balance);
  }
  
  // Check for duplicates
  const duplicates = detectDuplicateNativeCAIPs(corrected);
  if (duplicates.size > 0) {
    console.error(TAG, 'DUPLICATE NATIVE CAIPS DETECTED:');
    duplicates.forEach((dups, key) => {
      console.error(TAG, `  ${key}:`, dups.map(d => ({
        name: d.name,
        symbol: d.symbol,
        appId: d.appId
      })));
    });
  }
  
  return { corrected, issues };
}