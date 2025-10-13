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

    // Determine the change script type - use preference or default to p2wpkh for lower fees
    const actualChangeScriptType =
      changeScriptType ||
      relevantPubkeys.find((pk) => pk.scriptType === 'p2wpkh')?.scriptType || // Prefer native segwit if available
      relevantPubkeys[0].scriptType || // Fall back to first available
      'p2wpkh'; // Ultimate default
    console.log(`${tag}: Using change script type: ${actualChangeScriptType}`);

    // Find the xpub that matches the desired script type
    const changeXpub =
      relevantPubkeys.find((pk) => pk.scriptType === actualChangeScriptType)?.pubkey ||
      relevantPubkeys.find((pk) => pk.scriptType === 'p2wpkh')?.pubkey || // Fall back to native segwit
      relevantPubkeys[0].pubkey; // Last resort: use first available

    console.log(
      `${tag}: Change xpub selected for ${actualChangeScriptType}:`,
      changeXpub?.substring(0, 10) + '...',
    );

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
        console.log(
          `${tag}: ListUnspent response for ${pubkey.scriptType}:`,
          utxosResp?.length || 0,
          'UTXOs',
        );

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
    
    // HARDCODE DOGE FEES - API is unreliable for DOGE
    if (networkId === 'bip122:00000000001a91e3dace36e2be3bf030') {
      console.log(`${tag}: Using hardcoded fees for DOGE (10 sat/byte)`);
      feeRateFromNode = {
        slow: 10,
        average: 10,
        fast: 10,
        fastest: 10,
        unit: 'sat/byte',
        description: 'Hardcoded DOGE fees - API unreliable'
      };
    } else {
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

      // UNIT CONVERSION: Detect if API returned sat/kB instead of sat/byte
      // If values are unreasonably high (>500), they're likely in sat/kB
      const conversionThreshold = 500;
      const needsConversion =
        (feeRateFromNode.slow && feeRateFromNode.slow > conversionThreshold) ||
        (feeRateFromNode.average && feeRateFromNode.average > conversionThreshold) ||
        (feeRateFromNode.fast && feeRateFromNode.fast > conversionThreshold) ||
        (feeRateFromNode.fastest && feeRateFromNode.fastest > conversionThreshold);

      if (needsConversion) {
        console.warn(`${tag}: Detected wrong units - values appear to be in sat/kB instead of sat/byte`);
        console.warn(`${tag}: Original values:`, {
          slow: feeRateFromNode.slow,
          average: feeRateFromNode.average,
          fast: feeRateFromNode.fast,
          fastest: feeRateFromNode.fastest,
        });

        // Convert from sat/kB to sat/byte by dividing by 1000
        if (feeRateFromNode.slow) feeRateFromNode.slow = feeRateFromNode.slow / 1000;
        if (feeRateFromNode.average) feeRateFromNode.average = feeRateFromNode.average / 1000;
        if (feeRateFromNode.fast) feeRateFromNode.fast = feeRateFromNode.fast / 1000;
        if (feeRateFromNode.fastest) feeRateFromNode.fastest = feeRateFromNode.fastest / 1000;

        console.warn(`${tag}: Converted to sat/byte:`, feeRateFromNode);
      }

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
    }

    // Map fee level to fee rate (1-2 = slow, 3-4 = average, 5 = fastest)
    // Frontend typically sends: slow=1, average=3, fastest=5
    let effectiveFeeRate;
    console.log(`${tag}: Using fee level ${feeLevel}`);

    switch (feeLevel) {
      case 1:
      case 2:
        effectiveFeeRate = feeRateFromNode.slow || feeRateFromNode.average;
        console.log(`${tag}: Using SLOW fee rate: ${effectiveFeeRate} sat/vB`);
        break;
      case 3:
      case 4:
        effectiveFeeRate = feeRateFromNode.average || feeRateFromNode.fast;
        console.log(`${tag}: Using AVERAGE fee rate: ${effectiveFeeRate} sat/vB`);
        break;
      case 5:
        effectiveFeeRate = feeRateFromNode.fastest || feeRateFromNode.fast;
        console.log(`${tag}: Using FASTEST fee rate: ${effectiveFeeRate} sat/vB`);
        break;
      default:
        throw new Error(`Invalid fee level: ${feeLevel}. Must be 1-5`);
    }

    if (!effectiveFeeRate) throw new Error('Unable to get fee rate for network');

    // Log what we're using
    console.log(`${tag}: Using fee rate from API:`, {
      feeLevel,
      selectedRate: effectiveFeeRate,
      description: feeLevel <= 2 ? 'slow' : feeLevel <= 4 ? 'average' : 'fast',
    });

    // Only enforce minimum for safety if fee is 0 or negative
    if (effectiveFeeRate <= 0) throw Error('Failed to build valid fee! Must be > 0');

    // CRITICAL: coinselect library requires WHOLE NUMBER fee rates, not decimals
    // Round up to ensure we don't underpay on fees
    effectiveFeeRate = Math.ceil(effectiveFeeRate);
    
    // Enforce Bitcoin network minimum relay fee (3 sat/vB minimum for BTC mainnet)
    // This prevents "min relay fee not met" errors from nodes
    const MIN_RELAY_FEE_RATE = 3;
    if (effectiveFeeRate < MIN_RELAY_FEE_RATE) {
      console.log(`${tag}: Fee rate ${effectiveFeeRate} is below minimum relay fee, increasing to ${MIN_RELAY_FEE_RATE} sat/vB`);
      effectiveFeeRate = MIN_RELAY_FEE_RATE;
    }
    
    // The effectiveFeeRate is now the actual sat/vB from the API
    console.log(`${tag}: Final fee rate to use (rounded, with minimums): ${effectiveFeeRate} sat/vB`);

    amount = parseInt(String(amount * 1e8));
    if (amount <= 0 && !isMax) throw Error('Invalid amount! 0');

    // Log UTXOs before coin selection for debugging
    const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    console.log(`${tag}: Coin selection inputs:`, {
      utxoCount: utxos.length,
      totalBalance: totalBalance / 1e8,
      requestedAmount: amount / 1e8,
      isMax,
      feeRate: effectiveFeeRate,
    });

    // DEBUG: Log actual UTXO structure to see what coinselect receives
    console.log(`${tag}: UTXO details for coin selection:`, 
      utxos.map(u => ({
        value: u.value,
        txid: u.txid?.substring(0, 10) + '...',
        vout: u.vout,
        scriptType: u.scriptType,
        hasPath: !!u.path,
        hasTxHex: !!u.txHex
      }))
    );

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

    console.log(tag, 'coinSelect result object:', result);
    console.log(tag, 'coinSelect result.inputs:', result?.inputs);

    if (!result || !result.inputs) {
      // Provide detailed error information
      const errorDetails = {
        utxoCount: utxos.length,
        totalBalance: totalBalance / 1e8,
        requestedAmount: amount / 1e8,
        feeRate: effectiveFeeRate,
        insufficientFunds: totalBalance < amount,
      };
      console.error(`${tag}: Coin selection failed:`, errorDetails);

      if (utxos.length === 0) {
        throw Error('No UTXOs available for coin selection');
      } else if (totalBalance < amount) {
        throw Error(`Insufficient funds: Have ${totalBalance / 1e8} BTC, need ${amount / 1e8} BTC`);
      } else {
        throw Error(
          'Failed to create transaction: Coin selection failed (possibly due to high fees)',
        );
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
