import { DerivationPath } from '@coinmasters/types';
import { caipToNetworkId, NetworkIdToChain } from '@pioneer-platform/pioneer-caip';
import { bip32ToAddressNList } from '@pioneer-platform/pioneer-coins';
import coinSelect from 'coinselect';
import coinSelectSplit from 'coinselect/split';

export async function createUnsignedUxtoTx(
  caip: string,
  to: string,
  amount: number,
  memo: string,
  pubkeys: any,
  pioneer: any,
  keepKeySdk: any,
  isMax: boolean, // Added isMax parameter
): Promise<any> {
  let tag = ' | createUnsignedUxtoTx | ';

  try {
    if (!pioneer) throw Error('Failed to init! pioneer');

    const networkId = caipToNetworkId(caip);
    const relevantPubkeys = pubkeys.filter((e) => e.networks.includes(networkId));

    const isSegwit = networkId === 'bip122:000000000019d6689c085ae165831e93';

    let chain = NetworkIdToChain[networkId];

    let changeAddressIndex = await pioneer.GetChangeAddress({
      network: chain,
      xpub: relevantPubkeys[0].pubkey || relevantPubkeys[0].xpub,
    });
    changeAddressIndex = changeAddressIndex.data.changeIndex;

    const path = DerivationPath[chain].replace('/0/0', `/1/${changeAddressIndex}`);

    const changeAddress = {
      path: path,
      isChange: true,
      index: changeAddressIndex,
      addressNList: bip32ToAddressNList(path),
    };

    const utxos: any[] = [];
    for (const pubkey of relevantPubkeys) {
      let utxosResp = await pioneer.ListUnspent({ network: chain, xpub: pubkey.pubkey });
      utxosResp = utxosResp.data;
      utxos.push(...utxosResp);
    }
    if (!utxos || utxos.length === 0) throw Error('No UTXOs found');

    for (const utxo of utxos) {
      utxo.value = Number(utxo.value);
    }

    let feeRateFromNode: any;
    try {
      feeRateFromNode = (await pioneer.GetFeeRate({ networkId })).data;
    } catch (error) {
      console.warn(`${tag}: Pioneer API unavailable. Using fallback defaults.`);
      feeRateFromNode = null;
    }
    if (!feeRateFromNode) throw Error('Failed to get FEE RATES');

    const defaultFeeRates = {
      slow: 10,
      average: 20,
      fastest: 50,
    };

    if (!feeRateFromNode) {
      console.warn(`${tag}: Using hardcoded fee rates as defaults.`);
      feeRateFromNode = defaultFeeRates;
    }

    const feeLevel = 5;
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
    if (effectiveFeeRate === 0) throw Error('Failed to build valid fee! 0');
    if (effectiveFeeRate <= 5) effectiveFeeRate = 8;

    amount = parseInt(String(amount * 1e8));
    if (amount <= 0 && !isMax) throw Error('Invalid amount! 0');

    let result;
    if (isMax) {
      console.log(tag, 'isMax:', isMax);
      // For max send, use coinSelectSplit
      result = coinSelectSplit(utxos, [{ address: to }], effectiveFeeRate);
    } else {
      console.log(tag, 'isMax:', isMax)
      // Regular send
      result = coinSelect(utxos, [{ address: to, value: amount }], effectiveFeeRate);
    }
    console.log(tag, 'result:', result);
    let { inputs, outputs, fee } = result;
    if (!inputs) throw Error('Failed to create transaction: Missing inputs');
    if (!outputs) throw Error('Failed to create transaction: Missing outputs');
    if (fee === undefined) throw Error('Failed to calculate transaction fee');

    const uniqueInputSet = new Set();
    const preparedInputs = inputs
      .map(transformInput)
      .filter(({ hash, index }) =>
        uniqueInputSet.has(`${hash}:${index}`) ? false : uniqueInputSet.add(`${hash}:${index}`),
      )
      .map(({ value, index, hash, txHex, path }) => ({
        addressNList: bip32ToAddressNList(path),
        scriptType: isSegwit ? 'p2wpkh' : 'p2sh',
        amount: value.toString(),
        vout: index,
        txid: hash,
        hex: txHex || '',
      }));

    const scriptType = isSegwit ? 'p2wpkh' : 'p2sh';

    const preparedOutputs = outputs
      .map(({ value, address }) => {
        if (address) {
          return { address, amount: value.toString(), addressType: 'spend' };
        } else if (!isMax) {
          return {
            addressNList: changeAddress.addressNList,
            scriptType,
            isChange: true,
            amount: value.toString(),
            addressType: 'change',
          };
        }
        return null; // No change output when isMax is true
      })
      .filter((output) => output !== null);

    if (!fee) {
      fee =
        inputs.reduce((acc, input) => acc + input.value, 0) -
        outputs.reduce((acc, output) => acc + parseInt(output.amount), 0);
    }

    let unsignedTx = { inputs: preparedInputs, outputs: preparedOutputs, memo };
    console.log(tag, 'unsignedTx:', unsignedTx);

    return unsignedTx;
  } catch (error) {
    console.log(tag, 'Error:', error);
    throw error;
  }
}

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
