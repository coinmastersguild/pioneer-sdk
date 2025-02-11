import { DashboardPage } from '#features/dashboard/dashboard-page'
import { createPage } from '#lib/create-page'

const { Page, metadata } = createPage({
  title: 'Reports',
  renderComponent: () => <DashboardPage />,
})

export { metadata }
export default Page
