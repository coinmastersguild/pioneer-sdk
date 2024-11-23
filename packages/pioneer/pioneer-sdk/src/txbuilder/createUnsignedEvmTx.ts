import { caipToNetworkId } from '@pioneer-platform/pioneer-caip';

const TAG = ' | createUnsignedEvmTx | ';

// Utility function to convert a number to hex string with "0x" prefix
const toHex = (value: number | bigint): string => `0x${value.toString(16)}`;

// Utility function to convert a UTF-8 string to hex
const utf8ToHex = (str: string): string => {
  return '0x' + Buffer.from(str, 'utf8').toString('hex');
};

// Classify asset type based on CAIP format
const classifyCaipEvm = (caip: string): 'erc20' | 'nft' | 'gas' | 'unknown' => {
  if (caip.includes('erc20')) return 'erc20';
  if (caip.includes('eip720')) return 'nft';
  if (caip.includes('slip44')) return 'gas';
  return 'unknown';
};

// Extract numeric part from networkId and convert to hex for chainId
const extractChainIdFromNetworkId = (networkId: string): string => {
  const id = networkId.split(':').pop();
  if (!id || isNaN(parseInt(id))) {
    throw new Error(`Malformed networkId: ${networkId}`);
  }
  return toHex(parseInt(id));
};

// Create an unsigned EVM transaction
export async function createUnsignedEvmTx(
  caip: string,
  to: string,
  amount: number,
  memo: string,
  pubkeys: any,
  pioneer: any,
  keepKeySdk: any,
): Promise<any> {
  let tag = TAG + ' | createUnsignedEvmTx | ';

  try {
    if (!pioneer) throw new Error('Failed to initialize pioneer');

    //console.log(tag, 'Creating EVM transaction');

    // Determine networkId from CAIP
    const networkId = caipToNetworkId(caip);
    //console.log(tag, 'networkId:', networkId);

    // Extract chainId from networkId
    const chainId = extractChainIdFromNetworkId(networkId);
    //console.log(tag, 'chainId:', chainId);

    // Find relevant public keys for the network
    let blockchain;
    if (networkId.indexOf('eip155') > -1) blockchain = 'eip155:*';
    const relevantPubkeys = pubkeys.filter((e) => e.networks.includes(blockchain));
    const address = relevantPubkeys[0]?.address;
    if (!address) throw new Error('No address found for the specified network');

    // Fetch transaction details from pioneer
    let gasPrice = await pioneer.GetGasPriceByNetwork({ networkId });
    gasPrice = gasPrice.data;
    //console.log(tag, 'gasPrice: ', gasPrice);
    if (!gasPrice) throw new Error('Failed to fetch gas price');
    let nonce = await pioneer.GetNonceByNetwork({ networkId, address });
    nonce = nonce.data;
    if (!nonce) throw new Error('Failed to fetch nonce');
    //console.log(tag, 'nonce: ', nonce);

    // Classify asset type by CAIP
    const assetType = classifyCaipEvm(caip);
    let unsignedTx;

    const txAmount = toHex(BigInt(Math.floor(amount * 1e18)));

    // Build transaction object based on asset type
    switch (assetType) {
      case 'gas': {
        // Standard EVM transfer transaction (e.g., ETH)
        unsignedTx = {
          chainId, // Set the extracted chainId
          nonce: toHex(nonce),
          gasLimit: toHex(21000), // Standard gas limit for ETH transfer
          gasPrice: toHex(gasPrice),
          to,
          value: txAmount,
          data: memo ? utf8ToHex(memo) : '0x',
        };
        break;
      }

      case 'erc20': {
        // ERC20 token transfer
        const data = encodeERC20Transfer(to, txAmount); // Use helper function to encode transfer data
        unsignedTx = {
          chainId, // Set the extracted chainId
          nonce: toHex(nonce),
          gasLimit: toHex(60000), // Adjusted gas limit for ERC20 transfer
          gasPrice: toHex(gasPrice),
          to: caip, // Token contract address
          value: '0x0',
          data,
        };
        break;
      }

      case 'nft': {
        throw new Error('NFT transfers are not yet supported');
      }

      default: {
        throw new Error(`Unsupported asset type for CAIP ${caip}`);
      }
    }

    //console.log(tag, 'Unsigned Transaction:', unsignedTx);
    return unsignedTx;
  } catch (error) {
    console.error(tag, 'Error:', error);
    throw error;
  }
}

// Helper function to encode ERC20 transfer function call
const encodeERC20Transfer = (to: string, amountHex: string): string => {
  const functionSignature = 'a9059cbb'; // Keccak-256 hash of "transfer(address,uint256)" function
  const paddedTo = to.slice(2).padStart(64, '0'); // Remove "0x" and pad to 32 bytes
  const paddedAmount = amountHex.slice(2).padStart(64, '0'); // Remove "0x" and pad to 32 bytes
  return `0x${functionSignature}${paddedTo}${paddedAmount}`;
};
