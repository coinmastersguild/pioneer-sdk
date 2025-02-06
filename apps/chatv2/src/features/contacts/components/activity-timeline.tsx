import * as React from 'react'

import * as z from 'zod'
import {
  Box,
  Card,
  Group,
  HStack,
  Spacer,
  Span,
  Text,
  TextProps,
  Timeline,
  useClipboard,
} from '@chakra-ui/react'
import { Toolbar } from '@saas-ui-pro/react'
import { User } from '@saas-ui/auth-provider'
import {
  FormLayout,
  SubmitButton,
  SubmitHandler,
  type UseFormReturn,
} from '@saas-ui/forms'
import {
  Command,
  Link,
  LinkProps,
  PersonaAvatar,
  Tooltip,
  toast,
} from '@saas-ui/react'
import { AnimatePresence } from 'framer-motion'
import { LuPaperclip } from 'react-icons/lu'

import { EditorField } from '#components/editor'
import { Form } from '#components/form'
import { useModals } from '#components/modals'
import { OverflowMenu } from '#components/overflow-menu/index.ts'
import { StatusBadge } from '#components/status-badge'
import { DateTime, RelativeTime } from '#i18n/date-helpers'

type Activity<Type, TData extends object, TUser = Partial<User>> = {
  id: string
  user: TUser
  type: Type
  data: TData
  date: Date
}

type ActivityAction = Activity<'action', { action: string }>
type ActivityComment = Activity<'comment', { comment: string }>
type ActivityUpdate = Activity<
  'update',
  { field: string; oldValue?: string; value?: string }
>

export type Activities = Array<
  ActivityAction | ActivityComment | ActivityUpdate
>

