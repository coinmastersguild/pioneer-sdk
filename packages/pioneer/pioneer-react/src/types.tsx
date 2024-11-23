export enum WalletActions {
  SET_STATUS = 'SET_STATUS',
  SET_USERNAME = 'SET_USERNAME',
  OPEN_MODAL = 'OPEN_MODAL',
  SET_API = 'SET_API',
  SET_APP = 'SET_APP',
  SET_WALLETS = 'SET_WALLETS',
  SET_CONTEXT = 'SET_CONTEXT',
  SET_CONTEXT_TYPE = 'SET_CONTEXT_TYPE',
  SET_INTENT = 'SET_INTENT',
  SET_ASSET_CONTEXT = 'SET_ASSET_CONTEXT',
  SET_ASSETS = 'SET_ASSETS',
  SET_NFTS = 'SET_NFTS',
  SET_BLOCKCHAIN_CONTEXT = 'SET_BLOCKCHAIN_CONTEXT',
  SET_PUBKEY_CONTEXT = 'SET_PUBKEY_CONTEXT',
  SET_OUTBOUND_CONTEXT = 'SET_OUTBOUND_CONTEXT',
  SET_OUTBOUND_ASSET_CONTEXT = 'SET_OUTBOUND_ASSET_CONTEXT',
  SET_OUTBOUND_BLOCKCHAIN_CONTEXT = 'SET_OUTBOUND_BLOCKCHAIN_CONTEXT',
  SET_OUTBOUND_PUBKEY_CONTEXT = 'SET_OUTBOUND_PUBKEY_CONTEXT',
  SET_BLOCKCHAINS = 'SET_BLOCKCHAINS',
  SET_BALANCES = 'SET_BALANCES',
  SET_PUBKEYS = 'SET_PUBKEYS',
  SET_HARDWARE_ERROR = 'SET_HARDWARE_ERROR',
  ADD_WALLET = 'ADD_WALLET',
  RESET_STATE = 'RESET_STATE',
}

export interface InitialState {
  status: string | null;
  hardwareError: string | null;
  openModal: string | null;
  username: string | null;
  serviceKey: string;
  queryKey: string;
  context: string | null;
  contextType: string | null;
  intent: string | null;
  assetContext: string | null;
  blockchainContext: string;
  pubkeyContext: string | null;
  outboundContext: string | null;
  outboundAssetContext: string | null;
  outboundBlockchainContext: string | null;
  outboundPubkeyContext: string | null;
  blockchains: string[];
  balances: any[];
  pubkeys: any[];
  assets: Map<string, any>;
  wallets: any[];
  walletDescriptions: any[];
  totalValueUsd: number;
  app: any;
  api: any;
}

export type ActionTypes =
  | { type: WalletActions.SET_STATUS; payload: string }
  | { type: WalletActions.SET_USERNAME; payload: string }
  | { type: WalletActions.OPEN_MODAL; payload: string | null }
  | { type: WalletActions.SET_HARDWARE_ERROR; payload: string | null }
  | { type: WalletActions.SET_APP; payload: any }
  | { type: WalletActions.SET_API; payload: any }
  | { type: WalletActions.SET_INTENT; payload: string }
  | { type: WalletActions.SET_WALLETS; payload: any[] }
  | { type: WalletActions.SET_CONTEXT; payload: string }
  | { type: WalletActions.SET_CONTEXT_TYPE; payload: string }
  | { type: WalletActions.SET_ASSET_CONTEXT; payload: string }
  | { type: WalletActions.SET_NFTS; payload: any }
  | { type: WalletActions.SET_BLOCKCHAIN_CONTEXT; payload: string }
  | { type: WalletActions.SET_PUBKEY_CONTEXT; payload: string | null }
  | { type: WalletActions.SET_OUTBOUND_CONTEXT; payload: string | null }
  | { type: WalletActions.SET_OUTBOUND_ASSET_CONTEXT; payload: string | null }
  | { type: WalletActions.SET_OUTBOUND_BLOCKCHAIN_CONTEXT; payload: string | null }
  | { type: WalletActions.SET_OUTBOUND_PUBKEY_CONTEXT; payload: string | null }
  | { type: WalletActions.SET_BLOCKCHAINS; payload: string[] }
  | { type: WalletActions.SET_BALANCES; payload: any[] }
  | { type: WalletActions.SET_ASSETS; payload: any[] }
  | { type: WalletActions.SET_PUBKEYS; payload: any[] }
  | { type: WalletActions.ADD_WALLET; payload: any }
  | { type: WalletActions.RESET_STATE; payload: null };
