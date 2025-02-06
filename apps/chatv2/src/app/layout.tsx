import * as React from 'react'

import '@fontsource-variable/inter'
import { Metadata } from 'next'
import { cookies } from 'next/headers'

// import { LemonSqueezyScript } from '../lib/lemonsqueezy'
import { Provider } from './provider'

export const metadata: Metadata = {
  title: {
    template: '%s | KeepKey Template',
    default: 'KeepKey',
  },
  icons: {
    icon: '/favicons/favicon-32x32.png',
    apple: '/favicons/apple-touch-icon.png',
  },
}

export default async function AppRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const colorMode = cookieStore.get('chakra-ui-color-mode')?.value ?? 'dark'

  return (
    <html lang="en" data-theme={colorMode}>
      <body className={`chakra-ui-${colorMode}`}>
        {/*<LemonSqueezyScript />*/}
        <Provider initialColorMode={colorMode}>{children}</Provider>
      </body>
    </html>
  )
}
