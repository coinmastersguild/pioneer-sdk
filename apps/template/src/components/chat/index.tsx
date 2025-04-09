'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Input, 
  HStack, 
  IconButton
} from '@chakra-ui/react';
import { toaster } from "../ui/toaster";
import { HiPaperAirplane } from 'react-icons/hi';
import type { FlexProps } from '@chakra-ui/react';
import { Avatar } from "../ui/avatar";

interface ChatMessage {
  id: string;
  type: 'message' | 'system' | 'event';
  from: 'user' | 'computer';
  text: string;
  timestamp: Date;
  icon?: string;
  isSupport?: boolean;
  ticketId?: string;
}

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: any;
}

export function Chat({ usePioneer, ...rest }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ticketId, setTicketId] = useState<string>('');
  const [eventsAvailable, setEventsAvailable] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat and connect to events
  useEffect(() => {
    const initializeChat = async () => {
      if (!usePioneer?.state?.app?.username) {
        console.warn('No username available yet');
        return;
      }

      try {
        // Create or join ticket
        const username = usePioneer.state.app.username;
        const newTicketId = `${username}-${Date.now()}`;
        console.log('🚀 Initializing chat for user:', username, 'with ticket:', newTicketId);
        setTicketId(newTicketId);

        // Create ticket
        console.log('📝 Creating ticket...');
        const createTicketResponse = await fetch('/api/support/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': usePioneer.state.app.token || ''
          },
          body: JSON.stringify({
            id: newTicketId,
            username,
            description: 'Chat support session'
          })
        });

        if (!createTicketResponse.ok) {
          throw new Error('Failed to create ticket');
        }
        console.log('✅ Ticket created successfully');

        // Join room
        console.log('🔗 Joining chat room...');
        const joinRoomResponse = await fetch('/api/support/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': usePioneer.state.app.token || ''
          },
          body: JSON.stringify({
            ticketId: newTicketId,
            username
          })
        });

        if (!joinRoomResponse.ok) {
          throw new Error('Failed to join room');
        }

        const joinData = await joinRoomResponse.json();
        console.log('📥 Received room data:', joinData);
        if (joinData.messages) {
          setMessages(joinData.messages);
        }

        // Setup event listeners
        if (usePioneer?.events) {
          console.log('🎯 Setting up event listeners...');
          setEventsAvailable(true);
          usePioneer.events.events.on('message', (message: any) => {
            console.log('📨 Received message event:', message);
            if (message.ticketId === newTicketId) {
              setMessages(prev => [...prev, message]);
              toaster.create({
                title: "New message",
                description: "You have received a new message",
                type: "info",
                duration: 3000,
              });
            }
          });
          console.log('✅ Event listeners setup complete');
        }
      } catch (error) {
        console.error('❌ Error initializing chat:', error);
        toaster.create({
          title: "Error",
          description: "Failed to initialize chat. Please try again.",
          type: "error",
          duration: 5000,
        });
        setMessages([{
          id: 'error',
          type: 'system',
          from: 'computer',
          text: 'Failed to initialize chat. Please try again later.',
          timestamp: new Date()
        }]);
      }
    };

    initializeChat();

    return () => {
      if (usePioneer?.events?.events) {
        console.log('🧹 Cleaning up event listeners');
        usePioneer.events.events.removeAllListeners('message');
      }
    };
  }, [usePioneer?.state?.app?.username, toaster]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !ticketId) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('📤 Sending message:', messageText);
      // Send message through support endpoint
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': usePioneer.state.app.token || ''
        },
        body: JSON.stringify({
          ticketId,
          message: messageText,
          text: messageText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      console.log('✅ Message sent successfully');
      // Local message will be updated when we receive the event
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        type: 'message',
        from: 'user',
        text: messageText,
        timestamp: new Date(),
        ticketId
      };

      setMessages(prev => [...prev, tempMessage]);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toaster.create({
        title: "Error",
        description: "Failed to send message. Please try again.",
        type: "error",
        duration: 3000,
      });
      // Show error in chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        from: 'computer',
        text: 'Failed to send message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Flex
      direction="column"
      h="full"
      bg="gray.900"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
      {...rest}
    >
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor="gray.700" bg="gray.800">
        <HStack gap={3}>
          <Avatar src="https://pioneers.dev/coins/keepkey.png" />
          <Box flex="1">
            <Text fontWeight="bold" fontSize="lg">KeepKey Support</Text>
            {ticketId && (
              <Text fontSize="xs" color="gray.400">
                Ticket ID: {ticketId}
              </Text>
            )}
          </Box>
          <Box
            w="10px"
            h="10px"
            borderRadius="full"
            bg={eventsAvailable ? 'green.400' : 'red.400'}
            boxShadow={`0 0 10px ${eventsAvailable ? '#48BB78' : '#F56565'}`}
            transition="all 0.2s"
          />
        </HStack>
      </Box>

      {/* Messages */}
      <Flex
        flex="1"
        direction="column"
        p={4}
        overflowY="auto"
        gap={4}
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.500',
            borderRadius: '24px',
          },
        }}
      >
        {messages.map((msg) => (
          <Flex
            key={msg.id}
            justify={msg.from === 'user' ? 'flex-end' : 'flex-start'}
          >
            <Box
              maxW="80%"
              bg={msg.from === 'user' ? 'blue.500' : 'gray.700'}
              color="white"
              p={3}
              borderRadius="lg"
              boxShadow="md"
            >
              <Text fontSize="sm">{msg.text}</Text>
              <Text fontSize="xs" color="whiteAlpha.700" mt={1}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
            </Box>
          </Flex>
        ))}
        {isTyping && (
          <Flex align="center" gap={2}>
            <Box
              w="2"
              h="2"
              borderRadius="full"
              bg="blue.500"
              animation="bounce 0.8s infinite"
            />
            <Box
              w="2"
              h="2"
              borderRadius="full"
              bg="blue.500"
              animation="bounce 0.8s infinite"
              style={{ animationDelay: '0.2s' }}
            />
            <Box
              w="2"
              h="2"
              borderRadius="full"
              bg="blue.500"
              animation="bounce 0.8s infinite"
              style={{ animationDelay: '0.4s' }}
            />
          </Flex>
        )}
        <div ref={messagesEndRef} />
      </Flex>

      {/* Input */}
      <Box p={4} borderTop="1px" borderColor="gray.700" bg="gray.800">
        <HStack gap={3}>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            bg="gray.700"
            border="none"
            _focus={{
              boxShadow: 'none',
              ring: 2,
              ringColor: 'blue.500'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <IconButton
            aria-label="Send message"
            variant="solid"
            colorScheme="blue"
            size="md"
            onClick={handleSendMessage}
          >
            <HiPaperAirplane />
          </IconButton>
        </HStack>
      </Box>
    </Flex>
  );
}

// Default export
export default Chat;
