import { DashboardLayout } from '#features/common/layouts/dashboard-layout'

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
} 