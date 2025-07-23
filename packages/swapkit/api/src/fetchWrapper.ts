export enum ApiEndpoints {
  CachedPrices = '/api/cached-prices',
  TokenlistProviders = '/api/tokenlist-providers',
  Quote = '/api/quote',
  GasRates = '/api/gas-rates',
  Thorname = '/api/thorname',
  Transaction = '/api/transaction',
}

export class RequestClient {
  static async post<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  static async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'GET',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}