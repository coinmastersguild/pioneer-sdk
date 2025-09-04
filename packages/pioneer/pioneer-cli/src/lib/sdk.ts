import * as SDK from '@coinmasters/pioneer-sdk';
import { WalletOption, Chain } from '@coinmasters/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.pioneer', 'cli-config.json');

export class PioneerSDK {
  private app: any;
  private config: any;
  
  constructor() {
    // Load config
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      } catch (error) {
        this.config = {};
      }
    } else {
      this.config = {};
    }
  }
  
  async init() {
    const queryKey = `pioneer-cli:${Date.now()}`;
    const username = `cli-user:${Math.random()}`;
    
    const blockchains = (this.config.chains || ['ETH', 'BTC', 'AVAX', 'BASE', 'BSC', 'MATIC'])
      .map((chainStr: string) => chainStr as Chain);
    
    const sdkConfig: any = {
      appName: "Pioneer CLI",
      appIcon: "https://pioneers.dev/coins/keepkey.png",
      username,
      queryKey,
      spec: this.config.specUrl || 'https://pioneers.dev/spec/swagger.json',
      paths: [],
      blockchains,
      interfaces: ['rest'],
      disableDiscovery: true,
      verbose: this.config.verbose || false,
      keepkeyApiKey: this.config.apiKey || process.env.KEEPKEY_API_KEY || '123'
    };
    
    this.app = new SDK.SDK(sdkConfig.spec, sdkConfig);
    await this.app.init();
    
    // Auto-pair with configured wallet if set
    if (this.config.walletType) {
      const walletMap: Record<string, WalletOption> = {
        'keepkey': WalletOption.KEEPKEY,
        'metamask': WalletOption.METAMASK,
        'keplr': WalletOption.KEPLR
      };
      
      const walletOption = walletMap[this.config.walletType];
      if (walletOption) {
        await this.pairWallet(walletOption);
      }
    }
  }
  
  async pairWallet(walletOption: WalletOption) {
    return await this.app.pairWallet(walletOption);
  }
  
  async getPortfolio(options?: { deviceId?: string; refresh?: boolean }) {
    // Get portfolio data
    const balances = await this.app.getBalances();
    
    // Calculate totals
    const totalValueUsd = balances.reduce((sum: number, b: any) => sum + (b.valueUsd || 0), 0);
    
    // Group by device if available
    const devices: any[] = [];
    const deviceMap = new Map<string, any[]>();
    
    balances.forEach((balance: any) => {
      const deviceId = balance.deviceId || 'default';
      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, []);
      }
      deviceMap.get(deviceId)!.push(balance);
    });
    
    deviceMap.forEach((deviceBalances, deviceId) => {
      const deviceTotal = deviceBalances.reduce((sum: number, b: any) => sum + (b.valueUsd || 0), 0);
      devices.push({
        label: deviceId,
        shortId: deviceId.substring(0, 8),
        totalValueUsd: deviceTotal,
        balanceCount: deviceBalances.length
      });
    });
    
    return {
      totalValueUsd,
      pairedDevices: devices.length,
      devices,
      balances
    };
  }
  
  async getBalances() {
    return await this.app.getBalances();
  }
  
  async getPubkeys() {
    return await this.app.getPubkeys();
  }
  
  async getWalletStatus() {
    const context = await this.app.context;
    const balances = await this.app.getBalances();
    
    return {
      connected: !!context,
      walletType: context?.walletType || null,
      pairedDevices: 1, // TODO: Get actual device count
      balanceCount: balances.length
    };
  }
}