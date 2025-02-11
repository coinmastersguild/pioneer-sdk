'use client'

import * as React from 'react'

import { useRouter } from 'next/navigation'

import { AppLoader } from '#components/app-loader'

import { useInitApp } from '../hooks/use-init-app'

/**
 * Wrapper component for dashboard pages.
 *
 * Loads the minimal required user data for the app and
 * renders authentication screens when the user isn't authenticated.
 */
export const DashboardLayout: React.FC<{ children: React.ReactNode }> = (
  props,
) => {
  const router = useRouter()

  const { isInitializing, isAuthenticated } = useInitApp()

  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/login')
    }
  }, [isInitializing, isAuthenticated])

  return (
    <>
      <AppLoader loading={isInitializing} />
      {!isInitializing && props.children}
    </>
  )
}
