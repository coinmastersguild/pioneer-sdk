'use client';

import * as React from 'react';
import { Box, Flex, Text, Input, HStack, VStack, IconButton, type FlexProps, Button } from '@chakra-ui/react';
import { HiPaperAirplane } from 'react-icons/hi';
import { Avatar } from "../ui/avatar";
import { Message } from './types';
import MessageList from './MessageList';
import { useParams } from 'next/navigation';

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: any;
}

function Chat({ usePioneer, ...rest }: ChatProps) {
  const params = useParams();
  const ticketId = params?.ticketId as string;
  const pioneer = usePioneer;
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<string>("");
  const [showDebug, setShowDebug] = React.useState<boolean>(false);
  
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
  React.useEffect(() => {
    if (pioneer) {
      const info = analyzeObject(pioneer);
      setDebugInfo(info);
    }
  }, [pioneer]);

  // Initialize demo messages if none exist
  React.useEffect(() => {
    if (!localMessages || localMessages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-1',
        type: 'system',
        from: 'computer',
        text: 'Welcome to the KeepKey Support Chat! How can I help you today?',
        timestamp: new Date(),
      };
      setLocalMessages([welcomeMessage]);
    }
  }, [localMessages]);

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

      // Simulate bot response for demo
      setTimeout(() => {
        // Add bot response
        const responseMessage: Message = {
          id: `response-${messageId}`,
          type: 'message',
          from: 'computer',
          text: `Thank you for your message. Our team will respond to "${inputMessage.substring(0, 30)}${inputMessage.length > 30 ? '...' : ''}" shortly.`,
          timestamp: new Date(),
        };
        setLocalMessages(prev => [...prev, responseMessage]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // Handle key down (send on Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Main chat interface
  return (
    <Flex direction="column" h="75vh" {...rest}>
      {/* Chat Header */}
      <Flex
        py={4}
        px={6}
        bg="gray.700"
        borderTopRadius="md"
        align="center"
        justify="space-between"
      >
        <HStack>
          <Avatar size="sm" name="Support" src="https://pioneers.dev/coins/keepkey.png" />
          <Box>
            <Text fontWeight="bold">KeepKey Support</Text>
            <Text fontSize="xs" color="green.300">
              Online
            </Text>
          </Box>
        </HStack>
        <Button
          onClick={() => setShowDebug(!showDebug)}
          colorScheme="whiteAlpha"
          size="xs"
        >
          {showDebug ? "Hide Debug" : "Debug"}
        </Button>
      </Flex>

      {/* Debug Info */}
      {showDebug && (
        <Box
          p={2}
          bg="gray.800"
          fontSize="xs"
          fontFamily="monospace"
          overflowX="auto"
          maxH="150px"
          overflowY="auto"
        >
          {debugInfo || "No debug info available"}
        </Box>
      )}

      {/* Messages Container */}
      <Flex
        flex={1}
        direction="column"
        p={6}
        overflowY="auto"
        bg="gray.800"
        borderBottomRadius={0}
      >
        <MessageList messages={localMessages} app={pioneer?.state?.app} />
        {isTyping && (
          <Flex align="center" my={2}>
            <Avatar size="xs" name="Support" src="https://pioneers.dev/coins/keepkey.png" />
            <Text ml={2} fontSize="sm" color="gray.400">
              Typing...
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Message Input */}
      <HStack
        p={4}
        bg="gray.700"
        borderBottomRadius="md"
      >
        <Input
          placeholder="Type your message..."
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          bg="gray.600"
          border="none"
          _focus={{ borderColor: "blue.500" }}
          borderRadius="md"
          color="white"
          _placeholder={{ color: 'gray.400' }}
        />
        <IconButton
          aria-label="Send message"
          onClick={handleSendMessage}
          loading={isTyping}
          colorScheme="blue"
          borderRadius="md"
        >
          <HiPaperAirplane />
        </IconButton>
      </HStack>
    </Flex>
  );
}

export default Chat;
