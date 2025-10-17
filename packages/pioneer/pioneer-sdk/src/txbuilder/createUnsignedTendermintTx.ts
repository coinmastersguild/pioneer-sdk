import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';

import { cosmosTransferTemplate } from './templates/cosmos';
import { mayachainDepositTemplate, mayachainTransferTemplate } from './templates/mayachain';
import { osmosisTransferTemplate } from './templates/osmosis';
import { thorchainDepositTemplate, thorchainTransferTemplate } from './templates/thorchain';

const TAG = ' | createUnsignedTendermintTx | ';

export async function createUnsignedTendermintTx(
  caip: string,
  type: string,
  amount: number,
  memo: string,
  pubkeys: any[],
  pioneer: any,
  pubkeyContext: any,
  isMax: boolean,
  to?: string,
): Promise<any> {
  const tag = TAG + ' | createUnsignedTendermintTx | ';

  try {
    if (!pioneer) throw new Error('Failed to init! pioneer');

    const networkId = caipToNetworkId(caip);

    // Use the passed pubkeyContext directly - it's already been set by Pioneer SDK
    // No need to auto-correct anymore since context management is centralized
    if (!pubkeyContext) {
      throw new Error(`No pubkey context provided for networkId: ${networkId}`);
    }

    if (!pubkeyContext.networks?.includes(networkId)) {
      throw new Error(`Pubkey context is for wrong network. Expected ${networkId}, got ${pubkeyContext.networks}`);
    }

    console.log(tag, `✅ Using pubkeyContext for network ${networkId}:`, {
      address: pubkeyContext.address,
      addressNList: pubkeyContext.addressNList || pubkeyContext.addressNListMaster
    });

    // Map networkId to a human-readable chain
    let chain: string;
    switch (networkId) {
      case 'cosmos:thorchain-mainnet-v1':
        chain = 'thorchain';
        break;
      case 'cosmos:mayachain-mainnet-v1':
        chain = 'mayachain';
        break;
      case 'cosmos:cosmoshub-4':
        chain = 'cosmos';
        break;
      case 'cosmos:osmosis-1':
        chain = 'osmosis';
        break;
      default:
        throw new Error(`Unhandled networkId: ${networkId}`);
    }

    //console.log(tag, `Resolved chain: ${chain} for networkId: ${networkId}`);

    const fromAddress = pubkeyContext.address || pubkeyContext.pubkey;
    let asset = caip.split(':')[1]; // Assuming format is "network:asset"

    console.log(tag, `🔍 Fetching account info for address: ${fromAddress}`);
    const accountInfo = (await pioneer.GetAccountInfo({ network: chain, address: fromAddress }))
      .data;
    console.log(tag, '📋 accountInfo:', JSON.stringify(accountInfo, null, 2));

    let balanceInfo = await pioneer.GetPubkeyBalance({ asset: chain, pubkey: fromAddress });
    console.log(tag, `💰 balanceInfo:`, balanceInfo);

    let account_number, sequence;
    if (networkId === 'cosmos:cosmoshub-4' || networkId === 'cosmos:osmosis-1') {
      account_number = accountInfo.account.account_number || '0';
      sequence = accountInfo.account.sequence || '0';
    } else if (
      networkId === 'cosmos:thorchain-mainnet-v1' ||
      networkId === 'cosmos:mayachain-mainnet-v1'
    ) {
      account_number = accountInfo.result.value.account_number || '0';
      sequence = accountInfo.result.value.sequence || '0';
    }

    console.log(tag, `📊 Extracted account_number: ${account_number}, sequence: ${sequence}`);

    // CRITICAL: Pioneer API may return stale data. The mayachain-network module already
    // queries multiple nodes directly and uses consensus - but we're using the Pioneer API wrapper
    // which adds caching. If we get account_number 0, warn about potential Pioneer API cache issue.
    if (account_number === '0' || account_number === 0) {
      console.log(tag, `⚠️  WARNING: Account number is 0 from Pioneer API`);
      console.log(tag, `   This is likely due to stale Pioneer API cache`);
      console.log(tag, `   The mayachain-network module queries nodes directly but Pioneer API may be cached`);
      console.log(tag, `   Proceeding with account_number: 0 but transaction will likely fail`);
      console.log(tag, `   TODO: Fix Pioneer API to use fresh data from mayachain-network module`);
    }

    const fees = {
      'cosmos:thorchain-mainnet-v1': 0.02,
      'cosmos:mayachain-mainnet-v1': 0, // Increased to 0.5 CACAO (5000000000 base units) for reliable confirmation
      'cosmos:cosmoshub-4': 0.005,
      'cosmos:osmosis-1': 0.035,
    };

    switch (networkId) {
      case 'cosmos:thorchain-mainnet-v1': {
        if (isMax) {
          //console.log('isMax detected! Adjusting amount for fees...');
          const fee = 2000000; // Convert fee to smallest unit
          amount = Math.floor(Math.max(0, balanceInfo.data * 1e8 - fee)); // Adjust amount for fees if isMax
        } else {
          amount = Math.floor(amount * 1e8); // Convert amount to smallest unit
        }
        asset = 'rune';
        //console.log(tag, `amount: ${amount}, isMax: ${isMax}, fee: ${fees[networkId]}`);
        return to
          ? thorchainTransferTemplate({
              account_number,
              chain_id: 'thorchain-1',
              fee: {
                gas: '500000000',
                amount: [
                  {
                    amount: '0',
                    denom: 'rune',
                  },
                ],
              },
              from_address: fromAddress,
              to_address: to,
              asset,
              amount: amount.toString(),
              memo,
              sequence,
            })
          : thorchainDepositTemplate({
              account_number,
              chain_id: 'thorchain-1',
              fee: {
                gas: '500000000',
                amount: [
                  {
                    amount: '0',
                    denom: 'rune',
                  },
                ],
              },
              from_address: fromAddress,
              asset,
              amount: amount.toString(),
              memo,
              sequence,
            });
      }

      case 'cosmos:mayachain-mainnet-v1': {
        // Determine the correct native denomination based on CAIP
        // NOTE: Use native chain denominations, NOT asset identifiers (e.g., 'cacao' not 'MAYA.CACAO')
        let mayaAsset: string;
        if (caip.includes('/denom:maya')) {
          mayaAsset = 'maya'; // MAYA token (native denomination)
        } else if (caip.includes('/slip44:931')) {
          mayaAsset = 'cacao'; // CACAO (native denomination)
        } else {
          throw new Error(`Unsupported Maya chain CAIP: ${caip}`);
        }

        // MAYA token uses 1e4 (4 decimals), CACAO uses 1e10 (10 decimals)
        const decimals = mayaAsset === 'maya' ? 1e4 : 1e10;

        if (isMax) {
          const fee = Math.floor(fees[networkId] * decimals); // Convert fee to smallest unit and floor to int
          amount = Math.max(0, Math.floor(balanceInfo.data * decimals) - fee); // Floor to ensure no decimals
        } else {
          amount = Math.max(Math.floor(amount * decimals), 0); // Floor the multiplication result
        }

        //console.log(tag, `amount: ${amount}, isMax: ${isMax}, fee: ${fees[networkId]}, asset: ${mayaAsset}`);
        return to
          ? mayachainTransferTemplate({
              account_number,
              chain_id: 'mayachain-mainnet-v1',
              fee: {
                gas: '500000000',
                amount: [
                  {
                    amount: '0',
                    denom: 'cacao',
                  },
                ],
              },
              from_address: fromAddress,
              to_address: to,
              asset: mayaAsset,
              amount: amount.toString(),
              memo,
              sequence,
              addressNList: pubkeyContext.addressNList || pubkeyContext.addressNListMaster, // CRITICAL: Use correct derivation path for signing
            })
          : mayachainDepositTemplate({
              account_number,
              chain_id: 'mayachain-mainnet-v1',
              fee: {
                gas: '500000000',
                amount: [
                  {
                    amount: '0',
                    denom: 'cacao',
                  },
                ],
              },
              from_address: fromAddress,
              asset: mayaAsset,
              amount: amount.toString(),
              memo,
              sequence,
            });
      }

      case 'cosmos:cosmoshub-4': {
        if (isMax) {
          const fee = fees[networkId] * 1e6; // Convert fee to smallest unit
          amount = Math.max(0, amount * 1e6 - fee); // Adjust amount for fees if isMax
        } else {
          amount = amount * 1e4; // Convert amount to smallest unit
        }
        return cosmosTransferTemplate({
          account_number,
          chain_id: 'cosmoshub-4',
          fee: { gas: '1000000', amount: [] }, // Increased from 200k to 1M gas
          from_address: fromAddress,
          to_address: to,
          asset: 'uatom',
          amount: amount.toString(),
          memo,
          sequence,
        });
      }

      case 'cosmos:osmosis-1': {
        if (isMax) {
          const fee = fees[networkId] * 1e6; // Convert fee to smallest unit
          amount = Math.max(0, amount * 1e6 - fee); // Adjust amount for fees if isMax
        } else {
          amount = amount * 1e4; // Convert amount to smallest unit
        }
        const DEFAULT_OSMO_FEE_MAINNET = {
          amount: [{ denom: 'uosmo', amount: '10000' }], // Increased fee amount
          gas: '1000000', // Increased from 500k to 1M gas
        };
        return osmosisTransferTemplate({
          account_number,
          chain_id: 'osmosis-1',
          fee: DEFAULT_OSMO_FEE_MAINNET,
          from_address: fromAddress,
          to_address: to,
          asset: 'uosmo',
          amount: amount.toString(),
          memo,
          sequence,
        });
      }

      default: {
        throw new Error(`Unsupported networkId: ${networkId}`);
      }
    }
  } catch (error) {
    console.error(tag, 'Error:', error);
    throw error;
  }
}
