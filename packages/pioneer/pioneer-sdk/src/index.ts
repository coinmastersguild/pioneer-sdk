import { KeepKeySdk } from '@keepkey/keepkey-sdk';
import { caipToNetworkId, networkIdToCaip } from '@pioneer-platform/pioneer-caip';
import Pioneer from '@pioneer-platform/pioneer-client';
import { addressNListToBIP32, getPaths } from '@pioneer-platform/pioneer-coins';
import { assetData } from '@pioneer-platform/pioneer-discovery';
import { Events } from '@pioneer-platform/pioneer-events';
import EventEmitter from 'events';

import { getCharts } from './charts/index.js';
//internal
import { getPubkey } from './getPubkey.js';
import { optimizedGetPubkeys } from './kkapi-batch-client.js';
import { OfflineClient } from './offline-client.js';
import { TransactionManager } from './TransactionManager.js';
import { createUnsignedTendermintTx } from './txbuilder/createUnsignedTendermintTx.js';
import { createUnsignedStakingTx, type StakingTxParams } from './txbuilder/createUnsignedStakingTx.js';
import { getFees, estimateTransactionFee, type NormalizedFeeRates, type FeeEstimate } from './fees/index.js';

const TAG = ' | Pioneer-sdk | ';

// Utility function to detect if kkapi is available with smart environment detection
async function detectKkApiAvailability(forceLocalhost?: boolean): Promise<{
  isAvailable: boolean;
  baseUrl: string;
  basePath: string;
}> {
  const tag = `${TAG} | detectKkApiAvailability | `;

  try {
    // Smart detection: Check environment (Tauri, browser, or Node.js)
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    const isBrowser = typeof window !== 'undefined';
    const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
    const isLocalhost = isBrowser && window.location.hostname === 'localhost';

    // If in Tauri, use kkapi:// (will be proxied by Tauri)
    if (isTauri) {
      return {
        isAvailable: true,
        baseUrl: 'kkapi://',
        basePath: 'kkapi://spec/swagger.json',
      };
    }

    // In Node.js test environment or localhost browser, test if localhost:1646 is available
    // Force localhost if flag is set
    const shouldTestLocalhost = forceLocalhost || isLocalhost || isNodeJS;

    if (shouldTestLocalhost) {
      const testEnv = isNodeJS ? 'Node.js test environment' : 'development browser';
      try {
        const httpResponse = await fetch('http://localhost:1646/api/v1/health', {
          method: 'GET',
          signal: AbortSignal.timeout(1000), // 1 second timeout for localhost
        });

        if (httpResponse.ok) {
          return {
            isAvailable: true,
            baseUrl: 'http://localhost:1646',
            basePath: 'http://localhost:1646/spec/swagger.json',
          };
        }
      } catch (httpError: any) {
        console.error('❌ [KKAPI DETECTION] HTTP localhost:1646 not available:', httpError.message);
      }
    }

    // Fallback for production non-Tauri or when vault server is not running
    console.warn('⚠️ [KKAPI DETECTION] Using fallback config (vault may not be available)');
    return {
      isAvailable: false,
      baseUrl: 'http://localhost:1646',
      basePath: 'http://localhost:1646/spec/swagger.json',
    };
  } catch (error) {
    console.error('❌ [KKAPI DETECTION] Error during detection:', error);
    return {
      isAvailable: false,
      baseUrl: 'http://localhost:1646',
      basePath: 'http://localhost:1646/spec/swagger.json',
    };
  }
}

export interface PioneerSDKConfig {
  appName: string;
  appIcon: string;
  blockchains: any;
  nodes?: any;
  username: string;
  queryKey: string;
  spec: string;
  wss: string;
  paths: any;
  pubkeys?: any;
  balances?: any;
  keepkeyApiKey?: string;
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  utxoApiKey?: string;
  walletConnectProjectId?: string;
  offlineFirst?: boolean;
  vaultUrl?: string;
  forceLocalhost?: boolean;
}

// Helper function to format time differences
function formatTime(durationMs) {
  let seconds = Math.floor((durationMs / 1000) % 60);
  let minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  let hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);

  let formatted = '';
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0 || hours > 0) formatted += `${minutes}m `;
  formatted += `${seconds}s`;
  return formatted.trim();
}

