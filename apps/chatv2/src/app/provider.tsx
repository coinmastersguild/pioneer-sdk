'use client'

import { useEffect, useState } from 'react'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { PioneerProvider, usePioneer } from "@coinmasters/pioneer-react"
import { AppProvider } from '#features/common/providers/app'
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
      if (isInitialized) return
      
      try {
        setIsLoading(true)
        const pioneerSetup = {
          appName: 'KeepKey Portfolio',
          appIcon: 'https://pioneers.dev/coins/keepkey.png',
        }
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

  const theme = extendTheme({
    config: {
      initialColorMode,
      useSystemColorMode: false,
    },
  })

  return (
    <ChakraProvider value={theme}>
      <PioneerProvider>
        <PioneerInitializer onPioneerReady={handlePioneerReady}>
          <AppProvider onError={(error, info) => console.error(error, info)} initialColorMode={initialColorMode} pioneer={pioneerInstance}>
            {children}
          </AppProvider>
        </PioneerInitializer>
      </PioneerProvider>
    </ChakraProvider>
  )
}
