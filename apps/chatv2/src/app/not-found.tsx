'use client'

import { Button, Group } from '@chakra-ui/react'
import { EmptyState } from '@saas-ui/react'
import { useRouter } from 'next/navigation'
import { LuFrown } from 'react-icons/lu'

export default function NotFound() {
  const router = useRouter()

  return (
    <EmptyState
      title="404, Page not found"
      description="Where do you want to go?"
      icon={<LuFrown />}
      h="100dvh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Group>
        <Button variant="surface" onClick={() => router.back()}>
          Go back
        </Button>
        <Button variant="surface" onClick={() => router.push('/')}>
          Home
        </Button>
      </Group>
    </EmptyState>
  )
}
