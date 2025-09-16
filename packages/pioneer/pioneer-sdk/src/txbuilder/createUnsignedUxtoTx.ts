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
  feeLevel: number = 5, // Added feeLevel parameter with default of 5 (average)
): Promise<any> {
  let tag = ' | createUnsignedUxtoTx | ';

  try {
    if (!pioneer) throw Error('Failed to init! pioneer');

    const networkId = caipToNetworkId(caip);
    
    // Auto-correct context if wrong network
    if (!keepKeySdk.pubkeyContext?.networks?.includes(networkId)) {
      keepKeySdk.pubkeyContext = pubkeys.find(pk => 
        pk.networks?.includes(networkId)
      );
    }
    
    // For UTXO, we still need all relevant pubkeys to aggregate UTXOs
    const relevantPubkeys = pubkeys.filter((e) => e.networks && Array.isArray(e.networks) && e.networks.includes(networkId));

    const segwitNetworks = [
      'bip122:000000000019d6689c085ae165831e93', // Bitcoin Mainnet
      // 'bip122:12a765e31ffd4059bada1e25190f6e98', // LTC
    ];

    // Check if the current networkId is in the SegWit networks array
    const isSegwit = segwitNetworks.includes(networkId);

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
      //console.log('pubkey: ',pubkey)
      let utxosResp = await pioneer.ListUnspent({ network: chain, xpub: pubkey.pubkey });
      utxosResp = utxosResp.data;
      //console.log('utxosResp: ',utxosResp)
      //classify scriptType
      let scriptType = pubkey.scriptType
      // Assign the scriptType to each UTXO in the array
      for (const u of utxosResp) {
        u.scriptType = scriptType;
      }
      utxos.push(...utxosResp);
    }
    if (!utxos || utxos.length === 0) throw Error('No UTXOs found');

    for (const utxo of utxos) {
      utxo.value = Number(utxo.value);
    }

    let feeRateFromNode: any;
    try {
      // Try GetFeeRateByNetwork first (newer API), then fallback to GetFeeRate
      let feeResponse;
      if (pioneer.GetFeeRateByNetwork) {
        console.log(`${tag}: Trying GetFeeRateByNetwork for ${networkId}`);
        feeResponse = await pioneer.GetFeeRateByNetwork({ networkId });
      } else {
        console.log(`${tag}: Using GetFeeRate for ${networkId}`);
        feeResponse = await pioneer.GetFeeRate({ networkId });
      }

      feeRateFromNode = feeResponse.data;
      console.log(`${tag}: Got fee rates from API:`, JSON.stringify(feeRateFromNode, null, 2));

      // Validate the response has the expected structure
      if (!feeRateFromNode || typeof feeRateFromNode !== 'object') {
        throw new Error(`Invalid fee rate response from API: ${JSON.stringify(feeRateFromNode)}`);
      }

      // Log all available fee rates for debugging
      console.log(`${tag}: Available fee rates:`, {
        slow: feeRateFromNode.slow,
        average: feeRateFromNode.average,
        fast: feeRateFromNode.fast,
        fastest: feeRateFromNode.fastest
      });

      // Check that we have at least one fee rate
      if (!feeRateFromNode.slow && !feeRateFromNode.average && !feeRateFromNode.fast && !feeRateFromNode.fastest) {
        throw new Error(`No valid fee rates in API response: ${JSON.stringify(feeRateFromNode)}`);
      }
    } catch (error: any) {
      console.error(`${tag}: Failed to get fee rates from Pioneer API:`, error.message || error);
      throw new Error(`Unable to get fee rate for network ${networkId}: ${error.message || 'API unavailable'}`);
    }

    // Map fee level to fee rate (1,2,3 = slow, 4 = average, 5 = fastest)
    let effectiveFeeRate;
    console.log(`${tag}: Using fee level ${feeLevel}`);

    switch (feeLevel) {
      case 1:
      case 2:
      case 3:
        effectiveFeeRate = feeRateFromNode.slow || feeRateFromNode.average;
        console.log(`${tag}: Using SLOW fee rate: ${effectiveFeeRate} sat/vB`);
        break;
      case 4:
        effectiveFeeRate = feeRateFromNode.average || feeRateFromNode.fast;
        console.log(`${tag}: Using AVERAGE fee rate: ${effectiveFeeRate} sat/vB`);
        break;
      case 5:
        effectiveFeeRate = feeRateFromNode.fastest || feeRateFromNode.fast;
        console.log(`${tag}: Using FAST fee rate: ${effectiveFeeRate} sat/vB`);
        break;
      default:
        throw new Error(`Invalid fee level: ${feeLevel}. Must be 1-5`);
    }

    if (!effectiveFeeRate) throw new Error('Unable to get fee rate for network');

    // Log what we're using
    console.log(`${tag}: Using fee rate from API:`, {
      feeLevel,
      selectedRate: effectiveFeeRate,
      description: feeLevel <= 3 ? 'slow' : feeLevel === 4 ? 'average' : 'fast'
    });

    // Only enforce minimum for safety if fee is 0 or negative
    if (effectiveFeeRate <= 0) throw Error('Failed to build valid fee! Must be > 0');

    // The effectiveFeeRate is now the actual sat/vB from the API
    console.log(`${tag}: Final fee rate to use: ${effectiveFeeRate} sat/vB`);

    amount = parseInt(String(amount * 1e8));
    if (amount <= 0 && !isMax) throw Error('Invalid amount! 0');

    let result;
    if (isMax) {
      //console.log(tag, 'isMax:', isMax);
      // For max send, use coinSelectSplit
      result = coinSelectSplit(utxos, [{ address: to }], effectiveFeeRate);
    } else {
      //console.log(tag, 'isMax:', isMax)
      // Regular send
      result = coinSelect(utxos, [{ address: to, value: amount }], effectiveFeeRate);
    }
    //console.log(tag, 'result:', result);
    let { inputs, outputs, fee } = result;
    if (!inputs) throw Error('Failed to create transaction: Missing inputs');
    if (!outputs) throw Error('Failed to create transaction: Missing outputs');
    if (fee === undefined) throw Error('Failed to calculate transaction fee');

    console.log(`${tag}: Transaction built with:`, {
      feeLevel,
      effectiveFeeRate: `${effectiveFeeRate} sat/vB`,
      calculatedFee: `${fee} satoshis`,
      inputCount: inputs.length,
      outputCount: outputs.length
    });

    const uniqueInputSet = new Set();
    //console.log(tag,'inputs:', inputs);
    //console.log(tag,'inputs:', inputs[0]);
    const preparedInputs = inputs
      .map(transformInput)
      .filter(({ hash, index }) =>
        uniqueInputSet.has(`${hash}:${index}`) ? false : uniqueInputSet.add(`${hash}:${index}`),
      )
      .map(({ value, index, hash, txHex, path, scriptType }) => ({
        addressNList: bip32ToAddressNList(path),
        //TODO this is PER INPUT not per asset, we need to detect what pubkeys are segwit what are not
        scriptType,
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

    // Include the fee in the transaction object for the vault to use
    let unsignedTx = {
      inputs: preparedInputs,
      outputs: preparedOutputs,
      memo,
      fee: fee.toString() // Add the calculated fee to the returned object
    };
    //console.log(tag, 'unsignedTx:', unsignedTx);

    return unsignedTx;
  } catch (error) {
    //console.log(tag, 'Error:', error);
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

function getScriptTypeFromXpub(xpub: string): string {
  if (xpub.startsWith('xpub')) {
    return 'p2pkh';  // Legacy
  } else if (xpub.startsWith('ypub')) {
    return 'p2sh';   // P2WPKH nested in P2SH
  } else if (xpub.startsWith('zpub')) {
    return 'p2wpkh'; // Native SegWit
  } else {
    // Default fallback
    return 'p2pkh';
  }
}
