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
    console.log('🚀 [DEBUG PUBKEY] Starting getPubkey for networkId:', networkId);
    console.log('🚀 [DEBUG PUBKEY] Path details:', JSON.stringify(path, null, 2));
    console.log('🚀 [DEBUG PUBKEY] Context:', context);
    console.log('🚀 [DEBUG PUBKEY] SDK status:', sdk ? 'AVAILABLE' : 'NULL');

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
    console.log('🚀 [DEBUG PUBKEY] AddressInfo prepared:', JSON.stringify(addressInfo, null, 2));
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

    console.log('🚀 [DEBUG PUBKEY] Network type determined:', networkType, 'for networkId:', networkId);
    console.log('🚀 [DEBUG PUBKEY] About to call address retrieval method...');
    
    // Add timeout detection for address retrieval
    const addressTimeout = setTimeout(() => {
      console.error('🚀 [DEBUG PUBKEY] ⏰ Address retrieval hanging for more than 30 seconds!');
      console.error('🚀 [DEBUG PUBKEY] Network type:', networkType, 'NetworkId:', networkId);
      console.error('🚀 [DEBUG PUBKEY] This indicates a device communication issue');
    }, 30000);

    try {
      switch (networkType) {
        case 'UTXO':
          console.log('🚀 [DEBUG PUBKEY] Calling utxoGetAddress...');
          ({ address } = await sdk.address.utxoGetAddress(addressInfo));
          console.log('🚀 [DEBUG PUBKEY] ✅ utxoGetAddress completed, address:', address);
          break;
        case 'EVM':
          console.log('🚀 [DEBUG PUBKEY] Calling ethereumGetAddress...');
          ({ address } = await sdk.address.ethereumGetAddress(addressInfo));
          console.log('🚀 [DEBUG PUBKEY] ✅ ethereumGetAddress completed, address:', address);
          break;
        case 'OSMOSIS':
          console.log('🚀 [DEBUG PUBKEY] Calling osmosisGetAddress...');
          ({ address } = await sdk.address.osmosisGetAddress(addressInfo));
          console.log('🚀 [DEBUG PUBKEY] ✅ osmosisGetAddress completed, address:', address);
          break;
        case 'COSMOS':
          console.log('🚀 [DEBUG PUBKEY] Calling cosmosGetAddress...');
          ({ address } = await sdk.address.cosmosGetAddress(addressInfo));
          console.log('🚀 [DEBUG PUBKEY] ✅ cosmosGetAddress completed, address:', address);
          break;
        case 'MAYACHAIN':
          console.log('🚀 [DEBUG PUBKEY] Calling mayachainGetAddress...');
          ({ address } = await sdk.address.mayachainGetAddress(addressInfo));
          console.log('🚀 [DEBUG PUBKEY] ✅ mayachainGetAddress completed, address:', address);
          break;
        case 'THORCHAIN':
          console.log('🚀 [DEBUG PUBKEY] Calling thorchainGetAddress...');
          ({ address } = await sdk.address.thorchainGetAddress(addressInfo));
          console.log('🚀 [DEBUG PUBKEY] ✅ thorchainGetAddress completed, address:', address);
          break;
        case 'XRP':
          console.log('🚀 [DEBUG PUBKEY] Calling xrpGetAddress...');
          ({ address } = await sdk.address.xrpGetAddress(addressInfo));
          console.log('🚀 [DEBUG PUBKEY] ✅ xrpGetAddress completed, address:', address);
          break;
        default:
          throw new Error(`Unsupported network type for networkId: ${networkId}`);
      }
      clearTimeout(addressTimeout);
    } catch (addressError) {
      clearTimeout(addressTimeout);
      console.error('🚀 [DEBUG PUBKEY] ❌ Address retrieval failed:', addressError);
      throw addressError;
    }

    console.log('🚀 [DEBUG PUBKEY] Address validation...');
    if (!address) throw new Error(`Failed to get address for ${chain}`);
    if (address.includes('bitcoincash:')) {
      address = address.replace('bitcoincash:', '');
    }
    console.log('🚀 [DEBUG PUBKEY] Address validated, setting pubkey properties...');
    
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
      address: pubkey.address?.substring(0, 10) + '...',
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
