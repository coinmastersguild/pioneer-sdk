/*

     Pioneer SDK
        A typescript sdk for integrating cryptocurrency wallets info apps

 */

import { KeepKeySdk } from '@keepkey/keepkey-sdk';
import { caipToNetworkId, networkIdToCaip } from '@pioneer-platform/pioneer-caip';
import Pioneer from '@pioneer-platform/pioneer-client';
import {
  addressNListToBIP32,
  getPaths,
  // @ts-ignore
} from '@pioneer-platform/pioneer-coins';
import { assetData } from '@pioneer-platform/pioneer-discovery';
import { Events } from '@pioneer-platform/pioneer-events';
import EventEmitter from 'events';

import { getCharts } from './getCharts.js';
//internal
import { getPubkey } from './getPubkey.js';
import { optimizedGetPubkeys } from './kkapi-batch-client.js';
import { OfflineClient } from './offline-client.js';
import { TransactionManager } from './TransactionManager.js';
import {
  createUnsignedStakingTx,
  type StakingTxParams,
} from './txbuilder/createUnsignedStakingTx.js';
import { createUnsignedTendermintTx } from './txbuilder/createUnsignedTendermintTx.js';

const TAG = ' | Pioneer-sdk | ';

// Utility function to detect if kkapi is available with smart environment detection
async function detectKkApiAvailability(): Promise<{
  isAvailable: boolean;
  baseUrl: string;
  basePath: string;
}> {
  const tag = `${TAG} | detectKkApiAvailability | `;

  try {
    console.log('🔍 [KKAPI DETECTION] Starting smart environment detection...');

    // Smart detection: Check if we're in Tauri or browser
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    console.log('🔍 [KKAPI DETECTION] Environment:', {
      isTauri,
      isLocalhost,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    });

    // If in Tauri, use kkapi:// (will be proxied by Tauri)
    if (isTauri) {
      console.log('✅ [KKAPI DETECTION] Running in Tauri app, using kkapi:// protocol');
      return {
        isAvailable: true,
        baseUrl: 'kkapi://',
        basePath: 'kkapi://spec/swagger.json',
      };
    }

    // If in development browser, test if localhost:1646 is available
    if (isLocalhost) {
      console.log(
        '🔄 [KKAPI DETECTION] Running in development browser, testing http://localhost:1646...',
      );
      try {
        const httpResponse = await fetch('http://localhost:1646/api/v1/health', {
          method: 'GET',
          signal: AbortSignal.timeout(1000), // 1 second timeout for localhost
        });

        if (httpResponse.ok) {
          console.log('✅ [KKAPI DETECTION] HTTP localhost:1646 is available!');
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
  public loadPubkeyCache: (pubkeys: any) => Promise<void>;
  public getPubkeys: (wallets?: string[]) => Promise<any[]>;
  public getBalances: (filter?: any) => Promise<any[]>;
  public blockchains: any[];
  public clearWalletState: () => Promise<boolean>;
  public setBlockchains: (blockchains: any) => Promise<void>;
  public appName: string;
  public appIcon: any;
  public init: (walletsVerbose: any, setup: any) => Promise<any>;
  public initOffline: () => Promise<any>;
  public backgroundSync: () => Promise<void>;
  public getUnifiedPortfolio: () => Promise<any>;
  public offlineClient: OfflineClient | null;
  public verifyWallet: () => Promise<void>;
  public convertVaultPubkeysToPioneerFormat: (vaultPubkeys: any[]) => any[];
  public deriveNetworksFromPath: (path: string) => string[];
  public addAsset: (caip: string, data?: any) => Promise<any>;
  public getAssets: (filter?: string) => Promise<any>;
  public getBalance: (networkId: string) => Promise<any>;
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
  private buildTx: (sendPayload: any) => Promise<any>;
  public buildDelegateTx: (caip: string, params: StakingTxParams) => Promise<any>;
  public buildUndelegateTx: (caip: string, params: StakingTxParams) => Promise<any>;
  public buildClaimRewardsTx: (caip: string, params: StakingTxParams) => Promise<any>;
  public buildClaimAllRewardsTx: (caip: string, params: StakingTxParams) => Promise<any>;
  private estimateMax: (sendPayload: any) => Promise<void>;
  private syncMarket: () => Promise<boolean>;
  private getBalancesForNetworks: (networkIds: string[]) => Promise<any[]>;
  private search: (query: string, config: any) => Promise<void>;
  public networkPercentages: { networkId: string; percentage: string | number }[] = [];
  public assetQuery: { caip: string; pubkey: string }[] = [];

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
    this.paths = config.paths || [];
    this.blockchains = config.blockchains || [];
    this.pubkeys = config.pubkeys || [];
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

    // Fast portfolio loading from kkapi:// cache
    this.getUnifiedPortfolio = async function () {
      const tag = `${TAG} | getUnifiedPortfolio | `;
      try {
        console.log('🚀 [UNIFIED PORTFOLIO] Attempting fast portfolio load...');
        const startTime = performance.now();

        // Check if kkapi is available and use the detected endpoint
        try {
          // Use the detected endpoint instead of hardcoded kkapi://
          const baseUrl = this.keepkeyEndpoint?.baseUrl || 'kkapi://';
          const portfolioUrl = `${baseUrl}/api/portfolio`;
          console.log(`🔧 [UNIFIED PORTFOLIO] Using endpoint: ${portfolioUrl}`);
          
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

          console.log(`✅ [UNIFIED PORTFOLIO] Loaded portfolio in ${loadTime.toFixed(0)}ms`);
          console.log(
            `📊 [UNIFIED PORTFOLIO] Total USD: $${(portfolioData.totalValueUsd || 0).toFixed(2)}`,
          );
          console.log(`📊 [UNIFIED PORTFOLIO] Devices: ${portfolioData.pairedDevices || 0}`);
          console.log(`📊 [UNIFIED PORTFOLIO] Cached: ${portfolioData.cached ? 'YES' : 'NO'}`);

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
            console.log(`📦 [UNIFIED PORTFOLIO] Loaded ${allBalances.length} balances from cache`);
          }

          // Update pubkeys from cache
          if (portfolioData.pubkeys && portfolioData.pubkeys.length > 0) {
            // Convert vault pubkey format to pioneer-sdk format
            this.pubkeys = this.convertVaultPubkeysToPioneerFormat(portfolioData.pubkeys);
            this.events.emit('SET_PUBKEYS', this.pubkeys);
            console.log(`🔑 [UNIFIED PORTFOLIO] Loaded ${portfolioData.pubkeys.length} pubkeys from cache`);
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
            console.log(`👛 [UNIFIED PORTFOLIO] Loaded ${this.wallets.length} wallets from cache`);
          }

          // Create dashboard data
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
            networkPercentages: portfolioData.networks?.map((network: any) => ({
              networkId: network.network_id || network.networkId,
              percentage: network.percentage || 0,
            })) || [],
          };

          this.dashboard = dashboardData;
          this.events.emit('SET_DASHBOARD', this.dashboard);

          return {
            balances: allBalances,
            dashboard: dashboardData,
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
        console.log('walletsVerbose: ', walletsVerbose);
        console.log('🚀 [INIT OPTIMIZATION] Starting SDK initialization...');
        const initStartTime = performance.now();

        // Option to skip sync (for apps that will manually call getPubkeys/getBalances)
        const skipSync = setup?.skipSync || false;

        // Initialize Pioneer Client
        console.log('🚀 [INIT] Creating Pioneer client...');

        // CRITICAL FIX: Ensure Pioneer client has proper HTTP headers for browser requests
        const pioneerConfig = {
          ...config,
        };

        const PioneerClient = new Pioneer(this.spec, pioneerConfig);
        this.pioneer = await PioneerClient.init();
        if (!this.pioneer) throw Error('Failed to init pioneer server!');
        console.log('🚀 [INIT] ✅ Pioneer client ready');

        // Add paths for blockchains
        this.paths.concat(getPaths(this.blockchains));

        // Get gas assets (needed for asset map)
        console.log('🚀 [INIT] Loading gas assets...');
        await this.getGasAssets();
        console.log('🚀 [INIT] ✅ Gas assets loaded');

        // Detect KeepKey endpoint
        console.log('🚀 [INIT] Detecting KeepKey endpoint...');
        this.keepkeyEndpoint = await detectKkApiAvailability();
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
          //@ts-ignore
          const keepKeySdk = await KeepKeySdk.create(configKeepKey);
          const features = await keepKeySdk.system.info.getFeatures();

          this.keepkeyApiKey = configKeepKey.apiKey;
          this.keepKeySdk = keepKeySdk;
          this.context = 'keepkey:' + features.label + '.json';

          console.log('✅ [INIT] KeepKey SDK ready');
        } catch (e) {
          console.error('⚠️ [INIT] KeepKey SDK initialization failed:', e);
        }

        // Initialize WebSocket events
        console.log('🌐 [INIT] Initializing WebSocket events...');
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
        console.log('✅ [INIT] WebSocket events ready');

        this.events.emit('SET_STATUS', 'init');

        // Fast Portfolio Pattern: Try unified portfolio first, then sync if needed
        if (this.keepKeySdk && !skipSync) {
          console.log('⚡ [FAST PORTFOLIO] Attempting fast load...');
          const fastStart = performance.now();

          try {
            const unifiedResult = await this.getUnifiedPortfolio();

            if (unifiedResult && unifiedResult.cached && unifiedResult.totalValueUsd > 0) {
              console.log(
                `✅ [FAST PORTFOLIO] Loaded in ${(performance.now() - fastStart).toFixed(0)}ms`,
              );
              console.log(
                `💰 [PORTFOLIO] $${unifiedResult.totalValueUsd.toFixed(2)} USD (${
                  unifiedResult.balances.length
                } assets)`,
              );

              // Start background sync for fresh data (non-blocking)
              console.log('🔄 [SYNC] Starting background sync...');
              this.sync()
                .then(() => {
                  console.log('✅ [SYNC] Background sync completed');
                  this.events.emit('SYNC_COMPLETE');
                })
                .catch((error) => {
                  console.error('❌ [SYNC] Background sync failed:', error);
                });
            } else {
              console.log('⚠️ [FAST PORTFOLIO] Unavailable, using full sync...');
              const syncStart = performance.now();
              await this.sync();
              console.log(
                '✅ [SYNC] Full sync completed in',
                (performance.now() - syncStart).toFixed(0),
                'ms',
              );
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

        console.log('🎯 [INIT] Total time:', (performance.now() - initStartTime).toFixed(0), 'ms');
        return this.pioneer;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.syncMarket = async function () {
      const tag = `${TAG} | syncMarket | `;
      try {
        // Extract all CAIP identifiers from balances
        let allCaips = this.balances.map((b) => b.caip);

        // Fetch market prices for all CAIPs
        console.log('GetMarketInfo: payload: ', allCaips);
        console.log('GetMarketInfo: payload type: ', typeof allCaips);
        let allPrices = await this.pioneer.GetMarketInfo(allCaips);

        // Update each balance with the corresponding price and value
        for (let i = 0; i < allPrices.length; i++) {
          let balance = this.balances[i];
          balance.price = allPrices[i];
          balance.valueUsd = balance.price * balance.balance;
        }

        // Additional TODO items can be handled here

        return true;
      } catch (e) {
        console.error(tag, 'e:', e);
        throw e;
      }
    };
    this.sync = async function () {
      const tag = `${TAG} | sync | `;
      try {
        console.log('🚀 [DEBUG SYNC] Starting sync() function...');
        console.log('🚀 [DEBUG SYNC] Current blockchains:', this.blockchains);
        console.log('🚀 [DEBUG SYNC] Current paths length:', this.paths.length);
        console.log('🚀 [DEBUG SYNC] Current pubkeys length:', this.pubkeys.length);

        console.log('🚀 [DEBUG SYNC] About to call getPubkeys() - this might hang...');
        //at least 1 path per chain
        await this.getPubkeys();
        console.log('🚀 [DEBUG SYNC] ✅ getPubkeys() completed successfully!');
        for (let i = 0; i < this.blockchains.length; i++) {
          let networkId = this.blockchains[i];
          if (networkId.indexOf('eip155:') >= 0) networkId = 'eip155:*';
          let paths = this.paths.filter((path) => path.networks && Array.isArray(path.networks) && path.networks.includes(networkId));
          if (paths.length === 0) {
            //get paths for chain
            //console.log(tag, 'Adding paths for chain ' + networkId);
            let paths = getPaths([networkId]);
            if (!paths || paths.length === 0) throw Error('Unable to find paths for: ' + networkId);
            //add to paths
            this.paths = this.paths.concat(paths);
          }
        }

        //console.log(tag, 'Paths (Checkpoint2)');

        for (let i = 0; i < this.blockchains.length; i++) {
          let networkId = this.blockchains[i];
          //console.log(tag, `Processing blockchain: ${networkId}`);
          if (networkId.indexOf('eip155:') >= 0) networkId = 'eip155:*';
          //console.log(tag, 'paths: ', this.paths.length);
          // //console.log(tag, 'paths: ', this.paths);
          // Filter paths related to the current blockchain
          const pathsForChain = this.paths.filter((path) => path.networks && Array.isArray(path.networks) && path.networks.includes(networkId));
          //console.log(tag, 'pathsForChain: ', pathsForChain.length);
          if (!pathsForChain || pathsForChain.length === 0)
            throw Error('No paths found for blockchain: ' + networkId);

          for (let j = 0; j < pathsForChain.length; j++) {
            const path = pathsForChain[j];
            //console.log(tag, `Processing path: ${JSON.stringify(path)}`);

            let pathBip32 = addressNListToBIP32(path.addressNListMaster);
            //console.log(tag, 'pathBip32: ', pathBip32);
            //console.log(tag, 'this.pubkeys: ', this.pubkeys);
            let pubkey = this.pubkeys.find((pubkey) => pubkey.pathMaster === pathBip32);
            //console.log(tag, 'pubkey: ', pubkey);
            if (!pubkey) {
              //console.log(tag, 'NO PUBKEY FOUND IN CACHE!');
              const pubkey = await getPubkey(
                this.blockchains[i],
                path,
                this.keepKeySdk,
                this.context,
              );
              if (!pubkey) throw Error('Unable to get pubkey for network+ ' + networkId);
              try {
                // await this.keepKeySdk.storage
                //   .createPubkey(pubkey)
                //   .catch((error) => console.error('Error creating pubkey:', error));
              } catch (e) {
                //no logs
              }
              //if doesnt exist, add
              let exists = this.pubkeys.filter((e: any) => e.networks && Array.isArray(e.networks) && e.networks.includes(networkId));
              if (!exists || exists.length === 0) {
                this.pubkeys.push(pubkey);
              }
            } else {
              //console.log(tag, ' **** CACHE **** Cache valid for pubkey: ', pubkey);
            }
          }
        }
        await this.getBalances();
        //console.log(tag, 'balances (Checkpoint4)');

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

        // Calculate totals for each blockchain
        for (const blockchain of this.blockchains) {
          const networkBalances = this.balances.filter((b) => {
            const networkId = caipToNetworkId(b.caip);
            return (
              networkId === blockchain ||
              (blockchain === 'eip155:*' && networkId.startsWith('eip155:'))
            );
          });

          // Ensure we're working with numbers for calculations
          const networkTotal = networkBalances.reduce((sum, balance) => {
            const valueUsd =
              typeof balance.valueUsd === 'string'
                ? parseFloat(balance.valueUsd)
                : balance.valueUsd || 0;
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

    // Offline-first initialization method
    // this.initOffline = async function () {
    //   const tag = `${TAG} | initOffline | `;
    //   try {
    //     console.log('🚀 [OFFLINE] Starting offline initialization...');
    //
    //     if (!this.offlineClient) {
    //       console.log('⚠️ [OFFLINE] No offline client available, falling back to normal init');
    //       return null;
    //     }
    //
    //     // Convert paths to string format
    //     const pathStrings = this.paths
    //       .map((path: any) => {
    //         if (typeof path === 'string') return path;
    //         if (path.addressNListMaster) {
    //           return addressNListToBIP32(path.addressNListMaster);
    //         }
    //         return path.path || '';
    //       })
    //       .filter(Boolean);
    //
    //     console.log(`🚀 [OFFLINE] Getting cached data for ${pathStrings.length} paths`);
    //
    //     // Get cached data from vault
    //     const cachedData = await this.offlineClient.initOffline(pathStrings);
    //
    //     if (cachedData.cached && cachedData.pubkeys.length > 0) {
    //       // Load cached data
    //       this.pubkeys = [...this.pubkeys, ...cachedData.pubkeys];
    //       this.balances = [...this.balances, ...cachedData.balances];
    //
    //       console.log(
    //         `✅ [OFFLINE] Loaded ${cachedData.pubkeys.length} cached pubkeys, ${cachedData.balances.length} cached balances`,
    //       );
    //
    //       return {
    //         pubkeys: this.pubkeys,
    //         balances: this.balances,
    //         cached: true,
    //       };
    //     }
    //
    //     console.log('⚠️ [OFFLINE] No cached data available');
    //     return null;
    //   } catch (e) {
    //     console.error(tag, 'Error in offline init:', e);
    //     return null;
    //   }
    // };
    // Background sync method
    // this.backgroundSync = async function () {
    //   const tag = `${TAG} | backgroundSync | `;
    //   try {
    //     if (!this.offlineClient || !this.offlineClient.isAvailable()) {
    //       console.log('⚠️ [OFFLINE] Vault not available for background sync');
    //       return;
    //     }
    //
    //     console.log('🔄 [OFFLINE] Starting background sync...');
    //
    //     const pathStrings = this.paths
    //       .map((path: any) => {
    //         if (typeof path === 'string') return path;
    //         if (path.addressNListMaster) {
    //           return addressNListToBIP32(path.addressNListMaster);
    //         }
    //         return path.path || '';
    //       })
    //       .filter(Boolean);
    //
    //     await this.offlineClient.backgroundSync(pathStrings);
    //     console.log('✅ [OFFLINE] Background sync completed');
    //   } catch (e) {
    //     console.error(tag, 'Error in background sync:', e);
    //   }
    // };
    // this.loadPubkeyCache = async function (pubkeys) {
    //   const tag = `${TAG} | loadPubkeyCache | `;
    //   try {
    //     console.log(
    //       '🚀 [DEBUG CACHE] loadPubkeyCache called with:',
    //       pubkeys ? pubkeys.length : 'NULL',
    //       'pubkeys',
    //     );
    //
    //     if (!pubkeys || !Array.isArray(pubkeys)) {
    //       console.log('🚀 [DEBUG CACHE] Empty or invalid pubkeys input, using empty array');
    //       pubkeys = [];
    //     }
    //
    //     // Use a Map for efficient duplicate checking
    //     const pubkeyMap = new Map();
    //
    //     // Add existing pubkeys to the Map
    //     console.log('🚀 [DEBUG CACHE] Existing this.pubkeys count:', this.pubkeys.length);
    //     for (const existingPubkey of this.pubkeys) {
    //       pubkeyMap.set(existingPubkey.pubkey, existingPubkey);
    //     }
    //
    //     // Filter the pubkeys by enabled blockchains
    //     const enabledNetworkIds = new Set(this.blockchains);
    //     console.log('🚀 [DEBUG CACHE] Enabled networks:', Array.from(enabledNetworkIds));
    //
    //     const filteredPubkeys = pubkeys.filter((pubkey) => {
    //       // pubkey.networks is an array of networkIds
    //       return pubkey.networks.some((networkId) => enabledNetworkIds.has(networkId));
    //     });
    //     console.log('🚀 [DEBUG CACHE] Filtered pubkeys count:', filteredPubkeys.length);
    //
    //     // Add new pubkeys from the cache, avoiding duplicates
    //     for (const newPubkey of filteredPubkeys) {
    //       if (!pubkeyMap.has(newPubkey.pubkey)) {
    //         pubkeyMap.set(newPubkey.pubkey, newPubkey);
    //       } else {
    //         console.log('🚀 [DEBUG CACHE] Duplicate pubkey found, skipping');
    //       }
    //     }
    //
    //     // Update this.pubkeys with the unique values
    //     this.pubkeys = Array.from(pubkeyMap.values());
    //     console.log(
    //       '🚀 [DEBUG CACHE] ✅ loadPubkeyCache completed, total pubkeys:',
    //       this.pubkeys.length,
    //     );
    //   } catch (e) {
    //     console.error('🚀 [DEBUG CACHE] ❌ Error in loadPubkeyCache:', e);
    //     console.error(tag, 'Error loading pubkey cache:', e);
    //     throw e;
    //   }
    // };
    this.estimateMax = async function (sendPayload: any) {
      try {
        sendPayload.isMax = true;
        let unsignedTx = await this.buildTx(sendPayload);
        //console.log('unsignedTx: ', unsignedTx);
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
        //console.log(tag, 'unsignedTx: ', unsignedTx);
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
        //console.log(tag, 'unsignedTx: ', unsignedTx);
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
        //console.log(tag, 'unsignedTx: ', unsignedTx);
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
        //console.log(tag, 'unsignedTx: ', unsignedTx);
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
        //console.log(tag, 'signedTx: ', signedTx);
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
        //console.log(tag, 'txid: ', txid);
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
        if (!swapPayload.amount) throw Error('amount required!');

        //Set contexts
        console.log(tag, 'Setting contexts for swap...');
        console.log(tag, 'caipIn:', swapPayload.caipIn);
        console.log(tag, 'caipOut:', swapPayload.caipOut);

        await this.setAssetContext({ caip: swapPayload.caipIn });
        await this.setOutboundAssetContext({ caip: swapPayload.caipOut });

        console.log(tag, 'assetContext:', this.assetContext);
        console.log(tag, 'outboundAssetContext:', this.outboundAssetContext);
        //console.log(tag, 'assetContext: ', this.assetContext);
        //console.log(tag, 'outboundAssetContext: ', this.outboundAssetContext);

        if (!this.assetContext || !this.assetContext.networkId)
          throw Error('Invalid networkId for assetContext');
        if (!this.outboundAssetContext || !this.outboundAssetContext.networkId)
          throw Error('Invalid networkId for outboundAssetContext');
        //console.log(tag, 'assetContext networkId: ', this.assetContext.networkId);
        //console.log(tag, 'outboundAssetContext  networkId: ', this.outboundAssetContext.networkId);

        //get quote
        // Quote fetching logic
        const pubkeys = this.pubkeys.filter((e: any) =>
          e.networks && Array.isArray(e.networks) && e.networks.includes(this.assetContext.networkId),
        );
        let senderAddress = pubkeys[0]?.address || pubkeys[0]?.master;
        if (!senderAddress) throw new Error('senderAddress not found! wallet not connected');
        if (senderAddress.includes('bitcoincash:')) {
          senderAddress = senderAddress.replace('bitcoincash:', '');
        }

        /* Old debug code commented out
        //console.log(
          tag,
          'this.outboundAssetContext.networkId',
          this.outboundAssetContext.networkId,
        );
        */
        console.log(tag, 'Looking for recipient address...');
        console.log(
          tag,
          'this.outboundAssetContext.networkId:',
          this.outboundAssetContext.networkId,
        );
        console.log(tag, 'this.pubkeys count:', this.pubkeys.length);
        console.log(
          tag,
          'Sample pubkey networks:',
          this.pubkeys.slice(0, 3).map((p: any) => ({
            networks: p.networks,
            address: p.address?.substring(0, 10) + '...',
            master: p.master?.substring(0, 10) + '...',
          })),
        );

        // Check if we need to fetch pubkeys for this network
        const existingNetworks = [...new Set(this.pubkeys.flatMap((p: any) => p.networks))];
        if (!existingNetworks.includes(this.outboundAssetContext.networkId)) {
          console.log(
            tag,
            'Network not found in pubkeys, attempting to add paths for:',
            this.outboundAssetContext.networkId,
          );

          // Try to get paths for this network
          try {
            const newPaths = getPaths([this.outboundAssetContext.networkId]);
            if (newPaths && newPaths.length > 0) {
              console.log(tag, 'Found', newPaths.length, 'paths for network');
              this.paths = this.paths.concat(newPaths);

              // Get pubkeys for these new paths
              const newPubkeys = await this.getPubkeys();
              console.log(tag, 'Fetched', newPubkeys.length, 'new pubkeys');
            }
          } catch (pathError) {
            console.error(tag, 'Failed to get paths for network:', pathError);
          }
        }

        const pubkeysOut = this.pubkeys.filter((e: any) =>
          e.networks && Array.isArray(e.networks) && e.networks.includes(this.outboundAssetContext.networkId),
        );
        console.log(tag, 'pubkeysOut count:', pubkeysOut.length);
        console.log(tag, 'pubkeysOut:', pubkeysOut);

        let recipientAddress = pubkeysOut[0]?.address || pubkeysOut[0]?.master;
        if (!recipientAddress) {
          console.error(tag, 'Failed to find recipient address!');
          console.error(tag, 'Available networks in pubkeys:', [
            ...new Set(this.pubkeys.flatMap((p: any) => p.networks)),
          ]);
          console.error(tag, 'Looking for network:', this.outboundAssetContext.networkId);

          // Try to use the sender address as a fallback if both assets are on the same network
          if (
            this.assetContext.networkId === this.outboundAssetContext.networkId &&
            senderAddress
          ) {
            console.warn(tag, 'Using sender address as recipient for same-network swap');
            recipientAddress = senderAddress;
          } else {
            throw new Error(
              'recipientAddress not found! wallet not connected or missing pubkey for network: ' +
                this.outboundAssetContext.networkId,
            );
          }
        }
        if (recipientAddress.includes('bitcoincash:')) {
          recipientAddress = recipientAddress.replace('bitcoincash:', '');
        }

        //Convert amount to number for type safety
        let inputAmount = typeof swapPayload.amount === 'string' 
          ? parseFloat(swapPayload.amount) 
          : swapPayload.amount;
        
        // Validate the amount is a valid number
        if (isNaN(inputAmount)) {
          throw new Error(`Invalid amount provided: ${swapPayload.amount}`);
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
        //console.log(tag, 'quote: ', quote);

        let result: any;
        try {
          result = await this.pioneer.Quote(quote);
          result = result.data;
          console.log(tag, 'result: ', result);
        } catch (e) {
          console.error(tag, 'Failed to get quote: ', e);
        }
        if (result.length === 0)
          throw Error(
            'No quotes available! path: ' + quote.sellAsset.caip + ' -> ' + quote.buyAsset.caip,
          );
        //TODO let user handle selecting quote?
        let selected = result[0];
        let invocationId = selected.quote.id;
        //console.log('invocationId: ', invocationId);

        //console.log('txs: ', selected.quote.txs);
        let txs = selected.quote.txs;
        if (!txs) throw Error('invalid quote!');
        for (let i = 0; i < txs.length; i++) {
          let tx = txs[i];
          //console.log(tag, 'tx: ', tx);
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
            const sendPayload = {
              caip,
              to: tx.txParams.recipientAddress,
              amount: tx.txParams.amount,
              feeLevel: 5,
              memo: tx.txParams.memo,
              //Options
            };
            console.log(tag, 'sendPayload: ', sendPayload);
            unsignedTx = await txManager.transfer(sendPayload);
            //console.log(tag, 'unsignedTx: ', unsignedTx);
          }

          let signedTx = await txManager.sign({ caip, unsignedTx });
          //console.log(tag, 'signedTx: ', signedTx);

          let payload = {
            networkId: caipToNetworkId(caip),
            serialized: signedTx,
          };
          //console.log(tag, 'payload: ', payload);

          let txid = await txManager.broadcast(payload);
          if (txid.error) {
            throw Error('Failed to broadcast transaction! error:' + txid.error);
          }
          //console.log(tag, 'txid: ', txid);
          return { txid, events: this.events };
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
        //console.log(tag, 'sendPayload: ', sendPayload);
        let unsignedTx = await txManager.transfer(sendPayload);
        //console.log(tag, 'unsignedTx: ', unsignedTx);

        // Sign the transaction
        let signedTx = await txManager.sign({ caip, unsignedTx });
        //console.log(tag, 'signedTx: ', signedTx);
        if (!signedTx) throw Error('Failed to sign transaction!');
        // Broadcast the transaction
        let payload = {
          networkId: caipToNetworkId(caip),
          serialized: signedTx,
        };
        let txid = await txManager.broadcast(payload);
        //console.log(tag, 'txid: ', txid);
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
      try {
        if (!blockchains) throw Error('blockchains required!');
        //log.debug('setBlockchains called! blockchains: ', blockchains);
        this.blockchains = blockchains;
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
        //console.log(tag, 'dataLocal: ', dataLocal);
        //get assetData from discover
        if (!dataLocal) {
          //console.log(tag, 'dataLocal not found! caip: ', caip);
          //console.log(tag, 'dataLocal not found! data: ', data);
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
          // //console.log(tag, 'resultSubmit: ', resultSubmit);

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
        // @ts-ignore
        this.context = null;
        // this.contextType = WalletOption.KEEPKEY;
        this.paths = [];
        this.blockchains = [];
        this.pubkeys = [];
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
          //console.log(tag, 'networkId: ', networkId);
          let caip = networkIdToCaip(networkId);
          //lookup in pioneerBlob
          let asset = await assetData[caip.toLowerCase()];
          if (asset) {
            asset.caip = caip.toLowerCase();
            asset.networkId = networkId;
            //console.log(tag, 'asset: ', asset);
            this.assetsMap.set(caip, asset);
          } else {
            //Discovery
            //TODO push to Discovery api

            const explorerInfo = this.getExplorerForNetwork(networkId);
            let asset = {
              caip: caip,
              chainId: networkId.replace('eip155:', ''),
              networkId: networkId,
              symbol: 'ETH',
              name: networkId,
              networkName: networkId,
              precision: 18,
              color: '#0000ff',
              icon: 'https://pioneers.dev/coins/ethereum.png',
              explorer: explorerInfo.explorer,
              explorerAddressLink: explorerInfo.explorerAddressLink,
              explorerTxLink: explorerInfo.explorerTxLink,
            };
            this.assetsMap.set(caip, asset);
            //TODO build from scratch
            //throw Error('unknown asset! ' + caip + ' not found in assetData!');
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
        console.log('🚀 [DEBUG SDK] getPubkeys() starting with BATCH OPTIMIZATION...');
        console.log('🚀 [DEBUG SDK] Paths length:', this.paths.length);
        console.log('🚀 [DEBUG SDK] Blockchains length:', this.blockchains.length);

        if (this.paths.length === 0) throw new Error('No paths found!');

        // Use optimized batch fetching with individual fallback
        const pubkeys = await optimizedGetPubkeys(
          this.blockchains,
          this.paths,
          this.keepKeySdk,
          this.context,
          getPubkey, // Pass the original getPubkey function for fallback
        );

        console.log('🚀 [DEBUG SDK] Total pubkeys collected:', pubkeys.length);

        // Merge newly fetched pubkeys with existing ones
        this.pubkeys = [...this.pubkeys, ...pubkeys];
        console.log('🚀 [DEBUG SDK] Final pubkeys array length:', this.pubkeys.length);

        // Emit event to notify that pubkeys have been set
        this.events.emit('SET_PUBKEYS', pubkeys);

        return pubkeys;
      } catch (error) {
        console.error('🚀 [DEBUG SDK] ❌ Error in getPubkeys:', error);
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

        if (typeof this.pioneer.GetPortfolioBalances !== 'function') {
          console.error(tag, 'ERROR: GetPortfolioBalances is not a function!');
          console.error(tag, 'Pioneer client type:', typeof this.pioneer);
          console.error(tag, 'Pioneer client keys:', Object.keys(this.pioneer).slice(0, 10));
          console.error(
            tag,
            'Looking for methods containing "Portfolio":',
            Object.keys(this.pioneer).filter((key) => key.toLowerCase().includes('portfolio')),
          );
          throw new Error(
            'GetPortfolioBalances method not available on Pioneer client. Check API spec and client initialization.',
          );
        }

        const assetQuery: { caip: string; pubkey: string }[] = [];

        for (const networkId of networkIds) {
          let adjustedNetworkId = networkId;

          if (adjustedNetworkId.includes('eip155:')) {
            adjustedNetworkId = 'eip155:*';
          }

          const isEip155 = adjustedNetworkId.includes('eip155');
          const pubkeys = this.pubkeys.filter((pubkey) =>
            pubkey.networks && Array.isArray(pubkey.networks) && pubkey.networks.some((network) => {
              if (isEip155) return network.startsWith('eip155:');
              return network === adjustedNetworkId;
            }),
          );

          const caipNative = await networkIdToCaip(networkId);
          for (const pubkey of pubkeys) {
            assetQuery.push({ caip: caipNative, pubkey: pubkey.pubkey });
          }
        }

        //console.log(tag, 'assetQuery length: ', assetQuery.length);
        console.time('GetPortfolioBalances Response Time');

        try {
          let marketInfo = await this.pioneer.GetPortfolioBalances(assetQuery);
          console.timeEnd('GetPortfolioBalances Response Time');

          //console.log(tag, 'returned balances: ', marketInfo.data);
          let balances = marketInfo.data;

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
        //console.log(tag, 'networkId:', networkId);
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

        // Deduplicate balances using a Map with `identifier` as the key
        const uniqueBalances = new Map(
          [...this.balances, ...newBalances].map((balance: any) => [
            balance.identifier,
            {
              ...balance,
              type: balance.type || 'balance',
              icon: balance.icon || 'https://pioneers.dev/coins/ethereum.png',
            },
          ]),
        );

        // Filter out invalid balances (missing identifier or chain)
        this.balances = Array.from(uniqueBalances.values()).filter((balance) => {
          if (!balance.identifier) {
            console.error(tag, 'Invalid balance:', balance);
            return false; // Exclude invalid balances
          }
          return true; // Include valid balances
        });

        //console.log(tag, `Total unique balances after charts update: ${this.balances.length}`);
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

        // Try to find the asset in the local assetsMap
        let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());
        console.log(tag, 'assetInfo: ', assetInfo);

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
        const matchingBalance = this.balances.find((b) => b.caip === asset.caip);
        if (matchingBalance) {
          if (matchingBalance.priceUsd) {
            console.log(tag, 'detected priceUsd from balance:', matchingBalance.priceUsd);
            assetInfo.priceUsd = matchingBalance.priceUsd;
          }
          if (matchingBalance.balance !== undefined) {
            console.log(tag, 'detected balance from balance:', matchingBalance.balance);
            assetInfo.balance = matchingBalance.balance;
          }
          if (matchingBalance.valueUsd !== undefined) {
            console.log(tag, 'detected valueUsd from balance:', matchingBalance.valueUsd);
            assetInfo.valueUsd = matchingBalance.valueUsd;
          }
        }

        // Filter balances and pubkeys for this asset
        const assetBalances = this.balances.filter((b) => b.caip === asset.caip);
        const assetPubkeys = this.pubkeys.filter(
          (p) =>
            (p.networks && Array.isArray(p.networks) && p.networks.includes(caipToNetworkId(asset.caip))) ||
            (caipToNetworkId(asset.caip).includes('eip155') &&
              p.networks && Array.isArray(p.networks) && p.networks.some((n) => n.startsWith('eip155'))),
        );

        // Combine the user-provided asset with any additional info we have
        this.assetContext = {
          ...assetInfo,
          ...asset,
          pubkeys: assetPubkeys,
          balances: assetBalances,
        };

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

        this.events.emit('SET_ASSET_CONTEXT', this.assetContext);
        return this.assetContext;
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
        const matchingBalance = this.balances.find((b) => b.caip === asset.caip);
        if (matchingBalance) {
          if (matchingBalance.priceUsd) {
            console.log(tag, 'detected priceUsd from balance:', matchingBalance.priceUsd);
            assetInfo.priceUsd = matchingBalance.priceUsd;
          }
          if (matchingBalance.balance !== undefined) {
            console.log(tag, 'detected balance from balance:', matchingBalance.balance);
            assetInfo.balance = matchingBalance.balance;
          }
          if (matchingBalance.valueUsd !== undefined) {
            console.log(tag, 'detected valueUsd from balance:', matchingBalance.valueUsd);
            assetInfo.valueUsd = matchingBalance.valueUsd;
          }
        }

        console.log(tag, 'CHECKPOINT 1');

        // Combine the user-provided asset with any additional info we have
        this.outboundAssetContext = { ...assetInfo, ...asset };

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
    this.verifyWallet = async (): Promise<void> => {
      // Implementation will be added later
      return Promise.resolve();
    };
    this.search = async (query: string, config: any): Promise<void> => {
      // Implementation will be added later
      return Promise.resolve();
    };

    // Convert vault pubkey format to pioneer-sdk format
    this.convertVaultPubkeysToPioneerFormat = (vaultPubkeys: any[]): any[] => {
      const tag = `| convertVaultPubkeys | `;
      console.log(`🔄 [VAULT CONVERSION] Converting ${vaultPubkeys.length} vault pubkeys to pioneer format...`);
      
      return vaultPubkeys.map((vaultPubkey: any, index: number) => {
        // Handle different vault pubkey formats
        let pubkey: any = {};
        
        // Copy basic properties
        pubkey.path = vaultPubkey.path;
        pubkey.pathMaster = vaultPubkey.pathMaster || vaultPubkey.path;
        
        // Convert xpub to pubkey field
        if (vaultPubkey.xpub) {
          pubkey.pubkey = vaultPubkey.xpub;
          pubkey.type = 'xpub'; // Default for extended public keys
        } else if (vaultPubkey.pubkey) {
          pubkey.pubkey = vaultPubkey.pubkey;
        } else {
          console.warn(`⚠️ [VAULT CONVERSION] Warning: Pubkey ${index} has no xpub or pubkey field`, vaultPubkey);
          pubkey.pubkey = vaultPubkey.address || 'unknown';
        }
        
        // Handle networks
        if (vaultPubkey.networks && Array.isArray(vaultPubkey.networks)) {
          pubkey.networks = vaultPubkey.networks;
        } else {
          // Try to derive networks from path or coin info
          pubkey.networks = this.deriveNetworksFromPath(vaultPubkey.path || '');
        }
        
        // Handle other properties
        pubkey.scriptType = vaultPubkey.scriptType || vaultPubkey.script_type || 'p2pkh';
        pubkey.type = vaultPubkey.type || (vaultPubkey.xpub ? 'xpub' : 'address');
        pubkey.address = vaultPubkey.address;
        pubkey.coin = vaultPubkey.coin;
        pubkey.cached = true;
        pubkey.source = 'vault_cache';
        
        return pubkey;
      });
    };

    // Helper method to derive networks from BIP32 path
    this.deriveNetworksFromPath = (path: string): string[] => {
      // Parse BIP44 path format: m/44'/coin_type'/account'/change/address_index
      const pathParts = path.split('/');
      if (pathParts.length < 3) return ['unknown'];
      
      const coinTypeMatch = pathParts[2]?.match(/^(\d+)'?$/);
      if (!coinTypeMatch) return ['unknown'];
      
      const coinType = parseInt(coinTypeMatch[1]);
      
      // Map coin types to network IDs (BIP44 standard)
      const coinTypeToNetwork: { [key: number]: string[] } = {
        0: ['bip122:000000000019d6689c085ae165831e93'], // Bitcoin
        1: ['bip122:000000000019d6689c085ae165831e93'], // Bitcoin Testnet
        2: ['bip122:12a765e31ffd4059bada1e25190f6e98'], // Litecoin
        3: ['bip122:00000000001a91e3dace36e2be3bf030'], // Dogecoin
        5: ['bip122:000007d91d1254d60e2dd1ae58038307'], // Dash
        60: ['eip155:1', 'eip155:*'], // Ethereum
        118: ['cosmos:cosmoshub-4'], // Cosmos
        144: ['ripple:4109c6f2045fc7eff4cde8f9905d19c2'], // XRP
        145: ['bip122:000000000000000000651ef99cb9fcbe'], // Bitcoin Cash
        931: ['cosmos:thorchain-mainnet-v1', 'cosmos:mayachain-mainnet-v1'] // THORChain/Maya
      };
      
      return coinTypeToNetwork[coinType] || ['unknown'];
    };
  }
}

export default SDK;
