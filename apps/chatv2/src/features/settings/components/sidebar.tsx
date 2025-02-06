import * as React from 'react'

import { Heading, useBreakpointValue } from '@chakra-ui/react'
import { Sidebar } from '@saas-ui/react'
import { useHotkeysShortcut } from '@saas-ui/use-hotkeys'
import Link from 'next/link'
import { FiFolder, FiUser } from 'react-icons/fi'

import { useHelpCenter } from '#components/help-center'
import { useActivePath } from '#features/common/hooks/use-active-path'
import { usePath } from '#features/common/hooks/use-path'

const SettingsLink = (props: Sidebar.NavItemProps & { path: string }) => {
  const { path, children, ...rest } = props
  const href = usePath(`/settings${path}`)
  return (
    <Sidebar.NavItem ps="5" {...rest}>
      <Sidebar.NavButton active={useActivePath(href)} asChild>
        <Link href={href} prefetch={false}>
          {children}
        </Link>
      </Sidebar.NavButton>
    </Sidebar.NavItem>
  )
}

export const SettingsSidebar = () => {
  const backRef = React.useRef<HTMLButtonElement>(null)

  const help = useHelpCenter()

  useHotkeysShortcut('settings.close', () => {
    // Simply triggering a click here, so we don't need to reference the router.
    backRef.current?.click()
  })

  const [sidebarWidth, setSidebarWidth] = React.useState(280)
  const isMobile = useBreakpointValue({ base: true, lg: false })

  return (
    <div style={{ width: isMobile ? sidebarWidth : 280 }}>
      <Sidebar.Root>
        {/* <Sidebar.ToggleButton /> */}

        <Sidebar.Header direction="row" alignItems="center">
          <Link href={usePath()}>
            <button ref={backRef}>Back</button>
          </Link>
          <Heading as="h1" textStyle="lg">
            Settings
          </Heading>
        </Sidebar.Header>
        <Sidebar.Body flex="1" overflowY="auto">
          <Sidebar.Group>
            <Sidebar.GroupHeader>
              <Sidebar.GroupTitle gap="2">
                <FiFolder /> Organization
              </Sidebar.GroupTitle>
            </Sidebar.GroupHeader>
            <Sidebar.GroupContent>
              <SettingsLink path="/">Overview</SettingsLink>
              <SettingsLink path="/organization">Organization</SettingsLink>
              <SettingsLink path="/members">Members</SettingsLink>
            </Sidebar.GroupContent>
          </Sidebar.Group>

          <Sidebar.Group>
            <Sidebar.GroupHeader>
              <Sidebar.GroupTitle gap="2">
                <FiUser /> Account
              </Sidebar.GroupTitle>
            </Sidebar.GroupHeader>
            <Sidebar.GroupContent>
              <SettingsLink path="/account">Profile</SettingsLink>
              <SettingsLink path="/account/security">Security</SettingsLink>
              <SettingsLink path="/account/notifications">
                Notifications
              </SettingsLink>
              <SettingsLink path="/account/api">API access</SettingsLink>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Body>
      </Sidebar.Root>
    </div>
  )
}
