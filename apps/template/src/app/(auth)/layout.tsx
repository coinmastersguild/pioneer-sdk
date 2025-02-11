'use client'

import React from 'react'
import { useAuth } from '@saas-ui/auth-provider'
import { useRouter } from 'next/navigation'
import { AuthLayout as BaseAuthLayout } from '#features/common/layouts/auth-layout'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated, isLoggingIn } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    // Only redirect if user is authenticated and not in the process of logging in
    if (isAuthenticated && !isLoggingIn) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoggingIn])

  // Show children while checking auth status
  return <BaseAuthLayout>{children}</BaseAuthLayout>
}
