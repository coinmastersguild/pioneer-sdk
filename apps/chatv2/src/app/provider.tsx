'use client'

import { useEffect, useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { PioneerProvider, usePioneer } from "@coinmasters/pioneer-react"
import { AppProvider } from '#features/common/providers/app'
import { AppLoader } from '#components/app-loader/app-loader'
import { system } from '#theme'
import { SessionProvider } from 'next-auth/react'

// Get environment variables with fallbacks
const PIONEER_URL = process.env.NEXT_PUBLIC_PIONEER_URL || 'http://127.0.0.1:9001/spec/swagger.json'
const PIONEER_WSS = process.env.NEXT_PUBLIC_PIONEER_WSS || 'ws://127.0.0.1:9001'

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
      if (isInitialized) return
      
      try {
        setIsLoading(true)
        const pioneerSetup = {
          appName: 'KeepKey Portfolio',
          appIcon: 'https://pioneers.dev/coins/keepkey.png',
          spec: PIONEER_URL,
          wss: PIONEER_WSS,
        }
        console.log('pioneerSetup: ',pioneerSetup)
        await pioneer.onStart([], pioneerSetup)
        setIsInitialized(true)
        onPioneerReady(pioneer)
      } catch (e) {
        console.error('Pioneer initialization error:', e)
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

interface ProviderProps {
  children: React.ReactNode
  initialColorMode?: 'light' | 'dark'
}

export function Provider({ children, initialColorMode = 'dark' }: ProviderProps) {
  const [pioneerInstance, setPioneerInstance] = useState<ReturnType<typeof usePioneer> | null>(null)

  const handlePioneerReady = (pioneer: ReturnType<typeof usePioneer>) => {
    setPioneerInstance(pioneer)
  }

  return (
    <SessionProvider>
      <ChakraProvider value={system}>
        <PioneerProvider>
          <PioneerInitializer onPioneerReady={handlePioneerReady}>
            <AppProvider onError={(error, info) => console.error(error, info)} initialColorMode={initialColorMode} pioneer={pioneerInstance}>
              {children}
            </AppProvider>
          </PioneerInitializer>
        </PioneerProvider>
      </ChakraProvider>
    </SessionProvider>
  )
}
