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
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@chakra-ui/react';

interface ChatMessage {
  id: string;
  type: 'message' | 'system' | 'event';
  from: 'user' | 'computer';
  text: string;
  timestamp: Date;
  icon?: string;
  isSupport?: boolean;
  chatId?: string;
}

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: any;
}

export function Chat({ usePioneer, ...rest }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string>('');
  const [eventsAvailable, setEventsAvailable] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const toast = useToast();

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
        // Create or join chat
        const username = usePioneer.state.app.username;
        const newChatId = `${username}-${Date.now()}`;
        console.log('🚀 Initializing chat for user:', username, 'with chat ID:', newChatId);
        setChatId(newChatId);

        // Create chat session
        console.log('📝 Creating chat session...');
        const createChatResponse = await fetch('/api/support/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': usePioneer.state.app.token || ''
          },
          body: JSON.stringify({
            id: newChatId,
            username,
            description: 'Chat support session'
          })
        });

        if (!createChatResponse.ok) {
          throw new Error('Failed to create chat session');
        }
        console.log('✅ Chat session created successfully');

        // Join chat
        console.log('🔗 Joining chat...');
        const joinChatResponse = await fetch('/api/support/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': usePioneer.state.app.token || ''
          },
          body: JSON.stringify({
            chatId: newChatId,
            username
          })
        });

        if (!joinChatResponse.ok) {
          throw new Error('Failed to join chat');
        }

        const joinData = await joinChatResponse.json();
        console.log('📥 Received chat data:', joinData);
        if (joinData.messages) {
          setMessages(joinData.messages);
        }

        // Setup event listeners
        if (usePioneer?.events) {
          console.log('🎯 Setting up event listeners...');
          setEventsAvailable(true);
          usePioneer.events.events.on('message', (message: any) => {
            console.log('📨 Received message event:', message);
            if (message.chatId === newChatId) {
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
  }, [usePioneer?.state?.app?.username]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      console.error('Cannot send empty message');
      return;
    }

    setIsTyping(true);
    const messageId = uuidv4();

    try {
      console.log('Attempting to send message via Pioneer SDK...');
      
      if (!usePioneer?.state?.app?.pioneer?.Support) {
        throw new Error('Pioneer SDK Support method not available');
      }

      // Add message to local state immediately for UI responsiveness
      const tempMessage = {
        id: messageId,
        type: 'message',
        from: 'user',
        text: inputMessage.trim(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, tempMessage]);

      // Send via Pioneer SDK
      const result = await usePioneer.state.app.pioneer.Support({
        id: messageId,
        type: 'message',
        message: inputMessage.trim(),
        room: chatId || 'general', // Fallback to 'general' if no chatId
        user: {
          username: usePioneer.state.app.username || 'guest'
        },
        timestamp: new Date().toISOString()
      });

      console.log('Message sent successfully:', result);
      setInputMessage('');

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error sending message',
        description: error.message || 'Failed to send message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });

      // Remove the temporary message if it failed to send
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
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
            {chatId && (
              <Text fontSize="xs" color="gray.400">
                Chat ID: {chatId}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
                e.preventDefault();
                console.log('🎯 Enter key pressed, sending message...');
                handleSendMessage();
              }
            }}
            disabled={isTyping}
          />
          <IconButton
            aria-label="Send message"
            variant="solid"
            colorScheme="blue"
            size="md"
            onClick={() => {
              console.log('🎯 Send button clicked, sending message...');
              handleSendMessage();
            }}
            disabled={!inputMessage.trim() || isTyping}
            loading={isTyping}
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
