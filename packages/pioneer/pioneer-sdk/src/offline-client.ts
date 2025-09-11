// Offline-first client for KeepKey Vault integration

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
   * Fast health check with caching
   */
  async checkVaultHealth(forceRefresh = false): Promise<boolean> {
    const now = Date.now();
    
    if (!forceRefresh && (now - this.lastHealthCheck) < this.healthCheckCacheMs) {
      return this.isVaultAvailable;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
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
        
        return this.isVaultAvailable;
      } else {
        this.isVaultAvailable = false;
        return false;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      this.isVaultAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Get complete wallet bootstrap data
   */
  async getWalletBootstrap(paths: string[], includeOptions = {
    pubkeys: true,
    addresses: true,
    balances: true,
    transactions: false
  }): Promise<BootstrapResponse | null> {
    const isAvailable = await this.checkVaultHealth();
    if (!isAvailable) {
      return null;
    }

    const request: BootstrapRequest = {
      paths,
      include: includeOptions,
      cache_strategy: 'prefer_cache'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 2);

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

      return bootstrap;
    } catch (error) {
      clearTimeout(timeoutId);
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
    
    return pubkeys;
  }

  /**
   * Get network identifiers for a BIP32 path
   */
  private getNetworksForPath(path: string): string[] {
    const parts = path.split('/');
    if (parts.length < 3) return ['bitcoin'];
    
    const coinType = parts[2].replace("'", "");
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
   * Initialize offline mode
   */
  async initOffline(paths: string[]): Promise<{ pubkeys: any[], balances: any[], cached: boolean }> {
    const startTime = performance.now();
    const bootstrap = await this.getWalletBootstrap(paths);
    
    if (bootstrap) {
      const pubkeys = this.convertBootstrapToPubkeys(bootstrap);
      const balances = this.extractBalancesFromBootstrap(bootstrap);
      
      return {
        pubkeys,
        balances,
        cached: true
      };
    }
    
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
   * Background sync
   */
  async backgroundSync(paths: string[]): Promise<void> {
    try {
      const bootstrap = await this.getWalletBootstrap(paths, {
        pubkeys: true,
        addresses: true,
        balances: true,
        transactions: true
      });
      
      if (bootstrap) {
        // TODO: Emit events for updated data
      }
    } catch (error) {
      // Silent error handling
    }
  }
} 