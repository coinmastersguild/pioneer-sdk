let TIMEOUT = 30000;

export const getCharts = async (blockchains: any, pioneer: any, pubkeys: any, context: string) => {
  const tag = `| getCharts-Internal | `;
  try {
    let balances: any = [];
    pubkeys = pubkeys.filter((e) => e.networks.includes('eip155:*'));
    if (!pubkeys[0]) {
      console.error(tag, 'No ETH address found, not charting');
      return [];
    }

    const address = pubkeys[0].address || pubkeys[0].master;
    if (!address) throw Error('No address found in pubkeys for chain eip155:*');
    // Filter out chains that are not EVM-compatible or are ignored
    // const evmChains = blockchains
    //   .filter((chain) => chain.includes('eip155'))
    //   .filter((chain) => !['eip155:137'].includes(chain.networkId));
    //
    // const withTimeout = (promise, chain) =>
    //   new Promise((resolve) => {
    //     const timer = setTimeout(() => {
    //       console.error(
    //         `${tag} Timeout: NetworkId ${chain} took longer than ${TIMEOUT / 1000} seconds`,
    //       );
    //       resolve({ chain, result: { data: { items: [] } } });
    //     }, TIMEOUT);
    //
    //     promise
    //       .then((result) => {
    //         clearTimeout(timer);
    //         resolve({ chain, result });
    //       })
    //       .catch((error) => {
    //         clearTimeout(timer);
    //         console.error(tag, `Error fetching NFTs for chain ${chain}:`, error);
    //         resolve(null);
    //       });
    //   });

    // for (const chain of evmChains) {
    //   console.time(`${tag} NetworkId ${chain}`);
    //   const { chain: chainId, result } = await withTimeout(
    //     pioneer.GetCovalentNfts({ address, networkId: chain }),
    //     chain,
    //   );
    //
    //   console.timeEnd(`${tag} NetworkId ${chainId}`);
    //
    //   if (result?.data?.items?.length) {
    //     result.data.items.forEach((item) => {
    //       if (item.nft_data) {
    //         item.nft_data.forEach((nft) => {
    //           if (item.contract_address && nft.token_id && nft.external_data) {
    //             const balanceString = {
    //               context: context,
    //               chart: 'covalent',
    //               contextType: context.split(':')[0],
    //               collection: item.contract_name,
    //               caip: `${chainId}/erc721:${item.contract_address}:${nft.token_id}`,
    //               tokenId: nft.token_id,
    //               image: nft.external_data.image,
    //               pubkey: address,
    //               ticker: item.contract_ticker_symbol,
    //               ref: `${context}${chainId}/erc721:${item.contract_address}:${nft.token_id}`,
    //               identifier: 'unsupported',
    //               networkId: chainId,
    //               symbol: item.contract_ticker_symbol,
    //               type: 'nft',
    //               balance: item.balance || 1,
    //               priceUsd: item.floor_price_quote || 0,
    //               valueUsd: item.floor_price_quote || 0,
    //               updated: new Date().getTime(),
    //             };
    //
    //             if (!item.is_spam && blockchains.includes(chainId)) {
    //               const exists = balances.some((b) => b.caip === balanceString.caip);
    //               if (!exists) {
    //                 balances.push(balanceString);
    //               }
    //             }
    //           }
    //         });
    //       }
    //     });
    //   }
    // }

    try {
      let portfolio = await pioneer.GetPortfolio({ address });
      portfolio = portfolio.data;
      //console.log(tag, 'portfolio: ', portfolio);

      if (portfolio && portfolio.balances) {
        for (const balance of portfolio.balances) {
          if (balance.caip && balance.networkId && blockchains.includes(balance.networkId)) {
            balance.context = context;
            balance.identifier = context + ':' + balance.caip;
            balance.contextType = 'keepkey';
            balance.pubkey = address;
            balance.chain = balance.networkId;
            balance.balance = balance.balance.toString();
            balance.valueUsd = balance.valueUsd.toString();
            // Check if a balance with the same caip already exists
            const existingBalance = balances.find((b) => b.caip === balance.caip);
            if (balance.display)
              balance.icon = ['multi', balance.icon, balance.display.toString()].toString();
            if (existingBalance) {
              console.error(tag, 'Duplicate CAIP found:', {
                existingBalance,
                duplicateBalance: balance,
              });
            } else {
              balances.push(balance);
            }
          } else {
            if (blockchains.includes(balance.networkId))
              console.error(tag, 'Invalid balance:', balance);
          }
        }

        // for (const token of portfolio.tokens) {
        //   console.log(tag, 'token: ', token);
        //   if (token.assetCaip && token.networkId) {
        //     const balanceString = {
        //       context: context,
        //       chart: 'zapier',
        //       contextType: context.split(':')[0],
        //       name: token.token.coingeckoId,
        //       caip: token.assetCaip,
        //       icon: '',
        //       pubkey: address,
        //       ticker: token.token.symbol,
        //       ref: `${context}${token.assetCaip}`,
        //       networkId: token.networkId.split('/')[0] || token.networkId,
        //       symbol: token.token.symbol,
        //       type: 'token',
        //       balance: token.token.balance.toString(),
        //       priceUsd: token.token.price || 0,
        //       valueUsd: token.token.balanceUSD,
        //       updated: new Date().getTime(),
        //     };
        //
        //     if (blockchains.includes(balanceString.networkId)) {
        //       console.log(tag, 'WINNING! balances match!!! saving!!!! ', balanceString);
        //       balances.push(balanceString);
        //       // const exists = balances.some((b) => b.caip === balanceString.caip);
        //       // if (!exists) {
        //       //   console.log(tag,'adding balance!', balanceString)
        //       //   balances.push(balanceString);
        //       // } else {
        //       //   //already exists!
        //       // }
        //     } else {
        //       console.error(tag, 'network not live in blockchains:', balanceString.networkId);
        //     }
        //   } else {
        //     console.error(tag, 'Invalid token:', token);
        //   }
        // }
      } else {
        console.error(tag, 'No portfolio.balances found:', portfolio);
      }
    } catch (e) {
      console.error(tag, 'Error fetching portfolio:', e);
    }

    return balances;
  } catch (error) {
    console.error(tag, 'Error processing path:', error);
    throw error;
  }
};
