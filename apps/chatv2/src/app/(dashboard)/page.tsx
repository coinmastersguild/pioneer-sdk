import { Suspense } from 'react'
import { DashboardContent } from './dashboard-page-content'

export const metadata = {
  title: 'Home',
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
