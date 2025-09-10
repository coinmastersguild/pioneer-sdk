import { ChartBalance, ChartParams, StakingPosition } from './types';
import { hydrateAssetData, checkDuplicateBalance, createBalanceIdentifier } from './utils';

const tag = '| charts-cosmos-staking |';

export async function getCosmosStakingCharts(params: ChartParams): Promise<ChartBalance[]> {
  const { blockchains, pioneer, pubkeys, context } = params;
  const balances: ChartBalance[] = [];
  
  try {
    console.log(tag, 'Adding Cosmos staking positions to charts...');

    // Find cosmos pubkeys that could have staking positions
    const cosmosPubkeys = pubkeys.filter(
      (p: any) =>
        p.networks &&
        Array.isArray(p.networks) &&
        p.networks.some(
          (n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'),
        ),
    );

    if (cosmosPubkeys.length === 0) {
      console.log(tag, 'No cosmos pubkeys found for staking positions');
      return balances;
    }

    console.log(tag, 'Found cosmos pubkeys for staking:', cosmosPubkeys.length);

    for (const cosmosPubkey of cosmosPubkeys) {
      if (!cosmosPubkey.address) {
        continue;
      }

      // Check which cosmos networks this pubkey supports
      const cosmosNetworks = cosmosPubkey.networks.filter(
        (n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'),
      );

      for (const networkId of cosmosNetworks) {
        // Only process if this network is in our blockchains list
        if (!blockchains.includes(networkId)) {
          continue;
        }

        await fetchStakingPositionsForNetwork(
          networkId,
          cosmosPubkey.address,
          context,
          pioneer,
          balances
        );
      }
    }
  } catch (e) {
    console.error(tag, 'Error adding cosmos staking positions:', e);
  }

  return balances;
}

async function fetchStakingPositionsForNetwork(
  networkId: string,
  address: string,
  context: string,
  pioneer: any,
  balances: ChartBalance[]
): Promise<void> {
  try {
    console.log(tag, `Fetching staking positions for ${address} on ${networkId}...`);

    // Convert networkId to network name for API
    let network: string;
    if (networkId === 'cosmos:cosmoshub-4') {
      network = 'cosmos';
    } else if (networkId === 'cosmos:osmosis-1') {
      network = 'osmosis';
    } else {
      console.error(tag, `Unsupported networkId for staking: ${networkId}`);
      return;
    }

    // Get staking positions from pioneer server
    const stakingResponse = await pioneer.GetStakingPositions({
      network,
      address,
    });

    if (!stakingResponse?.data || !Array.isArray(stakingResponse.data)) {
      console.log(tag, `No staking positions found for ${address} on ${networkId}`);
      return;
    }

    console.log(
      tag,
      `Found ${stakingResponse.data.length} staking positions for ${networkId}`,
    );

    for (const position of stakingResponse.data) {
      const processedPosition = processStakingPosition(
        position,
        address,
        context,
        networkId
      );
      
      if (processedPosition && !checkDuplicateBalance(
        balances,
        processedPosition.caip,
        processedPosition.pubkey,
        processedPosition.validator
      )) {
        balances.push(processedPosition);
        console.log(tag, `Added ${position.type} position:`, {
          balance: processedPosition.balance,
          ticker: processedPosition.ticker,
          valueUsd: processedPosition.valueUsd,
          validator: processedPosition.validator,
        });
      }
    }
  } catch (stakingError) {
    console.error(
      tag,
      `Error fetching staking positions for ${address} on ${networkId}:`,
      stakingError,
    );
  }
}

function processStakingPosition(
  position: StakingPosition,
  address: string,
  context: string,
  networkId: string
): ChartBalance | null {
  // Validate position has required fields
  if (!position.balance || position.balance <= 0 || !position.caip) {
    return null;
  }

  // Hydrate staking position with assetData
  const stakingAssetInfo = hydrateAssetData(position.caip);

  const stakingBalance: ChartBalance = {
    context,
    chart: 'staking',
    contextType: context.split(':')[0],
    name: stakingAssetInfo?.name || position.name || `${position.type} Position`,
    caip: position.caip,
    icon: stakingAssetInfo?.icon || position.icon || '',
    pubkey: address,
    ticker: stakingAssetInfo?.symbol || position.ticker || position.symbol || 'UNK',
    ref: `${context}${position.caip}`,
    identifier: createBalanceIdentifier(position.caip, address),
    networkId,
    symbol: stakingAssetInfo?.symbol || position.symbol || position.ticker || 'UNK',
    type: stakingAssetInfo?.type || position.type || 'staking',
    decimal: stakingAssetInfo?.decimal,
    balance: position.balance.toString(),
    priceUsd: position.priceUsd || 0,
    valueUsd: position.valueUsd || position.balance * (position.priceUsd || 0),
    status: position.status || 'active',
    validator: position.validatorAddress || position.validator || '',
    updated: new Date().getTime(),
  };

  return stakingBalance;
}