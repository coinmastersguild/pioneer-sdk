import { TicketsPage } from '#features/tickets/tickets-page'
import { createPage } from '#lib/create-page'

const { Page } = createPage({
  title: 'Tickets',
  renderComponent: TicketsPage,
})

export default Page 