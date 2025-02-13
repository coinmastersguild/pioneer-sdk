import { Suspense } from 'react'
import type { Metadata } from 'next'
import { DashboardContent } from './_components/dashboard-content'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
} 