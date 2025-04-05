'use client'

import React from 'react';
import { useEffect, useState } from 'react'
import { PioneerProvider as BasePioneerProvider, usePioneer } from "@coinmasters/pioneer-react"
import { AppProvider } from '@/components/providers/pioneer'
import { Provider as ChakraProvider } from "@/components/ui/provider"
import { LogoIcon } from '@/components/logo'
import { keyframes } from '@emotion/react'
import { Flex } from '@chakra-ui/react'
import { ConnectionError } from '@/components/error'
// //@ts-ignore
// import { defaultConfig } from '@saas-ui-pro/react';

// Global variable to track if context setup has been completed
let contextSetupComplete = false;

interface ProviderProps {
  children: React.ReactNode;
}

const scale = keyframes`
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.5; }
`

// Get environment variables with fallbacks
const PIONEER_URL = process.env.NEXT_PUBLIC_PIONEER_URL
const PIONEER_WSS = process.env.NEXT_PUBLIC_PIONEER_WSS

// Store instance outside React lifecycle to preserve during Fast Refresh
let pioneerInstance: any = null;

// Create a wrapper component to handle Pioneer initialization
function PioneerInitializer({ children, onPioneerReady }: {
  children: React.ReactNode
  onPioneerReady: (pioneer: ReturnType<typeof usePioneer>) => void
}) {
  const pioneer = usePioneer()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionError, setConnectionError] = useState(false)

  const initPioneer = async () => {
    // If we already have an instance preserved from Fast Refresh, use it
    if (pioneerInstance) {
      console.log('Using preserved Pioneer instance from Fast Refresh')
      setIsInitialized(true)
      setIsLoading(false)
      onPioneerReady(pioneer)
      return
    }

    if (isInitialized) return

    try {
      setIsLoading(true)
      setConnectionError(false)
      const pioneerSetup = {
        appName: 'KeepKey Portfolio',
        appIcon: 'https://pioneers.dev/coins/keepkey.png',
        spec: PIONEER_URL,
        wss: PIONEER_WSS,
      }
      console.log('pioneerSetup: ',pioneerSetup)
      await pioneer.onStart([], pioneerSetup)

            // Disable default asset context setup to prevent getting stuck in setOutboundAssetContext
            // This overrides the default setup in pioneer-react's PioneerProvider
            if (pioneer.state?.app) {
              // Add a property to track if we should skip automatic context setting
              pioneer.state.app.skipDefaultContextSetup = true;
              
              // If setOutboundAssetContext is running and causing issues, let's monkey patch it with a timeout version
              if (typeof pioneer.state.app.setOutboundAssetContext === 'function') {
                const originalFn = pioneer.state.app.setOutboundAssetContext;
                pioneer.state.app.setOutboundAssetContext = async function(asset?: any) {
                  console.log('Safe version of setOutboundAssetContext', asset);
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
              
              // Also patch the setAssetContext method if it exists
              if (typeof pioneer.state.app.setAssetContext === 'function') {
                const originalSetAssetFn = pioneer.state.app.setAssetContext;
                pioneer.state.app.setAssetContext = async function(asset?: any) {
                  console.log('Safe version of setAssetContext', asset);
                  try {
                    // Run with a timeout
                    const result = await Promise.race([
                      originalSetAssetFn.call(pioneer.state.app, asset),
                      new Promise((resolve) => setTimeout(() => {
                        console.log('setAssetContext timed out, using fallback');
                        resolve({
                          caip: 'eip155:1/slip44:60',
                          networkId: 'ethereum',
                          symbol: 'ETH',
                          name: 'Ethereum',
                          icon: 'https://pioneers.dev/coins/ethereum.png',
                        });
                      }, 2000))
                    ]);
                    return result;
                  } catch (e) {
                    console.error('Safe setAssetContext error:', e);
                    return pioneer.state.app.assetContext || {
                      caip: 'eip155:1/slip44:60',
                      networkId: 'ethereum'
                    };
                  }
                };
              }
            }
      // Store instance for Fast Refresh persistence
      pioneerInstance = pioneer
      setIsInitialized(true)
      onPioneerReady(pioneer)
    } catch (e) {
      console.error('Pioneer initialization error:', e)
      // Check if the error is related to a connection failure
      if (e instanceof Error && (
        e.message.includes('Failed to fetch') || 
        e.message.includes('NetworkError') ||
        e.message.includes('Network Error') ||
        e.message.includes('Connection refused')
      )) {
        setConnectionError(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Preserve state on fast refresh
  // @ts-ignore - __NEXT_HMR_CB__ is an internal Next.js API
  if (typeof window !== 'undefined' && (window as any).__NEXT_HMR_CB__) {
    // Store the original callback
    const originalCallback = (window as any).__NEXT_HMR_CB__;
    
    // Replace with our version that preserves the pioneer instance
    (window as any).__NEXT_HMR_CB__ = (...args: any) => {
      console.log('Fast Refresh triggered, preserving Pioneer instance');
      originalCallback(...args);
    };
  }

  useEffect(() => {
    initPioneer()
  }, [pioneer, isInitialized, onPioneerReady])

  if (connectionError) {
    return <ConnectionError onRetry={initPioneer} />
  }

  if (isLoading) {
    return (
      <Flex 
        width="100vw" 
        height="100vh" 
        justify="center" 
        align="center"
        bg="gray.800"
      >
        <LogoIcon 
          boxSize="24"
          animation={`${scale} 2s ease-in-out infinite`}
          opacity="0.8"
        />
      </Flex>
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
            <AppProvider onError={(error, info) => console.error(error, info)} initialColorMode={'dark'} pioneer={pioneerInstance}>
              {children}
            </AppProvider>
          </PioneerInitializer>
        </BasePioneerProvider>
      </ChakraProvider>
  );
} 
