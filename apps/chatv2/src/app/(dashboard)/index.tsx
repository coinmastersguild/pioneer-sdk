'use client'

import { useAuth } from '@saas-ui/auth-provider'
import { LoadingOverlay } from '@saas-ui/react/loading-overlay'
import { Box, Spinner } from '@chakra-ui/react'

import { HomePage } from '#features/organizations/pages/home-page'

export const IndexPage = () => {
  const { isAuthenticated, isLoggingIn } = useAuth()

  if (isLoggingIn) {
    return (
      // @ts-ignore
      <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="black" display="flex" alignItems="center" justifyContent="center">
        {/* @ts-ignore */}
        <Spinner size="xl" color="white" />
      </Box>
    )
  }

  if (isAuthenticated) {
    return <HomePage />
  }
}
