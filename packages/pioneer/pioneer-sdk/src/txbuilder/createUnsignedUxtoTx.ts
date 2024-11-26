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

function transformInput(input) {
  const {
    txid,
    vout,
    value,
    address,
    height,
    confirmations,
    path,
    scriptType,
    hex: txHex,
    tx,
    coin,
    network,
  } = input;

  return {
    address,
    hash: txid,
    index: vout,
    value: parseInt(value),
    height,
    scriptType,
    confirmations,
    path,
    txHex,
    tx,
    coin,
    network,
    witnessUtxo: {
      value: parseInt(tx.vout[0].value),
      script: Buffer.from(tx.vout[0].scriptPubKey.hex, 'hex'),
    },
  };
}

export enum ChainToKeepKeyName {
  BTC = 'Bitcoin',
  BCH = 'BitcoinCash',
  DOGE = 'Dogecoin',
  LTC = 'Litecoin',
  DASH = 'Dash',
  ZEC = 'Zcash',
}

export async function createUnsignedUxtoTx(
  caip: string,
  to: string,
  amount: number,
  memo: string,
  pubkeys: any,
  pioneer: any,
  keepKeySdk: any,
): Promise<any> {
  let tag = TAG + ' | createUnsignedUxtoTx | ';

  try {
    if (!pioneer) throw Error('Failed to init! pioneer');
    //console.log(tag, 'Creating UTXO transaction');

    const networkId = caipToNetworkId(caip);
    //console.log(tag, 'networkId:', networkId);
    const relevantPubkeys = pubkeys.filter((e) => e.networks.includes(networkId));
    //console.log(tag, 'relevantPubkeys:', relevantPubkeys);

    const isSegwit = networkId === 'bip122:000000000019d6689c085ae165831e93';
    console.log(tag, 'isSegwit:', isSegwit);

    let chain = NetworkIdToChain[networkId];
    //console.log(tag, 'chain:', chain);

    let changeAddressIndex = await pioneer.GetChangeAddress({
      network: chain,
      xpub: relevantPubkeys[0].pubkey || relevantPubkeys[0].xpub,
    });
    changeAddressIndex = changeAddressIndex.data.changeIndex;
    //console.log(tag, 'changeAddressIndex:', changeAddressIndex);

    const path = DerivationPath[chain].replace('/0/0', `/1/${changeAddressIndex}`);
    //console.log(tag, 'path:', path);

    // const customAddressInfo = {
    //   coin: ChainToKeepKeyName[chain],
    //   script_type: isSegwit ? 'p2wpkh' : 'p2sh',
    //   address_n: bip32ToAddressNList(path),
    // };
    // //console.log(tag, 'keepKeySdk:', keepKeySdk);
    // const address = await keepKeySdk.address.utxoGetAddress(customAddressInfo);
    //console.log(tag, 'address:', address);

    const changeAddress = {
      // address: address,
      path: path,
      isChange: true,
      index: changeAddressIndex,
      addressNList: bip32ToAddressNList(path),
    };
    //console.log(tag, 'changeAddress:', changeAddress);

    const utxos: any[] = [];
    for (const pubkey of relevantPubkeys) {
      let utxosResp = await pioneer.ListUnspent({ network: chain, xpub: pubkey.pubkey });
      utxosResp = utxosResp.data;
      //console.log(TAG, 'utxosResp:', utxosResp);
      utxos.push(...utxosResp);
    }
    if (!utxos || utxos.length === 0) throw Error('No UTXOs found');
    //console.log(tag, 'utxos:', utxos);
    //console.log(tag, 'utxos:', JSON.stringify(utxos));
    for (const utxo of utxos) {
      utxo.value = Number(utxo.value);
    }

    let feeRateFromNode: any;
    try {
      // Attempt to fetch the fee rate from Pioneer API
      feeRateFromNode = (await pioneer.GetFeeRate({ networkId })).data;
    } catch (error) {
      console.warn(`${tag}: Pioneer API unavailable. Using fallback defaults.`);
      feeRateFromNode = null;
    }
    if (!feeRateFromNode) throw Error('Failed to get FEE RATES');
    // Provide failover defaults if feeRateFromNode is null or incomplete
    //TODO change by caip (default fee rates)

    const defaultFeeRates = {
      slow: 10, // Adjust as needed
      average: 20, // Adjust as needed
      fastest: 50, // Adjust as needed
    };

    if (!feeRateFromNode) {
      console.warn(`${tag}: Using hardcoded fee rates as defaults.`);
      feeRateFromNode = defaultFeeRates;
    }

    const feeLevel = 5; // Adjust as needed
    let effectiveFeeRate;

    switch (feeLevel) {
      case 1:
      case 2:
        effectiveFeeRate = feeRateFromNode.slow;
        break;
      case 3:
      case 4:
        effectiveFeeRate = feeRateFromNode.average;
        break;
      case 5:
        effectiveFeeRate = feeRateFromNode.fastest;
        break;
      default:
        throw new Error('Invalid fee level');
    }

    if (!effectiveFeeRate) throw new Error('Unable to get fee rate for network');
    effectiveFeeRate = Math.round(effectiveFeeRate * 1.2);
    console.log(tag, 'effectiveFeeRate:', effectiveFeeRate);
    if (effectiveFeeRate === 0) throw Error('Failed to build valid fee! 0');
    if (effectiveFeeRate <= 5) effectiveFeeRate = 8;
    //console.log(tag, 'utxos:', JSON.stringify(utxos));
    //console.log(tag, 'utxos:', utxos.length);
    amount = parseInt(String(amount * 1e8));

    //console.log(tag, 'amount:', amount);
    //console.log(tag, 'amount:', typeof amount);
    if (amount <= 0) throw Error('Invalid amount! 0');
    console.log(tag, 'amount:', amount);
    console.log(tag, 'to: ', to);
    console.log(tag, 'utxos:', utxos);
    console.log(tag, 'utxos:', utxos.length);
    const result = await coinSelect(utxos, [{ address: to, value: amount }], effectiveFeeRate);
    //console.log(tag, 'result:', result);
    let { inputs, outputs, fee } = result;
    if (!inputs) throw Error('Failed to create transaction Missing: inputs');
    if (!outputs) throw Error('Failed to create transaction Missing: outputs');
    if (!fee) throw Error('Failed to create transaction Missing: fee');

    //console.log(tag, 'inputs:', inputs);
    //console.log(tag, 'outputs:', outputs);
    //console.log(tag, 'fee:', fee);

    const uniqueInputSet = new Set();
    const preparedInputs = inputs
      .map(transformInput)
      .filter(({ hash, index }) =>
        uniqueInputSet.has(`${hash}:${index}`) ? false : uniqueInputSet.add(`${hash}:${index}`),
      )
      .map(({ value, index, hash, txHex, path, scriptType }) => ({
        addressNList: bip32ToAddressNList(path),
        scriptType: isSegwit ? 'p2wpkh' : 'p2sh', // Choose 'p2wpkh' if SegWit, else 'p2sh'
        amount: value.toString(),
        vout: index,
        txid: hash,
        hex: txHex || '',
      }));

    const scriptType = isSegwit ? 'p2wpkh' : 'p2sh';

    const preparedOutputs = outputs.map(({ value, address }) =>
      address
        ? { address, amount: value.toString(), addressType: 'spend' }
        : {
            addressNList: changeAddress.addressNList,
            scriptType,
            isChange: true,
            amount: value,
            addressType: 'change',
          },
    );

    let unsignedTx = { inputs: preparedInputs, outputs: preparedOutputs, memo };
    console.log(tag, 'unsignedTx:', unsignedTx);

    return unsignedTx;
  } catch (error) {
    console.log(tag, 'Error:', error);
    throw error;
  }
}
