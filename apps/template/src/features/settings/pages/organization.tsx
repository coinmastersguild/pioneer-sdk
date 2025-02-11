'use client'

import { Card, Group } from '@chakra-ui/react'
import { Section } from '@saas-ui-pro/react'
import { FormLayout, SubmitButton } from '@saas-ui/forms'
import { toast } from '@saas-ui/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { Organization, getOrganization, updateOrganization } from '#api'
import { Form } from '#components/form'
import { SettingsPage } from '#components/settings-page'
import { useWorkspace } from '#features/common/hooks/use-workspace'

const schema = z.object({
  name: z.string().min(2, 'Too short').max(25, 'Too long').describe('Name'),
  email: z
    .string()
    .email({ message: 'Please enter your email address' })
    .describe('Email'),
})

interface OrganizationDetailsProps {
  organization?: Organization | null
}

function OrganizationDetails({ organization }: OrganizationDetailsProps) {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: updateOrganization,
  })

  let form
  if (organization) {
    form = (
      <Form
        schema={schema}
        defaultValues={{
          name: organization.name,
          email: organization.email,
        }}
        onSubmit={(data) => {
          return mutateAsync({
            id: organization.id,
            name: data.name,
          }).then(() =>
            toast.success({
              title: 'Updated the organization',
            }),
          )
        }}
      >
        {({ Field }) => (
          <>
            <Card.Body css={{ '--field-label-width': '10rem' }}>
              <FormLayout>
                <Field
                  name="name"
                  orientation="horizontal"
                  label="Organization name"
                />
                <Field
                  name="email"
                  orientation="horizontal"
                  label="Email address"
                />
                <Group ps="calc(var(--field-label-width) + var(--chakra-spacing-2))">
                  <SubmitButton />
                </Group>
              </FormLayout>
            </Card.Body>
          </>
        )}
      </Form>
    )
  }
  return (
    <Section.Root>
      <Section.Header title="Organization details" />
      <Section.Body>
        <Card.Root>{form}</Card.Root>
      </Section.Body>
    </Section.Root>
  )
}

export function OrganizationSettingsPage() {
  const slug = useWorkspace()

  const { data, isLoading } = useQuery({
    queryKey: ['Organization', slug],
    queryFn: () => getOrganization({ slug }),
  })

  const organization = data?.organization

  return (
    <SettingsPage
      loading={isLoading}
      title="Organization"
      description="Manage your organization settings"
    >
      <OrganizationDetails organization={organization} />
    </SettingsPage>
  )
}
