import { ChartBalance, ChartParams } from './types';
import { getEvmCharts } from './evm';
import { getMayaCharts } from './maya';
import { getCosmosStakingCharts } from './cosmos-staking';

const tag = '| getCharts |';
const TIMEOUT = 30000;

export const getCharts = async (
  blockchains: any,
  pioneer: any,
  pubkeys: any,
  context: string
): Promise<ChartBalance[]> => {
  try {
    const balances: ChartBalance[] = [];
    console.log(tag, 'init');
    
    const params: ChartParams = {
      blockchains,
      pioneer,
      pubkeys,
      context,
    };

    // Get EVM charts (includes portfolio and tokens)
    const evmBalances = await getEvmCharts(params);
    balances.push(...evmBalances);

    // WORKAROUND: Check if MAYA tokens are missing and fetch them separately
    const mayaBalances = await getMayaCharts(params, balances);
    balances.push(...mayaBalances);

    // Add Cosmos Staking Positions to charts
    const stakingBalances = await getCosmosStakingCharts(params);
    balances.push(...stakingBalances);

    return balances;
  } catch (error) {
    console.error(tag, 'Error processing charts:', error);
    throw error;
  }
};

// Export types for external use
export * from './types';