import * as React from 'react'
import '@fontsource-variable/inter'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Provider } from './provider'

export const metadata: Metadata = {
  title: 'KeepKey Support',
  description: 'KeepKey Support Portal',
}

type ColorMode = 'light' | 'dark'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const colorMode = (cookieStore.get('chakra-ui-color-mode')?.value ?? 'dark') as ColorMode

  return (
    <html lang="en" data-theme={colorMode}>
      <head>
        <link
          rel="preload"
          href="/images/desktop/pin.png"
          as="image"
          type="image/png"
        />
      </head>
      <body className={`chakra-ui-${colorMode}`}>
        <Provider initialColorMode={colorMode}>
          {children}
        </Provider>
      </body>
    </html>
  )
}
