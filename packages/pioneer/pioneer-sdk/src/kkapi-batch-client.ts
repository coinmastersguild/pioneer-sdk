/**
 * KKAPI Batch Client for Pioneer SDK
 * 
 * Provides batch operations for kkapi:// protocol to optimize performance:
 * 1. Single batch call to get ALL cached pubkeys
 * 2. Audit which ones are missing
 * 3. Individual fallback only for missing pubkeys
 */

export interface KkapiPubkey {
  pubkey: string;
  address: string;
  path: string;
  pathMaster: string;
  scriptType: string;
  networks: string[];
  type: string;
  note?: string;
  available_scripts_types?: string[];
  context?: string;
}

export interface KkapiBatchPubkeysResponse {
  pubkeys: KkapiPubkey[];
  cached_count: number;
  total_requested: number;
  device_id?: string;
}

export interface KkapiHealthStatus {
  available: boolean;
  device_connected: boolean;
  cached_pubkeys: number;
  vault_version?: string;
}

/**
 * Check if kkapi:// vault is available and ready
 */
export async function checkKkapiHealth(baseUrl: string = 'kkapi://'): Promise<KkapiHealthStatus> {
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (!healthResponse.ok) {
      return { available: false, device_connected: false, cached_pubkeys: 0 };
    }

    const healthData = await healthResponse.json();
    if (healthData.cached_pubkeys !== undefined) {
      return {
        available: true,
        device_connected: healthData.device_connected || false,
        cached_pubkeys: healthData.cached_pubkeys || 0,
        vault_version: healthData.version
      };
    }

    const cacheResponse = await fetch(`${baseUrl}/api/cache/status`);
    if (!cacheResponse.ok) {
      return { available: true, device_connected: true, cached_pubkeys: 0 };
    }

    const cacheData = await cacheResponse.json();
    return {
      available: true,
      device_connected: true,
      cached_pubkeys: cacheData.cached_pubkeys || 0,
      vault_version: cacheData.vault_version
    };
  } catch (error: any) {
    return { available: false, device_connected: false, cached_pubkeys: 0 };
  }
}

/**
 * Get multiple pubkeys in a single batch call from kkapi:// vault
 * Returns cached pubkeys and indicates which paths are missing
 */
export async function batchGetPubkeys(paths: any[], context: string, baseUrl: string = 'kkapi://'): Promise<KkapiBatchPubkeysResponse> {
  try {
    const batchRequest = {
      paths: paths.map(path => ({
        address_n: path.addressNList,
        script_type: path.script_type,
        networks: path.networks,
        type: path.type,
        note: path.note
      })),
      context: context
    };
    const response = await fetch(`${baseUrl}/api/pubkeys/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchRequest)
    });

    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.status}`);
    }

    const batchResponse: KkapiBatchPubkeysResponse = await response.json();
    
    return batchResponse;

  } catch (error: any) {
    return {
      pubkeys: [],
      cached_count: 0,
      total_requested: paths.length
    };
  }
}

/**
 * Optimized getPubkeys that uses batch fetching with individual fallback
 * 
 * Strategy:
 * 1. Try batch fetch from kkapi:// vault first (fast)
 * 2. Audit which pubkeys are missing 
 * 3. Individual keepkey-sdk calls only for missing ones
 */
export async function optimizedGetPubkeys(
  blockchains: string[], 
  paths: any[], 
  keepKeySdk: any, 
  context: string,
  getPubkeyFunction: (networkId: string, path: any, sdk: any, context: string) => Promise<any>
): Promise<any[]> {
  let baseUrl: string;
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    baseUrl = 'kkapi://';
  } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    baseUrl = 'http://localhost:1646';
  } else {
    baseUrl = 'http://localhost:1646';
  }

  const vaultHealth = await checkKkapiHealth(baseUrl);

  let pubkeys: any[] = [];
  let remainingPaths: any[] = [];
  let remainingBlockchains: string[] = [];

  if (vaultHealth.available && vaultHealth.cached_pubkeys > 0) {
    const batchResponse = await batchGetPubkeys(paths, context, baseUrl);
    pubkeys = batchResponse.pubkeys;
    const cachedPaths = new Set(batchResponse.pubkeys.map(p => p.path));
    
    for (let i = 0; i < blockchains.length; i++) {
      const blockchain = blockchains[i];
      const pathsForChain = paths.filter(path => path.networks && Array.isArray(path.networks) && path.networks.includes(blockchain));
      
      for (const path of pathsForChain) {
        const { addressNListToBIP32 } = await import('@pioneer-platform/pioneer-coins');
        const pathBip32 = addressNListToBIP32(path.addressNList);
        
        if (!cachedPaths.has(pathBip32)) {
          remainingPaths.push(path);
          if (!remainingBlockchains.includes(blockchain)) {
            remainingBlockchains.push(blockchain);
          }
        }
      }
    }
  } else {
    remainingPaths = paths;
    remainingBlockchains = blockchains;
  }

  if (remainingPaths.length > 0) {
    
    for (let i = 0; i < remainingBlockchains.length; i++) {
      const blockchain = remainingBlockchains[i];
      const pathsForChain = remainingPaths.filter(path => path.networks && Array.isArray(path.networks) && path.networks.includes(blockchain));
      
      for (const path of pathsForChain) {
        try {
          const pubkey = await getPubkeyFunction(blockchain, path, keepKeySdk, context);
          if (pubkey) {
            pubkeys.push(pubkey);
          }
        } catch (error: any) {
          throw error;
        }
      }
    }
  }

  return pubkeys;
} 