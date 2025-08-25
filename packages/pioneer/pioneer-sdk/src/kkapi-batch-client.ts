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
    // Check health endpoint using provided base URL
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (!healthResponse.ok) {
      return { available: false, device_connected: false, cached_pubkeys: 0 };
    }

    const healthData = await healthResponse.json();
    
    // If health endpoint includes cache info, use it directly
    if (healthData.cached_pubkeys !== undefined) {
      return {
        available: true,
        device_connected: healthData.device_connected || false,
        cached_pubkeys: healthData.cached_pubkeys || 0,
        vault_version: healthData.version
      };
    }

    // Otherwise, check cache status endpoint separately
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
    console.log('🔍 [KKAPI BATCH] Vault not available:', error.message);
    return { available: false, device_connected: false, cached_pubkeys: 0 };
  }
}

/**
 * Get multiple pubkeys in a single batch call from kkapi:// vault
 * Returns cached pubkeys and indicates which paths are missing
 */
export async function batchGetPubkeys(paths: any[], context: string, baseUrl: string = 'kkapi://'): Promise<KkapiBatchPubkeysResponse> {
  console.log('🚀 [KKAPI BATCH] Attempting batch pubkey fetch for', paths.length, 'paths');

  try {
    // Create batch request payload
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

    // Make batch request to vault using provided base URL
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
    
    console.log('✅ [KKAPI BATCH] Batch response:', {
      cached_count: batchResponse.cached_count,
      total_requested: batchResponse.total_requested,
      hit_rate: `${Math.round(batchResponse.cached_count / batchResponse.total_requested * 100)}%`
    });

    return batchResponse;

  } catch (error: any) {
    console.log('❌ [KKAPI BATCH] Batch request failed:', error.message);
    
    // Return empty response on failure
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
  const tag = '🚀 [KKAPI BATCH OPTIMIZER]';
  console.log(`${tag} Starting optimized pubkey collection for ${blockchains.length} blockchains, ${paths.length} total paths`);

  // Step 1: Smart environment detection for KKAPI base URL
  let baseUrl: string;
  if (typeof window !== 'undefined' && '__TAURI__' in window) {
    // In Tauri app - use kkapi:// protocol
    baseUrl = 'kkapi://';
    console.log(`${tag} Running in Tauri app, using kkapi:// protocol`);
  } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // In development browser - use direct HTTP
    baseUrl = 'http://localhost:1646';
    console.log(`${tag} Running in development browser, using http://localhost:1646`);
  } else {
    // Fallback
    baseUrl = 'http://localhost:1646';
    console.log(`${tag} Running in unknown environment, using fallback http://localhost:1646`);
  }

  const vaultHealth = await checkKkapiHealth(baseUrl);
  console.log(`${tag} Vault health:`, vaultHealth);

  let pubkeys: any[] = [];
  let remainingPaths: any[] = [];
  let remainingBlockchains: string[] = [];

  if (vaultHealth.available && vaultHealth.cached_pubkeys > 0) {
    console.log(`${tag} 🚀 Using FAST PATH - vault has ${vaultHealth.cached_pubkeys} cached pubkeys`);
    
    // Step 2: Try batch fetch from vault using detected base URL
    const batchStart = Date.now();
    const batchResponse = await batchGetPubkeys(paths, context, baseUrl);
    const batchTime = Date.now() - batchStart;
    
    console.log(`${tag} ⚡ Batch fetch completed in ${batchTime}ms`);
    console.log(`${tag} 📊 Cache hit rate: ${batchResponse.cached_count}/${batchResponse.total_requested} (${Math.round(batchResponse.cached_count / batchResponse.total_requested * 100)}%)`);
    
    // Add cached pubkeys to results
    pubkeys = batchResponse.pubkeys;
    
    // Step 3: Audit which paths are missing
    const cachedPaths = new Set(batchResponse.pubkeys.map(p => p.path));
    
    for (let i = 0; i < blockchains.length; i++) {
      const blockchain = blockchains[i];
      const pathsForChain = paths.filter(path => path.networks && Array.isArray(path.networks) && path.networks.includes(blockchain));
      
      for (const path of pathsForChain) {
        // Dynamic import to avoid require() in browser
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
    
    console.log(`${tag} 📋 Audit complete: ${remainingPaths.length} paths missing from cache`);
    
  } else {
    console.log(`${tag} ⚠️ Using SLOW PATH - vault not available or empty cache`);
    remainingPaths = paths;
    remainingBlockchains = blockchains;
  }

  // Step 4: Individual fallback for missing pubkeys only
  if (remainingPaths.length > 0) {
    console.log(`${tag} 🔄 Falling back to individual calls for ${remainingPaths.length} missing pubkeys`);
    
    const individualStart = Date.now();
    
    for (let i = 0; i < remainingBlockchains.length; i++) {
      const blockchain = remainingBlockchains[i];
      const pathsForChain = remainingPaths.filter(path => path.networks && Array.isArray(path.networks) && path.networks.includes(blockchain));
      
      for (const path of pathsForChain) {
        console.log(`${tag} 🔑 Individual fetch ${i+1}/${remainingBlockchains.length} - ${path.note || 'unknown path'}`);
        
        try {
          const pubkey = await getPubkeyFunction(blockchain, path, keepKeySdk, context);
          if (pubkey) {
            pubkeys.push(pubkey);
          }
                 } catch (error: any) {
           console.error(`${tag} ❌ Individual fetch failed for ${blockchain}:`, error.message);
          throw error;
        }
      }
    }
    
    const individualTime = Date.now() - individualStart;
    console.log(`${tag} ✅ Individual fallback completed in ${individualTime}ms`);
  }

  const totalCached = pubkeys.length - remainingPaths.length;
  console.log(`${tag} 🎯 Final summary: ${pubkeys.length} total pubkeys (${totalCached} cached, ${remainingPaths.length} individual)`);
  
  if (vaultHealth.available) {
    const estimatedSavings = remainingPaths.length > 0 ? 
      `~${Math.round((paths.length - remainingPaths.length) * 0.3)}s saved` : 
      `~${Math.round(paths.length * 0.3)}s saved`;
    console.log(`${tag} 💡 Performance improvement: ${estimatedSavings}`);
  }

  return pubkeys;
} 