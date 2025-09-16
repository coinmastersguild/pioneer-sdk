/**
 * Fee Management Module for Pioneer SDK
 *
 * Handles all fee-related complexity, normalization, and provides
 * a clean, consistent interface for the frontend.
 */

const TAG = ' | Pioneer-sdk | fees | ';

export interface FeeLevel {
  label: string;
  value: string;
  unit: string;
  description: string;
  estimatedTime?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NormalizedFeeRates {
  slow: FeeLevel;
  average: FeeLevel;
  fastest: FeeLevel;
  networkId: string;
  networkType: 'UTXO' | 'EVM' | 'COSMOS' | 'RIPPLE' | 'OTHER';
  raw: any; // Original API response for debugging
}

export interface FeeEstimate {
  amount: string;
  unit: string;
  usdValue?: string;
}

// Network type detection
function getNetworkType(networkId: string): 'UTXO' | 'EVM' | 'COSMOS' | 'RIPPLE' | 'OTHER' {
  if (networkId.startsWith('bip122:')) return 'UTXO';
  if (networkId.startsWith('eip155:')) return 'EVM';
  if (networkId.startsWith('cosmos:')) return 'COSMOS';
  if (networkId.startsWith('ripple:')) return 'RIPPLE';
  return 'OTHER';
}

// Get human-readable network name
function getNetworkName(networkId: string): string {
  const networkNames: Record<string, string> = {
    'bip122:000000000019d6689c085ae165831e93': 'Bitcoin',
    'bip122:12a765e31ffd4059bada1e25190f6e98': 'Litecoin',
    'bip122:00000000001a91e3dace36e2be3bf030': 'Dogecoin',
    'bip122:000000000000000000651ef99cb9fcbe': 'Bitcoin Cash',
    'bip122:000007d91d1254d60e2dd1ae58038307': 'Dash',
    'eip155:1': 'Ethereum',
    'eip155:56': 'BNB Smart Chain',
    'eip155:137': 'Polygon',
    'eip155:43114': 'Avalanche',
    'eip155:8453': 'Base',
    'eip155:10': 'Optimism',
    'cosmos:cosmoshub-4': 'Cosmos Hub',
    'cosmos:osmosis-1': 'Osmosis',
    'cosmos:thorchain-mainnet-v1': 'THORChain',
    'cosmos:mayachain-mainnet-v1': 'Maya',
    'ripple:4109c6f2045fc7eff4cde8f9905d19c2': 'Ripple',
  };
  return networkNames[networkId] || networkId;
}

/**
 * Main fee fetching and normalization function
 * Handles all the complexity of different API formats and returns
 * a clean, normalized structure for the UI
 */
export async function getFees(
  pioneer: any,
  networkId: string
): Promise<NormalizedFeeRates> {
  const tag = TAG + ' | getFees | ';

  try {
    console.log(tag, `Fetching fees for network: ${networkId}`);

    // For Cosmos chains, always use hardcoded fees
    const networkType = getNetworkType(networkId);
    if (networkType === 'COSMOS') {
      console.log(tag, 'Using hardcoded fees for Cosmos network:', networkId);
      return getCosmosFees(networkId);
    }

    // Get raw fee data from API
    const feeResponse = await (pioneer.GetFeeRateByNetwork
      ? pioneer.GetFeeRateByNetwork({ networkId })
      : pioneer.GetFeeRate({ networkId }));

    if (!feeResponse || !feeResponse.data) {
      throw new Error(`No fee data returned for ${networkId}`);
    }

    const feeData = feeResponse.data;
    console.log(tag, 'Raw fee data:', feeData);

    // Network type already detected above, just get network name
    const networkName = getNetworkName(networkId);

    // Normalize the fee data based on format
    let normalizedFees = normalizeFeeData(feeData, networkType, networkName);

    // Ensure fees are differentiated for better UX
    normalizedFees = ensureFeeDifferentiation(normalizedFees, networkType);

    // Add network metadata
    normalizedFees.networkId = networkId;
    normalizedFees.networkType = networkType;
    normalizedFees.raw = feeData;

    console.log(tag, 'Normalized fees:', normalizedFees);
    return normalizedFees;

  } catch (error: any) {
    console.error(tag, 'Failed to fetch fees:', error);

    // Return sensible defaults on error
    return getFallbackFees(networkId);
  }
}

/**
 * Normalize fee data from various API formats to consistent UI format
 */
function normalizeFeeData(
  feeData: any,
  networkType: string,
  networkName: string
): NormalizedFeeRates {
  // Check which format the API returned
  const hasSlowAverageFastest = feeData.slow !== undefined &&
                                feeData.average !== undefined &&
                                feeData.fastest !== undefined;

  const hasAverageFastFastest = feeData.average !== undefined &&
                                feeData.fast !== undefined &&
                                feeData.fastest !== undefined;

  let slowValue: string, averageValue: string, fastestValue: string;

  if (hasSlowAverageFastest) {
    // Already in UI format
    slowValue = feeData.slow.toString();
    averageValue = feeData.average.toString();
    fastestValue = feeData.fastest.toString();
  } else if (hasAverageFastFastest) {
    // Map API format to UI format
    slowValue = feeData.average.toString();
    averageValue = feeData.fast.toString();
    fastestValue = feeData.fastest.toString();
  } else {
    throw new Error('Unknown fee data format');
  }

  // Get unit and descriptions based on network type
  const unit = feeData.unit || getDefaultUnit(networkType);
  const baseDescription = feeData.description || getDefaultDescription(networkType, networkName);

  return {
    slow: {
      label: 'Economy',
      value: slowValue,
      unit,
      description: `${baseDescription} - Lower priority, may take longer to confirm.`,
      estimatedTime: getEstimatedTime(networkType, 'low'),
      priority: 'low',
    },
    average: {
      label: 'Standard',
      value: averageValue,
      unit,
      description: `${baseDescription} - Normal priority, typical confirmation time.`,
      estimatedTime: getEstimatedTime(networkType, 'medium'),
      priority: 'medium',
    },
    fastest: {
      label: 'Priority',
      value: fastestValue,
      unit,
      description: `${baseDescription} - High priority, fastest confirmation.`,
      estimatedTime: getEstimatedTime(networkType, 'high'),
      priority: 'high',
    },
    networkId: '',
    networkType: networkType as any,
    raw: feeData,
  };
}

/**
 * Ensure fees are differentiated for better UX
 */
function ensureFeeDifferentiation(
  fees: NormalizedFeeRates,
  networkType: string
): NormalizedFeeRates {
  const slowVal = parseFloat(fees.slow.value) || 0;
  const avgVal = parseFloat(fees.average.value) || 0;
  const fastestVal = parseFloat(fees.fastest.value) || 0;

  // Check if all values are zero
  if (slowVal === 0 && avgVal === 0 && fastestVal === 0) {
    console.warn('All fee values are 0 - using fallback values');
    // Return sensible defaults based on network type
    if (networkType === 'UTXO') {
      return {
        ...fees,
        slow: { ...fees.slow, value: '1' },
        average: { ...fees.average, value: '2' },
        fastest: { ...fees.fastest, value: '3' },
      };
    } else {
      return {
        ...fees,
        slow: { ...fees.slow, value: '1' },
        average: { ...fees.average, value: '1.5' },
        fastest: { ...fees.fastest, value: '2' },
      };
    }
  }

  // For UTXO networks with very similar values (like 1, 1, 1.01)
  if (networkType === 'UTXO') {
    const diff = fastestVal - slowVal;
    if (diff < 0.5) {
      console.warn('UTXO fees too similar, adjusting for better UX');
      return {
        ...fees,
        slow: { ...fees.slow, value: slowVal.toString() },
        average: { ...fees.average, value: (slowVal + 1).toString() },
        fastest: { ...fees.fastest, value: (slowVal + 2).toString() },
      };
    }
  }

  // For EVM networks, check if values are already well differentiated
  // Don't adjust if there's already good separation
  const slowToAvgRatio = avgVal / slowVal;
  const avgToFastRatio = fastestVal / avgVal;

  // If ratios show good differentiation (at least 10% difference), keep original
  if (slowToAvgRatio >= 1.1 && avgToFastRatio >= 1.1) {
    return fees; // Already well differentiated
  }

  // Only adjust if fees are too similar
  console.warn('Fees not well differentiated, adjusting slightly');
  return {
    ...fees,
    slow: { ...fees.slow, value: slowVal.toString() },
    average: { ...fees.average, value: (slowVal * 1.2).toFixed(6) },
    fastest: { ...fees.fastest, value: (slowVal * 1.5).toFixed(6) },
  };
}

/**
 * Get default unit based on network type
 */
function getDefaultUnit(networkType: string): string {
  switch (networkType) {
    case 'UTXO':
      return 'sat/vB';
    case 'EVM':
      return 'gwei';
    case 'COSMOS':
      return 'uatom';
    case 'RIPPLE':
      return 'XRP';
    default:
      return 'units';
  }
}

/**
 * Get default description based on network type
 */
function getDefaultDescription(networkType: string, networkName: string): string {
  switch (networkType) {
    case 'UTXO':
      return `Fee rate in satoshis per virtual byte for ${networkName}`;
    case 'EVM':
      return `Gas price in Gwei for ${networkName} (1 Gwei = 0.000000001 ETH)`;
    case 'COSMOS':
      return `Transaction fee for ${networkName}`;
    case 'RIPPLE':
      return `Fixed transaction fee for ${networkName}`;
    default:
      return `Transaction fee for ${networkName}`;
  }
}

/**
 * Get estimated confirmation time
 */
function getEstimatedTime(networkType: string, priority: string): string {
  const times: Record<string, Record<string, string>> = {
    UTXO: {
      low: '~60+ minutes',
      medium: '~30 minutes',
      high: '~10 minutes',
    },
    EVM: {
      low: '~5 minutes',
      medium: '~2 minutes',
      high: '~30 seconds',
    },
    COSMOS: {
      low: '~10 seconds',
      medium: '~7 seconds',
      high: '~5 seconds',
    },
    RIPPLE: {
      low: '~4 seconds',
      medium: '~4 seconds',
      high: '~4 seconds',
    },
  };

  return times[networkType]?.[priority] || '~varies';
}

/**
 * Get hardcoded Cosmos fees based on network
 */
function getCosmosFees(networkId: string): NormalizedFeeRates {
  const networkName = getNetworkName(networkId);

  // These match the fees in txbuilder/createUnsignedTendermintTx.ts
  const cosmosFeesMap: Record<string, { base: number; unit: string; denom: string }> = {
    'cosmos:thorchain-mainnet-v1': { base: 0.02, unit: 'RUNE', denom: 'rune' },
    'cosmos:mayachain-mainnet-v1': { base: 0.2, unit: 'MAYA', denom: 'maya' },
    'cosmos:cosmoshub-4': { base: 0.005, unit: 'ATOM', denom: 'uatom' },
    'cosmos:osmosis-1': { base: 0.035, unit: 'OSMO', denom: 'uosmo' },
  };

  const feeConfig = cosmosFeesMap[networkId] || { base: 0.025, unit: 'units', denom: 'units' };

  // For Cosmos, we provide the base fee with different priority multipliers
  const slowFee = feeConfig.base.toString();
  const avgFee = (feeConfig.base * 1.5).toFixed(4);
  const fastFee = (feeConfig.base * 2).toFixed(4);

  return {
    slow: {
      label: 'Economy',
      value: slowFee,
      unit: feeConfig.unit,
      description: `Standard fee for ${networkName}. Gas is automatically calculated.`,
      estimatedTime: '~10 seconds',
      priority: 'low',
    },
    average: {
      label: 'Standard',
      value: avgFee,
      unit: feeConfig.unit,
      description: `Priority fee for ${networkName}. Slightly higher for faster processing.`,
      estimatedTime: '~7 seconds',
      priority: 'medium',
    },
    fastest: {
      label: 'Priority',
      value: fastFee,
      unit: feeConfig.unit,
      description: `Maximum priority for ${networkName}. Fastest possible confirmation.`,
      estimatedTime: '~5 seconds',
      priority: 'high',
    },
    networkId,
    networkType: 'COSMOS',
    raw: { hardcoded: true, base: feeConfig.base, unit: feeConfig.unit, denom: feeConfig.denom },
  };
}

/**
 * Get fallback fees when API fails
 */
function getFallbackFees(networkId: string): NormalizedFeeRates {
  const networkType = getNetworkType(networkId);
  const networkName = getNetworkName(networkId);

  // For Cosmos chains, use hardcoded fees
  if (networkType === 'COSMOS') {
    return getCosmosFees(networkId);
  }

  // Default fallback values by network type
  const fallbacks: Record<string, { slow: string; average: string; fastest: string; unit: string }> = {
    UTXO: { slow: '1', average: '2', fastest: '3', unit: 'sat/vB' },
    EVM: { slow: '1', average: '1.5', fastest: '2', unit: 'gwei' },
    RIPPLE: { slow: '0.00001', average: '0.00001', fastest: '0.00001', unit: 'XRP' },
  };

  const fallback = fallbacks[networkType] || fallbacks.UTXO;

  return {
    slow: {
      label: 'Economy',
      value: fallback.slow,
      unit: fallback.unit,
      description: `Default fee for ${networkName} (API unavailable)`,
      estimatedTime: getEstimatedTime(networkType, 'low'),
      priority: 'low',
    },
    average: {
      label: 'Standard',
      value: fallback.average,
      unit: fallback.unit,
      description: `Default fee for ${networkName} (API unavailable)`,
      estimatedTime: getEstimatedTime(networkType, 'medium'),
      priority: 'medium',
    },
    fastest: {
      label: 'Priority',
      value: fallback.fastest,
      unit: fallback.unit,
      description: `Default fee for ${networkName} (API unavailable)`,
      estimatedTime: getEstimatedTime(networkType, 'high'),
      priority: 'high',
    },
    networkId,
    networkType: networkType as any,
    raw: null,
  };
}

/**
 * Calculate estimated transaction fee based on fee rate and transaction size
 */
export function estimateTransactionFee(
  feeRate: string,
  unit: string,
  networkType: string,
  txSize?: number
): FeeEstimate {
  switch (networkType) {
    case 'UTXO':
      // For UTXO chains, multiply fee rate by transaction size
      const sizeInBytes = txSize || 250; // Default estimate
      const feeInSatoshis = parseFloat(feeRate) * sizeInBytes;
      const feeInBTC = feeInSatoshis / 100000000;
      return {
        amount: feeInBTC.toFixed(8),
        unit: 'BTC',
      };

    case 'EVM':
      // For EVM chains, multiply gas price by gas limit
      const gasLimit = 21000; // Standard transfer
      const feeInGwei = parseFloat(feeRate) * gasLimit;
      const feeInEth = feeInGwei / 1000000000;
      return {
        amount: feeInEth.toFixed(9),
        unit: 'ETH',
      };

    case 'RIPPLE':
      // Ripple has fixed fees
      return {
        amount: feeRate,
        unit: 'XRP',
      };

    default:
      return {
        amount: feeRate,
        unit: unit,
      };
  }
}