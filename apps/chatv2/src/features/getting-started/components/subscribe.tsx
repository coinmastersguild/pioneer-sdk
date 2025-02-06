import * as z from 'zod'
import {
  Box,
  Flex,
  Heading,
  Stack,
  Text,
  useStepsContext,
} from '@chakra-ui/react'
import { Switch, toast } from '@saas-ui/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { subscribeToNewsletter } from '#api'
import { LinkButton } from '#components/button'

import { OnboardingStep } from './onboarding-step'

const schema = z.object({
  newsletter: z.boolean(),
})

type FormInput = z.infer<typeof schema>

export const SubscribeStep = () => {
  const [newsletter, setNewsletter] = useState(false)
  const stepper = useStepsContext()

  const { mutateAsync } = useMutation({
    mutationFn: subscribeToNewsletter,
  })

  return (
    <OnboardingStep<FormInput>
      schema={schema}
      title="Subscribe to updates"
      description="Saas UI is updated regularly. These are the best ways to stay up to date."
      defaultValues={{ newsletter: false }}
      onSubmit={async (data) => {
        if (data.newsletter) {
          try {
            await mutateAsync({
              workspace: workspace.value!,
              newsletter: data.newsletter,
            })
          } catch {
            toast.error({
              title: 'Could not subscribe you to our newsletter.',
            })
          }
        }

        stepper.goToNextStep()
      }}
      submitLabel="Continue"
      maxW={{ base: '100%', md: 'xl' }}
    >
      <Box m="-6">
        <Flex borderBottomWidth="1px" p="6" display="flex" alignItems="center">
          <Stack flex="1" alignItems="flex-start" gap="0.5">
            <Heading size="md">Subscribe to our monthly newsletter</Heading>
            <Text color="fg.muted" fontSize="sm">
              Receive monthly updates in your email inbox.
            </Text>
          </Stack>
          <Switch />
        </Flex>
        <Flex borderBottomWidth="1px" p="6" display="flex" alignItems="center">
          <Stack flex="1" alignItems="flex-start" gap="0.5">
            <Heading size="md">Follow us on X</Heading>
            <Text color="fg.muted" fontSize="sm">
              Regular posts with updates and tips.
            </Text>
          </Stack>
          <LinkButton
            href="https://x.com/saas_js"
            target="_blank"
            colorPalette="neutral"
          >
            @saas_js
          </LinkButton>
        </Flex>
        <Flex p="6" display="flex" alignItems="center">
          <Stack flex="1" alignItems="flex-start" gap="0.5">
            <Heading size="md">Join our Discord community</Heading>
            <Text color="fg.muted" fontSize="sm">
              Chat with other developers and founders.
            </Text>
          </Stack>
          <LinkButton href="https://saas-ui.dev/discord" colorPalette="indigo">
            Join Discord
          </LinkButton>
        </Flex>
      </Box>
    </OnboardingStep>
  )
}
