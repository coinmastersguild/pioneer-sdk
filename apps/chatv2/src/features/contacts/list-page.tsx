'use client'

import * as React from 'react'

import {
  Button,
  DataList,
  Flex,
  Group,
  HStack,
  Popover,
  Portal,
  Spacer,
  createListCollection,
} from '@chakra-ui/react'
import {
  ActiveFiltersList,
  BulkActions,
  type ColumnFiltersState,
  Filter,
  type FilterItem,
  FiltersProvider,
  Page,
  ToggleGroup,
  Toolbar,
} from '@saas-ui-pro/react'
import { Command, EmptyState, Select, Tooltip } from '@saas-ui/react'
import { useHotkeys, useHotkeysShortcut } from '@saas-ui/use-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { TableState } from '@tanstack/react-table'
import { useParams } from 'next/navigation'
import { LuGrid2X2, LuList, LuSlidersHorizontal, LuUser } from 'react-icons/lu'
import { z } from 'zod'

import { getContacts } from '#api'
import { InlineSearch } from '#components/inline-search/inline-search.tsx'
import { useModals } from '#components/modals'

import { AddPersonDialog } from './components/add-person-dialog.tsx'
import { bulkActions } from './components/contact-bulk-actions.tsx'
import { AddFilterButton, filters } from './components/contact-filters.tsx'
import { ContactTypes } from './components/contact-types.tsx'
import { ContactsBoard } from './components/contacts-board.tsx'
import { ContactsGrid } from './components/contacts-grid.tsx'
import { useContactsColumns } from './components/use-contacts-columns.tsx'

const schema = z.object({
  firstName: z
    .string()
    .min(2, 'Too short')
    .max(25, 'Too long')
    .describe('First name'),
  lastName: z
    .string()
    .min(2, 'Too short')
    .max(25, 'Too long')
    .describe('Last name'),
  email: z.string().email().describe('Email'),
})