export interface ActivityTimelineProps {
  activities: Activities
  currentUser: User
  onAddComment: SubmitHandler<Comment>
  onDeleteComment?(id: string | number): Promise<void>
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = (props) => {
  const { currentUser, activities, onAddComment, onDeleteComment } = props

  return (
    <Box>
      <Timeline.Root>
        <AnimatePresence initial={false}>
          {activities?.map((activity) => {
            switch (activity.type) {
              case 'action':
                return (
                  <ActivityTimelineAction key={activity.id} {...activity} />
                )
              case 'comment':
                return (
                  <ActivityTimelineComment
                    key={activity.id}
                    {...activity}
                    onDelete={onDeleteComment}
                  />
                )
              case 'update':
                return (
                  <ActivityTimelineUpdate key={activity.id} {...activity} />
                )
            }
          })}
        </AnimatePresence>
      </Timeline.Root>
      <ActivityTimelineAddComment user={currentUser} onSubmit={onAddComment} />
    </Box>
  )
}

interface ActivityTimelineItem extends Timeline.ItemProps {
  id?: string
  icon: React.ReactNode
  children: React.ReactNode
  indicatorOffset?: string
}

const ActivityTimelineItem: React.FC<ActivityTimelineItem> = (props) => {
  const { id, icon, children, indicatorOffset = '0', ...rest } = props
  return (
    <Timeline.Item
      id={id}
      role="group"
      css={{
        '&:last-of-type .chakra-timeline__separator': { opacity: 0 },
      }}
      {...rest}
    >
      <Timeline.Separator />

      <Timeline.Connector>
        <Timeline.Indicator
          mt={indicatorOffset}
          bg="inherit"
          outlineColor="var(--bg-current-color)"
        >
          {icon}
        </Timeline.Indicator>
      </Timeline.Connector>

      {children}
    </Timeline.Item>
  )
}

interface ActivityTimelineDate {
  date: Date
}

const ActivityTimelineDate: React.FC<ActivityTimelineDate> = (props) => {
  return (
    <Tooltip content={<DateTime date={props.date} />}>
      <ActivityText>
        <RelativeTime date={props.date} />
      </ActivityText>
    </Tooltip>
  )
}

const ActivityText = React.forwardRef<HTMLParagraphElement, TextProps>(
  function ActivityText(props, ref) {
    return (
      <Text as="span" ref={ref} color="fg.muted" textStyle="sm" {...props} />
    )
  },
)

const ActivityLink: React.FC<LinkProps> = (props) => {
  const { copy } = useClipboard({
    value: props.href || '',
  })

  return (
    <Link
      {...props}
      onClick={() => {
        copy()
        toast.success({ title: 'Link copied to clipboard' })
      }}
    />
  )
}

const ActivityUser: React.FC<TextProps & { user: Partial<User> }> = (props) => {
  const { user, ...rest } = props
  return (
    <ActivityText fontWeight="medium" color="fg" {...rest}>
      {user.name || user.email || user.id}
    </ActivityText>
  )
}

const ActivityTimelineAction: React.FC<ActivityAction> = (props) => {
  const { id, user, date } = props

  const status = user.status === 'active' ? 'online' : user.status

  return (
    <ActivityTimelineItem
      id={`action-${id}`}
      icon={
        <PersonaAvatar
          src={user.avatar}
          name={user.name}
          size="2xs"
          presence={status}
        />
      }
    >
      <Timeline.Content flexDirection="row" alignItems="center">
        <ActivityText>
          <ActivityUser user={user} /> created the contact.
        </ActivityText>
        <Span textStyle="sm" color="fg.muted">
          •
        </Span>
        <ActivityLink href={`#action-${id}`} color="fg.muted" textStyle="xs">
          <ActivityTimelineDate date={date} />
        </ActivityLink>
      </Timeline.Content>
    </ActivityTimelineItem>
  )
}

interface UpdateIconProps {
  field: string
  value?: string
}

const UpdateIcon: React.FC<UpdateIconProps> = (props) => {
  switch (props.field) {
    case 'status':
      return <StatusBadge color={props.value} />
    default:
      return <Box boxSize="2" borderWidth="2px" borderColor="muted" />
  }
}

const ActivityTimelineUpdate: React.FC<ActivityUpdate> = (props) => {
  const { id, user, data, date } = props

  return (
    <ActivityTimelineItem id={`update-${id}`} icon={<UpdateIcon {...data} />}>
      <Timeline.Content flexDirection="row" alignItems="center">
        <ActivityText>
          <ActivityUser user={user} /> changed {data.field} to {data.value}
          {data.oldValue && ` from ${data.oldValue}`}.
        </ActivityText>
        <Span textStyle="sm" color="fg.muted">
          •
        </Span>
        <ActivityLink href={`#update-${id}`} color="fg.muted" textStyle="xs">
          <ActivityTimelineDate date={date} />
        </ActivityLink>
      </Timeline.Content>
    </ActivityTimelineItem>
  )
}

interface ActivityTimelineCommentProps extends ActivityComment {
  onDelete?(id: string | number): Promise<void>
}

const ActivityTimelineComment: React.FC<ActivityTimelineCommentProps> = (
  props,
) => {
  const { id, user, data, date, onDelete } = props
  const modals = useModals()

  return (
    <ActivityTimelineItem
      id={`comment-${id}`}
      icon={
        <PersonaAvatar
          src={user.avatar}
          name={user.name}
          size="2xs"
          presence={user.presence}
          mt="2"
        />
      }
    >
      <Timeline.Content>
        <Card.Root mb="4">
          <Card.Body py="2">
            <HStack mb="4">
              <ActivityUser user={user} />
              <ActivityLink href={`#action-${id}`} color="muted">
                <ActivityTimelineDate date={date} />
              </ActivityLink>
              <Group
                position="absolute"
                top="2"
                right="2"
                opacity="0"
                transition="all .2s ease-in"
                _groupHover={{ opacity: 1 }}
              >
                <OverflowMenu.Root>
                  <OverflowMenu.Item
                    value="delete"
                    onClick={() =>
                      modals.confirm({
                        title: 'Are you sure you want to delete this comment?',
                        children: 'This action cannot be undone.',
                        confirmProps: { colorPalette: 'red' },
                        onConfirm: () => onDelete?.(id),
                      })
                    }
                  >
                    Delete
                  </OverflowMenu.Item>
                </OverflowMenu.Root>
              </Group>
            </HStack>

            <Box
              dangerouslySetInnerHTML={{ __html: data.comment }}
              wordBreak="break-all"
              textStyle="sm"
            />
          </Card.Body>
        </Card.Root>
      </Timeline.Content>
    </ActivityTimelineItem>
  )
}

const commentSchema = z.object({
  comment: z
    .string({
      required_error: 'Please add a comment',
    })
    .min(1, 'Please add a comment'),
})

interface Comment {
  files?: FileList
  comment: string
}

interface ActivityTimelineAddCommentProps {
  onSubmit: SubmitHandler<Comment>
  user: User
}

const ActivityTimelineAddComment: React.FC<ActivityTimelineAddCommentProps> = (
  props,
) => {
  const { onSubmit, user } = props

  const formRef = React.useRef<UseFormReturn<any>>(null)
  const submitRef = React.useRef<HTMLButtonElement>(null)

  return (
    <Card.Root py="3" px="4">
      <Form
        schema={commentSchema}
        formRef={formRef}
        onSubmit={async (data) => {
          await onSubmit(data)

          formRef.current?.reset({
            comment: '',
          })
        }}
        mode="onSubmit"
      >
        <FormLayout gap="0">
          <EditorField
            name="comment"
            border="0"
            padding="0"
            placeholder="Write your comment..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                submitRef.current?.click()
              }
            }}
          />
          <Toolbar.Root>
            <Spacer />
            <Toolbar.Button color="muted" label="Upload a file">
              <LuPaperclip />
            </Toolbar.Button>
            <Tooltip
              content={
                <>
                  Submit comment <Command>⌘ enter</Command>
                </>
              }
            >
              <SubmitButton ref={submitRef}>Comment</SubmitButton>
            </Tooltip>
          </Toolbar.Root>
        </FormLayout>
      </Form>
    </Card.Root>
  )
}
