'use client'

import { EmptyState } from '@saas-ui/react'
import { Button, HStack } from '@chakra-ui/react'
import { FiFrown } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const router = useRouter()

  return (
    // @ts-ignore
    <EmptyState
      title="Something isn't looking right"
      description="Where do you want to go?"
      icon={<FiFrown />}
    >
      {/* @ts-ignore */}
      <HStack>
        {/* @ts-ignore */}
        <Button colorScheme="primary" onClick={() => router.back()}>
          Go back
        </Button>
        {/* @ts-ignore */}
        <Button variant="ghost" onClick={() => router.push('/')}>
          Home
        </Button>
      </HStack>
    </EmptyState>
  )
}
