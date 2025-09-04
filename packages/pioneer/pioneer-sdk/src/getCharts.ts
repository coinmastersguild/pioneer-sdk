let TIMEOUT = 30000;

export const getCharts = async (blockchains: any, pioneer: any, pubkeys: any, context: string) => {
  const tag = `| getCharts-Internal | `;
  try {
    let balances: any = [];
    
    // Find the primary address for portfolio lookup
    // Prefer EVM address if available, but don't filter out other pubkeys
    const evmPubkey = pubkeys.find((e: any) => e.networks.includes('eip155:*'));
    const primaryAddress = evmPubkey?.address || evmPubkey?.master || pubkeys[0]?.address || pubkeys[0]?.master;
    
    if (!primaryAddress) {
      console.error(tag, 'No address found for portfolio lookup');
      return [];
    }

    console.log(tag, 'Using primary address for portfolio:', primaryAddress);
    console.log(tag, 'Total pubkeys available:', pubkeys.length);
    console.log(tag, 'Blockchains to process:', blockchains);

    try {
      let portfolio = await pioneer.GetPortfolio({ address: primaryAddress });
      portfolio = portfolio.data;
      console.log(tag, 'portfolio: ', portfolio);

      if (portfolio && portfolio.balances) {
        for (const balance of portfolio.balances) {
          if (balance.caip && balance.networkId && blockchains.includes(balance.networkId)) {
            balance.context = context;
            balance.identifier = balance.caip + ':' + primaryAddress;
            balance.contextType = 'keepkey';
            balance.pubkey = primaryAddress;
            balance.chain = balance.networkId;
            balance.balance = balance.balance.toString();
            balance.valueUsd = balance.valueUsd.toString();
            // Check if a balance with the same caip already exists
            const existingBalance = balances.find(
              (b: any) => b.caip + ':' + b.pubkey === balance.caip + ':' + balance.pubkey,
            );
            if (balance.display)
              balance.icon = ['multi', balance.icon, balance.display.toString()].toString();
            if (existingBalance) {
              // console.error(tag, 'Duplicate CAIP found:', {
              //   existingBalance,
              //   duplicateBalance: balance,
              // });
            } else {
              balances.push(balance);
            }
          } else {
            if (blockchains.includes(balance.networkId))
              console.error(tag, 'Invalid balance:', balance);
          }
        }

        // Process tokens from portfolio (if they exist)
        if (portfolio.tokens && portfolio.tokens.length > 0) {
          console.log(tag, 'Processing portfolio.tokens:', portfolio.tokens.length);
          
          // Debug: Log all tokens to see what we're getting
          console.log(tag, 'DEBUG: All tokens from portfolio:');
          portfolio.tokens.forEach((token: any, index: number) => {
            console.log(tag, `DEBUG: Token ${index}:`, {
              assetCaip: token.assetCaip,
              networkId: token.networkId,
              symbol: token.token?.symbol,
              balance: token.token?.balance,
              balanceUSD: token.token?.balanceUSD,
              isMayaRelated: token.assetCaip && (
                token.assetCaip.includes('maya') || 
                token.assetCaip.includes('MAYA') ||
                token.assetCaip.includes('cosmos:mayachain') ||
                token.token?.symbol === 'MAYA' ||
                token.token?.symbol === 'CACAO'
              )
            });
          });
          
          for (const token of portfolio.tokens) {
            //console.log(tag, 'token: ', token);
            if (token.assetCaip && token.networkId) {
              // Extract the networkId from the assetCaip for special token formats like MAYA
              let extractedNetworkId = token.networkId;
              
              // Special handling for MAYA tokens with slip44:maya format
              if (token.assetCaip.includes('/slip44:maya')) {
                // Extract the network part before /slip44:maya
                const parts = token.assetCaip.split('/slip44:maya');
                if (parts.length > 0) {
                  extractedNetworkId = parts[0];
                }
              } else if (token.networkId && token.networkId.includes('/')) {
                // For other tokens, split by / and take the first part
                extractedNetworkId = token.networkId.split('/')[0];
              }
              
              const balanceString = {
                context: context,
                chart: 'pioneer',
                contextType: context.split(':')[0],
                name: token.token?.coingeckoId || token.token?.name || 'Unknown',
                caip: token.assetCaip,
                icon: token.token?.icon || '',
                pubkey: primaryAddress,
                ticker: token.token?.symbol || 'UNK',
                ref: `${context}${token.assetCaip}`,
                identifier: token.assetCaip + ':' + primaryAddress,
                networkId: extractedNetworkId,
                symbol: token.token?.symbol || 'UNK',
                type: 'token',
                balance: token.token?.balance?.toString() || '0',
                priceUsd: token.token?.price || 0,
                valueUsd: token.token?.balanceUSD || 0,
                updated: new Date().getTime(),
              };

              // Debug logging for MAYA tokens
              if (token.assetCaip.includes('maya') || token.assetCaip.includes('MAYA')) {
                console.log(tag, 'Processing MAYA token:', {
                  assetCaip: token.assetCaip,
                  originalNetworkId: token.networkId,
                  extractedNetworkId: extractedNetworkId,
                  blockchains: blockchains,
                  isIncluded: blockchains.includes(extractedNetworkId)
                });
              }

              if (blockchains.includes(balanceString.networkId)) {
                //console.log(tag, 'WINNING! balances match!!! saving!!!! ', balanceString);
                // Check if already exists
                const exists = balances.some((b: any) => b.caip === balanceString.caip && b.pubkey === balanceString.pubkey);
                if (!exists) {
                  balances.push(balanceString);
                  // Debug: Log when MAYA token is added
                  if (token.assetCaip.includes('maya') || token.assetCaip.includes('MAYA')) {
                    console.log(tag, 'DEBUG: Successfully added MAYA token to balances');
                  }
                }
              } else {
                console.error(tag, 'network not live in blockchains:', balanceString.networkId);
                // Debug: Log when MAYA token is filtered out
                if (token.assetCaip.includes('maya') || token.assetCaip.includes('MAYA')) {
                  console.error(tag, 'DEBUG: MAYA token filtered out - network not in blockchains');
                }
              }
            } else {
              console.error(tag, 'Invalid token:', token);
            }
          }
        }
      } else {
        console.error(tag, 'No portfolio.balances found:', portfolio);
      }
    } catch (e) {
      console.error(tag, 'Error fetching portfolio:', e);
    }

    // WORKAROUND: Check if MAYA tokens are missing and fetch them separately
    try {
      // Check if we have a MAYA address
      const mayaPubkey = pubkeys.find((p: any) => p.networks.includes('cosmos:mayachain-mainnet-v1'));
      if (mayaPubkey && mayaPubkey.address) {
        // Check if MAYA token is already in balances
        const hasMayaToken = balances.some((b: any) => 
          b.caip === 'cosmos:mayachain-mainnet-v1/slip44:maya'
        );
        
        if (!hasMayaToken && blockchains.includes('cosmos:mayachain-mainnet-v1')) {
          console.log(tag, 'MAYA token not found in portfolio, fetching separately...');
          console.log(tag, 'MAYA pubkey address:', mayaPubkey.address);
          
          // Try to get MAYA token balance via a separate call
          // This is a workaround for the portfolio API not returning MAYA tokens
          try {
            // First try GetPortfolioBalances with MAYA token CAIP
            const mayaBalanceResponse = await pioneer.GetPortfolioBalances([
              { 
                caip: 'cosmos:mayachain-mainnet-v1/slip44:maya', 
                pubkey: mayaPubkey.address 
              }
            ]);
            
            console.log(tag, 'MAYA balance response:', JSON.stringify(mayaBalanceResponse?.data, null, 2));
            
            if (mayaBalanceResponse?.data && mayaBalanceResponse.data.length > 0) {
              console.log(tag, 'Found MAYA token balances:', mayaBalanceResponse.data.length);
              
              for (const mayaBalance of mayaBalanceResponse.data) {
                if (mayaBalance.caip === 'cosmos:mayachain-mainnet-v1/slip44:maya') {
                  const mayaTokenBalance = {
                    context: context,
                    chart: 'pioneer',
                    contextType: context.split(':')[0],
                    name: 'Maya Token',
                    caip: mayaBalance.caip,
                    icon: 'https://pioneers.dev/coins/maya.png',
                    pubkey: mayaPubkey.address,
                    ticker: 'MAYA',
                    ref: `${context}${mayaBalance.caip}`,
                    identifier: mayaBalance.caip + ':' + mayaPubkey.address,
                    networkId: 'cosmos:mayachain-mainnet-v1',
                    symbol: 'MAYA',
                    type: 'token',
                    balance: mayaBalance.balance?.toString() || '0',
                    priceUsd: parseFloat(mayaBalance.priceUsd) || 0,
                    valueUsd: parseFloat(mayaBalance.valueUsd) || 0,
                    updated: new Date().getTime(),
                  };
                  
                  console.log(tag, 'Adding MAYA token to balances:', mayaTokenBalance);
                  balances.push(mayaTokenBalance);
                } else {
                  console.log(tag, 'Unexpected balance in MAYA response:', mayaBalance);
                }
              }
            } else {
              console.log(tag, 'No MAYA token balance returned from GetPortfolioBalances API');
            }
          } catch (mayaError) {
            console.error(tag, 'Error fetching MAYA token balance:', mayaError);
          }
        } else if (!hasMayaToken) {
          console.log(tag, 'MAYA network not in blockchains list, skipping MAYA token fetch');
        }
      }
    } catch (e) {
      console.error(tag, 'Error in MAYA token workaround:', e);
    }

    return balances;
  } catch (error) {
    console.error(tag, 'Error processing path:', error);
    throw error;
  }
};
