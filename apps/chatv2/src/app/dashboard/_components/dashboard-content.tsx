'use client'

import React from 'react'
import { IndexPage } from './index-page'

export function DashboardContent() {
  return (
    <React.Suspense fallback={<div>Loading dashboard content...</div>}>
      <IndexPage />
    </React.Suspense>
  )
} 