declare module '@pioneer-platform/pioneer-caip' {
  export const NetworkIdToChain: any;
  export const ChainToNetworkId: any;
  export function caipToNetworkId(caip: string): any;
  export function networkIdToCaip(networkId: string): any;
  export function shortListSymbolToCaip(symbol: string): any;
}
