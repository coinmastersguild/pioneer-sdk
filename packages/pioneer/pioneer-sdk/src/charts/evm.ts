import { ChartBalance, ChartParams, PortfolioBalance, PortfolioToken } from './types';
import { hydrateAssetData, checkDuplicateBalance, createBalanceIdentifier } from './utils';

const tag = '| charts-evm |';

export async function getEvmCharts(params: ChartParams): Promise<ChartBalance[]> {
  const { blockchains, pioneer, pubkeys, context } = params;
  const balances: ChartBalance[] = [];
  
  // Find the primary address for portfolio lookup
  // ONLY use EVM addresses since the portfolio endpoint uses Zapper which only supports Ethereum
  const evmPubkey = pubkeys.find(
    (e: any) => e.networks && Array.isArray(e.networks) && e.networks.includes('eip155:*'),
  );
  const primaryAddress = evmPubkey?.address || evmPubkey?.master;

  console.log(tag, 'Total pubkeys available:', pubkeys.length);
  console.log(tag, 'Blockchains to process:', blockchains);

  // Only call portfolio endpoint if we have an EVM address (Zapper requirement)
  if (!primaryAddress) {
    console.log(
      tag,
      'No EVM address found, skipping portfolio lookup (Zapper only supports Ethereum)',
    );
    return balances;
  }

  console.log(tag, 'Using EVM address for portfolio:', primaryAddress);

  try {
    let portfolio = await pioneer.GetPortfolio({ address: primaryAddress });
    portfolio = portfolio.data;

    if (!portfolio || !portfolio.balances) {
      console.error(tag, 'No portfolio.balances found:', portfolio);
      return balances;
    }

    // Process main balances
    for (const balance of portfolio.balances) {
      const processedBalance = processPortfolioBalance(balance, primaryAddress, context, blockchains);
      if (processedBalance && !checkDuplicateBalance(balances, processedBalance.caip, processedBalance.pubkey)) {
        balances.push(processedBalance);
      }
    }

    // Process tokens from portfolio (if they exist)
    if (portfolio.tokens && portfolio.tokens.length > 0) {
      console.log(tag, 'Processing portfolio.tokens:', portfolio.tokens.length);
      
      for (const token of portfolio.tokens) {
        const processedToken = processPortfolioToken(token, primaryAddress, context, blockchains);
        if (processedToken && !checkDuplicateBalance(balances, processedToken.caip, processedToken.pubkey)) {
          balances.push(processedToken);
        }
      }
    }
  } catch (e) {
    console.error(tag, 'Error fetching portfolio:', e);
  }

  return balances;
}

function processPortfolioBalance(
  balance: PortfolioBalance,
  primaryAddress: string,
  context: string,
  blockchains: string[]
): ChartBalance | null {
  if (!balance.caip) {
    console.error(tag, 'No caip found for:', balance);
    return null;
  }

  // Always derive networkId from CAIP
  const networkId = balance.caip.split('/')[0];
  
  // Skip if not in requested blockchains
  if (!blockchains.includes(networkId)) {
    return null;
  }

  // Hydrate with assetData
  const assetInfo = hydrateAssetData(balance.caip);
  
  // CRITICAL FIX: Use the original balance.pubkey from API if it exists,
  // otherwise fall back to primaryAddress. This ensures identifier consistency
  // with regular balance fetching which uses the API's balance.pubkey value.
  const balancePubkey = balance.pubkey || primaryAddress;
  
  const chartBalance: ChartBalance = {
    context,
    chart: 'pioneer',
    contextType: 'keepkey',
    name: assetInfo?.name || balance.name || 'Unknown',
    caip: balance.caip,
    icon: assetInfo?.icon || balance.icon || '',
    pubkey: balancePubkey,
    ticker: assetInfo?.symbol || balance.symbol || 'UNK',
    ref: `${context}${balance.caip}`,
    identifier: createBalanceIdentifier(balance.caip, balancePubkey),
    networkId,
    chain: networkId,
    symbol: assetInfo?.symbol || balance.symbol || 'UNK',
    type: assetInfo?.type || balance.type || 'native',
    decimal: assetInfo?.decimal || balance.decimal,
    balance: balance.balance.toString(),
    priceUsd: 0,
    valueUsd: balance.valueUsd.toString(),
    updated: new Date().getTime(),
  };

  // Handle display icon for multi-asset icons
  if (balance.display) {
    chartBalance.icon = ['multi', chartBalance.icon, balance.display.toString()].toString();
  }

  return chartBalance;
}

function processPortfolioToken(
  token: PortfolioToken,
  primaryAddress: string,
  context: string,
  blockchains: string[]
): ChartBalance | null {
  if (!token.assetCaip || !token.networkId) {
    return null;
  }

  // Extract the networkId from the assetCaip for special token formats
  let extractedNetworkId = token.networkId;
  
  // Special handling for tokens with special formats
  if (token.assetCaip.includes('/denom:')) {
    // Extract the network part before /denom:
    const parts = token.assetCaip.split('/denom:');
    if (parts.length > 0) {
      extractedNetworkId = parts[0];
    }
  } else if (token.networkId && token.networkId.includes('/')) {
    // For other tokens, split by / and take the first part
    extractedNetworkId = token.networkId.split('/')[0];
  }

  // Skip if not in requested blockchains
  if (!blockchains.includes(extractedNetworkId)) {
    return null;
  }

  // Hydrate token with assetData
  const tokenAssetInfo = hydrateAssetData(token.assetCaip);
  
  // CRITICAL FIX: Use consistent pubkey for tokens too
  const tokenPubkey = token.pubkey || primaryAddress;

  const chartBalance: ChartBalance = {
    context,
    chart: 'pioneer',
    contextType: context.split(':')[0],
    name: tokenAssetInfo?.name || token.token?.coingeckoId || token.token?.name || 'Unknown',
    caip: token.assetCaip,
    icon: tokenAssetInfo?.icon || token.token?.icon || '',
    pubkey: tokenPubkey,
    ticker: tokenAssetInfo?.symbol || token.token?.symbol || 'UNK',
    ref: `${context}${token.assetCaip}`,
    identifier: createBalanceIdentifier(token.assetCaip, tokenPubkey),
    networkId: extractedNetworkId,
    symbol: tokenAssetInfo?.symbol || token.token?.symbol || 'UNK',
    type: tokenAssetInfo?.type || 'token',
    decimal: tokenAssetInfo?.decimal || token.token?.decimal,
    balance: token.token?.balance?.toString() || '0',
    priceUsd: token.token?.price || 0,
    valueUsd: token.token?.balanceUSD || 0,
    updated: new Date().getTime(),
  };

  return chartBalance;
}