export function ContactsListPage() {
  const modals = useModals()

  const query = useParams()

  const type = query?.type?.toString()

  const [searchQuery, setSearchQuery] = React.useState('')

  const { data, isLoading } = useQuery({
    queryKey: [
      'GetContacts',
      {
        type,
        searchQuery,
      },
    ] as const,
    queryFn: async ({ queryKey }) => {
      const data = await getContacts(queryKey[1])

      if (queryKey[1].searchQuery) {
        return {
          contacts: data.contacts.filter((contact) => {
            return contact.name.includes(queryKey[1].searchQuery)
          }),
        }
      }

      return data
    },
  })

  const addPerson = () => {
    modals.open(AddPersonDialog)
  }

  const addCommand = useHotkeysShortcut('contacts.add', addPerson)

  const [groupBy, setGroupBy] = React.useState('status')

  const columns = useContactsColumns()

  const groupCollection = createListCollection({
    items: [
      { value: 'status', label: 'Status' },
      { value: 'type', label: 'Type' },
      { value: 'tags', label: 'Tag' },
    ],
  })

  const groupBySelect = (
    <Select.Root
      name="groupBy"
      value={[groupBy]}
      collection={groupCollection}
      onValueChange={({ value }) => setGroupBy(value[0] as string)}
      size="xs"
    >
      <Select.Trigger>
        <Select.ValueText placeholder="Group by" />
      </Select.Trigger>

      <Select.Content portalled={false}>
        {groupCollection.items.map((item) => (
          <Select.Item key={item.value} item={item}>
            {item.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )

  const primaryAction = (
    <Tooltip
      portalled
      content={
        <>
          Add person <Command>{addCommand}</Command>
        </>
      }
    >
      <Button variant="primary" size="sm" onClick={addPerson}>
        Add person
      </Button>
    </Tooltip>
  )

  const [view, setView] = React.useState<'list' | 'board'>('list')

  const [showSearch, setShowSearch] = React.useState(false)

  useHotkeys('cmd+f', () => setShowSearch((prev) => !prev), {
    preventDefault: true,
  })

  const [visibleColumns, setVisibleColumns] = React.useState([
    'name',
    'email',
    'createdAt',
    'type',
    'status',
  ])

  const displayProperties = (
    <ToggleGroup.Root
      multiple
      attached={false}
      display="flex"
      flexWrap="wrap"
      gap="1"
      value={visibleColumns}
      onValueChange={({ value }) => {
        setVisibleColumns(value as string[])
      }}
    >
      {columns.map((col) => {
        if ('accessorKey' in col && col.enableHiding !== false) {
          const id = col.id || col.accessorKey
          return (
            <ToggleGroup.Button
              key={id}
              value={id}
              size="xs"
              color="fg.muted"
              borderColor="border.subtle"
              _pressed={{ borderColor: 'border.emphasized' }}
              variant="surface"
            >
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </ToggleGroup.Button>
          )
        }
        return null
      })}
    </ToggleGroup.Root>
  )

  const toolbar = (
    <Toolbar.Root>
      <ContactTypes />
      <Spacer />
      {showSearch && (
        <InlineSearch
          ref={(el) => {
            el?.focus()
          }}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onReset={() => {
            setSearchQuery('')

            setShowSearch(false)
          }}
        />
      )}
      {primaryAction}
    </Toolbar.Root>
  )

  const tabbar = (
    <Toolbar.Root height="10" borderTopWidth="1px" mx="-3" px="3">
      <Flex flex="1" flexWrap="wrap" gap="2" alignItems="center">
        <ActiveFiltersList size="xs" variant="surface" />
        <AddFilterButton />
      </Flex>
      <ToggleGroup.Root
        value={[view]}
        onValueChange={({ value }) => {
          setView(value[0] as 'list' | 'board')
        }}
        attached
        width="auto"
      >
        <ToggleGroup.Button value="list" variant="outline" size="xs">
          <LuList />
        </ToggleGroup.Button>
        <ToggleGroup.Button value="board" variant="outline" size="xs">
          <LuGrid2X2 />
        </ToggleGroup.Button>
      </ToggleGroup.Root>
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
                    <DataList.ItemLabel>Group by</DataList.ItemLabel>
                    <DataList.ItemValue justifyContent="flex-end">
                      {groupBySelect}
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

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )

  const onFilter = React.useCallback((filters: Filter[]) => {
    setColumnFilters(
      filters.map((filter) => {
        return {
          id: filter.id,
          value: {
            value: filter.value,
            operator: filter.operator,
          },
        }
      }) as ColumnFiltersState,
    )
  }, [])

  const onBeforeEnableFilter = React.useCallback(
    (activeFilter: Filter, filter: FilterItem): Promise<Filter> => {
      return new Promise((resolve, reject) => {
        const { key, id, value } = activeFilter
        const { type, label } = filter

        // if (type === 'date' && value === 'custom') {
        //   return modals.open({
        //     title: label,
        //     date: new Date(),
        //     onSubmit: (date: DateValue) => {
        //       resolve({
        //         key,
        //         id,
        //         value: date.toDate(getLocalTimeZone()),
        //         operator: 'after',
        //       })
        //     },
        //     onClose: () => reject(),
        //     component: DatePickerModal,
        //   })
        // }

        resolve(activeFilter)
      })
    },
    [],
  )

  const defaultFilters = React.useMemo(() => {
    if (query.tag) {
      return [{ id: 'tags', operator: 'contains', value: query.tag }]
    }
    return []
  }, [query.tag])

  const [selections, setSelections] = React.useState<string[]>([])

  const initialState = React.useMemo(() => {
    return {
      pagination: {
        pageSize: 20,
      },
      columnPinning: {
        left: ['selection', 'name'],
        right: ['action'],
      },
    }
  }, [])

  const state = React.useMemo(() => {
    return {
      columnFilters,
      columnVisibility: Object.fromEntries(
        visibleColumns.map((column) => [column, true]),
      ),
    } satisfies Partial<TableState>
  }, [columnFilters, visibleColumns])

  let body = null

  const tableProps = {
    initialState,
    data: data?.contacts ?? [],
    state,
    onSelectedRowsChange: (rows: string[]) => {
      setSelections(rows)
    },
  }

  if (!isLoading && !data?.contacts.length) {
    body = (
      <EmptyState
        title="No people added yet"
        description="Add a person or import data to get started."
        colorPalette="primary"
        icon={<LuUser />}
      >
        <Button variant="primary" onClick={addPerson}>
          Add a person
        </Button>
        <Button>Import data</Button>
      </EmptyState>
    )
  } else if (view === 'board') {
    body = <ContactsBoard {...tableProps} />
  } else {
    body = <ContactsGrid {...tableProps} />
  }

  return (
    <FiltersProvider
      filters={filters}
      defaultFilters={defaultFilters}
      onChange={onFilter}
      onBeforeEnableFilter={onBeforeEnableFilter}
    >
      <Page.Root>
        <Page.Header title="People" actions={toolbar} footer={tabbar} />
        <Page.Body p="0" overflow="visible" flex="1" minH="1">
          {body}
        </Page.Body>
      </Page.Root>

      <BulkActions.Root open={selections.length > 0}>
        <BulkActions.Content portalled>
          <Group
            gap="0"
            border="1px dashed"
            borderRadius="md"
            borderColor="border"
          >
            <BulkActions.SelectionTrigger border="0">
              {selections.length} selected
            </BulkActions.SelectionTrigger>
            <BulkActions.CloseButton onClick={() => setSelections([])} />
          </Group>
          <BulkActions.Separator />
          <HStack flex="1" justify="flex-end">
            {bulkActions?.({ selections })}
          </HStack>
        </BulkActions.Content>
      </BulkActions.Root>
    </FiltersProvider>
  )
}
