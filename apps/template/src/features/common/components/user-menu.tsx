import { IconButton, Portal, Text, VStack } from '@chakra-ui/react'
import { useAuth } from '@saas-ui/auth-provider'
import { Menu, PersonaAvatar } from '@saas-ui/react'
import { useHotkeysShortcut } from '@saas-ui/use-hotkeys'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import { getCurrentUser } from '#api'
import { useHelpCenter } from '#components/help-center'
import { DEFAULT_AVATAR } from '../../config/constants'

import { usePath } from '../hooks/use-path'

export const UserMenu = () => {
  const { logOut } = useAuth()
  const { data: session } = useSession()

  const { data: { currentUser } = {} } = useQuery({
    queryKey: ['GetCurrentUser'],
    queryFn: () => getCurrentUser(),
  })

  const queryClient = useQueryClient()

  const logOutAndClearCache = () => {
    logOut().then(() => {
      queryClient.clear()
    })
  }

  const toggleColorMode = () => null

  const help = useHelpCenter()
  const helpCommand = useHotkeysShortcut('general.help', () => {
    help.open()
  })

  const logoutCommand = useHotkeysShortcut('general.logout', () => {
    logOutAndClearCache()
  })

  // Use Google profile picture if available, fallback to currentUser avatar, then default
  const userAvatar = session?.user?.image || currentUser?.avatar || DEFAULT_AVATAR
  const userName = session?.user?.name || currentUser?.name || ''
  const userEmail = session?.user?.email || currentUser?.email || ''

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton variant="ghost" aria-label="User menu" rounded="full">
          <PersonaAvatar
            size="xs"
            name={userName}
            src={userAvatar}
            presence="online"
          />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        {/* Wrap the menu in a portal so that the color scheme tokens get applied correctly.  */}
        <Menu.Content minW="200px" zIndex={['modal', null, 'dropdown']}>
          <Menu.ItemGroup>
            <VStack align="start" p="2">
              <Text fontWeight="medium">{userName}</Text>
              <Text fontSize="sm" color="muted">{userEmail}</Text>
              {session?.user?.locale && (
                <Text fontSize="xs" color="muted">Locale: {session.user.locale}</Text>
              )}
            </VStack>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.Item value="profile" asChild>
              <Link href={usePath(`/settings/account`)}>Profile</Link>
            </Menu.Item>
            <Menu.Item value="settings" asChild>
              <Link href={usePath(`/settings`)}>Settings</Link>
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.Item value="changelog">Changelog</Menu.Item>
          <Menu.Item value="help" onClick={() => help.open()}>
            Help
            <Menu.ItemCommand>{helpCommand}</Menu.ItemCommand>
          </Menu.Item>
          <Menu.Item value="feedback">Feedback</Menu.Item>
          <Menu.Item
            value="toggle-color-mode"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              toggleColorMode()
            }}
          >
            {/* {colorMode === 'dark' ? 'Light mode' : 'Dark mode'} */}
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item value="logout" onClick={() => logOutAndClearCache()}>
            Log out
            <Menu.ItemCommand>{logoutCommand}</Menu.ItemCommand>
          </Menu.Item>
        </Menu.Content>
      </Portal>
    </Menu.Root>
  )
}
