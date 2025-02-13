'use client'

import { useStepsContext, Box, Text, Stack, Button, VStack, Spinner } from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@saas-ui/react'
import { usePioneerContext } from '#features/common/providers/app'
import { FormLayout, Field } from '@saas-ui/forms'
import { Form } from '#components/form'
import { useRouter } from 'next/navigation'
import { FaWallet } from 'react-icons/fa'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import { OnboardingStep } from './onboarding-step'
import * as z from 'zod'

// Import the Chat component type from the module
import type { Chat as ChatComponent } from '#components/chat'

const DynamicChat = dynamic(() => import('#components/chat').then(mod => mod.Chat), {
  ssr: false,
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
      <Spinner />
    </Box>
  ),
}) as ComponentType<Parameters<typeof ChatComponent>[0]>

const schema = z.object({
  description: z.string().min(1, 'Please describe your issue'),
})

type FormInput = z.infer<typeof schema>

export const CreateTicketStep = () => {
  const stepper = useStepsContext()
  const pioneer = usePioneerContext()
  const router = useRouter()
  const [showChat, setShowChat] = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)

  const { mutateAsync: createTicket } = useMutation({
    mutationFn: async (data: FormInput) => {
      if (!pioneer?.pioneer) {
        throw new Error('Please connect your wallet first');
      }

      const ticketId = crypto.randomUUID()

      let ticket = {
        id: ticketId,
        workspace: 'keepkey',
        email: pioneer?.username || '',
        ...data
      }

      console.log('Creating ticket:', ticket)
      let result = await pioneer.pioneer.CreateTicket(ticket)
      console.log('Ticket created:', result.data)
      if(result.ticketId){
        //success
      } else {
        throw new Error('Failed to create ticket');
      }

      window.sessionStorage.setItem('getting-started.workspace', 'keepkey')
      localStorage.setItem('myRoomId', ticketId)

      return ticketId
    },
  })

  const isWalletConnected = !!pioneer?.pioneer

  useEffect(() => {
    const attemptConnection = async () => {
      if (!isWalletConnected) {
        try {
          await pioneer.connectWallet()
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
  }, [isWalletConnected, pioneer.connectWallet])

  const handleSubmit = async (data: FormInput) => {
    try {
      console.log('Creating ticket...');
      const ticketId = await createTicket(data);
      console.log('Ticket created successfully with ID:', ticketId);
      router.push(`/ticket/${ticketId}`);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error({
        title: 'Failed to create support ticket',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }

  const handleStartChat = () => {
    setShowChat(true);
  }

  const handleCreateTicket = () => {
    setShowTicketForm(true);
  }

  if (showChat) {
    return (
      <Box 
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.900"
        zIndex={9999}
      >
        <Box 
          width="90vw" 
          height="90vh" 
          maxWidth="1200px"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="2xl"
        >
          <DynamicChat usePioneer={pioneer} />
        </Box>
      </Box>
    )
  }

  if (showTicketForm) {
    return (
      <Box>
        <OnboardingStep
          schema={schema}
          title="Create Support Ticket"
          description="Let us know what's going on and we'll help you out."
          defaultValues={{ description: '' }}
          onSubmit={handleSubmit}
          submitLabel="Create Ticket"
          maxW={{ base: '100%', md: 'lg' }}
        >
          <FormLayout>
            <Field
              name="description"
              label="How can we help?"
              help="You will be connected with a human support agent"
              type="textarea"
              required
            />
          </FormLayout>
        </OnboardingStep>
      </Box>
    )
  }

  return (
    <Box>
      <OnboardingStep
        title="How would you like to get help?"
        description="Choose how you'd like to connect with our support team"
        maxW={{ base: '100%', md: 'lg' }}
      >
        <VStack spacing={4} width="100%">
          <Button
            width="100%"
            size="lg"
            colorScheme="blue"
            onClick={handleCreateTicket}
          >
            Create Support Ticket
            <Text fontSize="sm" color="whiteAlpha.800" ml={2}>
              (Track and manage your support request)
            </Text>
          </Button>
          <Button
            width="100%"
            size="lg"
            variant="outline"
            onClick={handleStartChat}
          >
            Just Chat
            <Text fontSize="sm" color="whiteAlpha.800" ml={2}>
              (Quick help from a human agent)
            </Text>
          </Button>
        </VStack>
      </OnboardingStep>
    </Box>
  )
} 
