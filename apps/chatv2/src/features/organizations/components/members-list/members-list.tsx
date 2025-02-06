import * as React from 'react'

import {
  Box,
  Card,
  CardHeader,
  HStack,
  Heading,
  IconButton,
  Tag,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { useSearchQuery } from '@saas-ui-pro/react'
import { FieldOptions, FormLayout } from '@saas-ui/forms'
import { Button, EmptyState } from '@saas-ui/react'
import { GridList, Menu, PersonaAvatar } from '@saas-ui/react'
import without from 'lodash/without'
import { LuEllipsis } from 'react-icons/lu'
import { z } from 'zod'

import {
  InviteData,
  InviteDialog,
  defaultMemberRoles,
} from '#components/invite-dialog'
import { useModals } from '#components/modals'
import { SearchInput } from '#components/search-input'

export interface Member {
  id: string
  email: string
  name?: string
  status?: 'invited' | 'active'
  roles?: string | string[]
  presence?: string
}

const Roles = ({ roles }: { roles?: string | string[] }) => {
  if (!roles || !roles.length) {
    return null
  }

  if (typeof roles === 'string') {
    return (
      <Tag.Root colorPalette="gray" size="sm">
        <Tag.Label>{roles}</Tag.Label>
      </Tag.Root>
    )
  }

  return (
    <>
      {roles?.map((role) => (
        <Tag.Root colorPalette="gray" key={role} size="sm">
          <Tag.Label>{role}</Tag.Label>
        </Tag.Root>
      ))}
    </>
  )
}

interface MemberListItemProps<M> {
  member: M
  onRemove(member: M): void
  onResendInvite(member: M): void
  onCancelInvite(member: M): void
  onChangeRole(member: M): void
}
function MembersListItem<M extends Member = Member>({
  member,
  onRemove,
  onResendInvite,
  onCancelInvite,
  onChangeRole,
}: MemberListItemProps<M>) {
  let actions

  const isInvite = member.status === 'invited'

  if (isInvite) {
    actions = (
      <>
        <Menu.Item value="resend" onClick={() => onResendInvite?.(member)}>
          Resend invitation
        </Menu.Item>
        <Menu.Item value="cancel" onClick={() => onCancelInvite?.(member)}>
          Cancel invitation
        </Menu.Item>
      </>
    )
  } else {
    actions = (
      <>
        <Menu.Item value="change" onClick={() => onChangeRole?.(member)}>
          Change role
        </Menu.Item>
        <Menu.Item value="remove" onClick={() => onRemove?.(member)}>
          Remove member
        </Menu.Item>
      </>
    )
  }

  return (
    <GridList.Item
      py="4"
      borderBottomWidth="1px"
      css={{ '&:last-of-type': { borderWidth: 0 } }}
    >
      <GridList.Cell>
        <PersonaAvatar
          name={member.name}
          presence={member.presence}
          size="xs"
        />
      </GridList.Cell>
      <GridList.Cell flex="1" px="4" flexDirection="column" gap="0">
        <Text textStyle="sm" fontWeight="medium">
          {member.name || member.email}
        </Text>
        <Text color="fg.muted" textStyle="sm">
          {member.name ? member.email : null}
        </Text>
      </GridList.Cell>
      <GridList.Cell>
        <HStack>
          {isInvite ? (
            <Tag.Root size="sm" variant="surface">
              {member.status}
            </Tag.Root>
          ) : (
            <Roles roles={member.roles} />
          )}
        </HStack>
      </GridList.Cell>
      <GridList.Cell>
        <Box>
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton variant="ghost" size="sm">
                <LuEllipsis />
              </IconButton>
            </Menu.Trigger>
            <Menu.Content>{actions}</Menu.Content>
          </Menu.Root>
        </Box>
      </GridList.Cell>
    </GridList.Item>
  )
}

export interface MembersListProps<TMember>
  extends Omit<Card.RootProps, 'children'> {
  inviteLabel?: string
  searchLabel?: string
  noResults?: string
  members: Array<TMember>
  roles?: FieldOptions
  isMultiRoles?: boolean
  onRemove(member: TMember): void
  onInvite(data: InviteData): Promise<any>
  onCancelInvite(member: TMember): Promise<any>
  onUpdateRoles(member: TMember, roles: string[]): Promise<any>
}

export function MembersList<TMember extends Member = Member>({
  inviteLabel = 'Invite people',
  searchLabel = 'Filter by name or email',
  noResults = 'No people found',
  members,
  roles = defaultMemberRoles,
  isMultiRoles = false,
  onRemove,
  onInvite,
  onCancelInvite,
  onUpdateRoles,
  ...cardProps
}: MembersListProps<TMember>) {
  const modals = useModals()
  const invite = useDisclosure()

  const { results, ...searchProps } = useSearchQuery<TMember>({
    items: members,
    fields: ['name', 'email'],
  })

  const onChangeRole = React.useCallback(
    (member: TMember) => {
      // modals.form?.({
      //   title: 'Update roles',
      //   schema: z.object({
      //     roles: isMultiRoles ? z.array(z.string()) : z.string(),
      //   }),
      //   onSubmit: async ({ roles }) => {
      //     if (typeof roles === 'string') {
      //       roles = [roles]
      //     }
      //     onUpdateRoles?.(member, roles)
      //   },
      //   defaultValues: {
      //     roles: isMultiRoles
      //       ? member.roles
      //       : without(member.roles, 'owner')?.[0],
      //   },
      //   fields: {
      //     submit: {
      //       children: 'Update',
      //     },
      //   },
      //   children: (
      //     <FormLayout>
      //       <Field name="roles" type="radio" options={defaultMemberRoles} />
      //     </FormLayout>
      //   ),
      // })
    },
    [roles],
  )

  return (
    <Card.Root {...cardProps}>
      <Card.Header display="flex" flexDirection="row" gap="2" px="3" pb="2">
        <SearchInput
          placeholder={searchLabel}
          size="sm"
          {...searchProps}
          mr="2"
        />
        <Button
          onClick={invite.onOpen}
          colorPalette="accent"
          variant="glass"
          flexShrink="0"
          size="sm"
        >
          {inviteLabel}
        </Button>
      </Card.Header>
      {results?.length ? (
        <GridList.Root py="0">
          {results.map((member, i) => (
            <MembersListItem<TMember>
              key={i}
              member={member}
              onRemove={onRemove}
              onResendInvite={({ email, roles }) =>
                onInvite({ emails: [email], role: roles?.[0] })
              }
              onCancelInvite={onCancelInvite}
              onChangeRole={onChangeRole}
            />
          ))}
        </GridList.Root>
      ) : (
        <EmptyState title={noResults} size="sm" p="4" />
      )}
      <InviteDialog
        title={inviteLabel}
        onInvite={onInvite}
        open={invite.open}
        onOpenChange={(details) => {
          if (details.open) {
            invite.onOpen()
          } else {
            invite.onClose()
          }
        }}
        roles={roles}
      />
    </Card.Root>
  )
}
