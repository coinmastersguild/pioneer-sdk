'use client'

import * as React from 'react'

import {
  Container,
  HStack,
  Heading,
  Spacer,
  Tabs,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'
import { Page, Toolbar } from '@saas-ui-pro/react'
import { IconButton, LoadingOverlay, Tooltip } from '@saas-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LuActivity,
  LuFile,
  LuListTodo,
  LuPanelRight,
  LuStar,
} from 'react-icons/lu'

import {
  addComment,
  deleteComment,
  getContact,
  getContactActivities,
} from '#api'
import { Breadcrumbs } from '#components/breadcrumbs'
import { useCurrentUser } from '#features/common/hooks/use-current-user'
import { usePath } from '#features/common/hooks/use-path'

import {
  type Activities,
  ActivityTimeline,
} from './components/activity-timeline'
import { ContactSidebar } from './components/contact-sidebar'

interface ContactsViewPageProps {
  params: {
    workspace: string
    id: string
  }
  /**
   * Actions override for inbox page
   */
  actions?: React.ReactNode
}

export function ContactsViewPage({
  params,
  actions: actionsProp,
}: ContactsViewPageProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['Contact', params.id],
    queryFn: () => getContact({ id: params.id }),
    enabled: !!params.id,
  })

  const isMobile = useBreakpointValue(
    { base: true, lg: false },
    {
      fallback: undefined,
    },
  )

  const sidebar = useDisclosure({
    defaultOpen: true,
  })

  React.useEffect(() => {
    if (isMobile === true) {
      sidebar.onClose()
    }
  }, [isMobile, sidebar])

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { href: usePath('/contacts'), title: 'Contacts' },
        { title: data?.contact?.name },
      ]}
    />
  )

  const toolbar = actionsProp ?? (
    <Toolbar.Root>
      <Tooltip content="Favorite contact" portalled>
        <IconButton aria-label="Favorite contact" variant="ghost" size="xs">
          <LuStar size="14" />
        </IconButton>
      </Tooltip>
      <Spacer />
      <Tooltip
        content={sidebar.open ? 'Hide contact details' : 'Show contact details'}
      >
        <Toolbar.Button
          onClick={sidebar.onToggle}
          size="sm"
          aria-label="Toggle contact details"
        >
          <LuPanelRight />
        </Toolbar.Button>
      </Tooltip>
    </Toolbar.Root>
  )

  return (
    <Page.Root loading={isLoading}>
      <Page.Header title={breadcrumbs} actions={toolbar} />
      <Page.Body p="0">
        <HStack
          alignItems="stretch"
          width="100%"
          height="100%"
          position="relative"
          gap="0"
        >
          <Tabs.Root
            variant="pills"
            size="xs"
            colorPalette="gray"
            defaultValue="activity"
            lazyMount
            flex="1"
            minH="0"
            display="flex"
            flexDirection="column"
          >
            <Tabs.List px="4" py="2" borderBottomWidth="1px">
              <Tabs.Trigger value="activity">
                <LuActivity /> Activity
              </Tabs.Trigger>
              <Tabs.Trigger value="tasks">
                <LuListTodo /> Tasks
              </Tabs.Trigger>
              <Tabs.Trigger value="files">
                <LuFile />
                Files
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.ContentGroup overflowY="auto" flex="1">
              <Tabs.Content value="activity" p="8">
                <Container maxW="2xl">
                  <ActivitiesPanel contactId={params.id} />
                </Container>
              </Tabs.Content>
            </Tabs.ContentGroup>
          </Tabs.Root>

          <ContactSidebar contact={data?.contact} open={sidebar.open} />
        </HStack>
      </Page.Body>
    </Page.Root>
  )
}

const ActivitiesPanel: React.FC<{ contactId: string }> = ({ contactId }) => {
  const currentUser = useCurrentUser()

  const { data, isLoading } = useQuery({
    queryKey: ['ContactActivities', contactId],
    queryFn: () => getContactActivities({ id: contactId }),
  })

  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addComment,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['ContactActivities', contactId],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['ContactActivities', contactId],
      })
    },
  })

  return (
    <>
      <Heading as="h3" size="sm" mb="5">
        Activity
      </Heading>
      {!currentUser || isLoading ? (
        <LoadingOverlay.Root>
          <LoadingOverlay.Spinner />
        </LoadingOverlay.Root>
      ) : (
        <>
          <ActivityTimeline
            activities={(data?.activities || []) as Activities}
            currentUser={currentUser}
            onAddComment={async (data) => {
              return addMutation.mutate({
                contactId,
                comment: data.comment,
              })
            }}
            onDeleteComment={async (id) => {
              return deleteMutation.mutate({
                id: id as string,
              })
            }}
          />
        </>
      )}
    </>
  )
}
