'use client'

import * as React from 'react'

import { LoadingOverlay } from '@saas-ui/react/loading-overlay'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { getCurrentUser } from '#api'
import { useWorkspace } from '#features/common/hooks/use-workspace'

export const HomePage: React.FC = () => {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['CurrentUser'],
    queryFn: () => getCurrentUser(),
  })

  const workspace = useWorkspace()

  React.useEffect(() => {
    if (workspace) {
      router.push(`/${workspace}/tickets`)
    } else if (!isLoading && data?.currentUser?.organizations?.[0]) {
      router.push(`/${data.currentUser.organizations[0].slug}/tickets`)
    } else if (!isLoading) {
      router.push('/getting-started')
    }
  }, [router, isLoading, data, workspace])

  return (
    <LoadingOverlay.Root>
      <LoadingOverlay.Spinner />
    </LoadingOverlay.Root>
  )
}
