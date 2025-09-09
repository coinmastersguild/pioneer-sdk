import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';
import { bip32ToAddressNList } from '@pioneer-platform/pioneer-coins';

const TAG = ' | createUnsignedEvmTx | ';

// Utility function to convert a number to hex string with "0x" prefix
const toHex = (value) => {
  let hex = value.toString(16);
  if (hex.length % 2) hex = '0' + hex; // Ensure even length
  return '0x' + hex;
};

// Utility function to convert a UTF-8 string to hex
const utf8ToHex = (str) => {
  return '0x' + Buffer.from(str, 'utf8').toString('hex');
};

// Classify asset type based on CAIP format
const classifyCaipEvm = (caip) => {
  if (caip.includes('erc20')) return 'erc20';
  if (caip.includes('eip721')) return 'nft';
  if (caip.includes('slip44')) return 'gas';
  return 'unknown';
};

// Extract numeric part from networkId and convert to number for chainId
const extractChainIdFromNetworkId = (networkId) => {
  const id = networkId.split(':').pop();
  if (!id || isNaN(parseInt(id))) {
    throw new Error(`Malformed networkId: ${networkId}`);
  }
  return parseInt(id);
};

// Fetch the current ETH price in USD from CoinGecko
async function fetchEthPriceInUsd() {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  );
  const data = await response.json();
  return data.ethereum.usd;
}

// Extract contract address from CAIP
const extractContractAddressFromCaip = (caip) => {
  const parts = caip.split('/');
  if (parts.length < 2) {
    throw new Error(`Malformed CAIP: ${caip}`);
  }
  const assetId = parts[1];
  const assetParts = assetId.split(':');
  if (assetParts.length < 2) {
    throw new Error(`Malformed CAIP asset ID: ${assetId}`);
  }
  const contractAddress = assetParts[1];
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    throw new Error(`Invalid contract address in CAIP: ${contractAddress}`);
  }
  return contractAddress;
};

// Encode ERC20 transfer data
const encodeTransferData = (toAddress, amountWei) => {
  const functionSignature = 'a9059cbb';

  // Remove '0x' from addresses
  const toAddressNoPrefix = toAddress.toLowerCase().replace(/^0x/, '');
  const amountHex = amountWei.toString(16);

  // Pad to 32 bytes
  const toAddressPadded = toAddressNoPrefix.padStart(64, '0');
  const amountPadded = amountHex.padStart(64, '0');

  const data = '0x' + functionSignature + toAddressPadded + amountPadded;
  return data;
};

