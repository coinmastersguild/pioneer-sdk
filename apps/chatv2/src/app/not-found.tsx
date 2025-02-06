'use client'

import { EmptyState } from '@saas-ui/react'
import { Button, HStack } from '@chakra-ui/react'
import { LuFrown } from 'react-icons/lu'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    // @ts-ignore
    <EmptyState
      title="404, Page not found"
      description="Where do you want to go?"
      icon={<LuFrown />}
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
