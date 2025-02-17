import { SDK } from '@coinmasters/pioneer-sdk';
import { availableChainsByWallet, getChainEnumValue, WalletOption } from '@coinmasters/types';
//@ts-ignore
import { caipToNetworkId, ChainToNetworkId } from '@pioneer-platform/pioneer-caip';
import { getPaths } from '@pioneer-platform/pioneer-coins';
import EventEmitter from 'eventemitter3';
import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { ActionTypes, InitialState } from './types';
import { WalletActions } from './types';

const TAG = ' | pioneer-react | ';

const eventEmitter = new EventEmitter();
const initialState: InitialState = {
  status: 'disconnected',
  hardwareError: null,
  openModal: null,
  username: '',
  serviceKey: '',
  queryKey: '',
  context: '',
  contextType: '',
  intent: '',
  assetContext: '',
  blockchainContext: '',
  pubkeyContext: '',
  outboundContext: null,
  outboundAssetContext: null,
  outboundBlockchainContext: null,
  outboundPubkeyContext: null,
  blockchains: [],
  balances: [],
  pubkeys: [],
  assets: new Map(),
  wallets: [],
  walletDescriptions: [],
  totalValueUsd: 0,
  app: null,
  api: null,
};

const reducer = (state: InitialState, action: ActionTypes) => {
  switch (action.type) {
    case WalletActions.SET_STATUS:
      return { ...state, status: action.payload };
    case WalletActions.SET_HARDWARE_ERROR:
      return { ...state, hardwareError: action.payload };
    case WalletActions.SET_USERNAME:
      return { ...state, username: action.payload };
    case WalletActions.OPEN_MODAL:
      return { ...state, openModal: action.payload };
    case WalletActions.SET_API:
      return { ...state, api: action.payload };
    case WalletActions.SET_APP:
      return { ...state, app: action.payload };
    case WalletActions.SET_ASSETS:
      return { ...state, assets: action.payload };
    case WalletActions.SET_BALANCES:
      return { ...state, balances: action.payload };
    case WalletActions.SET_ASSET_CONTEXT:
      return { ...state, assetContext: action.payload };
    case WalletActions.SET_OUTBOUND_ASSET_CONTEXT:
      return { ...state, outboundAssetContext: action.payload };
    case WalletActions.RESET_STATE:
      return initialState;
    default:
      return state;
  }
};

const PioneerContext = createContext<any>(null);

export const PioneerProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  //@ts-ignore
  const [state, dispatch] = useReducer(reducer, initialState);

  const onStart = async (wallets: any, setup: any) => {
    let tag = TAG + ' | onStart | ';
    try {
      if (!setup.appName || !setup.appIcon) throw Error('App name and icon are required!');
      const username = localStorage.getItem('username') || `user:${uuidv4()}`.substring(0, 13);
      localStorage.setItem('username', username);

      const queryKey = localStorage.getItem('queryKey') || `key:${uuidv4()}`;
      localStorage.setItem('queryKey', queryKey);

      let keepkeyApiKey = localStorage.getItem('keepkeyApiKey');
      if (!keepkeyApiKey) keepkeyApiKey = '123';
      console.log(tag, '(from localstorage) keepkeyApiKey: ', keepkeyApiKey);

      const walletType = WalletOption.KEEPKEY;
      const allSupported = availableChainsByWallet[walletType];
      let blockchains = allSupported.map(
        // @ts-ignore
        (chainStr: any) => ChainToNetworkId[getChainEnumValue(chainStr)],
      );
      const paths = getPaths(blockchains);
      const spec =
        setup.spec ||
        localStorage.getItem('pioneerUrl') ||
        'https://pioneers.dev/spec/swagger.json';
      const wss = setup.wss || 'wss://pioneers.dev';

      //@ts-ignore
      console.log(tag, 'spec: ', spec);
      console.log(tag, 'wss: ', wss);

      const appInit = new SDK(spec, {
        spec,
        wss,
        appName: setup.appName,
        appIcon: setup.appIcon,
        blockchains,
        keepkeyApiKey,
        username,
        queryKey,
        paths,
      });

      const api = await appInit.init([], setup);
      localStorage.setItem('keepkeyApiKey', appInit.keepkeyApiKey);
      //@ts-ignore
      dispatch({ type: WalletActions.SET_API, payload: api });
      //@ts-ignore
      dispatch({ type: WalletActions.SET_APP, payload: appInit });

      appInit.getCharts();

      // Set default context (pre-load for swap)
      let assets_enabled = [
        'eip155:1/slip44:60', // ETH
        'bip122:000000000019d6689c085ae165831e93/slip44:0', // BTC
      ];
      const defaultInput = {
        caip: assets_enabled[0],
        networkId: caipToNetworkId(assets_enabled[0]),
      };
      const defaultOutput = {
        caip: assets_enabled[1],
        networkId: caipToNetworkId(assets_enabled[1]),
      };
      await appInit.setAssetContext(defaultInput);
      await appInit.setOutboundAssetContext(defaultOutput);

      appInit.events.on('*', (action: string, data: any) => {
        eventEmitter.emit(action, data);
        console.log(TAG, 'Event:', action, data);
      });

      return appInit.events;
    } catch (e) {
      console.error('Failed to start app!', e);
      throw e;
    }
  };

  const value = useMemo(
    () => ({
      state,
      dispatch,
      onStart,
    }),
    [state],
  );

  return <PioneerContext.Provider value={value}>{children}</PioneerContext.Provider>;
};

export const usePioneer = () => useContext(PioneerContext);
