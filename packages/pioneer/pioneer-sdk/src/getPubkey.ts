import { Chain, NetworkIdToChain } from '@coinmasters/types';
import {
  addressNListToBIP32,
  //@ts-ignore
  COIN_MAP_KEEPKEY_LONG,
  xpubConvert,
} from '@pioneer-platform/pioneer-coins';

export const getPubkey = async (networkId: string, path: any, sdk: any, context: string) => {
  const tag = `| getPubkey | `;
  try {
      // Reduced logging for performance

    if (!path || !path.addressNList) {
      throw new Error('Invalid or missing path provided for pubkey retrieval');
    }
    if (networkId.indexOf('eip155') > -1) networkId = 'eip155:*';
    let chain: Chain = NetworkIdToChain[networkId];
    console.log('🚀 [DEBUG PUBKEY] Chain determined:', chain);

    let pubkey: any = { type: path.type };
    let addressInfo = {
      address_n: path.addressNListMaster,
      //@ts-ignore
      coin: COIN_MAP_KEEPKEY_LONG[chain],
      script_type: path.script_type,
    };
    // AddressInfo prepared
    const networkIdToType: any = {
      'bip122:000000000019d6689c085ae165831e93': 'UTXO',
      'bip122:000000000000000000651ef99cb9fcbe': 'UTXO',
      'bip122:000007d91d1254d60e2dd1ae58038307': 'UTXO',
      'bip122:00000000001a91e3dace36e2be3bf030': 'UTXO',
      'bip122:12a765e31ffd4059bada1e25190f6e98': 'UTXO',
      'cosmos:mayachain-mainnet-v1': 'MAYACHAIN',
      'cosmos:osmosis-1': 'OSMOSIS',
      'cosmos:cosmoshub-4': 'COSMOS',
      'cosmos:kaiyo-1': 'COSMOS',
      'cosmos:thorchain-mainnet-v1': 'THORCHAIN',
      'eip155:1': 'EVM',
      'eip155:137': 'EVM',
      'eip155:*': 'EVM',
      'ripple:4109c6f2045fc7eff4cde8f9905d19c2': 'XRP',
      'zcash:main': 'UTXO',
    };

    const networkType = networkIdToType[networkId];
    let address;

    // Network type determined
    
          // Add timeout detection for address retrieval  
      const addressTimeout = setTimeout(() => {
        console.error('⏰ [PUBKEY] Address retrieval timeout for', networkId);
      }, 30000);

    try {
      switch (networkType) {
        case 'UTXO':
          ({ address } = await sdk.address.utxoGetAddress(addressInfo));
          break;
        case 'EVM':
          ({ address } = await sdk.address.ethereumGetAddress(addressInfo));
          break;
        case 'OSMOSIS':
          ({ address } = await sdk.address.osmosisGetAddress(addressInfo));
          break;
        case 'COSMOS':
          ({ address } = await sdk.address.cosmosGetAddress(addressInfo));
          break;
        case 'MAYACHAIN':
          ({ address } = await sdk.address.mayachainGetAddress(addressInfo));
          break;
        case 'THORCHAIN':
          ({ address } = await sdk.address.thorchainGetAddress(addressInfo));
          break;
        case 'XRP':
          ({ address } = await sdk.address.xrpGetAddress(addressInfo));
          break;
        default:
          throw new Error(`Unsupported network type for networkId: ${networkId}`);
      }
      clearTimeout(addressTimeout);
    } catch (addressError) {
      clearTimeout(addressTimeout);
      console.error('❌ [PUBKEY] Address retrieval failed:', addressError.message);
      throw addressError;
    }
    if (!address) throw new Error(`Failed to get address for ${chain}`);
    if (address.includes('bitcoincash:')) {
      address = address.replace('bitcoincash:', '');
    }
    // Address validated, setting pubkey properties
    
    pubkey.master = address;
    pubkey.address = address;
    if (['xpub', 'ypub', 'zpub'].includes(path.type)) {
      console.log('🚀 [DEBUG PUBKEY] Getting xpub for extended public key type:', path.type);

      const pathQuery = {
        symbol: 'BTC',
        coin: 'Bitcoin',
        script_type: 'p2pkh',
        address_n: path.addressNList,
        showDisplay: false,
      };
      console.log('🚀 [DEBUG PUBKEY] Calling getPublicKey with pathQuery:', JSON.stringify(pathQuery, null, 2));
      
      // Add timeout for getPublicKey call
      const xpubTimeout = setTimeout(() => {
        console.error('🚀 [DEBUG PUBKEY] ⏰ getPublicKey hanging for more than 20 seconds!');
      }, 20000);
      
      try {
        const responsePubkey = await sdk.system.info.getPublicKey(pathQuery);
        clearTimeout(xpubTimeout);
        console.log('🚀 [DEBUG PUBKEY] ✅ getPublicKey completed, xpub:', responsePubkey.xpub ? 'RECEIVED' : 'NULL');

        if (path.script_type === 'p2wpkh') {
          responsePubkey.xpub = xpubConvert(responsePubkey.xpub, 'zpub');
          console.log('🚀 [DEBUG PUBKEY] Converted to zpub format');
        } else if (path.script_type === 'p2sh-p2wpkh') {
          responsePubkey.xpub = xpubConvert(responsePubkey.xpub, 'ypub');
          console.log('🚀 [DEBUG PUBKEY] Converted to ypub format');
        }

        pubkey.pubkey = responsePubkey.xpub;
        pubkey.path = addressNListToBIP32(path.addressNList);
        pubkey.pathMaster = addressNListToBIP32(path.addressNListMaster);
      } catch (xpubError) {
        clearTimeout(xpubTimeout);
        console.error('🚀 [DEBUG PUBKEY] ❌ getPublicKey failed:', xpubError);
        throw xpubError;
      }
    } else {
      console.log('🚀 [DEBUG PUBKEY] Using address as pubkey for non-xpub type');
      pubkey.pubkey = address;
      pubkey.path = addressNListToBIP32(path.addressNList);
    }

    pubkey.scriptType = path.script_type;
    pubkey.note = path.note;
    pubkey.available_scripts_types = path.available_scripts_types;
    pubkey.context = context;
    pubkey.networks = path.networks;

    console.log('🚀 [DEBUG PUBKEY] ✅ Pubkey generation completed successfully!');
    console.log('🚀 [DEBUG PUBKEY] Final pubkey summary:', {
      path: pubkey.path,
      scriptType: pubkey.scriptType,
      networks: pubkey.networks,
      address: pubkey.address,
      pubkey_length: pubkey.pubkey ? pubkey.pubkey.length : 'NO_PUBKEY'
    });
    return pubkey;
  } catch (error) {
    console.error('🚀 [DEBUG PUBKEY] ❌ Fatal error in getPubkey:', error);
    console.error('🚀 [DEBUG PUBKEY] NetworkId:', networkId);
    console.error('🚀 [DEBUG PUBKEY] Path:', JSON.stringify(path, null, 2));
    console.error(tag, 'Error processing path:', error);
    throw error;
  }
};
