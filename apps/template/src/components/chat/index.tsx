'use client';

import * as React from 'react';
import { Box, Flex, Text, Input, HStack, VStack, IconButton, type FlexProps } from '@chakra-ui/react';
import { HiPaperAirplane } from 'react-icons/hi';
import { Avatar } from "../ui/avatar";
import { Message } from './types';
import MessageList from './MessageList';
import { useParams } from 'next/navigation';

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: {
    state: {
      app: any;
      messages: Message[];
      isConnecting: boolean;
      context?: any;
    };
    connectWallet: () => Promise<void>;
    sendMessage: (message: string, roomId?: string) => Promise<void>;
    joinRoom: (roomId: string) => Promise<void>;
  };
}

// GuestSignIn component for users who aren't authenticated
const GuestSignIn: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  return (
    <Box
      as="button"
      onClick={onSignIn}
      p={6}
      bg="gray.700"
      borderRadius="xl"
      boxShadow="lg"
      _hover={{ bg: "gray.600" }}
      transition="all 0.2s"
      width="100%"
      maxW="400px"
      mx="auto"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={4}
    >
      <Avatar size="xl" name="Guest User" src="https://pioneers.dev/coins/guest.png" />
      <Text fontSize="xl" fontWeight="bold" color="white">
        Sign in as Guest
      </Text>
      <Text fontSize="sm" color="gray.300" textAlign="center">
        Start chatting instantly without registration
      </Text>
    </Box>
  );
};

