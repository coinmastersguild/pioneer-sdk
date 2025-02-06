'use client'

import React from 'react'
import { useAuth } from '@saas-ui/auth-provider'
import { useRouter } from 'next/navigation'
import { AuthLayout as BaseAuthLayout } from '#features/common/layouts/auth-layout'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated])

  // @ts-ignore
  return <BaseAuthLayout>{children}</BaseAuthLayout>
}
