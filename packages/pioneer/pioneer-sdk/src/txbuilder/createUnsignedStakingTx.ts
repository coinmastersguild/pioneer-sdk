import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';
import { 
  cosmosDelegateTemplate, 
  cosmosUndelegateTemplate, 
  cosmosRedelegateTemplate,
  cosmosClaimRewardsTemplate,
  cosmosClaimAllRewardsTemplate
} from './templates/cosmos-staking.js';

const TAG = ' | createUnsignedStakingTx | ';

export interface StakingTxParams {
  type: 'delegate' | 'undelegate' | 'redelegate' | 'claim_rewards' | 'claim_all_rewards';
  amount?: number;
  validatorAddress?: string;
  validatorSrcAddress?: string; // For redelegate
  validatorDstAddress?: string; // For redelegate
  validatorAddresses?: string[]; // For claim_all_rewards
  memo?: string;
}

export async function createUnsignedStakingTx(
  caip: string,
  params: StakingTxParams,
  pubkeys: any[],
  pioneer: any,
  keepKeySdk: any,
): Promise<any> {
  const tag = TAG + ' | createUnsignedStakingTx | ';

  try {
    if (!pioneer) throw new Error('Failed to init! pioneer');

    const networkId = caipToNetworkId(caip);
    const relevantPubkeys = pubkeys.filter((e) => e.networks && Array.isArray(e.networks) && e.networks.includes(networkId));
    if (relevantPubkeys.length === 0) {
      throw new Error(`No relevant pubkeys found for networkId: ${networkId}`);
    }

    // Map networkId to chain and get network-specific configs
    let chain: string;
    let chainId: string;
    let denom: string;
    let decimals: number;
    let feeConfig: any;

    switch (networkId) {
      case 'cosmos:cosmoshub-4':
        chain = 'cosmos';
        chainId = 'cosmoshub-4';
        denom = 'uatom';
        decimals = 6;
        feeConfig = {
          gas: '1500000', // Increased to 1.5M gas to handle all cosmos staking operations
          amount: [{ denom: 'uatom', amount: '37500' }] // Increased proportionally (1,500,000 * 0.025 = 37,500)
        };
        break;
      case 'cosmos:osmosis-1':
        chain = 'osmosis';
        chainId = 'osmosis-1';
        denom = 'uosmo';
        decimals = 6;
        feeConfig = {
          gas: '1000000', // Increased to 1M gas for osmosis staking operations
          amount: [{ denom: 'uosmo', amount: '25000' }] // Increased proportionally
        };
        break;
      default:
        throw new Error(`Unsupported networkId for staking: ${networkId}`);
    }

    console.log(tag, `Building ${params.type} transaction for ${chain}`);

    const fromAddress = relevantPubkeys[0].address;
    
    // Get account info
    const accountInfo = (await pioneer.GetAccountInfo({ network: chain, address: fromAddress }))
      .data;
    console.log(tag, 'accountInfo: ', accountInfo);

    let account_number: string;
    let sequence: string;

    if (networkId === 'cosmos:cosmoshub-4' || networkId === 'cosmos:osmosis-1') {
      account_number = accountInfo.account.account_number || '0';
      sequence = accountInfo.account.sequence || '0';
    } else {
      throw new Error(`Unsupported account info format for: ${networkId}`);
    }

    // Convert amount to smallest unit if provided
    let amountInSmallestUnit: string = '0';
    if (params.amount) {
      amountInSmallestUnit = Math.floor(params.amount * Math.pow(10, decimals)).toString();
    }

    const commonParams = {
      account_number,
      chain_id: chainId,
      fee: feeConfig,
      from_address: fromAddress,
      memo: params.memo || '',
      sequence,
    };

    // Build transaction based on type
    switch (params.type) {
      case 'delegate':
        if (!params.validatorAddress) {
          throw new Error('validatorAddress is required for delegate transaction');
        }
        if (!params.amount) {
          throw new Error('amount is required for delegate transaction');
        }
        
        return cosmosDelegateTemplate({
          ...commonParams,
          validator_address: params.validatorAddress,
          amount: amountInSmallestUnit,
          denom,
        });

      case 'undelegate':
        if (!params.validatorAddress) {
          throw new Error('validatorAddress is required for undelegate transaction');
        }
        if (!params.amount) {
          throw new Error('amount is required for undelegate transaction');
        }
        
        return cosmosUndelegateTemplate({
          ...commonParams,
          validator_address: params.validatorAddress,
          amount: amountInSmallestUnit,
          denom,
        });

      case 'redelegate':
        if (!params.validatorSrcAddress || !params.validatorDstAddress) {
          throw new Error('validatorSrcAddress and validatorDstAddress are required for redelegate transaction');
        }
        if (!params.amount) {
          throw new Error('amount is required for redelegate transaction');
        }
        
        return cosmosRedelegateTemplate({
          ...commonParams,
          validator_src_address: params.validatorSrcAddress,
          validator_dst_address: params.validatorDstAddress,
          amount: amountInSmallestUnit,
          denom,
        });

      case 'claim_rewards':
        if (!params.validatorAddress) {
          throw new Error('validatorAddress is required for claim_rewards transaction');
        }
        
        return cosmosClaimRewardsTemplate({
          ...commonParams,
          validator_address: params.validatorAddress,
        });

      case 'claim_all_rewards':
        if (!params.validatorAddresses || params.validatorAddresses.length === 0) {
          throw new Error('validatorAddresses is required for claim_all_rewards transaction');
        }
        
        return cosmosClaimAllRewardsTemplate({
          ...commonParams,
          validator_addresses: params.validatorAddresses,
        });

      default:
        throw new Error(`Unsupported staking transaction type: ${params.type}`);
    }
  } catch (error) {
    console.error(tag, 'Error:', error);
    throw error;
  }
} 