export const Chat: React.FC<ChatProps> = React.forwardRef<HTMLDivElement, ChatProps>(({ usePioneer, ...rest }, ref) => {
  const params = useParams();
  const ticketId = params?.ticketId as string;
  const { state, sendMessage, joinRoom, connectWallet } = usePioneer;
  const { app, messages: globalMessages, isConnecting } = state;
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  // Handle KeepKey login
  const handleKeepKeyLogin = async () => {
    try {
      console.log("🔍 Initiating KeepKey login...");
      
      // Store redirect URL before attempting connection
      const currentUrl = window.location.href;
      localStorage.setItem('auth_redirect', currentUrl);
      
      await connectWallet();
      
      // After successful connection, store the state in localStorage
      if (app?.state?.app?.username && app?.state?.app?.queryKey) {
        localStorage.setItem('pioneer_username', app.state.app.username);
        localStorage.setItem('pioneer_queryKey', app.state.app.queryKey);
        
        if (ticketId) {
          // Join room after successful auth
          await joinRoom(ticketId);
        }
      }
    } catch (error) {
      console.error("❌ KeepKey login failed:", error);
    }
  };

  // Handle guest login
  const handleGuestLogin = async () => {
    try {
      const guestUsername = `guest_${Math.random().toString(36).substring(7)}`;
      
      // Set guest user state using proper state management
      if (app?.state?.app) {
        const guestState = {
          ...app.state.app,
          username: guestUsername,
          isGuest: true,
          context: 'guest.json'
        };
        
        // Update app state properly
        if (app.state.dispatch) {
          app.state.dispatch({ type: 'SET_APP_STATE', payload: guestState });
        } else {
          app.state.app = guestState;
        }
        
        // Store guest state
        localStorage.setItem('pioneer_username', guestUsername);
        localStorage.setItem('pioneer_is_guest', 'true');
        
        // Join room as guest
        if (ticketId) {
          await joinRoom(ticketId);
        }
      }
    } catch (error) {
      console.error("❌ Guest login failed:", error);
    }
  };

  // Check for stored auth on mount
  React.useEffect(() => {
    const initializeAuth = async () => {
      const storedUsername = localStorage.getItem('pioneer_username');
      const storedQueryKey = localStorage.getItem('pioneer_queryKey');
      const isGuest = localStorage.getItem('pioneer_is_guest');
      
      if (!app?.state?.app?.username && storedUsername) {
        if (app?.state?.app) {
          const restoredState = {
            ...app.state.app,
            username: storedUsername,
            queryKey: storedQueryKey,
            isGuest: isGuest === 'true',
            context: isGuest ? 'guest.json' : app.state.app.context
          };
          
          // Update app state properly
          if (app.state.dispatch) {
            app.state.dispatch({ type: 'SET_APP_STATE', payload: restoredState });
          } else {
            app.state.app = restoredState;
          }
          
          // Join room if we have a ticket
          if (ticketId) {
            await joinRoom(ticketId);
          }
        }
      }
    };
    
    initializeAuth();
  }, [app, ticketId, joinRoom]);

  // Update local messages when global messages change
  React.useEffect(() => {
    if (globalMessages && globalMessages.length > 0) {
      setLocalMessages(globalMessages);
    }
  }, [globalMessages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsTyping(true);
    try {
      const messageId = Math.random().toString(36).substr(2, 9);

      // Add message to local state
      const newMessage: Message = {
        id: messageId,
        type: 'message',
        from: 'user',
        text: inputMessage,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, newMessage]);
      setInputMessage('');

      // Send message to server
      if (app?.state?.app?.pioneer?.Support) {
        await app.state.app.pioneer.Support({
          id: messageId,
          type: 'message',
          message: inputMessage,  // use message field to match server format
          ticketId,
          room: ticketId,
          user: {
            username: app.state.app.username
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // If pioneer support method is not available, use the sendMessage from props
        await sendMessage(inputMessage, ticketId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // Modify the render to show guest sign in when not authenticated
  if (!app?.state?.app?.username && !isConnecting) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="60vh"
        bg="gray.800"
        p={4}
        gap={6}
      >
        <GuestSignIn onSignIn={handleGuestLogin} />
        <Text color="gray.400" fontSize="sm">or</Text>
        <Box
          as="button"
          onClick={handleKeepKeyLogin}
          p={4}
          bg="blue.600"
          borderRadius="lg"
          _hover={{ bg: "blue.500" }}
        >
          <Text color="white">Connect with KeepKey</Text>
        </Box>
      </Flex>
    );
  }

  // Use local messages or global messages if available
  const displayMessages = localMessages.length > 0 ? localMessages : globalMessages || [];

  return (
    <Flex 
      direction="column" 
      h="full" 
      bg="gray.900"
      color="white"
      borderRadius="xl"
      overflow="hidden"
      ref={ref} 
      {...rest}
    >
      <Box 
        p={4} 
        borderBottom="1px" 
        borderColor="gray.700"
        bg="gray.800"
      >
        <VStack align="start" spacing={1}>
          <Text fontSize="lg" fontWeight="bold">KeepKey Support</Text>
          {ticketId && (
            <Text fontSize="sm" color="gray.400">Ticket ID: {ticketId}</Text>
          )}
        </VStack>
      </Box>

      <Box flex="1" overflowY="auto">
        <MessageList messages={displayMessages} app={app} />
      </Box>

      {isTyping && (
        <Box p={3} borderTop="1px" borderColor="gray.700" bg="gray.800">
          <HStack spacing={2}>
            <Text fontSize="sm" color="blue.200">Support Agent</Text>
            <Text fontSize="sm" color="gray.400">is typing...</Text>
          </HStack>
        </Box>
      )}

      <Box p={4} borderTop="1px" borderColor="gray.700" bg="gray.800">
        <HStack spacing={3}>
          <Input
            flex="1"
            value={inputMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
            bg="gray.700"
            border="1px"
            borderColor="gray.600"
            size="lg"
            _hover={{
              borderColor: "gray.500"
            }}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "outline"
            }}
            _placeholder={{
              color: "gray.400"
            }}
          />
          <IconButton
            aria-label="Send message"
            variant="solid"
            onClick={handleSendMessage}
            colorScheme="blue"
            size="lg"
            children={<HiPaperAirplane />}
            disabled={!inputMessage.trim()}
            _hover={{
              bg: "blue.600"
            }}
            transform="rotate(90deg)"
          />
        </HStack>
      </Box>
    </Flex>
  );
});

Chat.displayName = 'Chat'; 