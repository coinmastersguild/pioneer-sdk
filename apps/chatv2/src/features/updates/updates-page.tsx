'use client'

import { Spacer } from '@chakra-ui/react'
import { Page, Toolbar } from '@saas-ui-pro/react'
import { LuChevronLeft, LuClock } from 'react-icons/lu'

import { ContactsViewPage } from '#features/contacts/view-page.tsx'

/**
 * This is a simple wrapper around the ContactsViewPage with an inbox specific toolbar
 */
export function UpdatesPage(props: {
  params: {
    workspace: string
    id: string
  }
}) {
  const toolbar = (
    <Toolbar.Root>
      <Toolbar.Button
        display={{ base: 'inline-flex', lg: 'none' }}
        label="All notifications"
        // onClick={props.onBack}
        variant="ghost"
      >
        <LuChevronLeft size="1.2em" />
      </Toolbar.Button>
      <Spacer />
      <Toolbar.Button variant="surface" size="xs">
        Delete notification
      </Toolbar.Button>
      <Toolbar.Button variant="surface" size="xs">
        <LuClock /> Snooze
      </Toolbar.Button>
    </Toolbar.Root>
  )
  return (
    <Page.Root as="div">
      <ContactsViewPage params={props.params} actions={toolbar} />
    </Page.Root>
  )
}
