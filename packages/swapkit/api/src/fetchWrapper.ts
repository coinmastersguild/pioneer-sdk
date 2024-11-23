import { ApiUrl } from '@coinmasters/types';
import type { Options } from 'ky';
import ky from 'ky';

/**
 * Api Wrapper helpers
 */
export const ApiEndpoints = {
  CachedPrices: `${ApiUrl.ThorswapApi}/tokenlist/cached-price`,
  GasRates: `${ApiUrl.ThorswapApi}/resource-worker/gasPrice/getAll`,
  Quote: `${ApiUrl.ThorswapApi}/aggregator/tokens/quote`,
  Txn: `${ApiUrl.ThorswapApi}/apiusage/v2/txn`,
  TokenlistProviders: `${ApiUrl.ThorswapApi}/tokenlist/providers`,
  TokenList: `${ApiUrl.ThorswapStatic}/token-list`,
  Thorname: `${ApiUrl.ThorswapApi}/thorname`,
};

// Determine API key: use environment variable if available, otherwise use hardcoded value
const apiKey =
  typeof process !== 'undefined' && process.env['THORSWAP_API_KEY']
    ? process.env['THORSWAP_API_KEY']
    : '8813f69e-13e8-42c3-b90a-9c1c059bdad5';

// Determine referrer: use environment variable if available, otherwise use default value
const referrer =
  typeof process !== 'undefined' && process.env['THORSWAP_API_REFERER']
    ? process.env['THORSWAP_API_REFERER']
    : 'https://pioneers.dev';

// Define headers with 'x-api-key' and 'referrer'
const headers = {
  'x-api-key': apiKey,
  referrer: referrer,
};

const kyClient = ky.create({ headers });

export const RequestClient = {
  get: <T>(url: string | URL | Request, options?: Options) => kyClient.get(url, options).json<T>(),
  post: <T>(url: string | URL | Request, options?: Options) =>
    kyClient.post(url, options).json<T>(),
};
