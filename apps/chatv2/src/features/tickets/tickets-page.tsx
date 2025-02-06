'use client'

import { Box, Stack } from '@chakra-ui/react'
import { EmptyState, Button } from '@saas-ui/react'
import { LuTicket } from 'react-icons/lu'
import { useModals } from '#components/modals'
import { useRouter } from 'next/navigation'
import React from 'react'

export function TicketsPage() {
  const modals = useModals()
  const router = useRouter()

  const handleCreateTicket = () => {
    router.push('/getting-started')
  }

  return (
    <Stack gap={4}>
      <Box>
        <EmptyState
          title="Support Tickets"
          description="Create and manage your support tickets."
          icon={<LuTicket />}
        />
        <Button 
          colorScheme="primary"
          onClick={handleCreateTicket}
        >
          Create New Ticket
        </Button>
      </Box>
    </Stack>
  )
} 