import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';

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
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
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

// Helper function to fetch token price in USD
async function fetchTokenPriceInUsd(contractAddress) {
  // Use CoinGecko API to get token price by contract address
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`
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

    // Find relevant public keys for the network
    const blockchain = networkId.includes('eip155') ? 'eip155:*' : '';
    const relevantPubkeys = pubkeys.filter((e) => e.networks.includes(blockchain));
    const address = relevantPubkeys[0]?.address;
    if (!address) throw new Error('No address found for the specified network');

    // Fetch gas price in gwei and convert to wei
    const gasPriceData = await pioneer.GetGasPriceByNetwork({ networkId });
    const gasPriceGwei = gasPriceData.data; // Ensure this is in gwei
    console.log(tag, 'gasPrice (gwei):', gasPriceGwei);

    const gasPrice = BigInt(gasPriceGwei); // Convert gwei to wei

    const nonceData = await pioneer.GetNonceByNetwork({ networkId, address });
    const nonce = nonceData.data;
    if (nonce === undefined || nonce === null) throw new Error('Failed to fetch nonce');
    console.log(tag, 'nonce:', nonce);

    const balanceData = await pioneer.GetBalanceAddressByNetwork({ networkId, address });
    const balanceEth = balanceData.data; // Assuming this is in ETH
    const balance = BigInt(Math.round(balanceEth * 1e18)); // Convert to wei
    console.log(tag, 'balance (wei):', balance.toString());
    if (balance <= 0n) throw new Error('Wallet balance is zero');

    // Classify asset type by CAIP
    const assetType = classifyCaipEvm(caip);
    let unsignedTx;

    if (memo === ' ') memo = '';

    // Build transaction object based on asset type
    switch (assetType) {
      case 'gas': {
        // Standard gas limit for ETH transfer
        let gasLimit = BigInt(21000);

        if (memo && memo !== '') {
          const memoBytes = Buffer.from(memo, 'utf8').length;
          gasLimit += BigInt(memoBytes) * 68n; // Approximate additional gas
          console.log(tag, 'Adjusted gasLimit for memo:', gasLimit.toString());
        }

        const gasFee = gasPrice * gasLimit;
        console.log(tag, 'gasFee (wei):', gasFee.toString());

        let amountWei;
        if (isMax) {
          if (balance <= gasFee) {
            throw new Error('Insufficient funds to cover gas fees');
          }
          amountWei = balance - gasFee;
        } else {
          amountWei = BigInt(Math.round(amount * 1e18));
          if (amountWei + gasFee > balance) {
            throw new Error('Insufficient funds for the transaction amount and gas fees');
          }
        }

        console.log(tag, 'amountWei:', amountWei.toString());
        unsignedTx = {
          chainId,
          nonce: toHex(nonce),
          gas: toHex(gasLimit),
          gasPrice: toHex(gasPrice),
          to,
          value: toHex(amountWei),
          data: memo ? utf8ToHex(memo) : '0x',
        };
        break;
      }

      case 'erc20': {
        const contractAddress = extractContractAddressFromCaip(caip);

        let gasLimit = BigInt(60000);

        if (memo && memo !== '') {
          const memoBytes = Buffer.from(memo, 'utf8').length;
          gasLimit += BigInt(memoBytes) * 68n; // Approximate additional gas
          console.log(tag, 'Adjusted gasLimit for memo:', gasLimit.toString());
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
          const tokenBalance = BigInt(Math.round(tokenBalanceData.data * 1e18)); // Adjust decimals as needed
          amountWei = tokenBalance;
        } else {
          amountWei = BigInt(Math.round(amount * 1e18)); // Adjust decimals as needed
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
        const amountUsd = (Number(amountWei) / 1e18) * tokenPriceInUsd; // Adjust decimals as needed

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

    // Address path for hardware wallets (e.g., BIP44 path for Ethereum)
    unsignedTx.addressNList = [0x80000000 + 44, 0x80000000 + 60, 0x80000000, 0, 0];

    console.log(tag, 'Unsigned Transaction:', unsignedTx);
    return unsignedTx;
  } catch (error) {
    console.error(tag, 'Error:', error.message);
    throw error;
  }
}
