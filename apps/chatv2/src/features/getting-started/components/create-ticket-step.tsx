'use client'

import { useStepsContext, Box, Text, Stack, Button, Spinner, Center } from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@saas-ui/react'
import { randomUUID } from 'crypto'
import { usePioneerApp } from '#components/pioneer/pioneer-provider'
import { FormLayout } from '@saas-ui/forms'
import { Form } from '#components/form'
import { useRouter } from 'next/navigation'
import { FaWallet } from 'react-icons/fa'
import { signIn } from 'next-auth/react'
import { useEffect } from 'react'

import { OnboardingStep } from './onboarding-step'
import * as z from 'zod'

const schema = z.object({
  description: z.string().min(1, 'Please describe your issue'),
})

type FormInput = z.infer<typeof schema>

export const CreateTicketStep = () => {
  const stepper = useStepsContext()
  const { state, connectWallet } = usePioneerApp()
  const { app } = state
  const router = useRouter()

  const { mutateAsync: createTicket } = useMutation({
    mutationFn: async (data: FormInput) => {
      const ticketId = randomUUID()
      
      console.log('Ticket created:', {
        id: ticketId,
        workspace: 'keepkey',
        email: app?.username || '',
        ...data
      })

      window.sessionStorage.setItem('getting-started.workspace', 'keepkey')
      localStorage.setItem('myRoomId', ticketId)

      return ticketId
    },
  })

  const isWalletConnected = !!app?.username

  useEffect(() => {
    const attemptConnection = async () => {
      if (!isWalletConnected) {
        try {
          await connectWallet()
          toast.success({
            title: 'Wallet Connected',
            description: 'Your wallet has been successfully connected.',
          })
        } catch (error) {
          toast.error({
            title: 'Connection Failed',
            description: error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.',
          })
        }
      }
    }
    
    attemptConnection()
  }, [isWalletConnected, connectWallet])

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        callbackUrl: '/getting-started',
        redirect: false,
      })
      
      if (result?.error) {
        toast.error({
          title: 'Sign in Failed',
          description: result.error,
        })
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      toast.error({
        title: 'Sign in Failed',
        description: 'Failed to sign in with Google. Please try again.',
      })
    }
  }

  return (
    <Form
      schema={schema}
      defaultValues={{ description: '' }}
      onSubmit={async (data) => {
        try {
          await createTicket(data)
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
            <Box p={6} bg="whiteAlpha.100" borderRadius="lg" borderWidth="1px" borderColor="whiteAlpha.200" mb={6}>
              {!isWalletConnected ? (
                <Stack spacing={6} align="center">
                  <Text fontSize="lg" fontWeight="medium" textAlign="center">Connecting Your Wallet</Text>
                  <Text color="gray.500" textAlign="center">
                    Please wait while we connect to your wallet
                  </Text>
                  <Center>
                    <Spinner size="xl" color="blue.500" thickness="4px" />
                  </Center>
                </Stack>
              ) : (
                <Stack spacing={4}>
                  <Box>
                    <Text fontWeight="medium" mb={1}>Username</Text>
                    <Text>{app?.username}</Text>
                  </Box>
                  {app?.queryKey && (
                    <Box>
                      <Text fontWeight="medium" mb={1}>Query Key</Text>
                      <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">{app.queryKey}</Text>
                    </Box>
                  )}
                  {app?.pubkeys?.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" mb={1}>Public Keys</Text>
                      <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">
                        {app.pubkeys.join(', ')}
                      </Text>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
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