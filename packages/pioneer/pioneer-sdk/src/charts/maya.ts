import { ChartBalance, ChartParams } from './types';
import { hydrateAssetData, checkDuplicateBalance, createBalanceIdentifier } from './utils';

const tag = '| charts-maya |';

export async function getMayaCharts(
  params: ChartParams,
  existingBalances: ChartBalance[]
): Promise<ChartBalance[]> {
  const { blockchains, pioneer, pubkeys, context } = params;
  const balances: ChartBalance[] = [];
  
  try {
    // Check if we have a MAYA address
    const mayaPubkey = pubkeys.find(
      (p: any) =>
        p.networks &&
        Array.isArray(p.networks) &&
        p.networks.includes('cosmos:mayachain-mainnet-v1'),
    );
    
    if (!mayaPubkey || !mayaPubkey.address) {
      console.log(tag, 'No MAYA pubkey found, skipping MAYA token fetch');
      return balances;
    }

    // Check if MAYA network is in the requested blockchains
    if (!blockchains.includes('cosmos:mayachain-mainnet-v1')) {
      console.log(tag, 'MAYA network not in blockchains list, skipping MAYA token fetch');
      return balances;
    }

    // Check if MAYA token is already in existing balances
    const hasMayaToken = existingBalances.some(
      (b: any) => b.caip === 'cosmos:mayachain-mainnet-v1/denom:maya',
    );

    if (hasMayaToken) {
      console.log(tag, 'MAYA token already exists in balances, skipping');
      return balances;
    }

    console.log(tag, 'MAYA token not found in portfolio, fetching separately...');
    console.log(tag, 'MAYA pubkey address:', mayaPubkey.address);

    // Try to get MAYA token balance via a separate call
    // This is a workaround for the portfolio API not returning MAYA tokens
    const mayaBalanceResponse = await pioneer.GetPortfolioBalances([
      {
        caip: 'cosmos:mayachain-mainnet-v1/denom:maya',
        pubkey: mayaPubkey.address,
      },
    ]);

    console.log(
      tag,
      'MAYA balance response:',
      JSON.stringify(mayaBalanceResponse?.data, null, 2),
    );

    if (!mayaBalanceResponse?.data || mayaBalanceResponse.data.length === 0) {
      console.log(tag, 'No MAYA token balance returned from GetPortfolioBalances API');
      return balances;
    }

    console.log(tag, 'Found MAYA token balances:', mayaBalanceResponse.data.length);

    for (const mayaBalance of mayaBalanceResponse.data) {
      if (mayaBalance.caip !== 'cosmos:mayachain-mainnet-v1/denom:maya') {
        console.log(tag, 'Unexpected balance in MAYA response:', mayaBalance);
        continue;
      }

      // Hydrate MAYA token with assetData
      const mayaAssetInfo = hydrateAssetData(mayaBalance.caip);

      const mayaTokenBalance: ChartBalance = {
        context,
        chart: 'pioneer',
        contextType: context.split(':')[0],
        name: mayaAssetInfo?.name || 'Maya Token',
        caip: mayaBalance.caip,
        icon: mayaAssetInfo?.icon || 'https://pioneers.dev/coins/maya.png',
        pubkey: mayaPubkey.address,
        ticker: mayaAssetInfo?.symbol || 'MAYA',
        ref: `${context}${mayaBalance.caip}`,
        identifier: createBalanceIdentifier(mayaBalance.caip, mayaPubkey.address),
        networkId: 'cosmos:mayachain-mainnet-v1',
        symbol: mayaAssetInfo?.symbol || 'MAYA',
        type: mayaAssetInfo?.type || 'token',
        decimal: mayaAssetInfo?.decimal,
        balance: mayaBalance.balance?.toString() || '0',
        priceUsd: parseFloat(mayaBalance.priceUsd) || 0,
        valueUsd: parseFloat(mayaBalance.valueUsd) || 0,
        updated: new Date().getTime(),
      };

      console.log(tag, 'Adding MAYA token to balances:', mayaTokenBalance);
      balances.push(mayaTokenBalance);
    }
  } catch (mayaError) {
    console.error(tag, 'Error fetching MAYA token balance:', mayaError);
  }

  return balances;
}