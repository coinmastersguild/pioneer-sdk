'use client'

import { Box } from '@chakra-ui/react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { FlexProps } from '@chakra-ui/react'
import { usePioneerContext } from '#features/common/providers/app'
import { useEffect } from 'react'

interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: {
    state: {
      app: any;
      messages: any[];
      isConnecting: boolean;
    };
    connectWallet: () => Promise<void>;
    sendMessage: (message: string, roomId?: string) => Promise<void>;
    joinRoom: (roomId: string) => Promise<void>;
  }
}

const Chat = dynamic<ComponentType<ChatProps>>(
  () => import('#components/chat').then((mod) => mod.Chat),
  {
    ssr: false,
  }
)

export default function TicketPage() {
  const params = useParams()
  const pioneer = usePioneerContext()
  const ticketId = params.ticketId as string

  useEffect(() => {
    // Store the ticket ID in localStorage when the component mounts
    localStorage.setItem('ticketId', ticketId)
  }, [ticketId])

  // Ensure pioneer has all required properties
  const pioneerState = {
    app: pioneer?.app || pioneer || {},
    messages: pioneer?.messages || [],
    isConnecting: pioneer?.isConnecting || false
  }

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
        <Chat 
          usePioneer={{
            state: pioneerState,
            connectWallet: pioneer?.connectWallet || (() => Promise.resolve()),
            sendMessage: pioneer?.sendMessage || (() => Promise.resolve()),
            joinRoom: pioneer?.joinRoom || (() => Promise.resolve())
          }}
        />
      </Box>
    </Box>
  )
} 
