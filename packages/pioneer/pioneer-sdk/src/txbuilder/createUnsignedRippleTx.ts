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

export async function createUnsignedRippleTx(
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

    const relevantPubkeys = pubkeys.filter((e: any) => e.networks.includes(networkId));
    if (relevantPubkeys.length === 0) {
      throw new Error(`No relevant pubkeys found for networkId: ${networkId}`);
    }
    console.log(tag, 'relevantPubkeys:', relevantPubkeys);

    const accountInfo = await pioneer.GetAccount({ address:relevantPubkeys[0].address, network: networkId });
    const sequence = accountInfo.Sequence.toString();
    const ledgerIndexCurrent = accountInfo.ledger_index_current;
    const fromAddress = relevantPubkeys[0].address;
    let desttag = memo;
    if (!desttag) desttag = '0';
    let tx = {
      type: 'auth/StdTx',
      value: {
        fee: {
          amount: [
            {
              amount: '1000',
              denom: 'drop',
            },
          ],
          gas: '28000',
        },
        memo: 'KeepKey',
        msg: [
          {
            type: 'ripple-sdk/MsgSend',
            DestinationTag: desttag,
            value: {
              amount: [
                {
                  amount: amount,
                  denom: 'drop',
                },
              ],
              from_address: fromAddress,
              to_address: to,
            },
          },
        ],
        signatures: null,
      },
    };

    //Unsigned TX
    let unsignedTx = {
      addressNList: [2147483692, 2147483792, 2147483648, 0, 0],
      tx: tx,
      flags: undefined,
      lastLedgerSequence: parseInt(ledgerIndexCurrent + 1000000000).toString(),
      sequence: sequence || '0',
      payment: {
        amount,
        destination: to,
        destinationTag: desttag,
      },
    };

    return unsignedTx;
  } catch (error) {
    console.error(tag, 'Error:', error);
    throw error;
  }
}
