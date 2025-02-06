'use client'

import { useStepsContext } from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@saas-ui/react'
import { v4 as uuidv4 } from 'uuid'
import { usePioneerApp } from '#components/pioneer/pioneer-provider'
import { FormLayout } from '@saas-ui/forms'
import { Form } from '#components/form'
import { useRouter } from 'next/navigation'
import { Box, Text, VStack, Divider as ChakraDivider } from '@chakra-ui/react'

import { OnboardingStep } from './onboarding-step'
import * as z from 'zod'

const schema = z.object({
  description: z.string().min(1, 'Please describe your issue'),
})

type FormInput = z.infer<typeof schema>

export const CreateTicketStep = () => {
  const stepper = useStepsContext()
  const { state } = usePioneerApp()
  const { app } = state
  const router = useRouter()

  const { mutateAsync: createTicket } = useMutation({
    mutationFn: async (data: FormInput) => {
      const ticketId = uuidv4()
      
      // Store the ticket data with keepkey workspace
      console.log('Ticket created:', {
        id: ticketId,
        workspace: 'keepkey',
        email: app?.username || '',
        ...data
      })

      // Store the workspace in session storage
      window.sessionStorage.setItem('getting-started.workspace', 'keepkey')
      
      // Store the ticket ID for future reference
      localStorage.setItem('myRoomId', ticketId)

      return ticketId
    },
  })

  return (
    <Form
      schema={schema}
      defaultValues={{ description: '' }}
      onSubmit={async (data) => {
        try {
          await createTicket(data)
          // Instead of going to next step, redirect to the chat
          router.push('/')
        } catch (error) {
          toast.error({
            title: 'Failed to create support ticket',
            description: error instanceof Error ? error.message : 'Please try again.',
          })
        }
      }}
    >
      {({ Field }) => (
        <OnboardingStep
          schema={schema}
          title="Create Support Ticket"
          description="Let us know what's going on and we'll help you out."
          defaultValues={{ description: '' }}
          onSubmit={async (data) => {
            try {
              await createTicket(data)
              // Instead of going to next step, redirect to the chat
              router.push('/')
            } catch (error) {
              toast.error({
                title: 'Failed to create support ticket',
                description: error instanceof Error ? error.message : 'Please try again.',
              })
            }
          }}
          submitLabel="Create Ticket"
          maxW={{ base: '100%', md: 'lg' }}
        >
          <FormLayout>
            <Box p={4} bg="gray.50" borderRadius="md" mb={6}>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={1}>Username:</Text>
                  <Text>{app?.username || 'Not connected'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={1}>Query Key:</Text>
                  <Text wordBreak="break-all">{app?.queryKey || 'Not available'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={1}>Public Keys:</Text>
                  <Text wordBreak="break-all">{app?.pubkeys?.join(', ') || 'No public keys available'}</Text>
                </Box>
              </VStack>
            </Box>
            <ChakraDivider mb={6} />
            <Field
              name="description"
              label="Describe your issue"
              help="Tell us what's going on"
              type="textarea"
              required
            />
          </FormLayout>
        </OnboardingStep>
      )}
    </Form>
  )
} 