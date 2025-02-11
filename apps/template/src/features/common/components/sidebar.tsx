'use client'

import * as React from 'react'

import {
  Badge,
  Box,
  Collapsible,
  IconButton,
  Spacer,
  Text,
  useControllableState,
} from '@chakra-ui/react'
import { ResizeHandle, ResizeHandler, Resizer } from '@saas-ui-pro/react'
import { Sidebar, Tooltip, useSidebar } from '@saas-ui/react'
import { useHotkeysShortcut } from '@saas-ui/use-hotkeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  LuTicket,
  LuChartNoAxesCombined,
  LuPlus,
  LuSearch,
  LuSquareUser,
  LuWorkflow,
  LuZap,
} from 'react-icons/lu'

import { Tags, User, getTags } from '#api'
import { useHelpCenter } from '#components/help-center'
import { InviteDialog } from '#components/invite-dialog'
import { useModals } from '#components/modals'
import {
  SortableNavGroup,
  SortableNavItem,
} from '#components/sortable-nav-group'
import { useActivePath } from '#features/common/hooks/use-active-path'
import { usePath } from '#features/common/hooks/use-path'

import { useCurrentUser } from '../hooks/use-current-user'
import { WorkspacesMenu } from './workspaces-menu'

export interface AppSidebarProps extends Sidebar.RootProps {}

export const AppSidebar: React.FC<AppSidebarProps> = (props) => {
  const user = useCurrentUser()
  const modals = useModals()
  const router = useRouter()

  const searchPath = usePath('/search')

  const help = useHelpCenter()

  const [width, setWidth] = React.useState(280)

  const { colorPalette } = props

  const onResize: ResizeHandler = ({ width }) => {
    setWidth(width)
  }

  const { mode, setMode, open, setOpen, isMobile } = useSidebar()

  return (
    <Resizer
      defaultWidth={width}
      onResize={onResize}
      enabled={!isMobile && open}
    >
      <Sidebar.Root
        {...props}
        colorPalette={colorPalette}
        borderRightWidth="1px"
      >
        <Sidebar.Trigger />

        <Sidebar.Header direction="row" alignItems="center" gap="1" py="1">
          <WorkspacesMenu />
          <Spacer />
          <IconButton
            variant="ghost"
            size="sm"
            rounded="full"
            aria-label="Search"
            onClick={() => router.push(searchPath)}
          >
            <LuSearch />
          </IconButton>
        </Sidebar.Header>

        <Sidebar.Body>
          <Sidebar.Group>
            <AppSidebarLink
              href={usePath('tickets')}
              label="Tickets"
              icon={<LuTicket />}
              hotkey="navigation.tickets"
            />
            <AppSidebarLink
              href={usePath('reports')}
              label="Reports"
              icon={<LuChartNoAxesCombined />}
              hotkey="navigation.reports"
            />
          </Sidebar.Group>

          <AppSidebarTags user={user} />

          <Collapsible.Root defaultOpen asChild>
            <Sidebar.Group>
              <Collapsible.Trigger asChild>
                <Sidebar.GroupHeader>
                  <Sidebar.GroupTitle>Teams</Sidebar.GroupTitle>
                </Sidebar.GroupHeader>
              </Collapsible.Trigger>

              <Collapsible.Content>
                <Sidebar.NavItem>
                  <Sidebar.NavButton
                    onClick={() =>
                      modals.open(InviteDialog, {
                        title: 'Invite people',
                        onInvite: async () => {
                          // TODO: handle invite
                        },
                      })
                    }
                    color="sidebar-muted"
                  >
                    <LuPlus /> Invite people
                  </Sidebar.NavButton>
                </Sidebar.NavItem>
              </Collapsible.Content>
            </Sidebar.Group>
          </Collapsible.Root>

          <Spacer />

          <Sidebar.Group>
            <Sidebar.NavItem>
              <IconButton
                onClick={() => help.open()}
                variant="outline"
                rounded="full"
                aria-label="Help and support"
                size="xs"
                bg="bg.panel"
              >
                ?
              </IconButton>
            </Sidebar.NavItem>
          </Sidebar.Group>
        </Sidebar.Body>

        <Sidebar.Track
          asChild
          onClick={() => {
            if (mode === 'flyout') {
              setMode('collapsible')
              setOpen(true)
            } else {
              setMode('flyout')
            }
          }}
        >
          <ResizeHandle />
        </Sidebar.Track>
      </Sidebar.Root>
    </Resizer>
  )
}

interface AppSidebarlink extends Sidebar.NavButtonProps {
  hotkey: string
  href: string
  label: string
  icon: React.ReactNode
  badge?: React.ReactNode
}

const AppSidebarLink: React.FC<AppSidebarlink> = (props) => {
  const { href, label, hotkey, icon, badge, ...rest } = props
  const { push } = useRouter()
  const active = useActivePath(href)

  const command = useHotkeysShortcut(hotkey, () => {
    push(href)
  }, [href])

  return (
    <Tooltip
      content={
        <>
          {label} {command}
        </>
      }
      positioning={{
        placement: 'right',
      }}
      openDelay={200}
      portalled
    >
      <Sidebar.NavItem>
        <Sidebar.NavButton active={active} {...rest} asChild>
          <Link href={href} prefetch={false}>
            {icon}

            <Box as="span" lineClamp={1}>
              {label}
            </Box>


          </Link>
        </Sidebar.NavButton>
      </Sidebar.NavItem>
    </Tooltip>
  )
}

const AppSidebarTags = ({ user }: { user: User }) => {

  return (
    <Collapsible.Root defaultOpen asChild>
      <Sidebar.Group>
        <Collapsible.Trigger asChild>
          <Sidebar.GroupHeader>
          </Sidebar.GroupHeader>
        </Collapsible.Trigger>

        <Collapsible.Content>
        </Collapsible.Content>
      </Sidebar.Group>
    </Collapsible.Root>
  )
}
