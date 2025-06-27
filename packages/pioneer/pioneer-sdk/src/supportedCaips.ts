// supportedCaips.ts

export const UTXO_SUPPORT = [
  'bip122:000000000019d6689c085ae165831e93/slip44:0', // BTC
  'bip122:000000000000000000651ef99cb9fcbe/slip44:145', // BCH
  'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5', // DASH
  'bip122:00000000001a91e3dace36e2be3bf030/slip44:3', // DOGE
  'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2', // LTC
];

export const TENDERMINT_SUPPORT = [
  'cosmos:mayachain-mainnet-v1/slip44:931', // CACAO (native)
  'cosmos:mayachain-mainnet-v1/denom:maya', // MAYA token
  'cosmos:osmosis-1/slip44:118',
  'cosmos:cosmoshub-4/slip44:118',
  'cosmos:kaiyo-1/slip44:118',
  'cosmos:thorchain-mainnet-v1/slip44:931',
];

// Mapping of CAIP identifiers to KeepKey coin names for UTXO chains
export const CAIP_TO_COIN_MAP: { [key: string]: string } = {
  'bip122:000000000019d6689c085ae165831e93/slip44:0': 'Bitcoin',
  'bip122:000000000000000000651ef99cb9fcbe/slip44:145': 'BitcoinCash',
  'bip122:000007d91d1254d60e2dd1ae58038307/slip44:5': 'Dash',
  'bip122:00000000001a91e3dace36e2be3bf030/slip44:3': 'Dogecoin',
  'bip122:12a765e31ffd4059bada1e25190f6e98/slip44:2': 'Litecoin',
};

export const OTHER_SUPPORT = ['ripple:4109c6f2045fc7eff4cde8f9905d19c2/slip44:144'];

export const SUPPORTED_CAIPS = {
  UTXO: UTXO_SUPPORT,
  TENDERMINT: TENDERMINT_SUPPORT,
  EIP155: ['eip155:*'],
  OTHER: OTHER_SUPPORT,
};
