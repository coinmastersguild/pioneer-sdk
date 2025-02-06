import { redirect } from 'next/navigation'

import { getNotifications } from '#api'
import { createPage } from '#lib/create-page.tsx'

const { Page } = createPage({
  params: ['workspace'],
  loader: async ({ params, queryClient }) => {
    const data = await queryClient.ensureQueryData({
      queryKey: ['Notifications'],
      queryFn: () => {
        return getNotifications()
      },
    })

    if (data.notifications?.[0]) {
      redirect(
        `/keepkey/tickets`,
        // `/${params.workspace}/updates/${data.notifications[0].contact.id}`,
      )
    }
  },
  renderComponent: () => null,
})

export default Page
