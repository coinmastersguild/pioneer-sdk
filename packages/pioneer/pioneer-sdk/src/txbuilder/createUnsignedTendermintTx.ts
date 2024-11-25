import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';

import { cosmosTransferTemplate } from './templates/cosmos';
import { mayachainDepositTemplate, mayachainTransferTemplate } from './templates/mayachain';
import { osmosisTransferTemplate } from './templates/osmosis';
import { thorchainDepositTemplate, thorchainTransferTemplate } from './templates/thorchain';

const TAG = ' | createUnsignedTendermintTx | ';

export async function createUnsignedTendermintTx(
  caip: string,
  type: string,
  to: string,
  amount: number,
  memo: string,
  pubkeys: any[],
  pioneer: any,
  keepKeySdk: any,
): Promise<any> {
  const tag = TAG + ' | createUnsignedTendermintTx | ';

  try {
    if (!pioneer) throw new Error('Failed to init! pioneer');

    const networkId = caipToNetworkId(caip);
    const relevantPubkeys = pubkeys.filter((e) => e.networks.includes(networkId));
    if (relevantPubkeys.length === 0) {
      throw new Error(`No relevant pubkeys found for networkId: ${networkId}`);
    }

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
    console.log(tag, `Resolved chain: ${chain} for networkId: ${networkId}`);

    const fromAddress = relevantPubkeys[0].address;
    let asset = caip.split(':')[1]; // Assuming format is "network:asset"
    const accountInfo = (await pioneer.GetAccountInfo({ network: chain, address: fromAddress }))
      .data;

    let account_number, sequence;
    if (networkId === 'cosmos:cosmoshub-4' || networkId === 'cosmos:osmosis-1') {
      console.log(tag, 'accountInfo: ', accountInfo);
      account_number = accountInfo.account.account_number || '0';
      sequence = accountInfo.account.sequence || '0';
    } else if (
      networkId === 'cosmos:thorchain-mainnet-v1' ||
      networkId === 'cosmos:mayachain-mainnet-v1'
    ) {
      account_number = accountInfo.result.value.account_number || '0';
      sequence = accountInfo.result.value.sequence || '0';
    }

    switch (networkId) {
      case 'cosmos:thorchain-mainnet-v1':
        amount = amount * 1000000; // Convert to RUNE
        asset = 'urune';
        return to
          ? thorchainTransferTemplate({
              account_number,
              chain_id: 'thorchain-mainnet-v1',
              fee: { gas: '500000000', amount: [] },
              from_address: fromAddress,
              to_address: to,
              asset,
              amount: amount.toString(),
              memo,
              sequence,
            })
          : thorchainDepositTemplate({
              account_number,
              chain_id: 'thorchain-mainnet-v1',
              fee: { gas: '500000000', amount: [] },
              from_address: fromAddress,
              asset,
              amount: amount.toString(),
              memo,
              sequence,
            });
      case 'cosmos:mayachain-mainnet-v1': {
        amount = amount * 1000000; // Convert to RUNE
        asset = 'cacao';
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
              asset,
              amount: amount.toString(),
              memo,
              sequence,
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
              asset,
              amount: amount.toString(),
              memo,
              sequence,
            });
      }
      case 'cosmos:cosmoshub-4':
        return cosmosTransferTemplate({
          account_number,
          chain_id: 'cosmoshub-4',
          fee: { gas: '200000', amount: [] },
          from_address: fromAddress,
          to_address: to,
          asset: 'uatom',
          amount: (amount * 10000).toString(),
          memo,
          sequence,
        });

      case 'cosmos:osmosis-1':
        return osmosisTransferTemplate({
          account_number,
          chain_id: 'osmosis-1',
          fee: { gas: '200000', amount: [] },
          from_address: fromAddress,
          to_address: to,
          asset: 'uosmo',
          amount: (amount * 10000).toString(),
          memo,
          sequence,
        });

      default:
        throw new Error(`Unsupported networkId: ${networkId}`);
    }
  } catch (error) {
    console.error(tag, 'Error:', error);
    throw error;
  }
}
