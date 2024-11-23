/*
  Create Unsigned UTXO Transaction
*/
import { DerivationPath } from '@coinmasters/types';
// import type { UTXO, PubKey } from './types';
// @ts-ignore
import { caipToNetworkId, NetworkIdToChain } from '@pioneer-platform/pioneer-caip';
import { bip32ToAddressNList } from '@pioneer-platform/pioneer-coins';
//@ts-ignore
import coinSelect from 'coinselect';

const TAG = ' | createUnsignedUxtoTx | ';

export async function createUnsignedTendermintTx(
  caip: string,
  to: string,
  amount: number,
  memo: string,
  pubkeys: any,
  pioneer: any,
  keepKeySdk: any,
): Promise<any> {
  let tag = TAG + ' | createUnsignedTendermintTx | ';

  try {
    if (!pioneer) throw new Error('Failed to init! pioneer');

    // Determine networkId from caip
    const networkId = caipToNetworkId(caip);
    console.log(tag, 'networkId:', networkId);

    // Filter relevant pubkeys
    const relevantPubkeys = pubkeys.filter((e: any) => e.networks.includes(networkId));
    if (relevantPubkeys.length === 0) {
      throw new Error(`No relevant pubkeys found for networkId: ${networkId}`);
    }
    console.log(tag, 'relevantPubkeys:', relevantPubkeys);

    // Get account info
    const accountInfo = await pioneer.GetAccountInfo({
      network: networkId,
      address: relevantPubkeys[0].address,
    });

    const account_number = accountInfo.result.value.account_number || '0';
    const sequence = accountInfo.result.value.sequence || '0';

    // Construct unsigned transaction
    const fromAddress = relevantPubkeys[0].address;
    const asset = caip.split(':')[1]; // Assuming asset format is caip-style e.g., 'thorchain:rune'

    let unsignedTx: any;

    if (to) {
      // Transfer
      unsignedTx = {
        signerAddress: fromAddress,
        signDoc: {
          account_number,
          chain_id: NetworkIdToChain[networkId], // Maps networkId to chain_id
          fee: { gas: '500000000', amount: [] },
          msgs: [
            {
              value: {
                amount: [{ denom: asset.toLowerCase(), amount: amount.toString() }],
                to_address: to,
                from_address: fromAddress,
              },
              type: 'thorchain/MsgSend' as const,
            },
          ],
          memo: memo || '',
          sequence,
        },
      };
    } else {
      // Deposit
      unsignedTx = {
        signerAddress: fromAddress,
        signDoc: {
          sequence,
          account_number,
          chain_id: NetworkIdToChain[networkId],
          fee: {
            gas: '500000000',
            amount: [
              {
                amount: '0',
                denom: asset.toLowerCase(),
              },
            ],
          },
          msgs: [
            {
              value: {
                coins: [{ asset, amount: amount.toString() }],
                memo: memo || '',
                signer: fromAddress,
              },
              type: 'thorchain/MsgDeposit',
            },
          ],
          memo: memo || '',
        },
      };
    }

    console.log(tag, 'Unsigned Transaction:', unsignedTx);

    return unsignedTx;
  } catch (error) {
    console.error(tag, 'Error:', error);
    throw error;
  }
}
