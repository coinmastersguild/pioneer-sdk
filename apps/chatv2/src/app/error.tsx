'use client'

import { Button, HStack } from '@chakra-ui/react'
import { EmptyState } from '@saas-ui/react'
import { useRouter } from 'next/navigation'
import { FiFrown } from 'react-icons/fi'

export default function Error() {
  const router = useRouter()

  return (
    <EmptyState
      title="Something isn't looking right"
      description="Where do you want to go?"
      icon={<FiFrown />}
      h="100dvh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <HStack>
        <Button colorScheme="primary" onClick={() => router.back()}>
          Go back
        </Button>
        <Button onClick={() => router.push('/app')} colorPalette="accent">
          Home
        </Button>
      </HStack>
    </EmptyState>
  )
}
