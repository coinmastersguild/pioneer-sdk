'use client'

import { useAuth } from '@saas-ui/auth-provider'
import { LoadingOverlay } from '@saas-ui/react/loading-overlay'

import { HomePage } from '#features/organizations/pages/home-page'

export const IndexPage = () => {
  const { isAuthenticated, isLoggingIn } = useAuth()

  if (isLoggingIn) {
    return (
        <LoadingOverlay.Root
            variant="fullscreen"
            sx={{
              backgroundColor: 'black', // override the background color here
            }}
        >
        <LoadingOverlay.Spinner />
      </LoadingOverlay.Root>
    )
  }

  if (isAuthenticated) {
    return <HomePage />
  }
}
