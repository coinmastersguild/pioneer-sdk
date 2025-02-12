'use client'

import * as React from 'react'
import { useHotkeys } from '@saas-ui/use-hotkeys'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { IconContext } from 'react-icons'
import { SessionProvider } from 'next-auth/react'
import { ModalsProvider } from '#components/modals'
import { appHotkeys } from '#config'
import { ColorModeProvider } from '#components/ui/color-mode'

import { Hotkeys } from '../components/hotkeys'
import { getQueryClient } from '../lib/react-query'
import { AuthProvider } from './auth'
import { I18nProvider } from './i18n'

type ColorMode = 'light' | 'dark'

export interface AppProviderProps {
  onError?: (error: Error, info: any) => void
  initialColorMode?: ColorMode
  children: React.ReactNode
}

export function AppProvider({
  children,
  onError,
  initialColorMode = 'dark',
}: AppProviderProps) {
  const queryClient = getQueryClient()

  useHotkeys('ctrl+shift+d', () => {
    console.log('Toggle devtools')
  })

  return (
    <QueryClientProvider client={queryClient}>
      <IconContext.Provider
        value={{
          className: 'react-icons',
        }}
      >
        <ColorModeProvider defaultTheme={initialColorMode}>
            <I18nProvider>
              <SessionProvider>
                <AuthProvider>
                    <ModalsProvider>
                      <Hotkeys hotkeys={appHotkeys}>{children}</Hotkeys>
                    </ModalsProvider>
                </AuthProvider>
              </SessionProvider>
            </I18nProvider>
        </ColorModeProvider>
      </IconContext.Provider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
