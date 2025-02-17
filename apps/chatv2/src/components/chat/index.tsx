'use client';

import * as React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Input, 
  HStack,
  VStack,
  type FlexProps,
  type BoxProps,
  type TextProps,
  type StackProps,
} from '@chakra-ui/react';
import { IconButton } from '@saas-ui/react';
import { HiHeart } from 'react-icons/hi';
import { Avatar } from "../ui/avatar"
import {renderEventMessage,renderStandardMessage,renderViewMessage} from './views'
import { useParams } from 'next/navigation';

interface Message {
  id: string;
  type: 'message' | 'event' | 'system' | 'view' | 'join';
  from: 'user' | 'computer';
  text: string;
  timestamp: Date;
  view?: any; // Add view property for view type messages
  content?: string;
}

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: {
    state: {
      app: any;
      messages: Message[];
      isConnecting: boolean;
    };
    connectWallet: () => Promise<void>;
    sendMessage: (message: string, roomId?: string) => Promise<void>;
    joinRoom: (roomId: string) => Promise<void>;
  };
}

interface MessagesProps extends StackProps {
  messages: Message[];
  app: any;
}

const TAG = " | chat | ";

const AVATARS: Record<string, typeof HiHeart | string> = {
  user: HiHeart,
  computer: 'https://pioneers.dev/coins/keepkey.png'
}

const MessageBubble: React.FC<{ message: Message, app: any }> = ({ message, app }) => {
  const isUser = message.from === 'user';
  return (
    <Box
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      maxW="70%"
      bg={isUser ? 'blue.600' : 'gray.700'}
      color="white"
      px={4}
      py={3}
      borderRadius="2xl"
      my={1}
      boxShadow="md"
      position="relative"
      _after={{
        content: '""',
        position: 'absolute',
        bottom: '8px',
        [isUser ? 'right' : 'left']: '-6px',
        transform: isUser ? 'rotate(-45deg)' : 'rotate(45deg)',
        border: '6px solid transparent',
        borderTopColor: isUser ? 'blue.600' : 'gray.700',
      }}
    >
      {isUser && app?.state.app.username && (
        <Text fontSize="xs" opacity={0.8} mb={1} color="whiteAlpha.800">
          {app.state.app.username}
        </Text>
      )}
      <Text fontWeight="medium">{message.text}</Text>
      <Text fontSize="xs" opacity={0.8} mt={1} color="whiteAlpha.800">
        {message.timestamp.toLocaleTimeString()}
      </Text>
    </Box>
  );
};

const Messages: React.FC<MessagesProps> = React.memo(({ messages, app, ...props }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  console.log('messages: ',messages)
  if(!messages) messages = []
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <VStack 
      spacing={4}
      align="stretch"
      flex="1" 
      p={4} 
      overflowY="auto" 
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'gray.600',
          borderRadius: '24px',
        },
      }}
      {...props}
    >
      {messages.map((message, index) => (
        <React.Fragment key={message.id || index}>
          {message.type === 'join' ? (
            <Box 
              textAlign="center" 
              py={2}
            >
              <Text fontSize="sm" color="gray.400">
                {message.content}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            </Box>
          ) : message.type === 'view' && message.view ? (
            <Box key={`view-${message.id}`}>
              {renderViewMessage({ view: message.view }, index, app)}
            </Box>
          ) : (
            <MessageBubble key={`msg-${message.id}`} message={message} app={app} />
          )}
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />
    </VStack>
  );
});

Messages.displayName = 'Messages';

export const Chat: React.FC<ChatProps> = React.forwardRef<HTMLDivElement, ChatProps>(({ usePioneer, ...rest }, ref) => {
  const params = useParams();
  const ticketId = params?.ticketId as string;
  const { state, sendMessage, joinRoom } = usePioneer;
  const { app, messages: globalMessages, isConnecting } = state;
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  // Update local messages when global messages change
  React.useEffect(() => {
    if (globalMessages && globalMessages.length > 0) {
      setLocalMessages(globalMessages);
    }
  }, [globalMessages]);

  const onStart = React.useCallback(async () => {
    let tag = TAG + " | onStart | ";
    try {
      if (!app) {
        console.log(tag, 'App not initialized yet');
        return;
      }
      
      // Join the room
      let results = await app.state.app.pioneer.JoinRoom({
        ticketId,
        username: app.state.app.username || 'anonymous'
      });
      
      // Update messages with ticket history
      if (results.data?.ticket?.messages) {
        const formattedMessages = results.data.ticket.messages.map((msg: any) => ({
          id: msg.id || Math.random().toString(36).substr(2, 9),
          type: msg.type,
          from: msg.from || 'computer',
          text: msg.text || msg.content || '',
          timestamp: new Date(msg.timestamp),
          content: msg.content,
          view: msg.view
        }));
        setLocalMessages(formattedMessages);
      }
    } catch (e) {
      console.error(tag, 'Error in onStart:', e);
    }
  }, [app, ticketId]);

  // Separate useEffect for initialization
  React.useEffect(() => {
    console.log(TAG, 'Initialization useEffect triggered');
    onStart();
  }, [onStart]);

  // Use local messages or global messages if available
  const displayMessages = localMessages.length > 0 ? localMessages : globalMessages || [];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    setIsTyping(true);
    try {
      // Send message through the socket
      await sendMessage(inputMessage, ticketId);
      
      // Add message to local state
      const newMessage: any = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'message',
        from: 'user',
        text: inputMessage,
        ticket: ticketId,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, newMessage]);
      setInputMessage('');

      //
      // Join the room
      let results = await app.state.app.pioneer.Support(newMessage);
      console.log('results push message: ', results.data)

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

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
        <Messages messages={displayMessages} app={app} />
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
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            bg="gray.700"
            border="1px"
            borderColor="gray.600"
            size="lg"
            _hover={{
              borderColor: 'gray.500'
            }}
            _focus={{
              borderColor: 'blue.500',
              boxShadow: 'outline'
            }}
            _placeholder={{
              color: 'gray.400'
            }}
          />
          <IconButton
            aria-label="Send message"
            variant="solid"
            onClick={handleSendMessage}
            colorScheme="blue"
            size="lg"
            disabled={!inputMessage.trim()}
            _hover={{
              bg: 'blue.600'
            }}
            transform="rotate(90deg)"
          >
            <HiHeart />
          </IconButton>
        </HStack>
      </Box>
    </Flex>
  );
});

Chat.displayName = 'Chat'; 
