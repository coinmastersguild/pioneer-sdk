import { EmptyState } from '@saas-ui/react'
import { LuWorkflow } from 'react-icons/lu'

export function WorkflowsPage() {
  return (
    <EmptyState
      title="Workflows"
      description="Automate your business processes."
      icon={<LuWorkflow />}
    />
  )
}
