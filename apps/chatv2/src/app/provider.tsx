'use client'

import { useEffect, useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { PioneerProvider, usePioneer } from "@coinmasters/pioneer-react"
import { AppProvider } from '#features/common/providers/app'
import { system } from '#theme'
import { useOnStartApp } from './utils/onStart'

// Create a wrapper component to handle Pioneer initialization
function PioneerInitializer({ children }: { children: React.ReactNode }) {
  const onStartApp = useOnStartApp()
  const pioneer = usePioneer()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initPioneer = async () => {
      if (isInitialized) return // Skip if already initialized
      
      console.log('🚀 Initializing Pioneer at provider level')
      try {
        await onStartApp()
        console.log('✅ Pioneer initialized successfully')
        setIsInitialized(true)
      } catch (e) {
        console.error('❌ Pioneer initialization error:', e)
      }
    }

    initPioneer()
  }, [onStartApp, isInitialized])

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
  return (
    <ChakraProvider value={system}>
      <PioneerProvider>
        <PioneerInitializer>
          <AppProvider
            onError={(error, info) => console.error(error, info)}
            initialColorMode={initialColorMode}
          >
            {children}
          </AppProvider>
        </PioneerInitializer>
      </PioneerProvider>
    </ChakraProvider>
  )
}
