import * as z from 'zod'
import { useStepsContext } from '@chakra-ui/react'
import { useSessionStorageValue } from '@react-hookz/web'
import { Field, FormLayout } from '@saas-ui/forms'
import { toast } from '@saas-ui/react'
import { useMutation } from '@tanstack/react-query'

import { inviteToOrganization } from '#api'

import { OnboardingStep } from './onboarding-step'

const schema = z.object({
  emails: z.string(),
})

export const InviteTeamMembersStep = () => {
  const workspace = useSessionStorageValue<string>('getting-started.workspace')

  const stepper = useStepsContext()

  const { mutateAsync: invite } = useMutation({
    mutationFn: inviteToOrganization,
  })

  return (
    <OnboardingStep
      schema={schema}
      title="Invite Support Team Members"
      description="Add team members to help manage support requests."
      defaultValues={{ emails: '' }}
      onSubmit={async (data) => {
        if (workspace.value && data.emails) {
          try {
            await invite({
              organizationId: workspace.value,
              emails: data.emails.split(/,\s?/),
            })
          } catch {
            toast.error({
              title: 'Failed to invite team members',
              description: 'Please try again or skip this step.',
              action: {
                label: 'Skip',
                onClick() {
                  stepper.goToNextStep()
                },
              },
            })
            return
          }
        }
        stepper.goToNextStep()
      }}
      submitLabel="Continue"
      maxW={{ base: '100%', md: 'lg' }}
    >
      <FormLayout>
        <Field
          name="emails"
          label="Support Team Email Addresses"
          placeholder="member@acme.co, member2@acme.co"
          type="textarea"
          help="Invite team members to help manage support requests"
          autoFocus
        />
      </FormLayout>
    </OnboardingStep>
  )
}
