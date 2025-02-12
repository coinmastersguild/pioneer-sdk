'use client'

import { useEffect, useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { PioneerProvider, usePioneer } from "@coinmasters/pioneer-react"
import { AppProvider } from '#features/common/providers/app'
import { system } from '#theme'
import { Box, Center, VStack, Text, Spinner } from '@chakra-ui/react'

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
        
        // Subscribe to all events
        events.on('*', (action: string, data: any) => {
          console.log('Event: ', action, data);
        });

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
    return (
      <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="black" zIndex={9999}>
        <Center height="100vh">
          <VStack spacing={6}>
            <Spinner size="xl" color="white" />
            <img src="/images/desktop/pin.png" alt="Loading" style={{ width: '100px', height: '100px' }} />
            <Text color="white" fontSize="lg">Initializing Pioneer...</Text>
          </VStack>
        </Center>
      </Box>
    )
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
