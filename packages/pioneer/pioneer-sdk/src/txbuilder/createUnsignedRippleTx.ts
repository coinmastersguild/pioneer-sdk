/*
  Create Unsigned UTXO Transaction
*/
// import type { UTXO, PubKey } from './types';
// @ts-ignore
import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';
//@ts-ignore

const TAG = ' | createUnsignedUxtoTx | ';

export async function createUnsignedRippleTx(
  caip: string,
  to: string,
  amount: any,
  memo: string,
  pubkeys: any,
  pioneer: any,
  keepKeySdk: any,
  isMax: boolean,
): Promise<any> {
  let tag = TAG + ' | createUnsignedRippleTx | ';

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

    let accountInfo = await pioneer.GetAccountInfo({
      address: relevantPubkeys[0].address,
      network: 'ripple',
    });
    accountInfo = accountInfo.data;
    console.log(tag, 'accountInfo:', accountInfo);

    const sequence = accountInfo.Sequence.toString();
    const ledgerIndexCurrent = accountInfo.ledger_index_current;
    const fromAddress = relevantPubkeys[0].address;
    let desttag = memo;
    // Check if desttag is null, undefined, a space, or any non-numeric value
    //@ts-ignore
    if (!desttag || /^\s*$/.test(desttag) || isNaN(desttag)) {
      desttag = '0';
    }

    console.log(tag, 'amount:', amount);
    if(isMax){
      //balance - 1 (min) - fee
      amount = (Number(accountInfo.Balance) - 1000000) - 1;
      amount = amount.toString()
    } else {
      //format amount
      amount = amount * 1000000;
      amount = amount.toString();
    }



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
