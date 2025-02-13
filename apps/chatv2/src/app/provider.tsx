'use client'

import { useEffect, useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { PioneerProvider, usePioneer } from "@coinmasters/pioneer-react"
import { AppProvider } from '#features/common/providers/app'
import { system } from '#theme'
import { Box } from '@chakra-ui/react'
import { signIn } from 'next-auth/react'
import { AppLoader } from '#components/app-loader/app-loader'

// Create a wrapper component to handle Pioneer initialization
function PioneerInitializer({ children, onPioneerReady }: { 
  children: React.ReactNode
  onPioneerReady: (pioneer: ReturnType<typeof usePioneer>) => void 
}) {
  const pioneer = usePioneer()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initPioneer = async () => {
      if (isInitialized) return // Skip if already initialized
      
      console.log('🚀 Initializing Pioneer at provider level')
      try {
        setIsLoading(true)
        const pioneerSetup = {
          appName: 'KeepKey Portfolio',
          appIcon: 'https://pioneers.dev/coins/keepkey.png',
        };
        const events = await pioneer.onStart([], pioneerSetup);
        
        // Subscribe to all events with detailed logging
        events.on('*', (action: string, data: any) => {
          console.log('🎯 Pioneer Event:', { action, data });
          
          // Log state changes
          if (action === 'SET_STATE') {
            console.log('📊 Pioneer State Update:', pioneer.state);
            
            // Check if we have the context after state update
            if (pioneer.state.context && typeof pioneer.state.context === 'object') {
              try {
                const context = pioneer.state.context;
                console.log('🔍 Found Pioneer context:', context);
                
                const payload = {
                  username: context.username || pioneer.state.username,
                  address: context.selectedWallet?.address || '0xplaceholderAddress',
                  queryKey: pioneer.state.queryKey || context.queryKey
                }
                
                if (!payload.username || !payload.queryKey) {
                  console.log('⚠️ Missing required auth data:', {
                    hasUsername: !!payload.username,
                    hasQueryKey: !!payload.queryKey
                  })
                  return
                }

                console.log('🔐 Starting KeepKey auth flow with context data...')
                console.log('📦 Auth payload:', JSON.stringify(payload, null, 2))

                fetch('/api/auth/kkauth', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload)
                })
                .then(response => {
                  console.log('🔑 Auth Response Status:', response.status)
                  return response.json().then(data => ({ status: response.status, data }))
                })
                .then(({ status, data }) => {
                  console.log('📡 Auth Response Data:', JSON.stringify(data, null, 2))
                  
                  if (status === 200) {
                    console.log('✅ KeepKey auth successful - redirecting to getting-started')
                    window.location.href = '/getting-started'
                  } else {
                    console.error('❌ KeepKey auth failed:', data.error)
                  }
                })
                .catch(error => {
                  console.error('❌ Auth request failed:', error)
                })
              } catch (error) {
                console.error('❌ Error processing context:', error)
              }
            } else {
              console.log('⏳ Waiting for Pioneer context...')
            }
          }
        });

        // Debug log initial state
        console.log('🚀 Initial Pioneer state:', pioneer.state)
        console.log('✅ Pioneer initialized successfully')
        setIsInitialized(true)
        onPioneerReady(pioneer)
      } catch (e) {
        console.error('❌ Pioneer initialization error:', e)
      } finally {
        setIsLoading(false)
      }
    }

    initPioneer()
  }, [pioneer, isInitialized, onPioneerReady])

  if (isLoading) {
    return <AppLoader />
  }

  return <>{children}</>
}

/**
 * This is the root context provider for the application.
 * You can add context providers here that should be available to all pages.
 */
export function Provider({ 
  children,
  initialColorMode = 'dark'
}: { 
  children: React.ReactNode
  initialColorMode?: 'light' | 'dark'
}) {
  const [pioneerInstance, setPioneerInstance] = useState<ReturnType<typeof usePioneer> | null>(null)

  const handlePioneerReady = (pioneer: ReturnType<typeof usePioneer>) => {
    setPioneerInstance(pioneer)
  }

  return (
    <ChakraProvider value={system}>
      <PioneerProvider>
        <PioneerInitializer onPioneerReady={handlePioneerReady}>
          <AppProvider
            onError={(error, info) => console.error(error, info)}
            initialColorMode={initialColorMode}
            pioneer={pioneerInstance}
          >
            {children}
          </AppProvider>
        </PioneerInitializer>
      </PioneerProvider>
    </ChakraProvider>
  )
}
