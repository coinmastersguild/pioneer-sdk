'use client'

import React from 'react';
import { useEffect, useState } from 'react'
import { PioneerProvider as BasePioneerProvider, usePioneer } from "@coinmasters/pioneer-react"
import { AppProvider } from '@/components/providers/pioneer'
import { Provider as ChakraProvider } from "@/components/ui/provider"
import { LogoIcon } from '@/components/logo'
import { Center, Text } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
// //@ts-ignore
// import { defaultConfig } from '@saas-ui-pro/react';

const scale = keyframes`
  0% { transform: scale(0.8); }
  50% { transform: scale(1.2); }
  100% { transform: scale(0.8); }
`

interface ProviderProps {
  children: React.ReactNode;
}

// Global variable to track if context setup has been completed
let contextSetupComplete = false;

// Get environment variables with fallbacks
const PIONEER_URL = process.env.NEXT_PUBLIC_PIONEER_URL
const PIONEER_WSS = process.env.NEXT_PUBLIC_PIONEER_WSS
// Create a wrapper component to handle Pioneer initialization

function PioneerInitializer({ children, onPioneerReady }: {
  children: React.ReactNode
  onPioneerReady: (pioneer: ReturnType<typeof usePioneer>) => void
}) {
  const pioneer = usePioneer()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initPioneer = async () => {
      if (isInitialized) return

      try {
        setIsLoading(true)
        setError(null)

        // Initialize Pioneer with retries
        let retries = 3;
        while (retries > 0) {
          try {
            const pioneerSetup = {
              appName: 'KeepKey Portfolio',
              appIcon: 'https://pioneers.dev/coins/keepkey.png',
              spec: PIONEER_URL,
              wss: PIONEER_WSS,
              configWss: {
                reconnect: true,
                reconnectInterval: 3000,
                maxRetries: 5
              }
            }

            console.log('Initializing Pioneer:', pioneerSetup)
            await pioneer.onStart([], pioneerSetup)
            
            // Disable default asset context setup to prevent getting stuck in setOutboundAssetContext
            // This overrides the default setup in pioneer-react's PioneerProvider
            if (pioneer.state?.app) {
              // Add a property to track if we should skip automatic context setting
              pioneer.state.app.skipDefaultContextSetup = true;
              
              // If setOutboundAssetContext is running and causing issues, let's monkey patch it with a no-op version
              if (typeof pioneer.state.app.setOutboundAssetContext === 'function') {
                const originalFn = pioneer.state.app.setOutboundAssetContext;
                pioneer.state.app.setOutboundAssetContext = async function(asset?: any) {
                  console.log('Template app: Using safe version of setOutboundAssetContext', asset);
                  try {
                    // Only allow this to run once to prevent constant re-triggering
                    if (contextSetupComplete) {
                      console.log('Context setup already complete, returning cached value');
                      return pioneer.state.app.outboundAssetContext;
                    }
                    
                    // Run with a timeout
                    const result = await new Promise((resolve, reject) => {
                      const timeout = setTimeout(() => {
                        console.log('setOutboundAssetContext timed out, using fallback');
                        resolve({
                          caip: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
                          networkId: 'bitcoin',
                          symbol: 'BTC',
                          name: 'Bitcoin',
                          icon: 'https://pioneers.dev/coins/bitcoin.png',
                        });
                      }, 2000);
                      
                      originalFn.call(pioneer.state.app, asset)
                        .then((result: any) => {
                          clearTimeout(timeout);
                          resolve(result);
                        })
                        .catch((err: any) => {
                          clearTimeout(timeout);
                          reject(err);
                        });
                    });
                    
                    contextSetupComplete = true;
                    return result;
                  } catch (e) {
                    console.error('Safe setOutboundAssetContext error:', e);
                    contextSetupComplete = true;
                    return pioneer.state.app.outboundAssetContext || {
                      caip: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
                      networkId: 'bitcoin'
                    };
                  }
                };
              }
            }
            
            break;
          } catch (e) {
            retries--;
            if (retries === 0) throw e;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        setIsInitialized(true)
        onPioneerReady(pioneer)
      } catch (e) {
        console.error('Pioneer initialization error:', e)
        setError(e as Error)
      } finally {
        setIsLoading(false)
      }
    }

    initPioneer()
  }, [pioneer, isInitialized, onPioneerReady])

  if (error) {
    return (
        <Center w="100vw" h="100vh" flexDirection="column" gap={4}>
          <LogoIcon
              boxSize="8"
              opacity="0.5"
          />
          <Text color="red.500">Failed to connect to Server!</Text>
        </Center>
    )
  }

  if (isLoading) {
    return (
        <Center w="100vw" h="100vh">
          <LogoIcon
              boxSize="8"
              animation={`5s ease-out ${scale}`}
              opacity="0.8"
          />
        </Center>
    )
  }

  return <>{children}</>
}


export function Provider({ children }: ProviderProps) {
  const [pioneerInstance, setPioneerInstance] = useState<ReturnType<typeof usePioneer> | null>(null)

  const handlePioneerReady = (pioneer: ReturnType<typeof usePioneer>) => {
    setPioneerInstance(pioneer)
  }

  return (
      <ChakraProvider>
        <BasePioneerProvider>
          <PioneerInitializer onPioneerReady={handlePioneerReady}>
            <AppProvider onError={(error, info) => console.error(error, info)} pioneer={pioneerInstance}>
              {children}
            </AppProvider>
          </PioneerInitializer>
        </BasePioneerProvider>
      </ChakraProvider>
  );
} 
