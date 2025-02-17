/*

     Pioneer SDK
        A typescript sdk for integrating cryptocurrency wallets info apps

 */

import { KeepKeySdk } from '@keepkey/keepkey-sdk';
import { caipToNetworkId, networkIdToCaip } from '@pioneer-platform/pioneer-caip';
import Pioneer from '@pioneer-platform/pioneer-client';
import {
  addressNListToBIP32,
  getNativeAssetForBlockchain,
  getPaths,
  // @ts-ignore
} from '@pioneer-platform/pioneer-coins';
import { assetData } from '@pioneer-platform/pioneer-discovery';
import { Events } from '@pioneer-platform/pioneer-events';
import EventEmitter from 'events';

import { getCharts } from './getCharts';
//internal
import { getPubkey } from './getPubkey';
import { TransactionManager } from './TransactionManager';
import { createUnsignedTendermintTx } from './txbuilder/createUnsignedTendermintTx';

const TAG = ' | Pioneer-sdk | ';

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
  public ethplorerApiKey: string;
  public covalentApiKey: string;
  public utxoApiKey: string;
  public walletConnectProjectId: string;
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
  public keepkeyApiKey: string;
  public isPioneer: string | null;
  public loadBalanceCache: (balances: any) => Promise<void>;
  public loadPubkeyCache: (pubkeys: any) => Promise<void>;
  public getPubkeys: (wallets?: string[]) => Promise<any[]>;
  public getBalances: (filter?: any) => Promise<any[]>;
  public blockchains: any[];
  public clearWalletState: () => Promise<boolean>;
  public setBlockchains: (blockchains: any) => Promise<void>;
  public appName: string;
  public appIcon: any;
  public init: (walletsVerbose: any, setup: any) => Promise<any>;
  public verifyWallet: () => Promise<void>;
  public addAsset: (caip: string, data?: any) => Promise<any>;
  public getAssets: (filter?: string) => Promise<any>;
  public getBalance: (networkId: string) => Promise<any>;
  public getCharts: () => Promise<any>;
  public keepKeySdk: any;
  private getGasAssets: () => Promise<any>;
  private transactions: any;
  private transfer: (sendPayload: any) => Promise<any>;
  private clearCache: () => Promise<boolean>;
  private sync: () => Promise<boolean>;
  private swap: (swapPayload: any, waitOnConfirm?: boolean) => Promise<any>;
  private followTransaction: (
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
  private broadcastTx: (caip: string, signedTx: any) => Promise<any>;
  private signTx: (unsignedTx: any) => Promise<any>;
  private buildTx: (sendPayload: any) => Promise<any>;
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
    this.pairWallet = async (options: any) => {
      // Implementation will be added later
      return Promise.resolve({});
    };
    this.init = async function (walletsVerbose: any, setup: any) {
      const tag = `${TAG} | init | `;
      try {
        if (!this.username) throw Error('username required!');
        if (!this.queryKey) throw Error('queryKey required!');
        if (!this.wss) throw Error('wss required!');
        if (!this.wallets) throw Error('wallets required!');
        if (!this.paths) throw Error('wallets required!');
        const PioneerClient = new Pioneer(this.spec, config);
        this.pioneer = await PioneerClient.init();
        if (!this.pioneer) throw Error('Fialed to init pioneer server!');
        this.paths.concat(getPaths(this.blockchains));
        //get Assets
        await this.getGasAssets();
        const configKeepKey = {
          apiKey: this.keepkeyApiKey || 'keepkey-api-key',
          pairingInfo: {
            name: 'KeepKey SDK Demo App',
            imageUrl: 'https://pioneers.dev/coins/keepkey.png',
            basePath: spec,
            url: 'http://localhost:1646',
          },
        };
        try {
          //@ts-ignore
          const keepKeySdk = await KeepKeySdk.create(configKeepKey);
          const keepkeyApiKey = configKeepKey.apiKey;
          const features = await keepKeySdk.system.info.getFeatures();
          this.keepkeyApiKey = keepkeyApiKey;
          this.keepKeySdk = keepKeySdk;
          this.context = 'keepkey:' + features.label + '.json';
          let pubkeysCache = await this.keepKeySdk.storage.getPubkeys().catch((error) => {
            //console.error('Error fetching pubkeysCache:', error);
            return [];
          });
          await this.loadPubkeyCache(pubkeysCache);
        } catch (e) {
          console.error(e);
        }
        this.events.emit('SET_STATUS', 'init');

        let configWss = {
          // queryKey:TEST_QUERY_KEY_2,
          username: this.username,
          queryKey: this.queryKey,
          wss: this.wss,
        };
        let clientEvents = new Events(configWss);
        console.log(tag, 'clientEvents: ', clientEvents);
        await clientEvents.init();
        await clientEvents.setUsername(this.username);

        //events
        clientEvents.events.on('message', (request) => {
          console.log(tag, 'request: ', request);
          this.events.emit('message', request);
        });

        await this.getGasAssets();

        if (this.keepKeySdk) await this.sync();
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
        //console.log(tag, 'Syncing Wallet (Checkpoint1)');
        //at least 1 path per chain
        await this.getPubkeys();
        for (let i = 0; i < this.blockchains.length; i++) {
          let networkId = this.blockchains[i];
          if (networkId.indexOf('eip155:') >= 0) networkId = 'eip155:*';
          let paths = this.paths.filter((path) => path.networks.includes(networkId));
          if (paths.length === 0) {
            //get paths for chain
            //console.log(tag, 'Adding paths for chain ' + networkId);
            let paths = getPaths([networkId]);
            if (!paths || paths.length === 0) throw Error('Unable to find paths for: ' + networkId);
            //add to paths
            this.paths = this.paths.concat(paths);

            for (let j = 0; j < paths.length; j++) {
              let path = paths[j];
              //console.log(tag, 'Adding path to cache: ', path);
              await this.keepKeySdk.storage.createPath(path).catch((error) => {
                console.error('Error creating path:', error);
              });
            }
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
          const pathsForChain = this.paths.filter((path) => path.networks.includes(networkId));
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
              let exists = this.pubkeys.filter((e: any) => e.networks.includes(networkId));
              if (!exists || exists.length === 0) {
                this.pubkeys.push(pubkey);
              }
            } else {
              console.log(tag, ' **** CACHE **** Cache valid for pubkey: ', pubkey);
            }
          }
        }
        await this.getBalances();
        //console.log(tag, 'balances (Checkpoint4)');

        //we should be fully synced so lets make the dashboard
        const dashboardData: {
          networks: Array<{
            networkId: string;
            totalValueUsd: number;
            gasAssetCaip: string | null;
            gasAssetSymbol: string | null;
            icon: string | null;
            color: string | null;
            totalNativeBalance: string;
          }>;
          totalValueUsd: number;
          networkPercentages: { networkId: string; percentage: number }[];
        } = {
          networks: [],
          totalValueUsd: 0,
          networkPercentages: [],
        };

        let totalPortfolioValue = 0;
        const networksTemp = [];

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
            .filter(b => b.caip === nativeAssetCaip)
            .reduce((sum, balance) => {
              const balanceNum = typeof balance.balance === 'string' 
                ? parseFloat(balance.balance) 
                : (balance.balance || 0);
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
            percentage: totalPortfolioValue > 0
              ? Number(((network.totalValueUsd / totalPortfolioValue) * 100).toFixed(2))
              : 0,
          }))
          .filter(entry => entry.percentage > 0); // Remove zero percentages

        // Debug logging for Bitcoin balances
        const btcBalances = this.balances.filter(b => 
          b.caip === 'bip122:000000000019d6689c085ae165831e93/slip44:0'
        );
        console.log('Bitcoin balances:', btcBalances.map(b => ({
          pubkey: b.pubkey,
          balance: b.balance,
          valueUsd: b.valueUsd
        })));

        this.dashboard = dashboardData;

        return true;
      } catch (e) {
        console.error(tag, 'Error in sync:', e);
        throw e;
      }
    };
    this.loadPubkeyCache = async function (pubkeys) {
      const tag = `${TAG} | loadPubkeyCache | `;
      try {
        if (!pubkeys || !Array.isArray(pubkeys)) {
          throw new Error('Invalid pubkeys input, expected an array.');
        }

        // Use a Map for efficient duplicate checking
        const pubkeyMap = new Map();

        // Add existing pubkeys to the Map
        for (const existingPubkey of this.pubkeys) {
          pubkeyMap.set(existingPubkey.pubkey, existingPubkey);
        }

        // Filter the pubkeys by enabled blockchains
        const enabledNetworkIds = new Set(this.blockchains);
        const filteredPubkeys = pubkeys.filter((pubkey) => {
          // pubkey.networks is an array of networkIds
          return pubkey.networks.some((networkId) => enabledNetworkIds.has(networkId));
        });

        // Add new pubkeys from the cache, avoiding duplicates
        for (const newPubkey of filteredPubkeys) {
          if (!pubkeyMap.has(newPubkey.pubkey)) {
            pubkeyMap.set(newPubkey.pubkey, newPubkey);
          } else {
            //console.log(tag, `Duplicate pubkey found: ${newPubkey.pubkey}, skipping.`);
          }
        }

        // Update this.pubkeys with the unique values
        this.pubkeys = Array.from(pubkeyMap.values());
        //console.log(tag, `Total pubkeys after loading cache: ${this.pubkeys.length}`);
      } catch (e) {
        console.error(tag, 'Error loading pubkey cache:', e);
        throw e;
      }
    };
    this.clearCache = async function () {
      let tag = `${TAG} | clearCache | `;
      try {
        await this.keepKeySdk.storage
          .clearCollection({ name: 'pubkeys' })
          .catch((error) => console.error('Error clearing pubkeys:', error));

        await this.keepKeySdk.storage
          .clearCollection({ name: 'balances' })
          .catch((error) => console.error('Error clearing balances:', error));

        return true;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.loadBalanceCache = async function (balances) {
      const tag = `${TAG} | loadBalanceCache | `;
      try {
        if (!Array.isArray(balances)) {
          throw new Error('Invalid balances input, expected an array.');
        }

        // Filter balances by enabled blockchains
        const enabledNetworkIds = new Set(this.blockchains);
        const filteredBalances = balances.filter((balance: any) => {
          const networkId = balance.networkId || caipToNetworkId(balance.caip);
          return enabledNetworkIds.has(networkId);
        });

        // Deduplicate by `identifier` field
        const uniqueBalances = new Map();
        for (const balance of [...this.balances, ...filteredBalances]) {
          if (!uniqueBalances.has(balance.identifier)) {
            uniqueBalances.set(balance.identifier, balance);
          }
        }

        // Update this.balances with unique values
        this.balances = Array.from(uniqueBalances.values());

        console.log(tag, `Total balances after loading cache: ${this.balances.length}`);
      } catch (e) {
        console.error(tag, 'Error loading balance cache:', e);
        throw e;
      }
    };
    this.estimateMax = async function (sendPayload: any) {
      try {
        sendPayload.isMax = true;
        let unsignedTx = await this.buildTx(sendPayload);
        console.log('unsignedTx: ', unsignedTx);
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
        console.log(tag, 'signedTx: ', signedTx);
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
        console.log(tag, 'txid: ', txid);
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
        await this.setAssetContext({ caip: swapPayload.caipIn });
        await this.setOutboundAssetContext({ caip: swapPayload.caipOut });
        console.log(tag, 'assetContext: ', this.assetContext);
        console.log(tag, 'outboundAssetContext: ', this.outboundAssetContext);

        if (!this.assetContext || !this.assetContext.networkId)
          throw Error('Invalid networkId for assetContext');
        if (!this.outboundAssetContext || !this.outboundAssetContext.networkId)
          throw Error('Invalid networkId for outboundAssetContext');
        console.log(tag, 'assetContext networkId: ', this.assetContext.networkId);
        console.log(tag, 'outboundAssetContext  networkId: ', this.outboundAssetContext.networkId);

        //get quote
        // Quote fetching logic
        const pubkeys = this.pubkeys.filter((e: any) =>
          e.networks.includes(this.assetContext.networkId),
        );
        let senderAddress = pubkeys[0]?.address || pubkeys[0]?.master;
        if (!senderAddress) throw new Error('senderAddress not found! wallet not connected');
        if (senderAddress.includes('bitcoincash:')) {
          senderAddress = senderAddress.replace('bitcoincash:', '');
        }

        console.log(
          tag,
          'this.outboundAssetContext.networkId',
          this.outboundAssetContext.networkId,
        );
        console.log(tag, 'this.pubkeys: ', this.pubkeys);
        const pubkeysOut = this.pubkeys.filter((e: any) =>
          e.networks.includes(this.outboundAssetContext.networkId),
        );
        console.log(tag, 'pubkeysOut: ', pubkeysOut);
        let recipientAddress = pubkeysOut[0]?.address || pubkeysOut[0]?.master;
        if (!recipientAddress) throw new Error('recipientAddress not found! wallet not connected');
        if (recipientAddress.includes('bitcoincash:')) {
          recipientAddress = recipientAddress.replace('bitcoincash:', '');
        }

        //TODO type safety on amount
        let inputAmount = swapPayload.amount;

        let quote = {
          affiliate: '0x658DE0443259a1027caA976ef9a42E6982037A03',
          sellAsset: this.assetContext,
          sellAmount: inputAmount.toPrecision(8),
          buyAsset: this.outboundAssetContext,
          recipientAddress, // Fill this based on your logic
          senderAddress, // Fill this based on your logic
          slippage: '3',
        };
        console.log(tag, 'quote: ', quote);

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
        console.log('invocationId: ', invocationId);

        console.log('txs: ', selected.quote.txs);
        let txs = selected.quote.txs;
        if (!txs) throw Error('invalid quote!');
        for (let i = 0; i < txs.length; i++) {
          let tx = txs[i];
          console.log(tag, 'tx: ', tx);
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
            console.log(tag, 'unsignedTx: ', unsignedTx);
          }

          let signedTx = await txManager.sign({ caip, unsignedTx });
          console.log(tag, 'signedTx: ', signedTx);

          let payload = {
            networkId: caipToNetworkId(caip),
            serialized: signedTx,
          };
          console.log(tag, 'payload: ', payload);

          let txid = await txManager.broadcast(payload);
          if (txid.error) {
            throw Error('Failed to broadcast transaction! error:' + txid.error);
          }
          console.log(tag, 'txid: ', txid);
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
        console.log(tag, 'sendPayload: ', sendPayload);
        let unsignedTx = await txManager.transfer(sendPayload);
        console.log(tag, 'unsignedTx: ', unsignedTx);

        // Sign the transaction
        let signedTx = await txManager.sign({ caip, unsignedTx });
        console.log(tag, 'signedTx: ', signedTx);
        if (!signedTx) throw Error('Failed to sign transaction!');
        // Broadcast the transaction
        let payload = {
          networkId: caipToNetworkId(caip),
          serialized: signedTx,
        };
        let txid = await txManager.broadcast(payload);
        console.log(tag, 'txid: ', txid);
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
                console.log(
                  tag,
                  `Time from broadcast to detection: ${formatTime(detectedTime - broadcastTime)}`,
                );
              }

              if (txInfo.confirmations >= requiredConfirmations) {
                isConfirmed = true;
                confirmTime = Date.now();

                if (detectedTime !== null && confirmTime !== null) {
                  console.log(
                    tag,
                    `Time from detection to confirmation: ${formatTime(
                      confirmTime - detectedTime,
                    )}`,
                  );
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
              explorer: 'unknown',
              explorerAddressLink: 'unknown',
              explorerTxLink: 'unknown',
            };
            this.assetsMap.set(caip, asset);
            //TODO build from scratch
            //throw Error('unknown asset! ' + caip + ' not found in assetData!');
          }
        }

        //add gas assets to map
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

        const pubkeys: any[] = [];

        for (let i = 0; i < this.blockchains.length; i++) {
          const blockchain = this.blockchains[i];
          //console.log(tag, `Processing blockchain: ${blockchain}`);

          // Filter paths related to the current blockchain
          const pathsForChain = this.paths.filter((path) => path.networks.includes(blockchain));
          //console.log(tag, 'pathsForChain: ', pathsForChain.length);
          for (let j = 0; j < pathsForChain.length; j++) {
            const path = pathsForChain[j];
            //console.log(tag, `Processing path: ${JSON.stringify(path)}`);
            const pubkey = await getPubkey(blockchain, path, this.keepKeySdk, this.context);
            // try{
            //   await this.keepKeySdk.storage
            //     .createPubkey(pubkey)
            //     .catch((error) => console.error('Error creating pubkey:', error));
            // }catch(e){}
            pubkeys.push(pubkey);
          }
        }

        // Merge newly fetched pubkeys with existing ones
        this.pubkeys = [...this.pubkeys, ...pubkeys];
        //console.log(tag, 'Final pubkeys:', pubkeys);

        // Emit event to notify that pubkeys have been set
        this.events.emit('SET_PUBKEYS', pubkeys);

        return pubkeys;
      } catch (error) {
        console.error(tag, 'Error in getPubkeys:', error);
        throw error;
      }
    };
    this.getBalancesForNetworks = async function (networkIds: string[]) {
      const tag = `${TAG} | getBalancesForNetworks | `;
      try {
        const assetQuery: { caip: string; pubkey: string }[] = [];

        for (const networkId of networkIds) {
          let adjustedNetworkId = networkId;

          if (adjustedNetworkId.includes('eip155:')) {
            adjustedNetworkId = 'eip155:*';
          }

          const isEip155 = adjustedNetworkId.includes('eip155');
          const pubkeys = this.pubkeys.filter((pubkey) =>
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

        console.log(tag, 'assetQuery length: ', assetQuery.length);
        console.time('GetPortfolioBalances Response Time');
        let marketInfo = await this.pioneer.GetPortfolioBalances(assetQuery);
        console.timeEnd('GetPortfolioBalances Response Time');

        console.log(tag, 'returned balances: ', marketInfo.data);
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
        console.log(tag, 'networkId:', networkId);
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

        console.log(tag, `Total unique balances after charts update: ${this.balances.length}`);
        return this.balances;
      } catch (e) {
        console.error(tag, 'Error in getCharts:', e);
        throw e;
      }
    };
    this.setContext = async function (context: string) {
      const tag = `${TAG} | setContext | `;
      try {
        this.context = context;
        this.contextType = context.split(':')[0];
        this.events.emit('SET_CONTEXT', context);
        return { success: true };
      } catch (e) {
        console.error(tag, e);
        throw e;
      }
    };
    this.setAssetContext = async function (asset?: any) {
      const tag = `${TAG} | setAssetContext | `;
      try {
        let output: any = { success: false, message: 'Failed to set asset context!' };
        // Accept null
        if (!asset) {
          this.assetContext = null;
          return;
        }

        if (!asset.caip) throw Error('Invalid Asset! missing caip!');
        if (!asset.networkId) asset.networkId = caipToNetworkId(asset.caip);

        // Try to find the asset in the local assetsMap
        let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());

        // If the asset is not found, create a placeholder object
        if (!assetInfo) {
          console.log(tag, 'Building placeholder asset!');
          // Create a placeholder asset if it's not found in Pioneer or locally
          assetInfo = {
            chain: asset.chain || asset.name || 'Unknown Chain',
            decimals: asset.decimals || 18,
            type: asset.caip.includes('eip155') ? 'evm' : asset.type || 'unknown',
            networkId: asset.caip.split('/')[0],
            caip: asset.caip,
            symbol: asset.symbol.toUpperCase() || 'UNKNOWN',
            ticker: asset.symbol.toUpperCase() || 'UNKNOWN',
            sourceList: asset.sourceList || 'placeholder',
            assetId: asset.assetId || asset.caip,
            chainId: asset.chainId || asset.caip.split('/')[0],
            name: asset.name || 'Unknown Asset',
            networkName: asset.networkName || 'Unknown Network',
            precision: asset.precision || 18,
            color: asset.color || '#000000',
            icon: asset.icon || 'https://pioneers.dev/coins/ethereum.png',
            explorer: asset.explorer || '', // Fill with blank if unknown
            explorerAddressLink: asset.explorerAddressLink || asset.explorer + '/address/', // Fill in the explorer link if available
            explorerTxLink: asset.explorerTxLink || asset.explorer + '/tx/', // Fill in transaction explorer link if available
            relatedAssetKey: asset.caip,
            integrations: [],
            providers: asset.providers,
            pubkeys: [], // Set later
            balances: [], // Set later
            infoCoincap: {}, // Empty for now, can be set later
            infoCoingecko: {}, // Empty for now, can be set later
            priceUsd: asset.priceUsd || 0, // Default to 0 if no data
          };
          this.assetsMap.set(asset.caip.toLowerCase(), assetInfo);
          output = { success: true, message: 'Asset added to discovery!', discovery: true };
        }

        // Find related pubkeys
        let networkId = assetInfo.networkId;
        if (networkId.includes('eip155')) networkId = 'eip155:*';
        let pubkeys = this.pubkeys.filter((e: any) => e.networks.includes(networkId));
        assetInfo.pubkeys = pubkeys;

        //
        if (networkId.includes('eip155')) {
          //get providers for caip
          let chainId = asset.caip.split('/')[0].split(':')[1]; // This will get the "1" or "123" part of "eip155:1/slip44:60"
          //console.log(tag, 'chainId: ', chainId);
          try {
            let providers = await this.pioneer.GetEvmNode({ chainId });
            assetInfo.providers = providers?.data?.network;
          } catch (e) {
            console.error('Missing providers for chainId: ', chainId);
          }
        }

        // Find related balances
        let balances = this.balances.filter((b: any) => b.caip === assetInfo.caip);
        assetInfo.balances = balances;

        let priceUsd;
        let balanceTotal = 0;

        for (let i = 0; i < balances.length; i++) {
          let balance = balances[i];
          if (balance.priceUsd && parseFloat(balance.priceUsd) > 0) {
            console.log(tag, 'detected priceUsd from assetInfo');
            console.log(tag, 'balance.priceUsd:', balance.priceUsd);
            priceUsd = balance.priceUsd;
          }
          balanceTotal = balanceTotal + parseFloat(balance.balance);
        }
        assetInfo.valueUsd = (balanceTotal * priceUsd).toString();
        assetInfo.priceUsd = priceUsd;
        assetInfo.balance = balanceTotal.toString();

        // try {
        //   // Get marketInfo for asset, optional: can skip if market info is not needed
        //   let priceData = await this.pioneer.MarketInfo({
        //     caip: assetInfo.caip.toLowerCase(),
        //   });
        //   priceData = priceData?.data || {};
        //   assetInfo = { ...assetInfo, ...priceData };
        // } catch (e) {
        //   console.error(tag, 'Error getting market info: ', e);
        // }

        //console.log(tag, 'Final assetInfo: ', assetInfo);
        this.events.emit('SET_ASSET_CONTEXT', assetInfo);
        this.assetContext = assetInfo;
        output = { success: true, message: 'Asset context set!', asset: assetInfo };
        return output;
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.setOutboundAssetContext = async function (asset: any) {
      const tag = `${TAG} | setOutputAssetContext | `;
      try {
        console.log(tag, '0. asset: ', asset);
        //accept null
        if (!asset) {
          this.outboundAssetContext = null;
          return;
        }
        if (!asset.caip) throw Error('Invalid Asset! missing caip!');
        if (!asset.networkId) asset.networkId = caipToNetworkId(asset.caip);
        if (!asset.networkId) throw Error('Invalid Asset! missing networkId!');
        console.log(tag, '1 asset: ', asset);
        console.log(tag, 'networkId: ', asset.networkId);

        let assetInfo = this.assetsMap.get(asset.caip.toLowerCase());
        // if (!assetInfo) throw Error('Missing assetInfo for caip: ' + asset.caip);
        if (!assetInfo) {
          console.log(tag, 'Building placeholder asset!');
          // Create a placeholder asset if it's not found in Pioneer or locally
          assetInfo = {
            chain: asset.chain || asset.name || 'Unknown Chain',
            decimals: asset.decimals || 18,
            type: asset.caip.includes('eip155') ? 'evm' : asset.type || 'unknown',
            networkId: asset.caip.split('/')[0],
            caip: asset.caip,
            symbol: asset.symbol.toUpperCase() || 'UNKNOWN',
            ticker: asset.symbol.toUpperCase() || 'UNKNOWN',
            sourceList: asset.sourceList || 'placeholder',
            assetId: asset.assetId || asset.caip,
            chainId: asset.chainId || asset.caip.split('/')[0],
            name: asset.name || 'Unknown Asset',
            networkName: asset.networkName || 'Unknown Network',
            precision: asset.precision || 18,
            color: asset.color || '#000000',
            icon: asset.icon || 'https://pioneers.dev/coins/ethereum.png',
            explorer: asset.explorer || '', // Fill with blank if unknown
            explorerAddressLink: asset.explorerAddressLink || asset.explorer + '/address/', // Fill in the explorer link if available
            explorerTxLink: asset.explorerTxLink || asset.explorer + '/tx/', // Fill in transaction explorer link if available
            relatedAssetKey: asset.caip,
            integrations: [],
            providers: asset.providers,
            pubkeys: [], // Set later
            balances: [], // Set later
            infoCoincap: {}, // Empty for now, can be set later
            infoCoingecko: {}, // Empty for now, can be set later
            priceUsd: asset.priceUsd || 0, // Default to 0 if no data
          };
          //TODO: Add asset to discovery
          // try {
          //   this.pioneer.AddAssetToDiscovery(assetInfo);
          // } catch (e) {
          //   console.error(tag, 'Error adding asset to discovery: ', e);
          // }
          // Add asset to assetsMap and DB if it's missing
          this.assetsMap.set(asset.caip.toLowerCase(), assetInfo);
        }
        console.log(tag, 'assetInfo: ', assetInfo);

        //find related pubkeys
        let networkId = assetInfo.networkId;
        if (networkId.includes('eip155')) networkId = 'eip155:*';
        let pubkeys = this.pubkeys.filter((e: any) => e.networks.includes('eip155:*'));
        assetInfo.pubkeys = pubkeys;

        //find related nodes
        let balances = this.balances.filter((b: any) => b.caip === assetInfo.caip);
        assetInfo.balances = balances;

        let priceUsd;
        let balanceTotal = 0;

        for (let i = 0; i < balances.length; i++) {
          let balance = balances[i];
          if (balance.priceUsd && parseFloat(balance.priceUsd) > 0) {
            console.log(tag, 'detected priceUsd from assetInfo');
            console.log(tag, 'balance.priceUsd:', balance.priceUsd);
            priceUsd = balance.priceUsd;
          }
          balanceTotal = balanceTotal + parseFloat(balance.balance);
        }
        assetInfo.valueUsd = (balanceTotal * priceUsd).toString();
        assetInfo.priceUsd = priceUsd;
        assetInfo.balance = balanceTotal.toString();

        console.log(tag, 'CHECKPOINT 1');
        //get marketInfo for asset
        console.log(tag, 'CHECKPOINT 3');
        //this.events.emit('SET_OUTBOUND_ASSET_CONTEXT', assetInfo);
        console.log(tag, 'outboundAssetContext: assetInfo: ', assetInfo);
        this.outboundAssetContext = assetInfo;
        console.log(tag, 'CHECKPOINT 4');

        // try {
        //   let priceData = await this.pioneer.MarketInfo({
        //     caip: assetInfo.caip.toLowerCase(),
        //   });
        //   console.log(tag, 'CHECKPOINT 2');
        //   priceData = priceData?.data || {};
        //   assetInfo = { ...assetInfo, ...priceData };
        // } catch (e) {
        //   console.error(tag, 'Error getting market info: ', e);
        // }

        return { success: true };
      } catch (e) {
        console.error(tag, 'e: ', e);
        throw e;
      }
    };
    this.setContextType = async (contextType: string) => {
      this.contextType = contextType;
      return Promise.resolve({ success: true });
    };
    this.refresh = async () => {
      await this.sync();
      return Promise.resolve({});
    };
    this.verifyWallet = async () => {
      return Promise.resolve();
    };
    this.search = async (query: string, config: any) => {
      return Promise.resolve();
    };
  }
}

export default SDK;
