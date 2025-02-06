'use client'

import { DashboardLayout } from '#features/common/layouts/dashboard-layout'

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { workspace: string }
}) {
  return <DashboardLayout>{children}</DashboardLayout>
} 