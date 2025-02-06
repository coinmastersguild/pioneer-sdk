'use client'

import { Button, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { PersonaAvatar } from '@saas-ui/react'
import { LuBox, LuCircleHelp, LuGithub, LuShield, LuUser } from 'react-icons/lu'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

import { SettingsPage } from '#components/settings-page'
import { getCurrentUser } from '#api'
import { DEFAULT_AVATAR } from '../../../config/constants'

import { SettingsCard } from '../components/settings-card'
import { SupportCard } from '../components/support-card'

export function SettingsOverviewPage() {
  const { data: session } = useSession()
  const { data: { currentUser } = {} } = useQuery({
    queryKey: ['GetCurrentUser'],
    queryFn: () => getCurrentUser(),
  })

  // Use Google profile data if available, fallback to currentUser avatar, then default
  const userAvatar = session?.user?.image || currentUser?.avatar || DEFAULT_AVATAR
  const userName = session?.user?.name || currentUser?.name || ''
  const userEmail = session?.user?.email || currentUser?.email || ''

  return (
    <SettingsPage
      title="Overview"
      description="Manage your organization settings"
      contentWidth="6xl"
      actions={null}
    >
      <Stack gap={8}>
        <Stack>
          <Text fontSize="lg" fontWeight="medium">Your account</Text>
          <SimpleGrid columns={[1, null, 2]} gap={4}>
            <SettingsCard
              title="Profile"
              description="Manage your personal information"
              icon={<LuUser />}
              avatar={
                <PersonaAvatar
                  name={userName}
                  src={userAvatar}
                  size="md"
                />
              }
            >
              <VStack align="start" p="4" gap={1}>
                <Text fontWeight="medium">{userName}</Text>
                <Text color="muted">{userEmail}</Text>
                {session?.user?.locale && (
                  <Text fontSize="sm" color="muted">Locale: {session.user.locale}</Text>
                )}
              </VStack>
            </SettingsCard>
            <SettingsCard
              title="Security recommendations"
              description="Improve your account security by enabling two-factor
              authentication."
              icon={<LuShield />}
              footer={
                <Button variant="surface">
                  Enable two-factor authentication
                </Button>
              }
            />
          </SimpleGrid>
        </Stack>

        <Stack>
          <Text fontSize="lg" fontWeight="medium">More</Text>
          <SimpleGrid columns={[1, null, 3]} gap={4}>
            <SupportCard
              title="Start guide"
              description="Read how to get started with Saas UI Pro."
              icon={<LuCircleHelp />}
              href="https://saas-ui.dev/docs/pro/overview"
            />
            <SupportCard
              title="Components"
              description="See all components and how they work."
              icon={<LuBox />}
              href="https://www.saas-ui.dev/docs/components"
            />
            <SupportCard
              title="Roadmap"
              description="Post feedback, bugs and feature requests."
              icon={<LuGithub />}
              href="https://roadmap.saas-ui.dev"
            />
          </SimpleGrid>
        </Stack>
      </Stack>
    </SettingsPage>
  )
}
