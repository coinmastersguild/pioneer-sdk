import { Suspense } from 'react'
import type { Metadata } from 'next'
import { DashboardContent } from './dashboard-page-content'

export const metadata: Metadata = {
  title: 'Home',
}

export default async function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
