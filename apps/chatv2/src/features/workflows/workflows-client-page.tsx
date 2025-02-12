'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { EmptyState } from '@saas-ui/react/empty-state'
import { LuWorkflow } from 'react-icons/lu'

export function WorkflowsClientPage() {
  return (
    <ChakraProvider>
      <EmptyState
        title="Workflows"
        description="Automate your business processes."
        icon={<LuWorkflow />}
      />
    </ChakraProvider>
  )
} 