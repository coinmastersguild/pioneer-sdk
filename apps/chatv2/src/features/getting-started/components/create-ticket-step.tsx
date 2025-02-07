'use client'

import { useStepsContext, Box, Text, Stack, Button, Spinner } from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@saas-ui/react'
import { usePioneerApp } from '#components/pioneer/pioneer-provider'
import { FormLayout, Field } from '@saas-ui/forms'
import { Form } from '#components/form'
import { useRouter } from 'next/navigation'
import { FaWallet } from 'react-icons/fa'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { FlexProps } from '@chakra-ui/react'

import { OnboardingStep } from './onboarding-step'
import * as z from 'zod'

interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: {
    state: {
      app: any
      username: string
      isInitialized: boolean
    }
    connectWallet: () => Promise<void>
  }
}

const Chat = dynamic<ComponentType<ChatProps>>(
  () => import('#components/chat').then((mod) => mod.Chat),
  {
    ssr: false,
  }
)

const schema = z.object({
  description: z.string().min(1, 'Please describe your issue'),
})

type FormInput = z.infer<typeof schema>

export const CreateTicketStep = () => {
  const stepper = useStepsContext()
  const { state, connectWallet } = usePioneerApp()
  const { app } = state
  const router = useRouter()
  const [showChat, setShowChat] = useState(false)

  const { mutateAsync: createTicket } = useMutation({
    mutationFn: async (data: FormInput) => {
      const ticketId = crypto.randomUUID()
      
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

  console.log('Current showChat state:', showChat);
  
  if (showChat) {
    console.log('Rendering chat component with props:', { state, connectWallet });
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
          <Chat usePioneer={{ state, connectWallet }} />
        </Box>
      </Box>
    )
  }

  return (
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
        {/*<Box */}
        {/*  p={6} */}
        {/*  bg="whiteAlpha.100" */}
        {/*  borderRadius="lg" */}
        {/*  borderWidth="1px" */}
        {/*  borderColor="whiteAlpha.200" */}
        {/*  mb={6}*/}
        {/*>*/}
        {/*  {!isWalletConnected ? (*/}
        {/*    <Stack direction="column" spacing={6} align="center">*/}
        {/*      <Text fontSize="lg" fontWeight="medium" textAlign="center">*/}
        {/*        Connecting Your Wallet*/}
        {/*      </Text>*/}
        {/*      <Text color="gray.500" textAlign="center">*/}
        {/*        Please wait while we connect to your wallet*/}
        {/*      </Text>*/}
        {/*      <Box display="flex" justifyContent="center">*/}
        {/*        <Spinner size="xl" color="blue.500" />*/}
        {/*      </Box>*/}
        {/*    </Stack>*/}
        {/*  ) : (*/}
        {/*    <Stack direction="column" spacing={4}>*/}
        {/*      <Box>*/}
        {/*        <Text fontWeight="medium" mb={1}>Username</Text>*/}
        {/*        <Text>{app?.username}</Text>*/}
        {/*      </Box>*/}
        {/*      {app?.queryKey && (*/}
        {/*        <Box>*/}
        {/*          <Text fontWeight="medium" mb={1}>Query Key</Text>*/}
        {/*          <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">*/}
        {/*            {app.queryKey}*/}
        {/*          </Text>*/}
        {/*        </Box>*/}
        {/*      )}*/}
        {/*      {app?.pubkeys?.length > 0 && (*/}
        {/*        <Box>*/}
        {/*          <Text fontWeight="medium" mb={1}>Public Keys</Text>*/}
        {/*          <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">*/}
        {/*            {app.pubkeys.join(', ')}*/}
        {/*          </Text>*/}
        {/*        </Box>*/}
        {/*      )}*/}
        {/*    </Stack>*/}
        {/*  )}*/}
        {/*</Box>*/}
        <Field
          name="description"
          label="Describe your issue"
          help="Tell us what's going on"
          type="textarea"
          required
        />
      </FormLayout>
    </OnboardingStep>
  )
} 
