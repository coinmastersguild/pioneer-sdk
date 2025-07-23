// Offline-first client for KeepKey Vault integration
// This client prioritizes cached data and enables sub-200ms startup times

const TAG = ' | offline-client | ';

export interface OfflineClientConfig {
  vaultUrl: string;
  timeout: number;
  fallbackToRemote: boolean;
}

export interface BootstrapRequest {
  device_id?: string;
  paths: string[];
  include: {
    pubkeys: boolean;
    addresses: boolean;
    balances: boolean;
    transactions: boolean;
  };
  cache_strategy: 'prefer_cache' | 'force_refresh' | 'cache_only';
}

export interface BootstrapResponse {
  device_id: string;
  response_time_ms: number;
  cache_status: {
    total_requested: number;
    cache_hits: number;
    cache_misses: number;
    missing_paths: string[];
    cache_freshness: string;
  };
  data: {
    pubkeys: Record<string, any>;
    addresses: Record<string, any>;
    balances: Record<string, any>;
  };
  background_tasks: {
    missing_data_fetch: string;
    balance_refresh: string;
    transaction_sync: string;
  };
}

export interface FastHealthResponse {
  status: string;
  device_connected: boolean;
  device_id?: string;
  cache_status: string;
  response_time_ms: number;
}

export class OfflineClient {
  private config: OfflineClientConfig;
  private isVaultAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckCacheMs: number = 5000; // 5 second cache

  constructor(config: OfflineClientConfig) {
    this.config = config;
  }

