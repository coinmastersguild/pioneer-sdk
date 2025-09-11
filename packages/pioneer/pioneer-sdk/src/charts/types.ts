export interface ChartBalance {
  context: string;
  chart: string;
  contextType: string;
  name: string;
  caip: string;
  icon: string;
  pubkey: string;
  ticker: string;
  ref: string;
  identifier: string;
  networkId: string;
  chain?: string;
  symbol: string;
  type: string;
  token?: boolean;  // Indicates if this is a token balance
  decimal?: number;
  balance: string;
  priceUsd: number;
  valueUsd: number | string;
  updated: number;
  display?: string;
  status?: string;
  validator?: string;
}

export interface ChartParams {
  blockchains: string[];
  pioneer: any;
  pubkeys: any[];
  context: string;
}

export interface PortfolioBalance {
  caip: string;
  networkId?: string;
  pubkey?: string;
  balance: string | number;
  valueUsd: string | number;
  name?: string;
  symbol?: string;
  icon?: string;
  decimal?: number;
  type?: string;
  display?: string;
}

export interface PortfolioToken {
  assetCaip: string;
  networkId?: string;
  pubkey?: string;
  token?: {
    name?: string;
    symbol?: string;
    icon?: string;
    coingeckoId?: string;
    decimal?: number;
    balance?: string | number;
    price?: number;
    balanceUSD?: number;
  };
}

export interface StakingPosition {
  caip: string;
  balance: number;
  priceUsd?: number;
  valueUsd?: number;
  name?: string;
  icon?: string;
  ticker?: string;
  symbol?: string;
  type?: string;
  status?: string;
  validatorAddress?: string;
  validator?: string;
}