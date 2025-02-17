'use client'

import { useStepsContext, Box, Text, Stack, Button, VStack, Icon, HStack } from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@saas-ui/react'
import { usePioneerContext } from '#features/common/providers/app'
import { FormLayout, Field, Form } from '@saas-ui/forms'
import { useRouter } from 'next/navigation'
import { FaHeadset, FaRobot } from 'react-icons/fa'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { AppLoader } from '#components/app-loader/app-loader'

import { OnboardingStep } from './onboarding-step'
import * as z from 'zod'

// Import the Chat component type from the module
import type { Chat as ChatComponent } from '#components/chat'

const DynamicChat = dynamic(() => import('#components/chat').then(mod => mod.Chat), {
  ssr: false,
  loading: () => <AppLoader />,
}) as ComponentType<Parameters<typeof ChatComponent>[0]>

const schema = z.object({
  description: z.string().min(1, 'Please describe your issue'),
  emailFollowUp: z.boolean().default(false),
  email: z.string().email('Invalid email address').optional(),
})

type FormInput = z.infer<typeof schema>

export const CreateTicketStep = () => {
  const stepper = useStepsContext()
  const pioneer = usePioneerContext()
  const router = useRouter()
  const [showChat, setShowChat] = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const isWalletConnected = !!pioneer?.pioneer

  // Ensure wallet is connected before proceeding
  const ensureWalletConnected = async () => {
    if (!isWalletConnected && !isConnecting) {
      setIsConnecting(true)
      try {
        await pioneer.connectWallet()
        toast.success({
          title: 'Wallet Connected',
          description: 'Your wallet has been successfully connected.',
        })
        return true
      } catch (error) {
        toast.error({
          title: 'Connection Failed',
          description: error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.',
        })
        return false
      } finally {
        setIsConnecting(false)
      }
    }
    return isWalletConnected
  }

  const { mutateAsync: createTicket } = useMutation({
    mutationFn: async (data: FormInput) => {
      console.log("Creating ticket with pioneer state:", pioneer)
      
      // Double check pioneer connection
      const isConnected = await ensureWalletConnected()
      if (!isConnected) {
        throw new Error('Please connect your wallet first')
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

  // Initial connection attempt
  useEffect(() => {
    if (!isWalletConnected && !isConnecting) {
      ensureWalletConnected()
    }
  }, [isWalletConnected])

  const handleSubmit = async (data: FormInput) => {
    try {
      // Ensure wallet is connected before creating ticket
      const isConnected = await ensureWalletConnected()
      if (!isConnected) {
        return // Don't proceed if wallet connection failed
      }

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
    // Initialize the chat with the proper Pioneer provider structure
    const chatPioneerState = {
      state: {
        ...pioneer.state,
        pioneer: {
          ...pioneer.pioneer,
          initialized: true,
          sendMessage: async (message: any) => {
            console.log('Sending message via state.pioneer:', message);
            return pioneer.pioneer?.sendMessage?.(message);
          },
          joinRoom: async (roomId: string) => {
            console.log('Joining room via state.pioneer:', roomId);
            return pioneer.pioneer?.joinRoom?.(roomId);
          },
          onStart: async () => {
            console.log('Chat onStart called via state.pioneer');
            const appSetup = {
              appName: 'KeepKey Portfolio',
              appIcon: 'https://pioneers.dev/coins/keepkey.png',
            };
            return pioneer.pioneer?.onStart([], appSetup);
          }
        },
        messages: [],
        isConnecting: false,
        context: {
          ...pioneer.state?.context,
          username: pioneer.username,
          queryKey: pioneer.state?.queryKey,
          initialized: true
        }
      },
      // These methods should match the state.pioneer structure
      pioneer: pioneer.pioneer,
      dispatch: pioneer.dispatch,
      sendMessage: async (message: any) => {
        console.log('Top level sendMessage redirecting to state.pioneer:', message);
        return pioneer.pioneer?.sendMessage?.(message);
      },
      joinRoom: async (roomId: string) => {
        console.log('Top level joinRoom redirecting to state.pioneer:', roomId);
        return pioneer.pioneer?.joinRoom?.(roomId);
      },
      onStart: async () => {
        console.log('Top level onStart redirecting to state.pioneer');
        const appSetup = {
          appName: 'KeepKey Portfolio',
          appIcon: 'https://pioneers.dev/coins/keepkey.png',
        };
        return pioneer.pioneer?.onStart([], appSetup);
      },
      connectWallet: pioneer.connectWallet
    }

    // Log the state to verify initialization
    console.log('Chat pioneer state:', chatPioneerState);

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
          <DynamicChat usePioneer={chatPioneerState} />
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
          defaultValues={{ description: '', emailFollowUp: false, email: '' }}
          onSubmit={handleSubmit}
          submitLabel="Create Ticket"
          maxW={{ base: '100%', md: 'lg' }}
        >
          <Form onSubmit={handleSubmit}>
            {({ watch }) => {
              const showEmail = watch('emailFollowUp');
              
              return (
                <FormLayout>
                  <Field
                    name="description"
                    label="How can we help?"
                    help="A support agent will review your request and get back to you"
                    type="textarea"
                    required
                  />
                  <Field
                    name="emailFollowUp"
                    label="Follow up with email"
                    type="switch"
                  />
                  {showEmail && (
                    <Field
                      name="email"
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email address"
                      required
                    />
                  )}
                </FormLayout>
              );
            }}
          </Form>
        </OnboardingStep>
      </Box>
    )
  }

  return (
    <Box>
      <OnboardingStep
        title="How would you like to get help?"
        description="Choose your support option"
        maxW={{ base: '100%', md: 'lg' }}
      >
        <VStack spacing={6} width="100%" py={4}>
          <Button
            width="100%"
            height="auto"
            size="lg"
            colorScheme="blue"
            py={6}
            onClick={handleCreateTicket}
            _hover={{ transform: 'scale(1.02)', bg: 'blue.600' }}
            transition="all 0.2s"
          >
            <HStack spacing={4} width="100%" justifyContent="flex-start">
              <Box as={FaHeadset} boxSize={6} />
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold">Human Support</Text>
                <Text fontSize="sm" color="whiteAlpha.800" textAlign="left">
                  Create a support ticket and get help from our team
                </Text>
              </VStack>
            </HStack>
          </Button>

          <Button
            width="100%"
            height="auto"
            size="lg"
            variant="outline"
            py={6}
            onClick={handleStartChat}
            _hover={{ transform: 'scale(1.02)', borderColor: 'whiteAlpha.400' }}
            transition="all 0.2s"
          >
            <HStack spacing={4} width="100%" justifyContent="flex-start">
              <Box as={FaRobot} boxSize={6} />
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="bold">AI Assistant</Text>
                <Text fontSize="sm" color="whiteAlpha.800" textAlign="left">
                  Get instant help from our AI assistant
                </Text>
              </VStack>
            </HStack>
          </Button>
        </VStack>
      </OnboardingStep>
    </Box>
  )
} 
