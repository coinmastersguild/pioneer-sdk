import { assetData } from '@pioneer-platform/pioneer-discovery';

let TIMEOUT = 30000;

export const getCharts = async (blockchains: any, pioneer: any, pubkeys: any, context: string) => {
  const tag = `| getCharts-Internal | `;
  try {
    let balances: any = [];
    console.log(tag, 'init')
    // Find the primary address for portfolio lookup
    // ONLY use EVM addresses since the portfolio endpoint uses Zapper which only supports Ethereum
    const evmPubkey = pubkeys.find((e: any) => e.networks && Array.isArray(e.networks) && e.networks.includes('eip155:*'));
    const primaryAddress = evmPubkey?.address || evmPubkey?.master;
    
    console.log(tag, 'Total pubkeys available:', pubkeys.length);
    console.log(tag, 'Blockchains to process:', blockchains);

    // Only call portfolio endpoint if we have an EVM address (Zapper requirement)
    if (primaryAddress) {
      console.log(tag, 'Using EVM address for portfolio:', primaryAddress);
      
      try {
        let portfolio = await pioneer.GetPortfolio({ address: primaryAddress });
        portfolio = portfolio.data;

      if (portfolio && portfolio.balances) {
        for (const balance of portfolio.balances) {
          if (!balance.caip) {
              console.error(tag, 'No caip found for: ',balance);
              continue;
          }
          
          // Always derive networkId from CAIP
          const networkId = balance.caip.split('/')[0];
          balance.networkId = networkId;
          
          // Skip if not in requested blockchains
          if (!blockchains.includes(networkId)) continue;
          
          // Hydrate with assetData
          const assetInfo = assetData[balance.caip] || assetData[balance.caip.toLowerCase()];
          if (assetInfo) {
            // Add metadata from assetData
            balance.name = assetInfo.name || balance.name;
            balance.symbol = assetInfo.symbol || balance.symbol;
            balance.icon = assetInfo.icon || balance.icon;
            balance.decimal = assetInfo.decimal || balance.decimal;
            balance.type = assetInfo.type || balance.type;
          }
          
          // Set required fields
          balance.context = context;
          balance.contextType = 'keepkey';
          balance.chain = networkId;
          balance.balance = balance.balance.toString();
          balance.valueUsd = balance.valueUsd.toString();
          
          // CRITICAL FIX: Use the original balance.pubkey from API if it exists, 
          // otherwise fall back to primaryAddress. This ensures identifier consistency
          // with regular balance fetching which uses the API's balance.pubkey value.
          const balancePubkey = balance.pubkey || primaryAddress;
          balance.pubkey = balancePubkey;
          balance.identifier = balance.caip + ':' + balancePubkey;
          
          // Check if a balance with the same caip already exists
          const existingBalance = balances.find(
            (b: any) => b.caip + ':' + b.pubkey === balance.caip + ':' + balance.pubkey,
          );
          
          if (balance.display)
            balance.icon = ['multi', balance.icon, balance.display.toString()].toString();
            
          if (!existingBalance) {
            balances.push(balance);
          }
        }

        // Process tokens from portfolio (if they exist)
        if (portfolio.tokens && portfolio.tokens.length > 0) {
          console.log(tag, 'Processing portfolio.tokens:', portfolio.tokens.length);
          
          for (const token of portfolio.tokens) {
            if (token.assetCaip && token.networkId) {
              // Extract the networkId from the assetCaip for special token formats like MAYA
              let extractedNetworkId = token.networkId;
              
                        // Special handling for MAYA tokens with denom:maya format
          if (token.assetCaip.includes('/denom:maya')) {
            // Extract the network part before /denom:maya
            const parts = token.assetCaip.split('/denom:maya');
                if (parts.length > 0) {
                  extractedNetworkId = parts[0];
                }
              } else if (token.networkId && token.networkId.includes('/')) {
                // For other tokens, split by / and take the first part
                extractedNetworkId = token.networkId.split('/')[0];
              }
              
              // Hydrate token with assetData
              const tokenAssetInfo = assetData[token.assetCaip] || assetData[token.assetCaip.toLowerCase()];
              
              // CRITICAL FIX: Use consistent pubkey for tokens too
              const tokenPubkey = token.pubkey || primaryAddress;
              
              const balanceString = {
                context: context,
                chart: 'pioneer',
                contextType: context.split(':')[0],
                name: tokenAssetInfo?.name || token.token?.coingeckoId || token.token?.name || 'Unknown',
                caip: token.assetCaip,
                icon: tokenAssetInfo?.icon || token.token?.icon || '',
                pubkey: tokenPubkey,
                ticker: tokenAssetInfo?.symbol || token.token?.symbol || 'UNK',
                ref: `${context}${token.assetCaip}`,
                identifier: token.assetCaip + ':' + tokenPubkey,
                networkId: token.assetCaip.caip.split('/')[0],
                symbol: tokenAssetInfo?.symbol || token.token?.symbol || 'UNK',
                type: tokenAssetInfo?.type || 'token',
                decimal: tokenAssetInfo?.decimal || token.token?.decimal,
                balance: token.token?.balance?.toString() || '0',
                priceUsd: token.token?.price || 0,
                valueUsd: token.token?.balanceUSD || 0,
                updated: new Date().getTime(),
              };

              if (blockchains.includes(balanceString.networkId)) {
                // Check if already exists
                const exists = balances.some((b: any) => b.caip === balanceString.caip && b.pubkey === balanceString.pubkey);
                if (!exists) {
                  balances.push(balanceString);
                }
              }
            }
          }
        }
        } else {
          console.error(tag, 'No portfolio.balances found:', portfolio);
        }
      } catch (e) {
        console.error(tag, 'Error fetching portfolio:', e);
      }
    } else {
      console.log(tag, 'No EVM address found, skipping portfolio lookup (Zapper only supports Ethereum)');
    }

    // WORKAROUND: Check if MAYA tokens are missing and fetch them separately
    try {
      // Check if we have a MAYA address
      const mayaPubkey = pubkeys.find((p: any) => p.networks && Array.isArray(p.networks) && p.networks.includes('cosmos:mayachain-mainnet-v1'));
      if (mayaPubkey && mayaPubkey.address) {
        // Check if MAYA token is already in balances
        const hasMayaToken = balances.some((b: any) => 
                        b.caip === 'cosmos:mayachain-mainnet-v1/denom:maya'
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
                caip: 'cosmos:mayachain-mainnet-v1/denom:maya', 
                pubkey: mayaPubkey.address 
              }
            ]);
            
            console.log(tag, 'MAYA balance response:', JSON.stringify(mayaBalanceResponse?.data, null, 2));
            
            if (mayaBalanceResponse?.data && mayaBalanceResponse.data.length > 0) {
              console.log(tag, 'Found MAYA token balances:', mayaBalanceResponse.data.length);
              
              for (const mayaBalance of mayaBalanceResponse.data) {
                if (mayaBalance.caip === 'cosmos:mayachain-mainnet-v1/denom:maya') {
                  // Hydrate MAYA token with assetData
                  const mayaAssetInfo = assetData[mayaBalance.caip] || assetData[mayaBalance.caip.toLowerCase()];
                  
                  const mayaTokenBalance = {
                    context: context,
                    chart: 'pioneer',
                    contextType: context.split(':')[0],
                    name: mayaAssetInfo?.name || 'Maya Token',
                    caip: mayaBalance.caip,
                    icon: mayaAssetInfo?.icon || 'https://pioneers.dev/coins/maya.png',
                    pubkey: mayaPubkey.address,
                    ticker: mayaAssetInfo?.symbol || 'MAYA',
                    ref: `${context}${mayaBalance.caip}`,
                    identifier: mayaBalance.caip + ':' + mayaPubkey.address,
                    networkId: 'cosmos:mayachain-mainnet-v1',
                    symbol: mayaAssetInfo?.symbol || 'MAYA',
                    type: mayaAssetInfo?.type || 'token',
                    decimal: mayaAssetInfo?.decimal,
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

    // Add Cosmos Staking Positions to charts
    try {
      console.log(tag, 'Adding Cosmos staking positions to charts...');
      
      // Find cosmos pubkeys that could have staking positions
      const cosmosPubkeys = pubkeys.filter((p: any) => 
        p.networks && Array.isArray(p.networks) && p.networks.some((n: string) => n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis'))
      );
      
      if (cosmosPubkeys.length > 0) {
        console.log(tag, 'Found cosmos pubkeys for staking:', cosmosPubkeys.length);
        
        for (const cosmosPubkey of cosmosPubkeys) {
          if (cosmosPubkey.address) {
            // Check which cosmos networks this pubkey supports
            const cosmosNetworks = cosmosPubkey.networks.filter((n: string) => 
              n.includes('cosmos:cosmoshub') || n.includes('cosmos:osmosis')
            );
            
            for (const networkId of cosmosNetworks) {
              // Only process if this network is in our blockchains list
              if (blockchains.includes(networkId)) {
                try {
                  console.log(tag, `Fetching staking positions for ${cosmosPubkey.address} on ${networkId}...`);
                  
                  // Convert networkId to network name for API
                  let network;
                  if (networkId === 'cosmos:cosmoshub-4') {
                    network = 'cosmos';
                  } else if (networkId === 'cosmos:osmosis-1') {
                    network = 'osmosis';
                  } else {
                    console.error(tag, `Unsupported networkId for staking: ${networkId}`);
                    continue;
                  }
                  
                  // Get staking positions from pioneer server
                  const stakingResponse = await pioneer.GetStakingPositions({
                    network: network,
                    address: cosmosPubkey.address
                  });
                  
                  if (stakingResponse?.data && Array.isArray(stakingResponse.data)) {
                    console.log(tag, `Found ${stakingResponse.data.length} staking positions for ${networkId}`);
                    
                    for (const position of stakingResponse.data) {
                      // Validate position has required fields
                      if (position.balance && position.balance > 0 && position.caip) {
                        // Hydrate staking position with assetData
                        const stakingAssetInfo = assetData[position.caip] || assetData[position.caip.toLowerCase()];
                        
                        const stakingBalance = {
                          context: context,
                          chart: 'staking',
                          contextType: context.split(':')[0],
                          name: stakingAssetInfo?.name || position.name || `${position.type} Position`,
                          caip: position.caip,
                          icon: stakingAssetInfo?.icon || position.icon || '',
                          pubkey: cosmosPubkey.address,
                          ticker: stakingAssetInfo?.symbol || position.ticker || position.symbol,
                          ref: `${context}${position.caip}`,
                          identifier: position.caip + ':' + cosmosPubkey.address,
                          networkId: networkId,
                          symbol: stakingAssetInfo?.symbol || position.symbol || position.ticker,
                          type: stakingAssetInfo?.type || position.type || 'staking',
                          decimal: stakingAssetInfo?.decimal,
                          balance: position.balance.toString(),
                          priceUsd: position.priceUsd || 0,
                          valueUsd: position.valueUsd || (position.balance * (position.priceUsd || 0)),
                          status: position.status || 'active',
                          validator: position.validatorAddress || position.validator || '',
                          updated: new Date().getTime(),
                        };
                        
                        // Check if already exists to avoid duplicates
                        const exists = balances.some((b: any) => 
                          b.caip === stakingBalance.caip && 
                          b.pubkey === stakingBalance.pubkey &&
                          b.validator === stakingBalance.validator
                        );
                        
                        if (!exists) {
                          balances.push(stakingBalance);
                          console.log(tag, `Added ${position.type} position:`, {
                            balance: stakingBalance.balance,
                            ticker: stakingBalance.ticker,
                            valueUsd: stakingBalance.valueUsd,
                            validator: stakingBalance.validator
                          });
                        }
                      }
                    }
                  } else {
                    console.log(tag, `No staking positions found for ${cosmosPubkey.address} on ${networkId}`);
                  }
                } catch (stakingError) {
                  console.error(tag, `Error fetching staking positions for ${cosmosPubkey.address} on ${networkId}:`, stakingError);
                }
              }
            }
          }
        }
      } else {
        console.log(tag, 'No cosmos pubkeys found for staking positions');
      }
    } catch (e) {
      console.error(tag, 'Error adding cosmos staking positions:', e);
    }

    return balances;
  } catch (error) {
    console.error(tag, 'Error processing path:', error);
    throw error;
  }
};