  /**
   * Fast health check with caching to avoid repeated calls
   */
  async checkVaultHealth(forceRefresh = false): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (!forceRefresh && (now - this.lastHealthCheck) < this.healthCheckCacheMs) {
      return this.isVaultAvailable;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      console.log('🔍 [OFFLINE CLIENT] Checking vault health...');
      const response = await fetch(`${this.config.vaultUrl}/api/v1/health/fast`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const health: FastHealthResponse = await response.json();
        this.isVaultAvailable = health.status === 'healthy';
        this.lastHealthCheck = now;
        
        console.log('✅ [OFFLINE CLIENT] Vault health check successful:', {
          status: health.status,
          device_connected: health.device_connected,
          response_time: health.response_time_ms + 'ms'
        });
        
        return this.isVaultAvailable;
      } else {
        console.log('❌ [OFFLINE CLIENT] Vault health check failed:', response.status);
        this.isVaultAvailable = false;
        return false;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('⚠️ [OFFLINE CLIENT] Vault not available:', error);
      this.isVaultAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Get complete wallet bootstrap data in a single call
   */
  async getWalletBootstrap(paths: string[], includeOptions = {
    pubkeys: true,
    addresses: true,
    balances: true,
    transactions: false
  }): Promise<BootstrapResponse | null> {
    
    const tag = TAG + 'getWalletBootstrap';
    console.log(`🚀 [OFFLINE CLIENT] Requesting bootstrap for ${paths.length} paths`);

    // Check if vault is available
    const isAvailable = await this.checkVaultHealth();
    if (!isAvailable) {
      console.log('⚠️ [OFFLINE CLIENT] Vault unavailable, cannot get bootstrap data');
      return null;
    }

    const request: BootstrapRequest = {
      paths,
      include: includeOptions,
      cache_strategy: 'prefer_cache'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 2); // Double timeout for bootstrap

    try {
      const startTime = performance.now();
      
      const response = await fetch(`${this.config.vaultUrl}/api/v1/wallet/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Bootstrap request failed: ${response.status} ${response.statusText}`);
      }

      const bootstrap: BootstrapResponse = await response.json();
      const totalTime = performance.now() - startTime;

      console.log('✅ [OFFLINE CLIENT] Bootstrap successful:', {
        total_paths: bootstrap.cache_status.total_requested,
        cache_hits: bootstrap.cache_status.cache_hits,
        cache_misses: bootstrap.cache_status.cache_misses,
        cache_hit_rate: Math.round((bootstrap.cache_status.cache_hits / bootstrap.cache_status.total_requested) * 100) + '%',
        vault_response_time: bootstrap.response_time_ms + 'ms',
        total_time: Math.round(totalTime) + 'ms'
      });

      return bootstrap;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ [OFFLINE CLIENT] Bootstrap failed:', error);
      return null;
    }
  }

  /**
   * Convert vault bootstrap response to pioneer-sdk format
   */
  convertBootstrapToPubkeys(bootstrap: BootstrapResponse): any[] {
    const pubkeys: any[] = [];
    
    for (const [path, pubkeyData] of Object.entries(bootstrap.data.pubkeys)) {
      const addressData = bootstrap.data.addresses[path];
      const balanceData = bootstrap.data.balances[path];
      
      // Convert to pioneer-sdk pubkey format
      const pubkey = {
        pubkey: pubkeyData.pubkey,
        address: addressData?.address || '',
        path,
        pathMaster: path, // For now, same as path
        networks: this.getNetworksForPath(path),
        coin: pubkeyData.coin,
        script_type: addressData?.script_type || 'p2pkh',
        cached: pubkeyData.cached,
        source: 'vault_cache'
      };
      
      pubkeys.push(pubkey);
    }
    
    console.log(`🔄 [OFFLINE CLIENT] Converted ${pubkeys.length} pubkeys from bootstrap`);
    return pubkeys;
  }

  /**
   * Get network identifiers for a BIP32 path
   */
  private getNetworksForPath(path: string): string[] {
    // Parse BIP44 path to determine network
    const parts = path.split('/');
    if (parts.length < 3) return ['bitcoin'];
    
    const coinType = parts[2].replace("'", "");
    
    // Map coin types to network IDs
    const coinTypeMap: Record<string, string[]> = {
      '0': ['bip122:000000000019d6689c085ae165831e93'], // Bitcoin
      '1': ['bip122:000000000019d6689c085ae165831e93'], // Bitcoin testnet
      '2': ['bip122:000000000000000082ccf8f1557c5d40'], // Litecoin
      '3': ['bip122:12a765e31ffd4059bada1e25190f6e98'], // Dogecoin
      '5': ['bip122:000000000000000000651ef99cb9fcbe'], // Dash
      '60': ['eip155:1'], // Ethereum
      '118': ['cosmos:cosmoshub-4'], // Cosmos
      '144': ['bip122:000000000000000000651ef99cb9fcbe'], // Ripple
      '145': ['bip122:000000000000000082ccf8f1557c5d40'], // Bitcoin Cash
    };
    
    return coinTypeMap[coinType] || ['bitcoin'];
  }

  /**
   * Initialize offline mode - get cached data immediately
   */
  async initOffline(paths: string[]): Promise<{ pubkeys: any[], balances: any[], cached: boolean }> {
    console.log('🚀 [OFFLINE CLIENT] Starting offline initialization...');
    const startTime = performance.now();
    
    // First, try to get bootstrap data from vault
    const bootstrap = await this.getWalletBootstrap(paths);
    
    if (bootstrap) {
      const pubkeys = this.convertBootstrapToPubkeys(bootstrap);
      const balances = this.extractBalancesFromBootstrap(bootstrap);
      
      const totalTime = performance.now() - startTime;
      console.log(`✅ [OFFLINE CLIENT] Offline init complete in ${Math.round(totalTime)}ms`);
      
      return {
        pubkeys,
        balances,
        cached: true
      };
    }
    
    // Fallback to empty data if vault unavailable
    console.log('⚠️ [OFFLINE CLIENT] No cached data available, returning empty state');
    return {
      pubkeys: [],
      balances: [],
      cached: false
    };
  }

  /**
   * Extract balance information from bootstrap response
   */
  private extractBalancesFromBootstrap(bootstrap: BootstrapResponse): any[] {
    const balances: any[] = [];
    
    for (const [path, balanceData] of Object.entries(bootstrap.data.balances)) {
      const addressData = bootstrap.data.addresses[path];
      const pubkeyData = bootstrap.data.pubkeys[path];
      
      if (balanceData && addressData) {
        const balance = {
          address: addressData.address,
          balance: balanceData.confirmed,
          unconfirmed: balanceData.unconfirmed,
          currency: balanceData.currency,
          valueUsd: balanceData.usd_value,
          networks: this.getNetworksForPath(path),
          path,
          cached: balanceData.cached,
          last_updated: balanceData.last_updated
        };
        
        balances.push(balance);
      }
    }
    
    return balances;
  }

  /**
   * Get current availability status
   */
  isAvailable(): boolean {
    return this.isVaultAvailable;
  }

  /**
   * Background sync - update cache without blocking
   */
  async backgroundSync(paths: string[]): Promise<void> {
    console.log('🔄 [OFFLINE CLIENT] Starting background sync...');
    
    try {
      // Force refresh to get latest data
      const bootstrap = await this.getWalletBootstrap(paths, {
        pubkeys: true,
        addresses: true,
        balances: true,
        transactions: true
      });
      
      if (bootstrap) {
        console.log('✅ [OFFLINE CLIENT] Background sync completed');
        // TODO: Emit events for updated data
      }
    } catch (error) {
      console.error('❌ [OFFLINE CLIENT] Background sync failed:', error);
    }
  }
} 