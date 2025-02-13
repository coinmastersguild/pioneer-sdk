'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { IndexPage } from './index'

export function DashboardContent() {
  return (
    <React.Suspense fallback={<div>Loading dashboard content...</div>}>
      <IndexPage />
    </React.Suspense>
  )
} 