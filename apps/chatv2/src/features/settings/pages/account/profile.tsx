'use client'

import { useRef, useState } from 'react'

import { Card, Field, Group, Input, Stack } from '@chakra-ui/react'
import { FormLayout } from '@saas-ui/forms'
import { Avatar, Button, Tooltip, toast } from '@saas-ui/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { User, getCurrentUser, updateUser } from '#api'
import { Form } from '#components/form'
import { SettingsPage } from '#components/settings-page'
import { DEFAULT_AVATAR } from '../../../../config/constants'

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
  email: z
    .string()
    .email({ message: 'Please enter your email address' })
    .describe('Email'),
})

function ProfileDetails({ user }: { user: User }) {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: updateUser,
  })

  return (
    <Stack>
      <Card.Root>
        <Form
          schema={schema}
          defaultValues={{
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email,
          }}
          onSubmit={(data) => {
            mutateAsync({
              id: user.id,
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
            }).then(() =>
              toast.success({
                title: 'Profile updated',
              }),
            )
          }}
        >
          {({ Field }) => (
            <Card.Body>
              <FormLayout css={{ '--field-label-width': '142px' }}>
                <ProfileAvatar user={user} />
                <Field
                  name="firstName"
                  label="First name"
                  orientation="horizontal"
                />
                <Field
                  name="lastName"
                  label="Last name"
                  orientation="horizontal"
                />
                <Field name="email" label="Email" orientation="horizontal" />
                <Group ps="calc(var(--field-label-width) + var(--chakra-spacing-1\.5))">
                  <Button variant="surface" type="submit" isLoading={isPending}>
                    Save
                  </Button>
                </Group>
              </FormLayout>
            </Card.Body>
          )}
        </Form>
      </Card.Root>
    </Stack>
  )
}

function ProfileAvatar({ user }: { user: User }) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const ref = useRef<HTMLInputElement>(null)

  const selectFile = () => {
    ref.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target?.files

    if (files?.length) {
      setPreviewUrl(URL.createObjectURL(files[0]))
    }
  }

  return (
    <Field.Root orientation="horizontal">
      <Field.Label>Profile picture</Field.Label>
      <Tooltip content="Upload a picture">
        <Avatar
          name={user.name}
          src={previewUrl || user.avatar || DEFAULT_AVATAR}
          size="md"
          onClick={selectFile}
          cursor="pointer"
        />
      </Tooltip>
      <Input type="file" ref={ref} onChange={handleFileChange} display="none" />
    </Field.Root>
  )
}

export function AccountProfilePage() {
  const { isLoading, data } = useQuery({
    queryKey: ['CurrentUser'],
    queryFn: getCurrentUser,
  })

  const user = data?.currentUser

  return (
    <SettingsPage
      title="Profile"
      description="Manage your profile"
      loading={isLoading}
      actions={null}
    >
      {user && <ProfileDetails user={user} />}
    </SettingsPage>
  )
}
