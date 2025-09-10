import { assetData } from '@pioneer-platform/pioneer-discovery';
import { ChartBalance } from './types';

export function hydrateAssetData(caip: string): any {
  return assetData[caip] || assetData[caip.toLowerCase()];
}

export function checkDuplicateBalance(
  balances: ChartBalance[],
  caip: string,
  pubkey: string,
  validator?: string
): boolean {
  return balances.some(
    (b) =>
      b.caip === caip &&
      b.pubkey === pubkey &&
      (!validator || b.validator === validator)
  );
}

export function createBalanceIdentifier(caip: string, pubkey: string): string {
  return `${caip}:${pubkey}`;
}