export class SDK {
  public status: string;
  public username: string;
  public queryKey: string;
  public wss: string;
  public spec: any;
  public ethplorerApiKey: string | undefined;
  public covalentApiKey: string | undefined;
  public utxoApiKey: string | undefined;
  public walletConnectProjectId: string | undefined;
  public contextType: string;
  public context: string;
  public assetContext: any;
  public blockchainContext: any;
  public pubkeyContext: any;
  public outboundAssetContext: any;
  public outboundBlockchainContext: any;
  public outboundPubkeyContext: any;
  public buildDashboardFromBalances: any;
  // public swapKit: any | null;
  public pioneer: any;
  public charts: any[];
  public paths: any[];
  public pubkeys: {
    networks: string[];
    pubkey: string;
    pathMaster: string;
    address?: string;
    master?: string;
  }[] = [];
  private pubkeySet: Set<string> = new Set(); // Track unique pubkey identifiers
  public wallets: any[];
  public balances: any[];
  public nodes: any[];
  public assets: any[];
  public assetsMap: any;
  public dashboard: any;
  public nfts: any[];
  public events: any;
  public pairWallet: (options: any) => Promise<any>;
  public setContext: (context: string) => Promise<{ success: boolean }>;
  public setContextType: (contextType: string) => Promise<{ success: boolean }>;
  public refresh: () => Promise<any>;
  public setAssetContext: (asset?: any) => Promise<any>;
  public setOutboundAssetContext: (asset?: any) => Promise<any>;
  public keepkeyApiKey: string | undefined;
  public isPioneer: string | null;
  public keepkeyEndpoint: { isAvailable: boolean; baseUrl: string; basePath: string } | null;
  public forceLocalhost: boolean;
  // public loadPubkeyCache: (pubkeys: any) => Promise<void>;
  public getPubkeys: (wallets?: string[]) => Promise<any[]>;
  public getBalances: (filter?: any) => Promise<any[]>;
  public blockchains: any[];
  public clearWalletState: () => Promise<boolean>;
  public setBlockchains: (blockchains: any) => Promise<void>;
  public appName: string;
  public appIcon: any;
  public init: (walletsVerbose: any, setup: any) => Promise<any>;
  // public initOffline: () => Promise<any>;
  // public backgroundSync: () => Promise<void>;
  public getUnifiedPortfolio: () => Promise<any>;
  public offlineClient: OfflineClient | null;
  // public verifyWallet: () => Promise<void>;
  public convertVaultPubkeysToPioneerFormat: (vaultPubkeys: any[]) => any[];
  // public deriveNetworksFromPath: (path: string) => string[];
  // public getAddress: (options: {
  //   networkId?: string;
  //   showDevice?: boolean;
  //   path?: any;
  // }) => Promise<string>;
  public app: {
    getAddress: (options: {
      networkId?: string;
      showDevice?: boolean;
      path?: any;
    }) => Promise<string>;
  };
  public addAsset: (caip: string, data?: any) => Promise<any>;
  public getAssets: (filter?: string) => Promise<any>;
  public getBalance: (networkId: string) => Promise<any>;
  public getFees: (networkId: string) => Promise<NormalizedFeeRates>;
  public estimateTransactionFee: (feeRate: string, unit: string, networkType: string, txSize?: number) => FeeEstimate;
  public getCharts: () => Promise<any>;
  public keepKeySdk: any;
  private getGasAssets: () => Promise<any>;
  private transactions: any;
  private transfer: (sendPayload: any) => Promise<any>;
  private sync: () => Promise<boolean>;
  private swap: (swapPayload: any, waitOnConfirm?: boolean) => Promise<any>;
  public followTransaction: (
    caip: string,
    txid: string,
  ) => Promise<{
    detectedTime: string | null;
    requiredConfirmations: any;
    timeFromDetectionToConfirm: string | null;
    txid: string;
    confirmTime: string | null;
    caip: string;
    broadcastTime: string;
    timeToDetect: string | null;
    timeToConfirm: string | null;
  }>;
  public broadcastTx: (caip: string, signedTx: any) => Promise<any>;
  public signTx: (unsignedTx: any) => Promise<any>;
  public buildTx: (sendPayload: any) => Promise<any>;
  public buildDelegateTx: (caip: string, params: StakingTxParams) => Promise<any>;
  public buildUndelegateTx: (caip: string, params: StakingTxParams) => Promise<any>;
  public buildClaimRewardsTx: (caip: string, params: StakingTxParams) => Promise<any>;
  public buildClaimAllRewardsTx: (caip: string, params: StakingTxParams) => Promise<any>;
  public estimateMax: (sendPayload: any) => Promise<void>;
  public syncMarket: () => Promise<boolean>;
  public getBalancesForNetworks: (networkIds: string[]) => Promise<any[]>;
  // private search: (query: string, config: any) => Promise<void>;
  // public networkPercentages: { networkId: string; percentage: string | number }[] = [];
  // public assetQuery: { caip: string; pubkey: string }[] = [];
  public setPubkeyContext: (pubkey?: any) => Promise<boolean>;
  private getPubkeyKey: (pubkey: any) => string;
  private deduplicatePubkeys: (pubkeys: any[]) => any[];
  private addPubkey: (pubkey: any) => boolean;
  private setPubkeys: (newPubkeys: any[]) => void;
  constructor(spec: string, config: PioneerSDKConfig) {
    this.status = 'preInit';
    this.appName = config.appName || 'unknown app';
    this.appIcon = config.appIcon || 'https://pioneers.dev/coins/keepkey.png';
    this.spec = spec || config.spec || 'https://pioneers.dev/spec/swagger';
    this.wss = config.wss || 'wss://pioneers.dev';
    this.assets = assetData;
    this.assetsMap = new Map();
    this.username = config.username;
    this.queryKey = config.queryKey;
    this.keepkeyApiKey = config.keepkeyApiKey;
    this.keepkeyEndpoint = null;
    this.forceLocalhost = config.forceLocalhost || false;
    this.paths = config.paths || [];

    // Deduplicate blockchains to prevent duplicate dashboard calculations
    this.blockchains = config.blockchains ? [...new Set(config.blockchains)] : [];
    if (config.blockchains && config.blockchains.length !== this.blockchains.length) {
    }

    // Initialize pubkeys with deduplication if provided in config
    if (config.pubkeys && config.pubkeys.length > 0) {
      this.setPubkeys(config.pubkeys);
    } else {
      this.pubkeys = [];
      this.pubkeySet.clear();
    }

    this.balances = config.balances || [];
    this.nodes = config.nodes || [];
    this.charts = ['covalent', 'zapper'];
    this.nfts = [];
    this.isPioneer = null;
    this.pioneer = null;
    this.context = '';
    this.pubkeyContext = null;
    this.assetContext = null;
    this.blockchainContext = null;
    this.outboundAssetContext = null;
    this.outboundBlockchainContext = null;
    this.outboundPubkeyContext = null;
    this.wallets = [];
    this.events = new EventEmitter();
    this.transactions = null;
    this.ethplorerApiKey = config.ethplorerApiKey;
    this.covalentApiKey = config.covalentApiKey;
    this.utxoApiKey = config.utxoApiKey;
    this.walletConnectProjectId = config.walletConnectProjectId;
    this.contextType = '';

    // Initialize offline client if offline-first mode is enabled
    this.offlineClient = config.offlineFirst
      ? new OfflineClient({
          vaultUrl: config.vaultUrl || 'kkapi://',
          timeout: 1000, // 1 second timeout for fast checks
          fallbackToRemote: true,
        })
      : null;

    this.pairWallet = async (options: any) => {
      // Implementation will be added later
      return Promise.resolve({});
    };

    // Helper method to generate unique key for a pubkey
    this.getPubkeyKey = (pubkey: any): string => {
      return `${pubkey.pubkey}_${pubkey.pathMaster}`;
    };

    // Helper method to deduplicate pubkeys array
    this.deduplicatePubkeys = (pubkeys: any[]): any[] => {
      const seen = new Set<string>();
      const deduped = pubkeys.filter((pubkey) => {
        const key = this.getPubkeyKey(pubkey);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      return deduped;
    };

    // Helper method to validate and add a single pubkey
    this.addPubkey = (pubkey: any): boolean => {
      // Validate pubkey has required fields
      if (!pubkey.pubkey || !pubkey.pathMaster) {
        return false;
      }

      const key = this.getPubkeyKey(pubkey);

      // Check if already exists
      if (this.pubkeySet.has(key)) {
        return false;
      }

      // Add to both array and set
      this.pubkeys.push(pubkey);
      this.pubkeySet.add(key);
      return true;
    };

    // Helper method to set pubkeys array with deduplication
    this.setPubkeys = (newPubkeys: any[]): void => {
      const tag = `${TAG} | setPubkeys | `;

      // Clear existing
      this.pubkeys = [];
      this.pubkeySet.clear();

      // Add each pubkey with validation
      let added = 0;
      for (const pubkey of newPubkeys) {
        if (this.addPubkey(pubkey)) {
          added++;
        }
      }
    };

    // Fast portfolio loading from kkapi:// cache
    this.getUnifiedPortfolio = async function () {
      const tag = `${TAG} | getUnifiedPortfolio | `;
      try {
        const startTime = performance.now();

        // Check if kkapi is available and use the detected endpoint
        try {
          // Use the detected endpoint instead of hardcoded kkapi://
          const baseUrl = this.keepkeyEndpoint?.baseUrl || 'kkapi://';
          const portfolioUrl = `${baseUrl}/api/portfolio`;

          const portfolioResponse = await fetch(portfolioUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(2000), // 2 second timeout
          });

          if (!portfolioResponse.ok) {
            console.warn(tag, 'Portfolio endpoint returned', portfolioResponse.status);
            return null;
          }

          const portfolioData = await portfolioResponse.json();
          const loadTime = performance.now() - startTime;

          if (!portfolioData.success) {
            console.warn(tag, 'Portfolio API returned success=false');
            return null;
          }

          if (portfolioData.totalValueUsd === 0 || !portfolioData.totalValueUsd) {
            console.warn(tag, 'Portfolio value is $0.00 - may need device connection or sync');
            return null;
          }

          // Get device-specific balances if we have devices
          let allBalances = [];
          if (portfolioData.balances) allBalances = portfolioData.balances;

          // Update SDK state if we have balances
          if (allBalances.length > 0) {
            this.balances = allBalances;
            this.events.emit('SET_BALANCES', this.balances);
          }

          // Update pubkeys from cache
          if (portfolioData.pubkeys && portfolioData.pubkeys.length > 0) {
            // Convert vault pubkey format to pioneer-sdk format
            const convertedPubkeys = this.convertVaultPubkeysToPioneerFormat(portfolioData.pubkeys);
            // Use setPubkeys to ensure deduplication
            this.setPubkeys(convertedPubkeys);
            this.events.emit('SET_PUBKEYS', this.pubkeys);
          }

          // Update wallets from devices
          if (portfolioData.devices && portfolioData.devices.length > 0) {
            this.wallets = portfolioData.devices.map((device: any) => ({
              type: 'keepkey',
              deviceId: device.deviceId,
              label: device.label || `KeepKey ${device.shortId}`,
              shortId: device.shortId,
              totalValueUsd: device.totalValueUsd || 0,
            }));
            this.events.emit('SET_WALLETS', this.wallets);
          }

          // Validate cache data before using it
          const isCacheDataValid = (portfolioData: any): boolean => {
            // Check if networks data is reasonable (should be < 50 networks, not thousands)
            if (!portfolioData.networks || !Array.isArray(portfolioData.networks)) {
              console.warn('[CACHE VALIDATION] Networks is not an array');
              return false;
            }

            if (portfolioData.networks.length > 50) {
              console.error(
                `[CACHE VALIDATION] CORRUPTED: ${portfolioData.networks.length} networks (should be < 50)`,
              );
              return false;
            }

            // Check if at least some networks have required fields
            const validNetworks = portfolioData.networks.filter(
              (n: any) => n.networkId && n.totalValueUsd !== undefined && n.gasAssetSymbol,
            );

            if (validNetworks.length === 0 && portfolioData.networks.length > 0) {
              console.error('[CACHE VALIDATION] CORRUPTED: No networks have required fields');
              return false;
            }

            console.log(
              `[CACHE VALIDATION] Found ${portfolioData.networks.length} networks, ${validNetworks.length} valid`,
            );
            return true;
          };

          // Only use cache data if it's valid
          if (isCacheDataValid(portfolioData)) {
            const dashboardData = {
              totalValueUsd: portfolioData.totalValueUsd,
              pairedDevices: portfolioData.pairedDevices,
              devices: portfolioData.devices || [],
              networks: portfolioData.networks || [],
              assets: portfolioData.assets || [],
              statistics: portfolioData.statistics || {},
              cached: portfolioData.cached,
              lastUpdated: portfolioData.lastUpdated,
              cacheAge: portfolioData.lastUpdated
                ? Math.floor((Date.now() - portfolioData.lastUpdated) / 1000)
                : 0,
              networkPercentages:
                portfolioData.networks?.map((network: any) => ({
                  networkId: network.network_id || network.networkId,
                  percentage: network.percentage || 0,
                })) || [],
            };

            this.dashboard = dashboardData;
            this.events.emit('SET_DASHBOARD', this.dashboard);
          } else {
            console.warn(
              '[CACHE VALIDATION] ❌ Cache data corrupted, building dashboard from cached balances',
            );
            // Build dashboard from cached balances without hitting Pioneer APIs
            const dashboardData = this.buildDashboardFromBalances();
            this.dashboard = dashboardData;
            this.events.emit('SET_DASHBOARD', this.dashboard);
          }

          return {
            balances: allBalances,
            dashboard: this.dashboard, // Use the dashboard that was set (or undefined if cache was invalid)
            cached: portfolioData.cached,
            loadTimeMs: loadTime,
            totalValueUsd: portfolioData.totalValueUsd,
          };
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            console.log(
              tag,
              'Unified portfolio request timed out (this is normal if vault not running)',
            );
          } else {
            console.log(tag, 'Failed to fetch unified portfolio:', fetchError.message);
          }
          return null;
        }
      } catch (e) {
        console.error(tag, 'Error:', e);
        return null;
      }
    };

    this.init = async function (walletsVerbose: any, setup: any) {
      const tag = `${TAG} | init | `;
      try {
        if (!this.username) throw Error('username required!');
        if (!this.queryKey) throw Error('queryKey required!');
        if (!this.wss) throw Error('wss required!');
        if (!this.wallets) throw Error('wallets required!');
        if (!this.paths) throw Error('wallets required!');
        const initStartTime = performance.now();

        // Option to skip sync (for apps that will manually call getPubkeys/getBalances)
        const skipSync = setup?.skipSync || false;

        // Initialize Pioneer Client

        // CRITICAL FIX: Ensure Pioneer client has proper HTTP headers for browser requests
        const pioneerConfig = {
          ...config,
        };

        const PioneerClient = new Pioneer(this.spec, pioneerConfig);
        this.pioneer = await PioneerClient.init();
        if (!this.pioneer) throw Error('Failed to init pioneer server!');

        // Add paths for blockchains
        this.paths.concat(getPaths(this.blockchains));

        // Get gas assets (needed for asset map)
        await this.getGasAssets();

        // Detect KeepKey endpoint
        this.keepkeyEndpoint = await detectKkApiAvailability(this.forceLocalhost);
        const keepkeyEndpoint = this.keepkeyEndpoint;

        // Initialize KeepKey SDK if available
        try {
          const configKeepKey = {
            apiKey: this.keepkeyApiKey || 'keepkey-api-key',
            pairingInfo: {
              name: 'KeepKey SDK Demo App',
              imageUrl: 'https://pioneers.dev/coins/keepkey.png',
              basePath: keepkeyEndpoint.basePath,
              url: keepkeyEndpoint.baseUrl,
            },
          };

          console.log('🔑 [INIT] Initializing KeepKey SDK...');
          const keepKeySdk = await KeepKeySdk.create(configKeepKey);
          const features = await keepKeySdk.system.info.getFeatures();

          this.keepkeyApiKey = configKeepKey.apiKey;
          this.keepKeySdk = keepKeySdk;
          this.context = 'keepkey:' + features.label + '.json';
        } catch (e) {
          console.error('⚠️ [INIT] KeepKey SDK initialization failed:', e);
        }

        // Initialize WebSocket events
        let configWss = {
          username: this.username,
          queryKey: this.queryKey,
          wss: this.wss,
        };

        let clientEvents = new Events(configWss);
        await clientEvents.init();
        await clientEvents.setUsername(this.username);

        clientEvents.events.on('message', (request) => {
          this.events.emit('message', request);
        });

        this.events.emit('SET_STATUS', 'init');

        // Fast Portfolio Pattern: Try unified portfolio first, then sync if needed
        if (this.keepKeySdk && !skipSync) {
          console.log('⚡ [FAST PORTFOLIO] Attempting fast load...');
          const fastStart = performance.now();

          try {
            const unifiedResult = await this.getUnifiedPortfolio();
            console.log('unifiedResult: ', unifiedResult);

            if (unifiedResult && unifiedResult.cached && unifiedResult.totalValueUsd > 0) {
              console.log(
                `✅ [FAST PORTFOLIO] Loaded in ${(performance.now() - fastStart).toFixed(0)}ms`,
              );
              console.log(
                `💰 [PORTFOLIO] $${unifiedResult.totalValueUsd.toFixed(2)} USD (${
                  unifiedResult.balances.length
                } assets)`,
              );

              // Skip background sync when cache is valid - we already have the data!
              console.log('✅ [FAST PORTFOLIO] Cache valid - skipping sync');
              this.events.emit('SYNC_COMPLETE');
            } else {
              console.log('⚠️ [FAST PORTFOLIO] Unavailable, using full sync...');
              throw Error('Failing fast TEST');
              const syncStart = performance.now();
              // await this.sync();
              // console.log(
              //   '✅ [SYNC] Full sync completed in',
              //   (performance.now() - syncStart).toFixed(0),
              //   'ms',
              // );
            }
          } catch (fastError) {
            console.warn('⚠️ [FAST PORTFOLIO] Failed, using full sync');
            const syncStart = performance.now();
            await this.sync();
            console.log(
              '✅ [SYNC] Full sync completed in',
              (performance.now() - syncStart).toFixed(0),
              'ms',
            );
          }
        } else if (skipSync) {
          console.log('⏭️ [INIT] Skipping sync (skipSync=true)');
        }

        return this.pioneer;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    // Build dashboard from cached balances (no Pioneer API calls)
    this.buildDashboardFromBalances = function () {
      const tag = `${TAG} | buildDashboardFromBalances | `;
      console.log(tag, '[DASHBOARD] Building dashboard from cached balances...');

      const dashboardData: {
        networks: {
          networkId: string;
          totalValueUsd: number;
          gasAssetCaip: string | null;
          gasAssetSymbol: string | null;
          icon: string | null;
          color: string | null;
          totalNativeBalance: string;
        }[];
        totalValueUsd: number;
        networkPercentages: { networkId: string; percentage: number }[];
      } = {
        networks: [],
        totalValueUsd: 0,
        networkPercentages: [],
      };

      let totalPortfolioValue = 0;
      const networksTemp: {
        networkId: string;
        totalValueUsd: number;
        gasAssetCaip: string | null;
        gasAssetSymbol: string | null;
        icon: string | null;
        color: string | null;
        totalNativeBalance: string;
      }[] = [];

      console.log(tag, 'this.balances: ', this.balances);

      // Calculate totals for each blockchain
      for (const blockchain of this.blockchains) {
        const filteredBalances = this.balances.filter((b) => {
          const networkId = caipToNetworkId(b.caip);
          return (
            networkId === blockchain ||
            (blockchain === 'eip155:*' && networkId.startsWith('eip155:'))
          );
        });

        // Deduplicate balances based on caip + pubkey combination
        const balanceMap = new Map();

        // Special handling for Bitcoin to work around API bug
        const isBitcoin = blockchain.includes('bip122:000000000019d6689c085ae165831e93');
        if (isBitcoin) {
          console.log(tag, 'Bitcoin network detected - checking for duplicate balances');
          // Group Bitcoin balances by value to detect duplicates
          const bitcoinByValue = new Map();
          filteredBalances.forEach((balance) => {
            const valueKey = `${balance.balance}_${balance.valueUsd}`;
            if (!bitcoinByValue.has(valueKey)) {
              bitcoinByValue.set(valueKey, []);
            }
            bitcoinByValue.get(valueKey).push(balance);
          });

          // Check if all three address types have the same non-zero balance (API bug)
          for (const [valueKey, balances] of bitcoinByValue.entries()) {
            if (balances.length === 3 && parseFloat(balances[0].valueUsd || '0') > 0) {
              console.log(
                tag,
                'BITCOIN API BUG DETECTED: All 3 address types have same balance, keeping only xpub',
              );
              // Keep only the xpub (or first one if no xpub)
              const xpubBalance = balances.find((b) => b.pubkey?.startsWith('xpub')) || balances[0];
              const key = `${xpubBalance.caip}_${xpubBalance.pubkey || 'default'}`;
              balanceMap.set(key, xpubBalance);
            } else {
              // Add all balances normally
              balances.forEach((balance) => {
                const key = `${balance.caip}_${balance.pubkey || 'default'}`;
                balanceMap.set(key, balance);
              });
            }
          }
        } else {
          // Standard deduplication for non-Bitcoin networks
          filteredBalances.forEach((balance) => {
            const key = `${balance.caip}_${balance.pubkey || 'default'}`;
            // Only keep the first occurrence or the one with higher value
            if (
              !balanceMap.has(key) ||
              parseFloat(balance.valueUsd || '0') > parseFloat(balanceMap.get(key).valueUsd || '0')
            ) {
              balanceMap.set(key, balance);
            }
          });
        }

        const networkBalances = Array.from(balanceMap.values());

        // Ensure we're working with numbers for calculations
        const networkTotal = networkBalances.reduce((sum, balance, idx) => {
          const valueUsd =
            typeof balance.valueUsd === 'string'
              ? parseFloat(balance.valueUsd)
              : balance.valueUsd || 0;

          if (blockchain.includes('bip122:000000000019d6689c085ae165831e93')) {
            console.log(
              tag,
              `[BITCOIN DEBUG ${idx}] pubkey:`,
              balance.pubkey?.substring(0, 10) + '...',
              '| balance:',
              balance.balance,
              '| valueUsd:',
              balance.valueUsd,
              '→ parsed:',
              valueUsd,
              '| running sum:',
              sum + valueUsd,
            );
          }

          return sum + valueUsd;
        }, 0);

        // Get native asset for this blockchain
        const nativeAssetCaip = networkIdToCaip(blockchain);
        const gasAsset = networkBalances.find((b) => b.caip === nativeAssetCaip);

        // Calculate total native balance (sum of all balances for the native asset)
        const totalNativeBalance = networkBalances
          .filter((b) => b.caip === nativeAssetCaip)
          .reduce((sum, balance) => {
            const balanceNum =
              typeof balance.balance === 'string'
                ? parseFloat(balance.balance)
                : balance.balance || 0;
            return sum + balanceNum;
          }, 0)
          .toString();

        // Get colors from assetMap since balances don't have them
        const assetInfo = nativeAssetCaip ? this.assetsMap.get(nativeAssetCaip) : null;

        networksTemp.push({
          networkId: blockchain,
          totalValueUsd: networkTotal,
          gasAssetCaip: nativeAssetCaip || null,
          gasAssetSymbol: gasAsset?.ticker || gasAsset?.symbol || assetInfo?.symbol || null,
          icon: gasAsset?.icon || assetInfo?.icon || null,
          color: gasAsset?.color || assetInfo?.color || null,
          totalNativeBalance,
        });

        totalPortfolioValue += networkTotal;
      }

      // Sort networks by USD value and assign to dashboard
      dashboardData.networks = networksTemp.sort((a, b) => b.totalValueUsd - a.totalValueUsd);
      dashboardData.totalValueUsd = totalPortfolioValue;

      // Calculate network percentages for pie chart
      dashboardData.networkPercentages = dashboardData.networks
        .map((network) => ({
          networkId: network.networkId,
          percentage:
            totalPortfolioValue > 0
              ? Number(((network.totalValueUsd / totalPortfolioValue) * 100).toFixed(2))
              : 0,
        }))
        .filter((entry) => entry.percentage > 0); // Remove zero percentages

      console.log(
        `[FAST DASHBOARD] ✅ Built dashboard: ${
          dashboardData.networks.length
        } networks, $${totalPortfolioValue.toFixed(2)} total`,
      );
      return dashboardData;
    };

    this.syncMarket = async function () {
      const tag = `${TAG} | syncMarket | `;
      try {
        // Log balances with invalid CAIPs for debugging
        const invalidBalances = this.balances.filter(b => 
          !b || !b.caip || typeof b.caip !== 'string' || !b.caip.includes(':')
        );
        if (invalidBalances.length > 0) {
          console.warn(tag, `Found ${invalidBalances.length} balances with invalid CAIPs:`, 
            invalidBalances.map(b => ({ 
              caip: b?.caip, 
              type: typeof b?.caip, 
              symbol: b?.symbol,
              balance: b?.balance 
            }))
          );
        }

        // Extract all CAIP identifiers from balances, filtering out invalid entries
        let allCaips = this.balances
          .filter(b => b && b.caip && typeof b.caip === 'string' && b.caip.trim().length > 0)
          .map((b) => b.caip);

        // Remove duplicates
        allCaips = [...new Set(allCaips)];

        // CRITICAL: Double-check all elements are valid strings after Set deduplication
        // Filter out any non-string or empty values that might have slipped through
        allCaips = allCaips.filter(caip => 
          caip && 
          typeof caip === 'string' && 
          caip.trim().length > 0 &&
          caip.includes(':') // CAIP format always has a colon
        );

        // Fetch market prices for all CAIPs
        console.log('GetMarketInfo: payload: ', allCaips);
        console.log('GetMarketInfo: payload type: ', typeof allCaips);
        console.log('GetMarketInfo: payload length: ', allCaips.length);
        
        // Additional validation log to catch issues
        const invalidEntries = allCaips.filter(caip => typeof caip !== 'string');
        if (invalidEntries.length > 0) {
          console.error(tag, 'CRITICAL: Invalid entries detected in allCaips:', invalidEntries);
          throw new Error('Invalid CAIP entries detected - aborting market sync');
        }
        
        if (allCaips && allCaips.length > 0) {
          try {
            let allPrices = await this.pioneer.GetMarketInfo(allCaips);
            console.log('GetMarketInfo: response: ', allPrices);

            // Create a map of CAIP to price for easier lookup
            const priceMap = {};
            if (allPrices && allPrices.data) {
              for (let i = 0; i < allCaips.length && i < allPrices.data.length; i++) {
                priceMap[allCaips[i]] = allPrices.data[i];
              }
            }

            // Update each balance with the corresponding price and value
            for (let balance of this.balances) {
              if (balance && balance.caip && priceMap[balance.caip] !== undefined) {
                balance.price = priceMap[balance.caip];
                balance.priceUsd = priceMap[balance.caip]; // Also set priceUsd for compatibility
                balance.valueUsd = balance.price * (balance.balance || 0);
              }
            }
          } catch (apiError) {
            console.error(tag, 'API error fetching market info:', apiError);
            // Don't throw - just log and continue without prices
            console.warn(tag, 'Continuing without market prices');
          }
        }
        return true;
      } catch (e) {
        console.error(tag, 'e:', e);
        throw e;
      }
    };
    this.sync = async function () {
      const tag = `${TAG} | sync | `;
      try {
        // Helper to check network match with EVM wildcard support (works for both paths and pubkeys)
        const matchesNetwork = (item: any, networkId: string) => {
          if (!item.networks || !Array.isArray(item.networks)) return false;
          if (item.networks.includes(networkId)) return true;
          if (networkId.startsWith('eip155:') && item.networks.includes('eip155:*')) return true;
          return false;
        };

        //at least 1 path per chain
        await this.getPubkeys();
        for (let i = 0; i < this.blockchains.length; i++) {
          let networkId = this.blockchains[i];
          if (networkId.indexOf('eip155:') >= 0) networkId = 'eip155:*';

          let paths = this.paths.filter((path) => matchesNetwork(path, networkId));
          if (paths.length === 0) {
            //get paths for chain
            let paths = getPaths([networkId]);
            if (!paths || paths.length === 0) throw Error('Unable to find paths for: ' + networkId);
            //add to paths
            this.paths = this.paths.concat(paths);
          }
        }

        for (let i = 0; i < this.blockchains.length; i++) {
          let networkId = this.blockchains[i];
          if (networkId.indexOf('eip155:') >= 0) networkId = 'eip155:*';
          const pathsForChain = this.paths.filter((path) => matchesNetwork(path, networkId));
          if (!pathsForChain || pathsForChain.length === 0)
            throw Error('No paths found for blockchain: ' + networkId);

          for (let j = 0; j < pathsForChain.length; j++) {
            const path = pathsForChain[j];
            let pathBip32 = addressNListToBIP32(path.addressNListMaster);
            let pubkey = this.pubkeys.find((pubkey) => pubkey.pathMaster === pathBip32);
            if (!pubkey) {
              const pubkey = await getPubkey(
                this.blockchains[i],
                path,
                this.keepKeySdk,
                this.context,
              );
              if (!pubkey) throw Error('Unable to get pubkey for network+ ' + networkId);
              // Use addPubkey method for proper duplicate checking
              this.addPubkey(pubkey);
            }
          }
        }
        await this.getBalances();

        //we should be fully synced so lets make the dashboard
        const dashboardData: {
          networks: {
            networkId: string;
            totalValueUsd: number;
            gasAssetCaip: string | null;
            gasAssetSymbol: string | null;
            icon: string | null;
            color: string | null;
            totalNativeBalance: string;
          }[];
          totalValueUsd: number;
          networkPercentages: { networkId: string; percentage: number }[];
        } = {
          networks: [],
          totalValueUsd: 0,
          networkPercentages: [],
        };

        let totalPortfolioValue = 0;
        const networksTemp: {
          networkId: string;
          totalValueUsd: number;
          gasAssetCaip: string | null;
          gasAssetSymbol: string | null;
          icon: string | null;
          color: string | null;
          totalNativeBalance: string;
        }[] = [];

        // Deduplicate blockchains before calculation to prevent double-counting
        const uniqueBlockchains = [...new Set(this.blockchains)];
        console.log(tag, 'uniqueBlockchains: ', uniqueBlockchains);

        // Calculate totals for each blockchain
        for (const blockchain of uniqueBlockchains) {
          const filteredBalances = this.balances.filter((b) => {
            const networkId = caipToNetworkId(b.caip);
            return (
              networkId === blockchain ||
              (blockchain === 'eip155:*' && networkId.startsWith('eip155:'))
            );
          });

          console.log(tag, `Filtering for blockchain: ${blockchain}`);
          console.log(tag, `Found ${filteredBalances.length} balances before deduplication`);

          // Log each balance to see what's different
          filteredBalances.forEach((balance, idx) => {
            console.log(tag, `Balance[${idx}]:`, {
              caip: balance.caip,
              pubkey: balance.pubkey,
              balance: balance.balance,
              valueUsd: balance.valueUsd,
            });
          });

          // Deduplicate balances based on caip + pubkey combination
          const balanceMap = new Map();

          // Special handling for Bitcoin to work around API bug
          const isBitcoin = blockchain.includes('bip122:000000000019d6689c085ae165831e93');
          if (isBitcoin) {
            console.log(tag, 'Bitcoin network detected - checking for duplicate balances');
            // Group Bitcoin balances by value to detect duplicates
            const bitcoinByValue = new Map();
            filteredBalances.forEach((balance) => {
              const valueKey = `${balance.balance}_${balance.valueUsd}`;
              if (!bitcoinByValue.has(valueKey)) {
                bitcoinByValue.set(valueKey, []);
              }
              bitcoinByValue.get(valueKey).push(balance);
            });

            // Check if all three address types have the same non-zero balance (API bug)
            for (const [valueKey, balances] of bitcoinByValue.entries()) {
              if (balances.length === 3 && parseFloat(balances[0].valueUsd || '0') > 0) {
                console.log(
                  tag,
                  'BITCOIN API BUG DETECTED: All 3 address types have same balance, keeping only xpub',
                );
                // Keep only the xpub (or first one if no xpub)
                const xpubBalance =
                  balances.find((b) => b.pubkey?.startsWith('xpub')) || balances[0];
                const key = `${xpubBalance.caip}_${xpubBalance.pubkey || 'default'}`;
                balanceMap.set(key, xpubBalance);
              } else {
                // Add all balances normally
                balances.forEach((balance) => {
                  const key = `${balance.caip}_${balance.pubkey || 'default'}`;
                  balanceMap.set(key, balance);
                });
              }
            }
          } else {
            // Standard deduplication for non-Bitcoin networks
            filteredBalances.forEach((balance) => {
              const key = `${balance.caip}_${balance.pubkey || 'default'}`;
              // Only keep the first occurrence or the one with higher value
              if (
                !balanceMap.has(key) ||
                parseFloat(balance.valueUsd || '0') >
                  parseFloat(balanceMap.get(key).valueUsd || '0')
              ) {
                balanceMap.set(key, balance);
              }
            });
          }

          const networkBalances = Array.from(balanceMap.values());

          console.log(tag, 'networkBalances (deduplicated): ', networkBalances);
          console.log(tag, 'networkBalances count: ', networkBalances.length);

          // Ensure we're working with numbers for calculations
          const networkTotal = networkBalances.reduce((sum, balance, idx) => {
            const valueUsd =
              typeof balance.valueUsd === 'string'
                ? parseFloat(balance.valueUsd)
                : balance.valueUsd || 0;

            console.log(
              tag,
              `[${idx}] valueUsd:`,
              balance.valueUsd,
              '→ parsed:',
              valueUsd,
              '| running sum:',
              sum + valueUsd,
            );

            if (blockchain.includes('bip122:000000000019d6689c085ae165831e93')) {
              console.log(
                tag,
                `[BITCOIN DEBUG ${idx}] pubkey:`,
                balance.pubkey?.substring(0, 10) + '...',
                '| balance:',
                balance.balance,
                '| valueUsd:',
                balance.valueUsd,
                '→ parsed:',
                valueUsd,
              );
            }

            return sum + valueUsd;
          }, 0);

          console.log('Final networkTotal:', networkTotal);

          // Get native asset for this blockchain
          const nativeAssetCaip = networkIdToCaip(blockchain);
          const gasAsset = networkBalances.find((b) => b.caip === nativeAssetCaip);

          // Calculate total native balance (sum of all balances for the native asset)
          const totalNativeBalance = networkBalances
            .filter((b) => b.caip === nativeAssetCaip)
            .reduce((sum, balance) => {
              const balanceNum =
                typeof balance.balance === 'string'
                  ? parseFloat(balance.balance)
                  : balance.balance || 0;
              return sum + balanceNum;
            }, 0)
            .toString();

          networksTemp.push({
            networkId: blockchain,
            totalValueUsd: networkTotal,
            gasAssetCaip: nativeAssetCaip || null,
            gasAssetSymbol: gasAsset?.symbol || null,
            icon: gasAsset?.icon || null,
            color: gasAsset?.color || null,
            totalNativeBalance,
          });

          totalPortfolioValue += networkTotal;
        }

        // Sort networks by USD value and assign to dashboard
        dashboardData.networks = networksTemp.sort((a, b) => b.totalValueUsd - a.totalValueUsd);
        dashboardData.totalValueUsd = totalPortfolioValue;

        // Calculate network percentages for pie chart
        dashboardData.networkPercentages = dashboardData.networks
          .map((network) => ({
            networkId: network.networkId,
            percentage:
              totalPortfolioValue > 0
                ? Number(((network.totalValueUsd / totalPortfolioValue) * 100).toFixed(2))
                : 0,
          }))
          .filter((entry) => entry.percentage > 0); // Remove zero percentages

        /* console.log('Bitcoin balances:', btcBalances.map(b => ({
          pubkey: b.pubkey,
          balance: b.balance,
          valueUsd: b.valueUsd
        }))); */

        this.dashboard = dashboardData;

        return true;
      } catch (e) {
        console.error(tag, 'Error in sync:', e);
        throw e;
      }
    };
    this.estimateMax = async function (sendPayload: any) {
      try {
        sendPayload.isMax = true;
        let unsignedTx = await this.buildTx(sendPayload);
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.buildTx = async function (sendPayload: any) {
      let tag = TAG + ' | buildTx | ';
      try {
        const transactionDependencies = {
          context: this.context,
          assetContext: this.assetContext,
          balances: this.balances,
          pioneer: this.pioneer,
          pubkeys: this.pubkeys,
          nodes: this.nodes,
          keepKeySdk: this.keepKeySdk,
        };
        let txManager = new TransactionManager(transactionDependencies, this.events);
        let unsignedTx = await txManager.transfer(sendPayload);
        console.log(tag, 'unsignedTx: ', unsignedTx);
        return unsignedTx;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.buildDelegateTx = async function (caip: string, params: StakingTxParams) {
      let tag = TAG + ' | buildDelegateTx | ';
      try {
        const delegateParams = {
          ...params,
          type: 'delegate' as const,
        };
        let unsignedTx = await createUnsignedStakingTx(
          caip,
          delegateParams,
          this.pubkeys,
          this.pioneer,
          this.keepKeySdk,
        );
        console.log(tag, 'unsignedTx: ', unsignedTx);
        return unsignedTx;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.buildUndelegateTx = async function (caip: string, params: StakingTxParams) {
      let tag = TAG + ' | buildUndelegateTx | ';
      try {
        const undelegateParams = {
          ...params,
          type: 'undelegate' as const,
        };
        let unsignedTx = await createUnsignedStakingTx(
          caip,
          undelegateParams,
          this.pubkeys,
          this.pioneer,
          this.keepKeySdk,
        );
        console.log(tag, 'unsignedTx: ', unsignedTx);
        return unsignedTx;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.buildClaimRewardsTx = async function (caip: string, params: StakingTxParams) {
      let tag = TAG + ' | buildClaimRewardsTx | ';
      try {
        const claimParams = {
          ...params,
          type: 'claim_rewards' as const,
        };
        let unsignedTx = await createUnsignedStakingTx(
          caip,
          claimParams,
          this.pubkeys,
          this.pioneer,
          this.keepKeySdk,
        );
        console.log(tag, 'unsignedTx: ', unsignedTx);
        return unsignedTx;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.buildClaimAllRewardsTx = async function (caip: string, params: StakingTxParams) {
      let tag = TAG + ' | buildClaimAllRewardsTx | ';
      try {
        const claimAllParams = {
          ...params,
          type: 'claim_all_rewards' as const,
        };
        let unsignedTx = await createUnsignedStakingTx(
          caip,
          claimAllParams,
          this.pubkeys,
          this.pioneer,
          this.keepKeySdk,
        );
        //console.log(tag, 'unsignedTx: ', unsignedTx);
        return unsignedTx;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.signTx = async function (unsignedTx: any) {
      let tag = TAG + ' | signTx | ';
      try {
        const transactionDependencies = {
          context: this.context,
          assetContext: this.assetContext,
          balances: this.balances,
          pioneer: this.pioneer,
          pubkeys: this.pubkeys,
          nodes: this.nodes,
          keepKeySdk: this.keepKeySdk,
        };
        let txManager = new TransactionManager(transactionDependencies, this.events);
        let signedTx = await txManager.sign(unsignedTx);
        return signedTx;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.broadcastTx = async function (caip: string, signedTx: any) {
      let tag = TAG + ' | broadcastTx | ';
      try {
        const transactionDependencies = {
          context: this.context,
          assetContext: this.assetContext,
          balances: this.balances,
          pioneer: this.pioneer,
          pubkeys: this.pubkeys,
          nodes: this.nodes,
          keepKeySdk: this.keepKeySdk,
        };
        let txManager = new TransactionManager(transactionDependencies, this.events);
        let payload = {
          networkId: caipToNetworkId(caip),
          serialized: signedTx,
        };
        let txid = await txManager.broadcast(payload);
        return txid;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.swap = async function (swapPayload) {
      let tag = `${TAG} | swap | `;
      try {
        if (!swapPayload) throw Error('swapPayload required!');
        if (!swapPayload.caipIn) throw Error('caipIn required!');
        if (!swapPayload.caipOut) throw Error('caipOut required!');
        if (!swapPayload.isMax && !swapPayload.amount)
          throw Error('amount required! Set either amount or isMax: true');

        //Set contexts

        await this.setAssetContext({ caip: swapPayload.caipIn });
        await this.setOutboundAssetContext({ caip: swapPayload.caipOut });

        if (!this.assetContext || !this.assetContext.networkId)
          throw Error('Invalid networkId for assetContext');
        if (!this.outboundAssetContext || !this.outboundAssetContext.networkId)
          throw Error('Invalid networkId for outboundAssetContext');
        if (!this.outboundAssetContext || !this.outboundAssetContext.address)
          throw Error('Invalid outboundAssetContext missing address');

        //get quote
        // Quote fetching logic
        // Helper function to check if pubkey matches network (handles EVM wildcard)
        const matchesNetwork = (pubkey: any, networkId: string) => {
          if (!pubkey.networks || !Array.isArray(pubkey.networks)) return false;
          // Exact match
          if (pubkey.networks.includes(networkId)) return true;
          // For EVM chains, check if pubkey has eip155:* wildcard
          if (networkId.startsWith('eip155:') && pubkey.networks.includes('eip155:*')) return true;
          return false;
        };

        const pubkeys = this.pubkeys.filter((e: any) =>
          matchesNetwork(e, this.assetContext.networkId),
        );
        let senderAddress = pubkeys[0]?.address || pubkeys[0]?.master || pubkeys[0]?.pubkey;
        if (!senderAddress) throw new Error('senderAddress not found! wallet not connected');
        if (senderAddress.includes('bitcoincash:')) {
          senderAddress = senderAddress.replace('bitcoincash:', '');
        }

        const pubkeysOut = this.pubkeys.filter((e: any) =>
          matchesNetwork(e, this.outboundAssetContext.networkId),
        );

        // Handle both regular addresses and xpubs for recipient
        let recipientAddress;

        // First priority: use actual address if available
        recipientAddress = pubkeysOut[0]?.address || pubkeysOut[0]?.master || pubkeysOut[0]?.pubkey;

        if (!recipientAddress) throw Error('Failed to Find recepient address');
        if (recipientAddress.includes('bitcoincash:')) {
          recipientAddress = recipientAddress.replace('bitcoincash:', '');
        }

        // Handle max amount if isMax flag is set (consistent with transfer function pattern)
        let inputAmount;
        if (swapPayload.isMax) {
          // Find ALL balances for the input asset (important for UTXO chains with multiple xpubs)
          const inputBalances = this.balances.filter(
            (balance: any) => balance.caip === swapPayload.caipIn,
          );

          if (!inputBalances || inputBalances.length === 0) {
            throw new Error(`Cannot use max amount: no balance found for ${swapPayload.caipIn}`);
          }

          // Aggregate all balances for this asset (handles multiple xpubs for BTC, etc.)
          let totalBalance = 0;
          console.log(
            tag,
            `Found ${inputBalances.length} balance entries for ${swapPayload.caipIn}`,
          );

          for (const balanceEntry of inputBalances) {
            const balance = parseFloat(balanceEntry.balance) || 0;
            totalBalance += balance;
            console.log(tag, `  - ${balanceEntry.pubkey || balanceEntry.identifier}: ${balance}`);
          }

          // CRITICAL: Update the assetContext with the aggregated balance
          // This ensures the quote gets the correct total balance, not just one xpub
          this.assetContext.balance = totalBalance.toString();
          this.assetContext.valueUsd = (
            totalBalance * parseFloat(this.assetContext.priceUsd || '0')
          ).toFixed(2);
          console.log(tag, `Updated assetContext balance to aggregated total: ${totalBalance}`);

          // Fee reserves by network (conservative estimates)
          // These match the pattern used in transfer functions
          const feeReserves: any = {
            'bip122:000000000019d6689c085ae165831e93/slip44:0': 0.00005, // BTC
            'eip155:1/slip44:60': 0.001, // ETH
            'cosmos:thorchain-mainnet-v1/slip44:931': 0.02, // RUNE
            'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 1, // DOGE
            'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 0.001, // DASH
            'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 0.0005, // BCH
          };

          const reserve = feeReserves[swapPayload.caipIn] || 0.0001;
          inputAmount = Math.max(0, totalBalance - reserve);

          console.log(
            tag,
            `Using max amount for swap: ${inputAmount} (total balance: ${totalBalance}, reserve: ${reserve})`,
          );
        } else {
          // Convert amount to number for type safety
          inputAmount =
            typeof swapPayload.amount === 'string'
              ? parseFloat(swapPayload.amount)
              : swapPayload.amount;

          // Validate the amount is a valid number
          if (isNaN(inputAmount) || inputAmount <= 0) {
            throw new Error(`Invalid amount provided: ${swapPayload.amount}`);
          }
        }

        let quote = {
          affiliate: '0x658DE0443259a1027caA976ef9a42E6982037A03',
          sellAsset: this.assetContext,
          sellAmount: inputAmount.toPrecision(8),
          buyAsset: this.outboundAssetContext,
          recipientAddress, // Fill this based on your logic
          senderAddress, // Fill this based on your logic
          slippage: '3',
        };

        let result: any;
        try {
          result = await this.pioneer.Quote(quote);
          result = result.data;
        } catch (e) {
          console.error(tag, 'Failed to get quote: ', e);
        }
        if (result.length === 0)
          throw Error(
            'No quotes available! path: ' + quote.sellAsset.caip + ' -> ' + quote.buyAsset.caip,
          );
        //TODO let user handle selecting quote?
        let selected = result[0];
        let txs = selected.quote.txs;
        if (!txs) throw Error('invalid quote!');
        for (let i = 0; i < txs.length; i++) {
          let tx = txs[i];
          const transactionDependencies = {
            context: this.context,
            assetContext: this.assetContext,
            balances: this.balances,
            pioneer: this.pioneer,
            pubkeys: this.pubkeys,
            nodes: this.nodes,
            keepKeySdk: this.keepKeySdk,
          };

          let txManager = new TransactionManager(transactionDependencies, this.events);

          let caip = swapPayload.caipIn;

          let unsignedTx;
          if (tx.type === 'deposit') {
            //build deposit tx
            unsignedTx = await createUnsignedTendermintTx(
              caip,
              tx.type,
              tx.txParams.amount,
              tx.txParams.memo,
              this.pubkeys,
              this.pioneer,
              this.keepKeySdk,
              false,
              undefined,
            );
          } else {
            if (!tx.txParams.memo) throw Error('memo required on swaps!');
            const sendPayload: any = {
              caip,
              to: tx.txParams.recipientAddress,
              amount: tx.txParams.amount,
              feeLevel: 5,
              memo: tx.txParams.memo,
              //Options
            };

            //if isMax
            if (swapPayload.isMax) sendPayload.isMax = true;

            unsignedTx = await txManager.transfer(sendPayload);
          }

          return unsignedTx;
        }
      } catch (e) {
        console.error(tag, 'Error: ', e);
        throw e;
      }
    };
    this.transfer = async function (sendPayload) {
      let tag = `${TAG} | transfer | `;
      try {
        if (!sendPayload) throw Error('sendPayload required!');
        if (!sendPayload.caip) throw Error('caip required!');
        if (!sendPayload.to) throw Error('to required!');
        if (!sendPayload.isMax) sendPayload.isMax = false;
        let { caip } = sendPayload;

        const transactionDependencies = {
          context: this.context,
          assetContext: this.assetContext,
          balances: this.balances,
          pioneer: this.pioneer,
          pubkeys: this.pubkeys,
          nodes: this.nodes,
          keepKeySdk: this.keepKeySdk,
          isMax: sendPayload.isMax,
        };
        let txManager = new TransactionManager(transactionDependencies, this.events);
        let unsignedTx = await txManager.transfer(sendPayload);

        // Sign the transaction
        let signedTx = await txManager.sign({ caip, unsignedTx });
        if (!signedTx) throw Error('Failed to sign transaction!');
        // Broadcast the transaction
        let payload = {
          networkId: caipToNetworkId(caip),
          serialized: signedTx,
        };
        let txid = await txManager.broadcast(payload);
        return { txid, events: this.events };
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(tag, 'An error occurred during the transfer process:', error.message);
        } else {
          console.error(tag, 'An unknown error occurred during the transfer process');
        }
        throw error;
      }
    };
    this.followTransaction = async function (caip: string, txid: string) {
      let tag = ' | followTransaction | ';
      try {
        const finalConfirmationBlocksByCaip = {
          dogecoin: 3,
          bitcoin: 6,
        };

        const requiredConfirmations = finalConfirmationBlocksByCaip[caip] || 1;
        let isConfirmed = false;
        const broadcastTime = Date.now();
        let detectedTime: number | null = null;
        let confirmTime: number | null = null;

        while (!isConfirmed) {
          try {
            const response = await this.pioneer.LookupTx({
              networkId: caipToNetworkId(caip),
              txid,
            });

            if (response?.data?.data) {
              const txInfo = response.data.data;

              if (txInfo.txid && detectedTime === null) {
                detectedTime = Date.now();
                /* Old debug code commented out
                //console.log(
                  tag,
                  `Time from broadcast to detection: ${formatTime(detectedTime - broadcastTime)}`,
                );
                */
              }

              if (txInfo.confirmations >= requiredConfirmations) {
                isConfirmed = true;
                confirmTime = Date.now();

                if (detectedTime !== null && confirmTime !== null) {
                  /* Old debug code commented out
                  //console.log(
                    tag,
                    `Time from detection to confirmation: ${formatTime(
                      confirmTime - detectedTime,
                    )}`,
                  );
                  */
                }
              }
            }
          } catch (error) {
            console.error(tag, 'Error:', error);
          }

          if (!isConfirmed) {
            await new Promise((resolve) => setTimeout(resolve, 8000));
          }
        }

        return {
          caip,
          txid,
          broadcastTime: new Date(broadcastTime).toISOString(),
          detectedTime: detectedTime ? new Date(detectedTime).toISOString() : null,
          confirmTime: confirmTime ? new Date(confirmTime).toISOString() : null,
          timeToDetect: detectedTime ? formatTime(detectedTime - broadcastTime) : null,
          timeToConfirm: confirmTime ? formatTime(confirmTime - broadcastTime) : null,
          timeFromDetectionToConfirm:
            detectedTime && confirmTime ? formatTime(confirmTime - detectedTime) : null,
          requiredConfirmations,
        };
      } catch (error) {
        console.error(tag, 'Error:', error);
        throw new Error('Failed to follow transaction');
      }
    };
    this.setBlockchains = async function (blockchains: any) {
      const tag = `${TAG} | setBlockchains | `;
      try {
        if (!blockchains) throw Error('blockchains required!');

        // Deduplicate blockchains array to prevent duplicate calculations
        const uniqueBlockchains = [...new Set(blockchains)];
        if (blockchains.length !== uniqueBlockchains.length) {
          console.warn(
            tag,
            `Removed ${blockchains.length - uniqueBlockchains.length} duplicate blockchains`,
          );
        }

        this.blockchains = uniqueBlockchains;
        this.events.emit('SET_BLOCKCHAINS', this.blockchains);
      } catch (e) {
        console.error('Failed to load balances! e: ', e);
        throw e;
      }
    };
    this.addAsset = async function (caip: string, data: any) {
      let tag = TAG + ' | addAsset | ';
      try {
        let success = false;
        if (!caip) throw new Error('caip required!');

        let dataLocal = assetData[caip];
        //get assetData from discover
        if (!dataLocal) {
          if (!data.networkId) throw new Error('networkId required! can not build asset');
          // if (!data.chart) throw new Error('chart required! can not build asset');
          // console.error(tag, '*** DISCOVERY *** ', data);
          // console.error(tag, 'Failed to build asset for caip: ', caip);
          //build asset
          let asset: any = {};
          asset.source = data.chart;
          asset.caip = caip;
          asset.networkId = data.networkId;
          //Zapper chart
          if (data.token && data.token.symbol) asset.symbol = data.token.symbol;
          if (data.token && data.token.name) asset.name = data.token.name;
          if (data.token && data.token.decimals) asset.decimals = data.token.decimals;

          //common
          asset.raw = JSON.stringify(data);
          //verify
          if (!asset.symbol) throw new Error('symbol required! can not build asset');
          if (!asset.name) throw new Error('name required! can not build asset');
          if (!asset.decimals) throw new Error('decimals required! can not build asset');

          //post to pioneer-discovery
          // let resultSubmit = await this.pioneer.Discovery({asset})

          //set locally into assetMap
          // this.assetsMap.set(caip, asset);
          success = true;
        } else {
          this.assetsMap.set(caip, dataLocal);
          success = true;
        }

        return success;
      } catch (e) {
        console.error('Failed to load balances! e: ', e);
        throw e;
      }
    };
    this.clearWalletState = async function () {
      const tag = `${TAG} | clearWalletState | `;
      try {
        this.context = null;
        // this.contextType = WalletOption.KEEPKEY;
        this.paths = [];
        this.blockchains = [];
        this.pubkeys = [];
        this.pubkeySet.clear(); // Clear the tracking set as well
        console.log(tag, 'Cleared wallet state including pubkeys and tracking set');
        return true;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.getAssets = async function () {
      /*
        Get Asset Rules
      
        asset MUST have a balance if a token to be tracked
        asset MUST have a pubkey to be tracked
       */
      return this.getGasAssets();
    };
    this.getGasAssets = async function () {
      const tag = `${TAG} | getGasAssets | `;
      try {
        //get configured blockchains
        for (let i = 0; i < this.blockchains.length; i++) {
          let networkId = this.blockchains[i];
          let caip = networkIdToCaip(networkId);
          //lookup in pioneerBlob
          let asset = await assetData[caip.toLowerCase()];
          if (asset) {
            asset.caip = caip.toLowerCase();
            asset.networkId = networkId;
            this.assetsMap.set(caip, asset);
          } else {
            //Discovery
            //TODO push to Discovery api
            throw Error('GAS Asset MISSING from assetData ' + caip);
          }
        }

        //add gas assets to map

        // Add missing MAYA token manually until it's added to assetData
        const mayaTokenCaip = 'cosmos:mayachain-mainnet-v1/denom:maya';
        if (!this.assetsMap.has(mayaTokenCaip)) {
          const mayaToken = {
            caip: mayaTokenCaip,
            networkId: 'cosmos:mayachain-mainnet-v1',
            chainId: 'mayachain-mainnet-v1',
            symbol: 'MAYA',
            name: 'Maya Token',
            precision: 4,
            decimals: 4,
            color: '#00D4AA',
            icon: 'https://pioneers.dev/coins/maya.png',
            explorer: 'https://explorer.mayachain.info',
            explorerAddressLink: 'https://explorer.mayachain.info/address/{{address}}',
            explorerTxLink: 'https://explorer.mayachain.info/tx/{{txid}}',
            type: 'token',
            isToken: true,
            denom: 'maya',
          };
          this.assetsMap.set(mayaTokenCaip, mayaToken);
          console.log(tag, 'Added MAYA token to assetsMap');
        }

        return this.assetsMap;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };
    this.getPubkeys = async function () {
      const tag = `${TAG} | getPubkeys | `;
      try {
        if (this.paths.length === 0) throw new Error('No paths found!');

        // Use optimized batch fetching with individual fallback
        const pubkeys = await optimizedGetPubkeys(
          this.blockchains,
          this.paths,
          this.keepKeySdk,
          this.context,
          getPubkey, // Pass the original getPubkey function for fallback
        );

        // Merge newly fetched pubkeys with existing ones using deduplication
        const beforeCount = this.pubkeys.length;
        const allPubkeys = [...this.pubkeys, ...pubkeys];
        const dedupedPubkeys = this.deduplicatePubkeys(allPubkeys);

        // Use setPubkeys to properly update both array and set
        this.setPubkeys(dedupedPubkeys);

        const duplicatesRemoved = allPubkeys.length - this.pubkeys.length;
        if (duplicatesRemoved > 0) {
        }

        // Emit event to notify that pubkeys have been set
        this.events.emit('SET_PUBKEYS', this.pubkeys);

        return pubkeys;
      } catch (error) {
        console.error('Error in getPubkeys:', error);
        console.error(tag, 'Error in getPubkeys:', error);
        throw error;
      }
    };
    this.getBalancesForNetworks = async function (networkIds: string[]) {
      const tag = `${TAG} | getBalancesForNetworks | `;
      try {
        // Add defensive check for pioneer initialization
        if (!this.pioneer) {
          console.error(
            tag,
            'ERROR: Pioneer client not initialized! this.pioneer is:',
            this.pioneer,
          );
          throw new Error('Pioneer client not initialized. Call init() first.');
        }

        const assetQuery: { caip: string; pubkey: string }[] = [];

        for (const networkId of networkIds) {
          let adjustedNetworkId = networkId;

          if (adjustedNetworkId.includes('eip155:')) {
            adjustedNetworkId = 'eip155:*';
          }

          const isEip155 = adjustedNetworkId.includes('eip155');
          const pubkeys = this.pubkeys.filter(
            (pubkey) =>
              pubkey.networks &&
              Array.isArray(pubkey.networks) &&
              pubkey.networks.some((network) => {
                if (isEip155) return network.startsWith('eip155:');
                return network === adjustedNetworkId;
              }),
          );

          const caipNative = await networkIdToCaip(networkId);
          for (const pubkey of pubkeys) {
            assetQuery.push({ caip: caipNative, pubkey: pubkey.pubkey });
          }
        }

        console.time('GetPortfolioBalances Response Time');

        try {
          let marketInfo = await this.pioneer.GetPortfolioBalances(assetQuery);
          console.timeEnd('GetPortfolioBalances Response Time');

          let balances = marketInfo.data;

          const bitcoinBalances = balances.filter(
            (b: any) => b.caip === 'bip122:000000000019d6689c085ae165831e93/slip44:0',
          );
          if (bitcoinBalances.length > 0) {
          }

          // Enrich balances with asset info
          for (let balance of balances) {
            const assetInfo = this.assetsMap.get(balance.caip);
            if (!assetInfo) continue;

            Object.assign(balance, assetInfo, {
              networkId: caipToNetworkId(balance.caip),
              icon: assetInfo.icon || 'https://pioneers.dev/coins/etherum.png',
              identifier: `${balance.caip}:${balance.pubkey}`,
            });
          }
          console.log(tag, 'balances: ', balances);

          this.balances = balances;
          this.events.emit('SET_BALANCES', this.balances);
          return this.balances;
        } catch (apiError: any) {
          console.error(tag, 'GetPortfolioBalances API call failed:', apiError);
          throw new Error(
            `GetPortfolioBalances API call failed: ${apiError?.message || 'Unknown error'}`,
          );
        }
      } catch (e) {
        console.error(tag, 'Error: ', e);
        throw e;
      }
    };
    this.getBalances = async function () {
      const tag = `${TAG} | getBalances | `;
      try {
        // Simply call the shared function with all blockchains
        return await this.getBalancesForNetworks(this.blockchains);
      } catch (e) {
        console.error(tag, 'Error in getBalances: ', e);
        throw e;
      }
    };
    this.getBalance = async function (networkId: string) {
      const tag = `${TAG} | getBalance | `;
      try {
        // If we need to handle special logic like eip155: inside getBalance,
        // we can do it here or just rely on getBalancesForNetworks to handle it.
        // For example:
        // if (networkId.includes('eip155:')) {
        //   networkId = 'eip155:*';
        // }

        // Call the shared function with a single-network array
        const results = await this.getBalancesForNetworks([networkId]);

        // If needed, you can filter only those that match the specific network
        // (especially if you used wildcard eip155:*)
        const filtered = results.filter(
          async (b) => b.networkId === (await networkIdToCaip(networkId)),
        );
        return filtered;
      } catch (e) {
        console.error(tag, 'Error: ', e);
        throw e;
      }
    };

    /**
     * Get normalized fee rates for a specific network
     * This method handles all fee complexity and returns a clean, consistent format
     */
    this.getFees = async function (networkId: string): Promise<NormalizedFeeRates> {
      const tag = `${TAG} | getFees | `;
      try {
        if (!this.pioneer) {
          throw new Error('Pioneer client not initialized. Call init() first.');
        }

        // Use the fee management module to get normalized fees
        return await getFees(this.pioneer, networkId);
      } catch (e) {
        console.error(tag, 'Error getting fees: ', e);
        throw e;
      }
    };

    /**
     * Estimate transaction fee based on fee rate and transaction parameters
     * This is a utility method that doesn't require network access
     */
    this.estimateTransactionFee = function (
      feeRate: string,
      unit: string,
      networkType: string,
      txSize?: number
    ): FeeEstimate {
      return estimateTransactionFee(feeRate, unit, networkType, txSize);
    };
    this.getCharts = async function () {
      const tag = `${TAG} | getCharts | `;
      try {
        console.log(tag, 'Fetching charts');

        // Fetch balances from the `getCharts` function
        const newBalances = await getCharts(
          this.blockchains,
          this.pioneer,
          this.pubkeys,
          this.context,
        );
        console.log(tag, 'newBalances: ', newBalances);

        // Deduplicate balances using a Map with `identifier` as the key
        const uniqueBalances = new Map(
          [...this.balances, ...newBalances].map((balance: any) => [
            balance.identifier,
            {
              ...balance,
              type: balance.type || 'balance',
            },
          ]),
        );
        console.log(tag, 'uniqueBalances: ', uniqueBalances);

        // Convert Map back to array and set this.balances
        this.balances = Array.from(uniqueBalances.values());
        console.log(tag, 'Updated this.balances: ', this.balances);

        return this.balances;
      } catch (e) {
        console.error(tag, 'Error in getCharts:', e);
        throw e;
      }
    };
    this.setContext = async (context: string): Promise<{ success: boolean }> => {
      const tag = `${TAG} | setContext | `;
      try {
        if (!context) throw Error('context required!');
        this.context = context;
        this.events.emit('SET_CONTEXT', context);
        return { success: true };
      } catch (e) {
        console.error(tag, 'e: ', e);
        return { success: false };
      }
    };
    this.setContextType = async (contextType: string): Promise<{ success: boolean }> => {
      const tag = `${TAG} | setContextType | `;
      try {
        if (!contextType) throw Error('contextType required!');
        this.contextType = contextType;
        this.events.emit('SET_CONTEXT_TYPE', contextType);
        return { success: true };
      } catch (e) {
        console.error(tag, 'e: ', e);
        return { success: false };
      }
    };
    this.refresh = async (): Promise<any> => {
      const tag = `${TAG} | refresh | `;
      try {
        await this.sync();
        return this.balances;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.setAssetContext = async function (asset?: any): Promise<any> {
      const tag = `${TAG} | setAssetContext | `;
      try {
        // Accept null
        if (!asset) {
          this.assetContext = null;
          return;
        }

        if (!asset.caip) throw Error('Invalid Asset! missing caip!');
        if (!asset.networkId) asset.networkId = caipToNetworkId(asset.caip);

        // CRITICAL VALIDATION: Check if we have an address/xpub for this network
        if (!this.pubkeys || this.pubkeys.length === 0) {
          const errorMsg = `Cannot set asset context for ${asset.caip} - no pubkeys loaded. Please initialize wallet first.`;
          console.error(tag, errorMsg);
          throw new Error(errorMsg);
        }

        // For EVM chains, check for wildcard eip155:* in addition to exact match
        const pubkeysForNetwork = this.pubkeys.filter((e: any) => {
          if (!e.networks || !Array.isArray(e.networks)) return false;

          // Exact match
          if (e.networks.includes(asset.networkId)) return true;

          // For EVM chains, check if pubkey has eip155:* wildcard
          if (asset.networkId.startsWith('eip155:') && e.networks.includes('eip155:*')) {
            return true;
          }

          return false;
        });

        if (pubkeysForNetwork.length === 0) {
          const errorMsg = `Cannot set asset context for ${asset.caip} - no address/xpub found for network ${asset.networkId}`;
          console.error(tag, errorMsg);
          console.error(tag, 'Available networks in pubkeys:', [
            ...new Set(this.pubkeys.flatMap((p: any) => p.networks || [])),
          ]);
          throw new Error(errorMsg);
        }

        // For UTXO chains, verify we have xpub
        const isUtxoChain = asset.networkId.startsWith('bip122:');
        if (isUtxoChain) {
          const xpubFound = pubkeysForNetwork.some((p: any) => p.type === 'xpub' && p.pubkey);
          if (!xpubFound) {
            const errorMsg = `Cannot set asset context for UTXO chain ${asset.caip} - xpub required but not found`;
            console.error(tag, errorMsg);
            throw new Error(errorMsg);
          }
        }

        // Verify we have a valid address or pubkey
        const hasValidAddress = pubkeysForNetwork.some(
          (p: any) => p.address || p.master || p.pubkey,
        );
        if (!hasValidAddress) {
          const errorMsg = `Cannot set asset context for ${asset.caip} - no valid address found in pubkeys`;
          console.error(tag, errorMsg);
          throw new Error(errorMsg);
        }

        console.log(
          tag,
          `✅ Validated: Found ${pubkeysForNetwork.length} addresses for ${asset.networkId}`,
        );

        // ALWAYS fetch fresh market price for the asset
        let freshPriceUsd = 0;
        try {
          // Validate CAIP before calling API
          if (!asset.caip || typeof asset.caip !== 'string' || !asset.caip.includes(':')) {
            console.warn(tag, 'Invalid or missing CAIP, skipping market price fetch:', asset.caip);
          } else {
            console.log(tag, 'Fetching fresh market price for:', asset.caip);
            const marketData = await this.pioneer.GetMarketInfo([asset.caip]);
            console.log(tag, 'Market data response:', marketData);

            if (marketData && marketData.data && marketData.data.length > 0) {
              freshPriceUsd = marketData.data[0];
              console.log(tag, '✅ Fresh market price:', freshPriceUsd);
            } else {
              console.warn(tag, 'No market data returned for:', asset.caip);
            }
          }
        } catch (marketError) {
          console.error(tag, 'Error fetching market price:', marketError);
          // Continue without fresh price, will try to use cached data
        }

        // Try to find the asset in the local assetsMap
        let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());
        console.log(tag, 'assetInfo: ', assetInfo);

        //check discovery
        let assetInfoDiscovery = assetData[asset.caip];
        console.log(tag, 'assetInfoDiscovery: ', assetInfoDiscovery);
        if (assetInfoDiscovery) assetInfo = assetInfoDiscovery;

        // If the asset is not found, create a placeholder object
        if (!assetInfo) {
          console.log(tag, 'Building placeholder asset!');
          // Create a placeholder asset if it's not found in Pioneer or locally
          assetInfo = {
            caip: asset.caip.toLowerCase(),
            networkId: asset.networkId,
            symbol: asset.symbol || 'UNKNOWN',
            name: asset.name || 'Unknown Asset',
            icon: asset.icon || 'https://pioneers.dev/coins/ethereum.png',
          };
        }

        // Look for price and balance information in balances
        // CRITICAL: For UTXO chains, we need to aggregate ALL balances across all xpubs
        const matchingBalances = this.balances.filter((b) => b.caip === asset.caip);

        if (matchingBalances.length > 0) {
          // Use price from first balance entry (all should have same price)
          // Check for both priceUsd and price properties (different sources may use different names)
          let priceValue = matchingBalances[0].priceUsd || matchingBalances[0].price;

          // If no price but we have valueUsd and balance, calculate the price
          if ((!priceValue || priceValue === 0) && matchingBalances[0].valueUsd && matchingBalances[0].balance) {
            const balance = parseFloat(matchingBalances[0].balance);
            const valueUsd = parseFloat(matchingBalances[0].valueUsd);
            if (balance > 0 && valueUsd > 0) {
              priceValue = valueUsd / balance;
              console.log(tag, 'calculated priceUsd from valueUsd/balance:', priceValue);
            }
          }

          if (priceValue && priceValue > 0) {
            console.log(tag, 'detected priceUsd from balance:', priceValue);
            assetInfo.priceUsd = priceValue;
          }
        }

        // Override with fresh price if we got one from the API
        if (freshPriceUsd && freshPriceUsd > 0) {
          assetInfo.priceUsd = freshPriceUsd;
          console.log(tag, '✅ Using fresh market price:', freshPriceUsd);

          // Aggregate all balances for this asset (critical for UTXO chains with multiple xpubs)
          let totalBalance = 0;
          let totalValueUsd = 0;

          console.log(tag, `Found ${matchingBalances.length} balance entries for ${asset.caip}`);
          for (const balanceEntry of matchingBalances) {
            const balance = parseFloat(balanceEntry.balance) || 0;
            const valueUsd = parseFloat(balanceEntry.valueUsd) || 0;
            totalBalance += balance;
            totalValueUsd += valueUsd;
            console.log(tag, `  Balance entry: ${balance} (${valueUsd} USD)`);
          }

          assetInfo.balance = totalBalance.toString();
          assetInfo.valueUsd = totalValueUsd.toFixed(2);
          console.log(tag, `Aggregated balance: ${totalBalance} (${totalValueUsd.toFixed(2)} USD)`);
        }

        // Filter balances and pubkeys for this asset
        const assetBalances = this.balances.filter((b) => b.caip === asset.caip);
        const assetPubkeys = this.pubkeys.filter(
          (p) =>
            (p.networks &&
              Array.isArray(p.networks) &&
              p.networks.includes(caipToNetworkId(asset.caip))) ||
            (caipToNetworkId(asset.caip).includes('eip155') &&
              p.networks &&
              Array.isArray(p.networks) &&
              p.networks.some((n) => n.startsWith('eip155'))),
        );

        // Combine the user-provided asset with any additional info we have
        // IMPORTANT: Don't let a 0 priceUsd from input override a valid price from balance
        const finalAssetContext = {
          ...assetInfo,
          ...asset,
          pubkeys: assetPubkeys,
          balances: assetBalances,
        };

        // If input has priceUsd of 0 but we found a valid price from balance, use the balance price
        if ((!asset.priceUsd || asset.priceUsd === 0) && assetInfo.priceUsd && assetInfo.priceUsd > 0) {
          finalAssetContext.priceUsd = assetInfo.priceUsd;
        }

        // Update all matching balances with the fresh price
        if (freshPriceUsd && freshPriceUsd > 0) {
          for (const balance of assetBalances) {
            balance.price = freshPriceUsd;
            balance.priceUsd = freshPriceUsd;
            // Recalculate valueUsd with fresh price
            const balanceAmount = parseFloat(balance.balance || 0);
            balance.valueUsd = (balanceAmount * freshPriceUsd).toString();
          }
          console.log(tag, 'Updated all balances with fresh price data');
        }

        this.assetContext = finalAssetContext;

        // For tokens, we need to also set the native gas balance and symbol
        if (
          asset.isToken ||
          asset.type === 'token' ||
          assetInfo.isToken ||
          assetInfo.type === 'token'
        ) {
          // Get the native asset for this network
          const networkId = asset.networkId || assetInfo.networkId;

          // Determine the native gas symbol based on the network
          let nativeSymbol = 'GAS'; // default fallback
          let nativeCaip = '';

          //TODO removeme
          if (networkId.includes('mayachain')) {
            nativeSymbol = 'CACAO';
            nativeCaip = 'cosmos:mayachain-mainnet-v1/slip44:931';
          } else if (networkId.includes('thorchain')) {
            nativeSymbol = 'RUNE';
            nativeCaip = 'cosmos:thorchain-mainnet-v1/slip44:931';
          } else if (networkId.includes('cosmoshub')) {
            nativeSymbol = 'ATOM';
            nativeCaip = 'cosmos:cosmoshub-4/slip44:118';
          } else if (networkId.includes('osmosis')) {
            nativeSymbol = 'OSMO';
            nativeCaip = 'cosmos:osmosis-1/slip44:118';
          } else if (networkId.includes('eip155:1')) {
            nativeSymbol = 'ETH';
            nativeCaip = 'eip155:1/slip44:60';
          } else if (networkId.includes('eip155:137')) {
            nativeSymbol = 'MATIC';
            nativeCaip = 'eip155:137/slip44:60';
          } else if (networkId.includes('eip155:56')) {
            nativeSymbol = 'BNB';
            nativeCaip = 'eip155:56/slip44:60';
          } else if (networkId.includes('eip155:43114')) {
            nativeSymbol = 'AVAX';
            nativeCaip = 'eip155:43114/slip44:60';
          }

          // Set the native symbol
          this.assetContext.nativeSymbol = nativeSymbol;

          // Try to find the native balance
          if (nativeCaip) {
            const nativeBalance = this.balances.find((b) => b.caip === nativeCaip);
            if (nativeBalance) {
              this.assetContext.nativeBalance = nativeBalance.balance || '0';
            } else {
              this.assetContext.nativeBalance = '0';
            }
          }
        }

        // Set blockchain context based on asset
        if (asset.caip) {
          this.blockchainContext = caipToNetworkId(asset.caip);
        } else if (asset.networkId) {
          this.blockchainContext = asset.networkId;
        }

        // Auto-set pubkey context for this asset's network
        // Use the first matching pubkey from assetPubkeys we already filtered
        if (assetPubkeys && assetPubkeys.length > 0) {
          this.pubkeyContext = assetPubkeys[0];
          // Also set it on keepKeySdk so tx builders can access it
          if (this.keepKeySdk) {
            this.keepKeySdk.pubkeyContext = assetPubkeys[0];
          }
          console.log(
            tag,
            'Auto-set pubkey context for network:',
            this.pubkeyContext.address || this.pubkeyContext.pubkey,
          );
        }

        this.events.emit('SET_ASSET_CONTEXT', this.assetContext);
        return this.assetContext;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.setPubkeyContext = async function (pubkey?: any) {
      let tag = `${TAG} | setPubkeyContext | `;
      try {
        if (!pubkey) throw Error('pubkey is required');
        if (!pubkey.pubkey && !pubkey.address)
          throw Error('invalid pubkey: missing pubkey or address');

        // Validate pubkey exists in our pubkeys array
        const exists = this.pubkeys.some(
          (pk: any) =>
            pk.pubkey === pubkey.pubkey ||
            pk.address === pubkey.address ||
            pk.pubkey === pubkey.address,
        );

        if (!exists) {
          console.warn(tag, 'Pubkey not found in current pubkeys array');
        }

        /*
            Pubkey context is what FROM address we use in a tx
            Example
            ethereum account 0/1/2
        */
        this.pubkeyContext = pubkey;
        // Also set it on keepKeySdk so tx builders can access it
        if (this.keepKeySdk) {
          this.keepKeySdk.pubkeyContext = pubkey;
        }
        console.log(
          tag,
          'Pubkey context set to:',
          pubkey.address || pubkey.pubkey,
          'note:',
          pubkey.note,
        );

        return true;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.setOutboundAssetContext = async function (asset?: any): Promise<any> {
      const tag = `${TAG} | setOutputAssetContext | `;
      try {
        console.log(tag, '0. asset: ', asset);
        // Accept null
        if (!asset) {
          this.outboundAssetContext = null;
          return;
        }

        console.log(tag, '1 asset: ', asset);

        if (!asset.caip) throw Error('Invalid Asset! missing caip!');
        if (!asset.networkId) asset.networkId = caipToNetworkId(asset.caip);

        console.log(tag, 'networkId: ', asset.networkId);
        console.log(tag, 'this.pubkeys: ', this.pubkeys);
        //get a pubkey for network (handle EVM wildcard)
        const pubkey = this.pubkeys.find((p) => {
          if (!p.networks || !Array.isArray(p.networks)) return false;
          // Exact match
          if (p.networks.includes(asset.networkId)) return true;
          // For EVM chains, check if pubkey has eip155:* wildcard
          if (asset.networkId.startsWith('eip155:') && p.networks.includes('eip155:*')) return true;
          return false;
        });
        if (!pubkey) throw Error('Invalid network! missing pubkey for network! ' + asset.networkId);

        // ALWAYS fetch fresh market price for the asset
        let freshPriceUsd = 0;
        try {
          // Validate CAIP before calling API
          if (!asset.caip || typeof asset.caip !== 'string' || !asset.caip.includes(':')) {
            console.warn(tag, 'Invalid or missing CAIP, skipping market price fetch:', asset.caip);
          } else {
            console.log(tag, 'Fetching fresh market price for:', asset.caip);
            const marketData = await this.pioneer.GetMarketInfo([asset.caip]);
            console.log(tag, 'Market data response:', marketData);

            if (marketData && marketData.data && marketData.data.length > 0) {
              freshPriceUsd = marketData.data[0];
              console.log(tag, '✅ Fresh market price:', freshPriceUsd);
            } else {
              console.warn(tag, 'No market data returned for:', asset.caip);
            }
          }
        } catch (marketError) {
          console.error(tag, 'Error fetching market price:', marketError);
          // Continue without fresh price, will try to use cached data
        }

        // Try to find the asset in the local assetsMap
        let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());
        console.log(tag, 'assetInfo: ', assetInfo);

        // If the asset is not found, create a placeholder object
        if (!assetInfo) {
          // Create a placeholder asset if it's not found in Pioneer or locally
          assetInfo = {
            caip: asset.caip.toLowerCase(),
            networkId: asset.networkId,
            symbol: asset.symbol || 'UNKNOWN',
            name: asset.name || 'Unknown Asset',
            icon: asset.icon || 'https://pioneers.dev/coins/ethereum.png',
          };
        }

        // Look for price and balance information in balances
        // CRITICAL: For UTXO chains, we need to aggregate ALL balances across all xpubs
        const matchingBalances = this.balances.filter((b) => b.caip === asset.caip);

        if (matchingBalances.length > 0) {
          // Use price from first balance entry (all should have same price)
          // Check for both priceUsd and price properties (different sources may use different names)
          let priceValue = matchingBalances[0].priceUsd || matchingBalances[0].price;

          // If no price but we have valueUsd and balance, calculate the price
          if ((!priceValue || priceValue === 0) && matchingBalances[0].valueUsd && matchingBalances[0].balance) {
            const balance = parseFloat(matchingBalances[0].balance);
            const valueUsd = parseFloat(matchingBalances[0].valueUsd);
            if (balance > 0 && valueUsd > 0) {
              priceValue = valueUsd / balance;
              console.log(tag, 'calculated priceUsd from valueUsd/balance:', priceValue);
            }
          }

          if (priceValue && priceValue > 0) {
            console.log(tag, 'detected priceUsd from balance:', priceValue);
            assetInfo.priceUsd = priceValue;
          }
        }

        // Override with fresh price if we got one from the API
        if (freshPriceUsd && freshPriceUsd > 0) {
          assetInfo.priceUsd = freshPriceUsd;
          console.log(tag, '✅ Using fresh market price:', freshPriceUsd);

          // Aggregate all balances for this asset (critical for UTXO chains with multiple xpubs)
          let totalBalance = 0;
          let totalValueUsd = 0;

          console.log(tag, `Found ${matchingBalances.length} balance entries for ${asset.caip}`);
          for (const balanceEntry of matchingBalances) {
            const balance = parseFloat(balanceEntry.balance) || 0;
            const valueUsd = parseFloat(balanceEntry.valueUsd) || 0;
            totalBalance += balance;
            totalValueUsd += valueUsd;
            console.log(tag, `  Balance entry: ${balance} (${valueUsd} USD)`);
          }

          assetInfo.balance = totalBalance.toString();
          assetInfo.valueUsd = totalValueUsd.toFixed(2);
          console.log(tag, `Aggregated balance: ${totalBalance} (${totalValueUsd.toFixed(2)} USD)`);
        }

        console.log(tag, 'CHECKPOINT 1');

        // Combine the user-provided asset with any additional info we have
        this.outboundAssetContext = { ...assetInfo, ...asset, ...pubkey };

        console.log(tag, 'CHECKPOINT 3');
        console.log(tag, 'outboundAssetContext: assetInfo: ', assetInfo);

        // Set outbound blockchain context based on asset
        if (asset.caip) {
          this.outboundBlockchainContext = caipToNetworkId(asset.caip);
        } else if (asset.networkId) {
          this.outboundBlockchainContext = asset.networkId;
        }

        console.log(tag, 'CHECKPOINT 4');

        this.events.emit('SET_OUTBOUND_ASSET_CONTEXT', this.outboundAssetContext);
        return this.outboundAssetContext;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
  }
}

// Export fee-related types for consumers
export type { NormalizedFeeRates, FeeLevel, FeeEstimate } from './fees/index.js';

export default SDK;
