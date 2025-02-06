import * as React from 'react'

import { useAuth } from '@saas-ui/auth-provider'
import { useQueries } from '@tanstack/react-query'

import { getCurrentUser, getOrganization } from '#api'

import { useWorkspace } from './use-workspace'

/**
 * Use this hook to load all required data for the app to function.
 * Like user data, etc.
 **/
export const useInitApp = () => {
  const { isLoading, isAuthenticated, isLoggingIn } = useAuth()

  /**
   * Get the workspace (organization slug), from the query params
   * You could persist the active workspace in the user profile and retrieve it from `currentUser`.
   */
  const slug = useWorkspace()

  /**
   * Load current user and organization (workspace) data serially
   */
  const [
    { data: userData, isFetched: currentUserIsFetched },
    { data: orgData },
  ] = useQueries({
    queries: [
      {
        queryKey: ['CurrentUser'],
        queryFn: getCurrentUser,
        enabled: isAuthenticated,
      },
      {
        queryKey: [
          'Organization',
          {
            slug,
          },
        ] as const,
        queryFn: () => getOrganization({ slug }),
        enabled: isAuthenticated && !!slug,
      },
    ],
  })

  const currentUser = userData?.currentUser
  const organization = orgData?.organization

  return {
    isInitializing:
      isLoading || isLoggingIn || (isAuthenticated && !currentUserIsFetched),
    isAuthenticated,
  }
}
