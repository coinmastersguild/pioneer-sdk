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
  changeScriptType?: string, // Added changeScriptType parameter for user preference
): Promise<any> {
  let tag = ' | createUnsignedUxtoTx | ';

  try {
    if (!pioneer) throw Error('Failed to init! pioneer');

    const networkId = caipToNetworkId(caip);

    // Auto-correct context if wrong network
    if (!keepKeySdk.pubkeyContext?.networks?.includes(networkId)) {
      keepKeySdk.pubkeyContext = pubkeys.find((pk) => pk.networks?.includes(networkId));
    }

    // For UTXO, we still need all relevant pubkeys to aggregate UTXOs
    const relevantPubkeys = pubkeys.filter(
      (e) => e.networks && Array.isArray(e.networks) && e.networks.includes(networkId),
    );

    const segwitNetworks = [
      'bip122:000000000019d6689c085ae165831e93', // Bitcoin Mainnet
      // 'bip122:12a765e31ffd4059bada1e25190f6e98', // LTC
    ];

    // Check if the current networkId is in the SegWit networks array
    const isSegwit = segwitNetworks.includes(networkId);

    let chain = NetworkIdToChain[networkId];

    // Determine the change script type - use preference or default to first available
    const actualChangeScriptType = changeScriptType || relevantPubkeys[0].scriptType || 'p2wpkh';
    console.log(`${tag}: Using change script type: ${actualChangeScriptType}`);

    // Find the xpub that matches the desired script type
    const changeXpub = relevantPubkeys.find(pk => pk.scriptType === actualChangeScriptType)?.pubkey
      || relevantPubkeys.find(pk => pk.scriptType === 'p2wpkh')?.pubkey // Fall back to native segwit
      || relevantPubkeys[0].pubkey; // Last resort: use first available

    console.log(`${tag}: Change xpub selected for ${actualChangeScriptType}:`, changeXpub?.substring(0, 10) + '...');

    let changeAddressIndex = await pioneer.GetChangeAddress({
      network: chain,
      xpub: changeXpub,
    });
    changeAddressIndex = changeAddressIndex.data.changeIndex;

    // Determine BIP path based on script type
    let bipPath: string;
    switch (actualChangeScriptType) {
      case 'p2pkh':
        bipPath = `m/44'/0'/0'/1/${changeAddressIndex}`; // BIP44 for legacy
        break;
      case 'p2sh-p2wpkh':
        bipPath = `m/49'/0'/0'/1/${changeAddressIndex}`; // BIP49 for wrapped segwit
        break;
      case 'p2wpkh':
      default:
        bipPath = `m/84'/0'/0'/1/${changeAddressIndex}`; // BIP84 for native segwit
        break;
    }

    const path = bipPath;
    console.log(`${tag}: Change address path: ${path} (index: ${changeAddressIndex})`);

    const changeAddress = {
      path: path,
      isChange: true,
      index: changeAddressIndex,
      addressNList: bip32ToAddressNList(path),
      scriptType: actualChangeScriptType, // Store the script type with the change address
    };

    const utxos: any[] = [];
    for (const pubkey of relevantPubkeys) {
      //console.log('pubkey: ',pubkey)
      try {
        let utxosResp = await pioneer.ListUnspent({ network: chain, xpub: pubkey.pubkey });
        utxosResp = utxosResp.data;
        console.log(`${tag}: ListUnspent response for ${pubkey.scriptType}:`, utxosResp?.length || 0, 'UTXOs');

        // Validate the response
        if (!utxosResp || !Array.isArray(utxosResp)) {
          console.warn(`${tag}: Invalid or empty UTXO response for ${pubkey.pubkey}`);
          continue;
        }

        //classify scriptType
        let scriptType = pubkey.scriptType;
        // Assign the scriptType to each UTXO in the array
        for (const u of utxosResp) {
          u.scriptType = scriptType;
        }
        utxos.push(...utxosResp);
      } catch (error) {
        console.error(`${tag}: Failed to fetch UTXOs for ${pubkey.pubkey}:`, error);
        // Continue to next pubkey instead of failing entirely
      }
    }

    console.log(`${tag}: Total UTXOs collected:`, utxos.length);
    if (!utxos || utxos.length === 0) throw Error('No UTXOs found across all addresses');

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
        fastest: feeRateFromNode.fastest,
      });

      // Check that we have at least one fee rate
      if (
        !feeRateFromNode.slow &&
        !feeRateFromNode.average &&
        !feeRateFromNode.fast &&
        !feeRateFromNode.fastest
      ) {
        throw new Error(`No valid fee rates in API response: ${JSON.stringify(feeRateFromNode)}`);
      }
    } catch (error: any) {
      console.error(`${tag}: Failed to get fee rates from Pioneer API:`, error.message || error);
      throw new Error(
        `Unable to get fee rate for network ${networkId}: ${error.message || 'API unavailable'}`,
      );
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
      description: feeLevel <= 3 ? 'slow' : feeLevel === 4 ? 'average' : 'fast',
    });

    // Only enforce minimum for safety if fee is 0 or negative
    if (effectiveFeeRate <= 0) throw Error('Failed to build valid fee! Must be > 0');

    // The effectiveFeeRate is now the actual sat/vB from the API
    console.log(`${tag}: Final fee rate to use: ${effectiveFeeRate} sat/vB`);

    amount = parseInt(String(amount * 1e8));
    if (amount <= 0 && !isMax) throw Error('Invalid amount! 0');

    // Log UTXOs before coin selection for debugging
    const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    console.log(`${tag}: Coin selection inputs:`, {
      utxoCount: utxos.length,
      totalBalance: totalBalance / 1e8,
      requestedAmount: amount / 1e8,
      isMax,
      feeRate: effectiveFeeRate
    });

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

    console.log(tag, 'coinSelect result:', result ? 'Success' : 'Failed');

    if (!result || !result.inputs) {
      // Provide detailed error information
      const errorDetails = {
        utxoCount: utxos.length,
        totalBalance: totalBalance / 1e8,
        requestedAmount: amount / 1e8,
        feeRate: effectiveFeeRate,
        insufficientFunds: totalBalance < amount
      };
      console.error(`${tag}: Coin selection failed:`, errorDetails);

      if (utxos.length === 0) {
        throw Error('No UTXOs available for coin selection');
      } else if (totalBalance < amount) {
        throw Error(`Insufficient funds: Have ${totalBalance / 1e8} BTC, need ${amount / 1e8} BTC`);
      } else {
        throw Error('Failed to create transaction: Coin selection failed (possibly due to high fees)');
      }
    }

    let { inputs, outputs, fee } = result;
    if (!inputs) throw Error('Failed to create transaction: Missing inputs');
    if (!outputs) throw Error('Failed to create transaction: Missing outputs');
    if (fee === undefined) throw Error('Failed to calculate transaction fee');

    console.log(`${tag}: Transaction built with:`, {
      feeLevel,
      effectiveFeeRate: `${effectiveFeeRate} sat/vB`,
      calculatedFee: `${fee} satoshis`,
      inputCount: inputs.length,
      outputCount: outputs.length,
    });

    const uniqueInputSet = new Set();
    console.log(tag, 'inputs:', inputs);
    console.log(tag, 'inputs:', inputs[0]);
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

    // Remove hardcoded script type - use the one from changeAddress

    const preparedOutputs = outputs
      .map(({ value, address }) => {
        if (address) {
          return { address, amount: value.toString(), addressType: 'spend' };
        } else if (!isMax) {
          return {
            addressNList: changeAddress.addressNList,
            scriptType: changeAddress.scriptType, // Use the correct script type from change address
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
      fee: fee.toString(), // Add the calculated fee to the returned object
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
    return 'p2pkh'; // Legacy
  } else if (xpub.startsWith('ypub')) {
    return 'p2sh'; // P2WPKH nested in P2SH
  } else if (xpub.startsWith('zpub')) {
    return 'p2wpkh'; // Native SegWit
  } else {
    // Default fallback
    return 'p2pkh';
  }
}
