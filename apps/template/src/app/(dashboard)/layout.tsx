import { HeaderLayout } from '#features/common/layouts/header-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <HeaderLayout>{children}</HeaderLayout>
}