//TODO use assetData here, this is horrible
// Helper function to fetch token price in USD
async function fetchTokenPriceInUsd(contractAddress) {
  // Use CoinGecko API to get token price by contract address
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`,
  );
  const data = await response.json();
  const price = data[contractAddress.toLowerCase()]?.usd;
  if (!price) {
    throw new Error('Failed to fetch token price');
  }
  return price;
}

// Create an unsigned EVM transaction
export async function createUnsignedEvmTx(
  caip,
  to,
  amount,
  memo,
  pubkeys,
  pioneer,
  keepKeySdk,
  isMax,
) {
  const tag = TAG + ' | createUnsignedEvmTx | ';

  try {
    if (!pioneer) throw new Error('Failed to initialize Pioneer');

    // Determine networkId from CAIP
    const networkId = caipToNetworkId(caip);
    // Extract chainId from networkId
    const chainId = extractChainIdFromNetworkId(networkId);

    // Check if context is valid for this network
    const isValidForNetwork = (pubkey: any) => {
      if (!pubkey?.networks) return false;
      // For EVM, check if it has eip155:* wildcard OR the specific network
      if (networkId.includes('eip155')) {
        return pubkey.networks.includes('eip155:*') || pubkey.networks.includes(networkId);
      }
      // For non-EVM, check exact match
      return pubkey.networks.includes(networkId);
    };
    
    // Check if we have a context at all
    if (!keepKeySdk.pubkeyContext) {
      console.log(tag, 'No context set - auto-selecting first matching pubkey');
      keepKeySdk.pubkeyContext = pubkeys.find(pk => isValidForNetwork(pk));
    } else {
      // We have a context - check if it's valid for this network
      console.log(tag, 'Current context networks:', keepKeySdk.pubkeyContext.networks, 'For networkId:', networkId);
      
      if (!isValidForNetwork(keepKeySdk.pubkeyContext)) {
        // Context exists but wrong network - auto-correct
        console.log(tag, 'Auto-correcting context - wrong network detected');
        keepKeySdk.pubkeyContext = pubkeys.find(pk => isValidForNetwork(pk));
      } else {
        console.log(tag, 'Context is valid for this network - using existing context');
      }
    }
    
    const address = keepKeySdk.pubkeyContext?.address || keepKeySdk.pubkeyContext?.pubkey;
    console.log(tag, '✅ Using FROM address from pubkeyContext:', address, 'note:', keepKeySdk.pubkeyContext?.note);
    if (!address) throw new Error('No address found for the specified network');

    // Fetch gas price in gwei and convert to wei
    const gasPriceData = await pioneer.GetGasPriceByNetwork({ networkId });
    let gasPrice: bigint;
    
    // Check if the returned value is reasonable (in wei or gwei)
    // If it's less than 1 gwei (1e9 wei), it's probably already in wei but too low
    // For mainnet, we need at least 10-30 gwei typically
    const MIN_GAS_PRICE_WEI = BigInt(10e9); // 10 gwei minimum for mainnet
    
    if (BigInt(gasPriceData.data) < MIN_GAS_PRICE_WEI) {
      // The API is returning a value that's way too low (like 0.296 gwei)
      // Use a reasonable default for mainnet
      console.log(tag, 'Gas price from API too low:', gasPriceData.data, 'wei - using minimum:', MIN_GAS_PRICE_WEI.toString());
      gasPrice = MIN_GAS_PRICE_WEI;
    } else {
      gasPrice = BigInt(gasPriceData.data);
    }
    
    console.log(tag, 'Using gasPrice:', gasPrice.toString(), 'wei (', Number(gasPrice) / 1e9, 'gwei)');

    let nonce;
    try {
      const nonceData = await pioneer.GetNonceByNetwork({ networkId, address });
      nonce = nonceData.data;
      
      // Handle fresh addresses that have never sent a transaction
      if (nonce === undefined || nonce === null) {
        console.log(tag, 'No nonce found for address (likely fresh address), defaulting to 0');
        nonce = 0;
      }
    } catch (nonceError) {
      // If the API fails to fetch nonce (e.g., for a fresh address), default to 0
      console.log(tag, 'Failed to fetch nonce (likely fresh address):', nonceError.message, '- defaulting to 0');
      nonce = 0;
    }
    //console.log(tag, 'nonce:', nonce);

    const balanceData = await pioneer.GetBalanceAddressByNetwork({ networkId, address });
    const balanceEth = balanceData.data; // Assuming this is in ETH
    const balance = BigInt(Math.round(balanceEth * 1e18)); // Convert to wei
    //console.log(tag, 'balance (wei):', balance.toString());
    if (balance <= 0n) throw new Error('Wallet balance is zero');

    // Classify asset type by CAIP
    const assetType = classifyCaipEvm(caip);
    let unsignedTx;

    if (memo === ' ') memo = '';

    // Build transaction object based on asset type
    switch (assetType) {
      case 'gas': {
        // Check if this is a THORChain swap (needs more gas for contract call)
        const isThorchainOperation =
          memo && (memo.startsWith('=') || memo.startsWith('SWAP') || memo.includes(':'));
        
        let gasLimit;
        if (isThorchainOperation) {
          // THORChain depositWithExpiry requires more gas (90-120k typical)
          // Use 120000 to be safe for all network conditions
          gasLimit = BigInt(120000);
          console.log(tag, 'Using higher gas limit for THORChain swap:', gasLimit.toString());
        } else {
          // Standard gas limit for ETH transfer
          // Use higher gas limit for all chains except mainnet to be safe
          gasLimit = chainId === 1 ? BigInt(21000) : BigInt(25000);
        }

        if (memo && memo !== '' && !isThorchainOperation) {
          const memoBytes = Buffer.from(memo, 'utf8').length;
          gasLimit += BigInt(memoBytes) * 68n; // Approximate additional gas
          //console.log(tag, 'Adjusted gasLimit for memo:', gasLimit.toString());
        }

        const gasFee = gasPrice * gasLimit;
        //console.log(tag, 'gasFee (wei):', gasFee.toString());

        let amountWei;
        if (isMax) {
          if (balance <= gasFee) {
            throw new Error('Insufficient funds to cover gas fees');
          }
          // Subtract a small buffer (100 wei) to avoid rounding issues
          // This prevents "insufficient funds" errors when sending max amount
          const buffer = BigInt(100);
          amountWei = balance - gasFee - buffer;
          console.log(tag, 'isMax calculation - balance:', balance.toString(), 'gasFee:', gasFee.toString(), 'buffer:', buffer.toString(), 'amountWei:', amountWei.toString());
        } else {
          amountWei = BigInt(Math.round(amount * 1e18));
          if (amountWei + gasFee > balance) {
            throw new Error('Insufficient funds for the transaction amount and gas fees');
          }
        }

        //console.log(tag, 'amountWei:', amountWei.toString());

        // Check if this is a THORChain swap (memo starts with '=' or 'SWAP' or contains ':')
        const isThorchainSwap =
          memo && (memo.startsWith('=') || memo.startsWith('SWAP') || memo.includes(':'));

        let txData = '0x';

        if (isThorchainSwap) {
          // This is a THORChain swap - need to encode the deposit function call
          console.log(tag, 'Detected THORChain swap, encoding deposit data for memo:', memo);

          // Fix the memo format if it's missing the chain identifier
          // Convert "=:b:address" to "=:BTC.BTC:address" for Bitcoin
          let fixedMemo = memo;
          if (memo.startsWith('=:b:') || memo.startsWith('=:btc:')) {
            fixedMemo = memo.replace(/^=:(b|btc):/, '=:BTC.BTC:');
            console.log(tag, 'Fixed Bitcoin swap memo from:', memo, 'to:', fixedMemo);
          } else if (memo.startsWith('=:e:') || memo.startsWith('=:eth:')) {
            fixedMemo = memo.replace(/^=:(e|eth):/, '=:ETH.ETH:');
            console.log(tag, 'Fixed Ethereum swap memo from:', memo, 'to:', fixedMemo);
          }
          
          // Validate memo length (THORChain typically < 250 bytes)
          if (fixedMemo.length > 250) {
            throw new Error(`Memo too long for THORChain: ${fixedMemo.length} bytes (max 250)`);
          }

          try {
            // CRITICAL: Fetch current inbound addresses from THORChain
            // The 'to' address should be the router, but we need the vault address for the deposit
            let vaultAddress = '0x0000000000000000000000000000000000000000';
            let routerAddress = to; // The 'to' field should already be the router
            
            try {
              // Try to fetch inbound addresses from THORChain
              // This would typically be: GET https://thornode.ninerealms.com/thorchain/inbound_addresses
              const inboundResponse = await fetch('https://thornode.ninerealms.com/thorchain/inbound_addresses');
              if (inboundResponse.ok) {
                const inboundData = await inboundResponse.json();
                // Find ETH inbound data
                const ethInbound = inboundData.find(inbound => 
                  inbound.chain === 'ETH' && !inbound.halted
                );
                if (ethInbound) {
                  vaultAddress = ethInbound.address; // This is the Asgard vault
                  routerAddress = ethInbound.router || to; // Use fetched router or fallback to 'to'
                  console.log(tag, 'Using THORChain inbound addresses - vault:', vaultAddress, 'router:', routerAddress);
                  
                  // Update the 'to' address to be the router (in case it wasn't)
                  to = routerAddress;
                } else {
                  throw new Error('ETH inbound is halted or not found - cannot proceed with swap');
                }
              }
            } catch (fetchError) {
              console.error(tag, 'Failed to fetch inbound addresses:', fetchError);
              // ABORT - cannot proceed without proper vault address
              throw new Error(`Cannot proceed with THORChain swap - failed to fetch inbound addresses: ${fetchError.message}`);
            }
            
            // Final validation - never use 0x0 as vault
            if (vaultAddress === '0x0000000000000000000000000000000000000000') {
              throw new Error('Cannot proceed with THORChain swap - vault address is invalid (0x0)');
            }

            // Use depositWithExpiry for better safety
            // Function signature: depositWithExpiry(address,address,uint256,string,uint256)
            // Function selector: 0x44bc937b
            const functionSelector = '44bc937b';
            
            // For native ETH swaps, asset is 0x0000...0000
            const assetAddress = '0x0000000000000000000000000000000000000000';
            
            // Calculate expiry time (current time + 1 hour)
            const expiryTime = Math.floor(Date.now() / 1000) + 3600;
            
            // Encode the parameters
            const vaultPadded = vaultAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
            const assetPadded = assetAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
            const amountPadded = amountWei.toString(16).padStart(64, '0');
            
            // CRITICAL FIX: String offset for depositWithExpiry with 5 parameters
            // The memo is the 4th parameter (dynamic string)
            // Offset must point after all 5 head words: 5 * 32 = 160 = 0xa0
            const stringOffset = (5 * 32).toString(16).padStart(64, '0'); // 0xa0
            
            // Expiry time (5th parameter after the string offset)
            const expiryPadded = expiryTime.toString(16).padStart(64, '0');
            
            // String length in bytes
            const memoBytes = Buffer.from(fixedMemo, 'utf8');
            const stringLength = memoBytes.length.toString(16).padStart(64, '0');
            
            // String data (padded to 32-byte boundary)
            const memoHex = memoBytes.toString('hex');
            const paddingLength = (32 - (memoBytes.length % 32)) % 32;
            const memoPadded = memoHex + '0'.repeat(paddingLength * 2);
            
            // Construct the complete transaction data for depositWithExpiry
            txData = '0x' + functionSelector + vaultPadded + assetPadded + amountPadded + stringOffset + expiryPadded + stringLength + memoPadded;
            
            console.log(tag, 'Encoded THORChain depositWithExpiry data:', {
              functionSelector: '0x' + functionSelector,
              vault: vaultAddress,
              asset: assetAddress,
              amount: amountWei.toString(),
              memo: fixedMemo,
              expiry: expiryTime,
              stringOffset: '0x' + stringOffset,
              fullData: txData
            });
            
            // CRITICAL: For native ETH, the value MUST be set in the transaction
            // This is already handled below where we set value: toHex(amountWei)
            // But let's make sure it's clear
            console.log(tag, 'Native ETH swap - value will be set to:', amountWei.toString(), 'wei');
            
          } catch (error) {
            console.error(tag, 'Error encoding THORChain deposit:', error);
            // Don't fallback to plain memo - this will fail on chain
            throw new Error(`Failed to encode THORChain swap: ${error.message}`);
          }
        } else if (memo) {
          // Regular transaction with memo
          txData = utf8ToHex(memo);
        }

        unsignedTx = {
          chainId,
          nonce: toHex(nonce),
          gas: toHex(gasLimit),
          gasPrice: toHex(gasPrice),
          to,
          value: toHex(amountWei),
          data: txData,
        };
        break;
      }

      case 'erc20': {
        const contractAddress = extractContractAddressFromCaip(caip);

        // Get token decimals - CRITICAL for correct amount calculation
        // Common token decimals:
        // USDT: 6, USDC: 6, DAI: 18, WETH: 18, most others: 18
        let tokenDecimals = 18; // Default to 18 if not specified

        // Check for known stablecoins with 6 decimals
        const contractLower = contractAddress.toLowerCase();
        if (
          contractLower === '0xdac17f958d2ee523a2206206994597c13d831ec7' || // USDT on Ethereum
          contractLower === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' || // USDC on Ethereum
          contractLower === '0x4fabb145d64652a948d72533023f6e7a623c7c53' || // BUSD on Ethereum
          contractLower === '0x8e870d67f660d95d5be530380d0ec0bd388289e1'
        ) {
          // USDP on Ethereum
          tokenDecimals = 6;
          console.log(tag, 'Using 6 decimals for stablecoin:', contractAddress);
        }

        // TODO: Fetch decimals from contract in the future:
        // const decimals = await getTokenDecimals(contractAddress, networkId);

        // Use BigInt for precise decimal math (no float drift)
        const tokenMultiplier = 10n ** BigInt(tokenDecimals);

        // Increase gas limit for ERC-20 transfers - 60k was insufficient on Polygon
        // Transaction 0x00ba81ce failed at 52,655/60,000 gas
        let gasLimit = BigInt(100000); // Increased from 60000 to handle SSTORE operations

        if (memo && memo !== '') {
          const memoBytes = Buffer.from(memo, 'utf8').length;
          gasLimit += BigInt(memoBytes) * 68n; // Approximate additional gas
          //console.log(tag, 'Adjusted gasLimit for memo:', gasLimit.toString());
        }

        const gasFee = gasPrice * gasLimit;

        let amountWei;
        if (isMax) {
          // For ERC20 tokens, need to get token balance
          const tokenBalanceData = await pioneer.GetTokenBalance({
            networkId,
            address,
            contractAddress,
          });
          // Use BigInt math to avoid precision loss
          // Note: tokenBalanceData.data is a float which can lose precision
          // Ideally the API should return base units as string/bigint
          const tokenBalance = BigInt(Math.round(tokenBalanceData.data * Number(tokenMultiplier)));
          amountWei = tokenBalance;
        } else {
          // Use BigInt math to avoid precision loss
          amountWei = BigInt(Math.round(amount * Number(tokenMultiplier)));
          console.log(tag, 'Token amount calculation:', {
            inputAmount: amount,
            decimals: tokenDecimals,
            multiplier: tokenMultiplier,
            resultWei: amountWei.toString(),
          });
        }

        // Ensure user has enough ETH to pay for gas
        if (gasFee > balance) {
          throw new Error('Insufficient ETH balance to cover gas fees');
        }

        // Ensure user has enough tokens
        // For simplicity, we assume user has enough tokens
        // In practice, need to check token balance

        const data = encodeTransferData(to, amountWei);

        const ethPriceInUsd = await fetchEthPriceInUsd();
        const gasFeeUsd = (Number(gasFee) / 1e18) * ethPriceInUsd;

        // For token price, need to fetch from API
        const tokenPriceInUsd = await fetchTokenPriceInUsd(contractAddress);
        // Use the correct decimals for USD calculation
        const amountUsd = (Number(amountWei) / Number(tokenMultiplier)) * tokenPriceInUsd;

        unsignedTx = {
          chainId,
          nonce: toHex(nonce),
          gas: toHex(gasLimit),
          gasPrice: toHex(gasPrice),
          to: contractAddress,
          value: '0x0',
          data,
          // USD estimations
          gasFeeUsd,
          amountUsd,
        };
        break;
      }

      default: {
        throw new Error(`Unsupported asset type for CAIP ${caip}`);
      }
    }

    // Address path for hardware wallets - use the path from the pubkey context
    // The pubkey context should have either addressNListMaster or pathMaster
    if (keepKeySdk.pubkeyContext?.addressNListMaster) {
      // Direct use if we have addressNListMaster
      unsignedTx.addressNList = keepKeySdk.pubkeyContext.addressNListMaster;
      console.log(tag, '✅ Using addressNListMaster from pubkey context:', unsignedTx.addressNList, 'for address:', address);
    } else if (keepKeySdk.pubkeyContext?.pathMaster) {
      // Convert BIP32 path to addressNList if we have pathMaster
      unsignedTx.addressNList = bip32ToAddressNList(keepKeySdk.pubkeyContext.pathMaster);
      console.log(tag, '✅ Converted pathMaster to addressNList:', keepKeySdk.pubkeyContext.pathMaster, '→', unsignedTx.addressNList);
    } else if (keepKeySdk.pubkeyContext?.addressNList) {
      // Use addressNList if available (but this would be the non-master path)
      unsignedTx.addressNList = keepKeySdk.pubkeyContext.addressNList;
      console.log(tag, '✅ Using addressNList from pubkey context:', unsignedTx.addressNList);
    } else if (keepKeySdk.pubkeyContext?.path) {
      // Last resort - convert regular path to addressNList
      unsignedTx.addressNList = bip32ToAddressNList(keepKeySdk.pubkeyContext.path);
      console.log(tag, '⚠️ Using regular path (not master):', keepKeySdk.pubkeyContext.path, '→', unsignedTx.addressNList);
    } else {
      // Fallback to default account 0
      unsignedTx.addressNList = [0x80000000 + 44, 0x80000000 + 60, 0x80000000, 0, 0];
      console.warn(tag, '⚠️ No path info in pubkey context, using default account 0');
    }

    //console.log(tag, 'Unsigned Transaction:', unsignedTx);
    return unsignedTx;
  } catch (error) {
    console.error(tag, 'Error:', error.message);
    throw error;
  }
}
