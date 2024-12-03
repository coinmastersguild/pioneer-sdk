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
  return parseInt(id).toString();
};

// Helper function to encode ERC20 transfer function call
const encodeERC20Transfer = (to: string, amountHex: string): string => {
  const functionSignature = 'a9059cbb'; // Keccak-256 hash of "transfer(address,uint256)" function
  const paddedTo = to.slice(2).padStart(64, '0'); // Remove "0x" and pad to 32 bytes
  const paddedAmount = amountHex.slice(2).padStart(64, '0'); // Remove "0x" and pad to 32 bytes
  return `0x${functionSignature}${paddedTo}${paddedAmount}`;
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
  isMax: boolean,
): Promise<any> {
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

    // Fetch transaction details from Pioneer
    let gasPrice = await pioneer.GetGasPriceByNetwork({ networkId });
    gasPrice = BigInt(gasPrice.data);
    console.log(tag, 'gasPrice:', gasPrice.toString());
    if (!gasPrice) throw new Error('Failed to fetch gas price');

    let nonce = await pioneer.GetNonceByNetwork({ networkId, address });
    nonce = nonce.data;
    if (nonce === undefined || nonce === null) throw new Error('Failed to fetch nonce');
    console.log(tag, 'nonce:', nonce);

    // Fetch wallet balance native gas asset
    let balance = await pioneer.GetBalanceAddressByNetwork({ networkId, address });
    balance = BigInt(balance.data * 1e18); // Convert to wei
    console.log(tag, 'balance:', balance.toString());
    if (balance <= 0n) throw new Error('Wallet balance is zero');

    // Classify asset type by CAIP
    const assetType = classifyCaipEvm(caip);
    let unsignedTx;

    if (memo === ' ') memo = '';

    // Build transaction object based on asset type
    switch (assetType) {
      case 'gas': {
        // Standard gas limit for ETH transfer
        let gasLimit = BigInt(80000);

        // Add gas cost for memo (if applicable)
        if (memo && memo !== '') {
          const memoBytes = utf8ToHex(memo).length / 2 - 1; // Subtract "0x" prefix length
          gasLimit += BigInt(memoBytes) * 68n; // 68 gas units per non-zero byte
          console.log(tag, 'Adjusted gasLimit for memo:', gasLimit.toString());
        }

        const gasFee = gasPrice * gasLimit;
        console.log(tag, 'gasFee:', gasFee.toString());

        let amountWei: bigint;
        if (isMax) {
          // Calculate maximum transferable amount
          if (balance <= gasFee) {
            throw new Error('Insufficient funds to cover gas fees');
          }
          amountWei = balance - gasFee;
        } else {
          amountWei = BigInt(Math.round(amount * 1e18)); // Use Math.round for proper conversion
          if (amountWei + gasFee > balance) {
            throw new Error('Insufficient funds for the transaction amount and gas fees');
          }
        }

        const txAmount = toHex(amountWei);
        console.log(tag, 'txAmount:', txAmount);
        console.log(tag, 'nonce:', nonce);
        console.log(tag, 'gasLimit:', gasLimit);
        console.log(tag, 'gasPrice:', gasPrice);
        unsignedTx = {
          chainId,
          nonce: toHex(nonce),
          gasLimit: toHex(gasLimit),
          gasPrice: toHex(gasPrice),
          to,
          value: txAmount,
          data: memo ? utf8ToHex(memo) : '0x',
        };
        break;
      }

      case 'erc20': {
        // Adjusted gas limit for ERC20 transfer
        const gasLimit = BigInt(80000);
        const gasFee = gasPrice * gasLimit;
        console.log(tag, 'gasFee:', gasFee.toString());

        // For ERC20 tokens, balance check should be on the token balance, but gas fees are paid in ETH
        // Assuming pioneer can provide token balance if needed

        let amountWei: bigint;
        if (isMax) {
          // For ERC20 tokens, you need to fetch the token balance
          let tokenBalance = await pioneer.GetTokenBalance({ networkId, address, caip });
          tokenBalance = BigInt(tokenBalance.data);
          console.log(tag, 'tokenBalance:', tokenBalance.toString());
          amountWei = tokenBalance;
        } else {
          amountWei = BigInt(Math.round(amount * 1e18)); // Use Math.round for proper conversion
        }
        const txAmount = toHex(amountWei);
        console.log(tag, 'txAmount:', txAmount);

        // Ensure there is enough ETH to cover gas fees
        if (balance < gasFee) {
          throw new Error('Insufficient ETH balance to cover gas fees for ERC20 transfer');
        }

        const data = encodeERC20Transfer(to, txAmount);
        unsignedTx = {
          chainId,
          nonce: toHex(nonce),
          gasLimit: toHex(gasLimit),
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

    // Allow custom paths if needed; using default for now
    unsignedTx.addressNList = [2147483692, 2147483708, 2147483648, 0, 0];

    console.log(tag, 'Unsigned Transaction:', unsignedTx);
    return unsignedTx;
  } catch (error) {
    console.error(tag, 'Error:', error.message);
    throw error;
  }
}
