'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Input, 
  HStack, 
  VStack, 
  IconButton, 
  type FlexProps, 
  Button,
  useDisclosure,
  Textarea
} from '@chakra-ui/react';
import { HiPaperAirplane } from 'react-icons/hi';
import { Avatar } from "../ui/avatar";
import { Message } from './types';
import MessageList from './MessageList';
import { useParams } from 'next/navigation';

interface Message {
  id: string;
  type: 'message' | 'system';
  from: 'user' | 'computer';
  text: string;
  timestamp: Date;
}

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: any;
}

export function Chat({ usePioneer, ...rest }: ChatProps) {
  const params = useParams();
  const ticketId = params?.ticketId as string;
  const pioneer = usePioneer;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [eventsAvailable, setEventsAvailable] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Add state for Redis testing
  const [showRedisForm, setShowRedisForm] = useState<boolean>(false);
  const [redisChannel, setRedisChannel] = useState<string>('keepkey-support');
  const [redisMessage, setRedisMessage] = useState<string>('{"type":"broadcast","message":"Test message from UI"}');
  const [redisMessageType, setRedisMessageType] = useState<string>('broadcast');
  const [redisMessageStatus, setRedisMessageStatus] = useState<string>('');

  // Debug function to analyze the pioneer object
  const analyzeObject = (obj: any, path = 'pioneer'): string => {
    if (!obj) return `${path} is null or undefined`;
    
    let result = `${path} is type: ${typeof obj}\n`;
    
    if (typeof obj === 'object') {
      result += `${path} has properties: ${Object.keys(obj).join(', ')}\n`;
      
      // Check for functions
      const methods = Object.keys(obj).filter(key => typeof obj[key] === 'function');
      if (methods.length > 0) {
        result += `${path} has methods: ${methods.join(', ')}\n`;
      }
      
      // Check state property specifically
      if (obj.state) {
        result += analyzeObject(obj.state, `${path}.state`);
      }
      
      // Check app property specifically
      if (obj.state?.app) {
        result += analyzeObject(obj.state.app, `${path}.state.app`);
      }
      
      // Check pioneer property specifically
      if (obj.state?.app?.pioneer) {
        result += analyzeObject(obj.state.app.pioneer, `${path}.state.app.pioneer`);
      }
    }
    
    return result;
  };
  
  // Collect debug info on pioneer object
  useEffect(() => {
    if (pioneer) {
      const info = analyzeObject(pioneer);
      setDebugInfo(info);
    }
  }, [pioneer]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'system',
        from: 'computer',
        text: 'Welcome to KeepKey support! How can I help you today?',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Initialize message list and set up event listeners
  useEffect(() => {
    if (pioneer?.events) {
      try {
        setEventsAvailable(pioneer.events.isConnected);
        
        // Subscribe to messages from events system
        pioneer.events.events.on('message', (message: any) => {
          console.log('Event message received:', message);
          
          // Properly format the event message
          const formattedMessage: Message = {
            id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'event',
            from: 'computer',
            text: typeof message === 'string' ? message : JSON.stringify(message),
            timestamp: new Date(),
            icon: 'https://pioneers.dev/coins/keepkey.png'
          };
          
          // Add message to chat
          setMessages(prev => [...prev, formattedMessage]);
        });
        
        // Setup reconnection monitoring
        pioneer.events.socket.on('connect', () => {
          setEventsAvailable(true);
          
          // Add system message when reconnected
          const reconnectMsg: Message = {
            id: `system-${Date.now()}`,
            type: 'system',
            from: 'computer',
            text: 'Events system connected successfully!',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, reconnectMsg]);
        });
        
        pioneer.events.socket.on('disconnect', () => {
          setEventsAvailable(false);
          
          // Add system message when disconnected
          const disconnectMsg: Message = {
            id: `system-${Date.now()}`,
            type: 'system',
            from: 'computer',
            text: 'Events system disconnected. Attempting to reconnect...',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, disconnectMsg]);
        });
      } catch (e) {
        console.error('Error setting up event listeners:', e);
        setEventsAvailable(false);
      }
    }
    
    // Clean up event listeners
    return () => {
      if (pioneer?.events?.events) {
        pioneer.events.events.removeAllListeners('message');
      }
      if (pioneer?.events?.socket) {
        pioneer.events.socket.off('connect');
        pioneer.events.socket.off('disconnect');
      }
    };
  }, [pioneer]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'message',
      from: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Add bot response
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        type: 'message',
        from: 'computer',
        text: 'Thank you for your message. Our support team will get back to you soon.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // Handle test event button
  const handleTestEvent = async () => {
    try {
      if (!pioneer?.events) {
        // If no events system, add a message about it
        const noEventsMsg: Message = {
          id: `system-${Date.now()}`,
          type: 'system',
          from: 'computer',
          text: 'Events system not available. Please refresh the page or check connection.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, noEventsMsg]);
        return;
      }
      
      // Check if events system is connected
      if (!eventsAvailable) {
        // Try to initialize if not connected
        try {
          await pioneer.events.init();
          setEventsAvailable(true);
        } catch (e: any) {
          console.error('Failed to initialize events:', e);
          const errorMsg: Message = {
            id: `system-${Date.now()}`,
            type: 'system',
            from: 'computer',
            text: `Failed to initialize events: ${e.message || e}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
          return;
        }
      }
      
      // Send test event
      const testEvent = {
        type: 'test',
        data: 'Hello from the test event button!',
        timestamp: new Date().toISOString()
      };
      
      // Add outgoing message
      const outgoingMsg: Message = {
        id: `event-out-${Date.now()}`,
        type: 'message',
        from: 'user',
        text: `Sending test event: ${JSON.stringify(testEvent)}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, outgoingMsg]);
      
      // Send the event through socket
      await pioneer.events.send('event', testEvent);
      
      // Add confirmation message
      const confirmMsg: Message = {
        id: `system-${Date.now()}`,
        type: 'system',
        from: 'computer',
        text: 'Test event sent successfully!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMsg]);
    } catch (e: any) {
      console.error('Error sending test event:', e);
      // Add error message
      const errorMsg: Message = {
        id: `system-${Date.now()}`,
        type: 'system',
        from: 'computer',
        text: `Error sending test event: ${e.message || e}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // Handle Redis Direct Message form submission
  const handleSendRedisMessage = async () => {
    try {
      setRedisMessageStatus('Sending...');
      
      // Format the message based on type
      let messagePayload: any;
      
      try {
        // Try to parse as JSON first
        messagePayload = JSON.parse(redisMessage);
      } catch (e) {
        // If not valid JSON, use as text
        messagePayload = { message: redisMessage };
      }
      
      // Add message type if not present
      if (!messagePayload.type) {
        messagePayload.type = redisMessageType;
      }
      
      // Add logInChat flag to ensure the message appears in chat
      messagePayload.logInChat = true;
      
      // Add timestamp if not present
      if (!messagePayload.timestamp) {
        messagePayload.timestamp = new Date().toISOString();
      }
      
      // Create a message about what we're doing
      const preparingMessage: Message = {
        id: `redis-info-${Date.now()}`,
        type: 'system',
        from: 'computer',
        text: `Sending message to ${redisChannel} channel: ${JSON.stringify(messagePayload)}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, preparingMessage]);
      
      // For simplicity, inform user to use the direct-push.sh script
      // since browser might not have direct Redis access
      const infoMessage: Message = {
        id: `redis-help-${Date.now()}`,
        type: 'system',
        from: 'computer',
        text: `To send this message manually, run this command from the terminal:\n\n/Users/highlander/WebstormProjects/keepkey-stack/skills/direct-push.sh ${redisChannel} '${JSON.stringify(messagePayload)}'`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, infoMessage]);
      
      // Reset the form
      setShowRedisForm(false);
      setRedisMessageStatus('Command prepared for terminal');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setRedisMessageStatus('');
      }, 3000);
    } catch (e: any) {
      console.error('Error preparing Redis message:', e);
      setRedisMessageStatus(`Error: ${e.message || String(e)}`);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `redis-error-${Date.now()}`,
        type: 'system',
        from: 'computer',
        text: `Failed to prepare Redis message: ${e.message || String(e)}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // Update message template when type changes
  const updateMessageTemplate = (type: string) => {
    setRedisMessageType(type);
    switch (type) {
      case 'broadcast':
        setRedisMessage('{"type":"broadcast","message":"Broadcast message to all users"}');
        break;
      case 'admin':
        setRedisMessage('{"type":"admin","message":"Admin notification message"}');
        break;
      case 'event':
        setRedisMessage('{"type":"event","eventType":"test","data":{"key":"value"}}');
        break;
      case 'message':
        setRedisMessage('{"type":"message","ticketId":"room-id","message":"Message to specific room"}');
        break;
      default:
        setRedisMessage('{"message":"Custom message"}');
    }
  };

  // Main chat interface
  return (
    <Flex
      direction="column"
      h="full"
      bg="gray.900"
      {...rest}
    >
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor="gray.700">
        <HStack>
          <Avatar src="https://pioneers.dev/coins/keepkey.png" />
          <Text fontWeight="bold">KeepKey Support</Text>
        </HStack>
      </Box>

      {/* Messages */}
      <Flex
        flex={1}
        direction="column"
        p={4}
        overflowY="auto"
        gap={4}
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
            >
              <Text>{msg.text}</Text>
            </Box>
          </Flex>
        ))}
        {isTyping && (
          <Text color="gray.500" fontSize="sm">
            Support is typing...
          </Text>
        )}
      </Flex>

      {/* Input */}
      <Box p={4} borderTop="1px" borderColor="gray.700">
        <HStack>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <IconButton
            aria-label="Send message"
            _icon={{ as: HiPaperAirplane }}
            onClick={handleSendMessage}
            isLoading={isTyping}
            colorScheme="blue"
          />
        </HStack>
      </Box>
    </Flex>
  );
}

// Default export
export default Chat;
