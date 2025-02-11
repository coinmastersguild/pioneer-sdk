'use client'

import * as React from 'react'

import {
  DataList,
  Popover,
  Portal,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'
import {
  Page,
  ResizeHandle,
  Resizer,
  SplitPage,
  ToggleGroup,
  Toolbar,
} from '@saas-ui-pro/react'
import { Switch } from '@saas-ui/react'
import { EmptyState } from '@saas-ui/react/empty-state'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LuInbox, LuSlidersHorizontal } from 'react-icons/lu'

import { getNotifications } from '#api'

import { UpdatesList } from './components/updates-list'

export function UpdatesLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: {
    workspace: string
    id?: string
  }
}) {
  const { data } = useSuspenseQuery({
    queryKey: ['Notifications'],
    queryFn: () => getNotifications(),
  })

  const isMobile = useBreakpointValue(
    { base: true, lg: false },
    { fallback: 'base' },
  )

  const { open, onOpen, onClose } = useDisclosure({
    defaultOpen: !!params.id,
  })

  const [width, setWidth] = React.useState(280)

  // React.useEffect(() => {
  //   if (!params.id && !isLoading && !isMobile) {
  //     const firstItem = data?.notifications[0]
  //     if (firstItem) {
  //       // redirect to the first inbox notification if it's available.
  //       router.replace(`/${params.workspace}/updates/${firstItem.id}`)
  //     }
  //   }
  // }, [router, data, isLoading, isMobile])

  // React.useEffect(() => {
  //   if (params.id) {
  //     onOpen()
  //   }
  //   // the isMobile dep is needed so that the SplitPage
  //   // will open again when the screen size changes to lg
  // }, [params.id, isMobile])

  const [visibleProps, setVisibleProps] = React.useState<string[]>([])

  const notificationCount = data?.notifications?.length || 0

  const displayProperties = (
    <ToggleGroup.Root
      multiple
      attached={false}
      gap="0"
      flexWrap="wrap"
      value={visibleProps}
      onValueChange={(details) => {
        setVisibleProps(details.value)
      }}
    >
      {['id'].map((id) => {
        return (
          <ToggleGroup.Button
            key={id}
            value={id}
            variant="surface"
            size="xs"
            mb="1"
            me="1"
            color="fg.muted"
            _checked={{ color: 'app-text', bg: 'whiteAlpha.200' }}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </ToggleGroup.Button>
        )
      })}
    </ToggleGroup.Root>
  )

  const toolbar = (
    <Toolbar.Root justifyContent="flex-end">
      <Popover.Root
        size="sm"
        positioning={{
          placement: 'bottom-end',
        }}
      >
        <Popover.Trigger asChild>
          <Toolbar.Button label="Display" variant="surface" size="xs">
            <LuSlidersHorizontal />
            Display
          </Toolbar.Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content maxW="260px">
              <Popover.Body borderBottomWidth="1px">
                <DataList.Root orientation="horizontal">
                  <DataList.Item>
                    <DataList.ItemLabel>Show snoozed</DataList.ItemLabel>
                    <DataList.ItemValue justifyContent="flex-end">
                      <Switch size="sm" defaultChecked={false} />
                    </DataList.ItemValue>
                  </DataList.Item>

                  <DataList.Item>
                    <DataList.ItemLabel>Show read</DataList.ItemLabel>
                    <DataList.ItemValue justifyContent="flex-end">
                      <Switch size="sm" defaultChecked={false} />
                    </DataList.ItemValue>
                  </DataList.Item>
                </DataList.Root>
              </Popover.Body>
              <Popover.Body>
                <DataList.Root>
                  <DataList.Item>
                    <DataList.ItemLabel>Display properties</DataList.ItemLabel>
                    <DataList.ItemValue>{displayProperties}</DataList.ItemValue>
                  </DataList.Item>
                </DataList.Root>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Toolbar.Root>
  )

  const emptyState = (
    <EmptyState
      icon={<LuInbox />}
      title="Updates zero"
      description="Nothing to do here"
      height="100%"
    />
  )

  return (
    <SplitPage open={open} onOpen={onOpen} onClose={onClose}>
      <Resizer
        defaultWidth={width}
        onResize={({ width }) => setWidth(width)}
        enabled={!isMobile}
      >
        <Page.Root
          as="div"
          borderRightWidth={{ base: 0, lg: '1px' }}
          minWidth="280px"
          maxW={{ base: '100%', lg: '640px' }}
          position="relative"
          flex={{ base: '1', lg: 'unset' }}
        >
          <Page.Header title="Updates" actions={toolbar} />
          <Page.Body p="0">
            {!notificationCount && isMobile ? (
              emptyState
            ) : (
              <UpdatesList items={data?.notifications || []} />
            )}
          </Page.Body>
          <ResizeHandle />
        </Page.Root>
      </Resizer>
      <>{children}</>
    </SplitPage>
  )
}
