'use client';

import * as React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Input, 
  HStack, 
  Button,
  VStack,
  IconButton,
  type BoxProps,
  type FlexProps,
  type TextProps,
  type InputProps,
  type ButtonProps,
  type StackProps,
  type SystemStyleObject,
} from '@chakra-ui/react';
import { HiHeart, HiOutlinePaperAirplane } from "react-icons/hi";
const TAG = " | chat | "
const AVATARS: Record<string, typeof HiHeart | string> = {
  user: HiHeart,
  computer: 'https://pioneers.dev/coins/keepkey.png'
}

interface Message {
  id: string;
  type: 'message' | 'event' | 'system';
  from: 'user' | 'computer';
  text: string;
  timestamp: Date;
}

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: {
    state: {
      app: any;
    };
    connectWallet: () => Promise<void>;
  };
}

interface MessagesProps extends Omit<FlexProps, 'children'> {
  messages: Message[];
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
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
      <Text fontWeight="medium">{message.text}</Text>
      <Text fontSize="xs" opacity={0.8} mt={1} color="whiteAlpha.800">
        {message.timestamp.toLocaleTimeString()}
      </Text>
    </Box>
  );
};

const Messages: React.FC<MessagesProps> = React.memo(({ messages, ...props }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

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
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </VStack>
  );
});

Messages.displayName = 'Messages';

export const Chat: React.FC<ChatProps> = React.forwardRef<HTMLDivElement, ChatProps>(({ usePioneer, ...rest }, ref) => {
  const { state } = usePioneer;
  const { app } = state;
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      type: 'system',
      from: 'computer',
      text: 'Welcome to KeepKey Support! How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);


  const onStart = async () => {
    let tag = TAG + " | onStart | "
    try {
      if (app && app.events && app.pioneer) {
        const roomId = localStorage.getItem('myRoomId');
        if (roomId) {
          console.log(tag,'app.pioneer: ',app.pioneer)
          console.log(tag,'app.pioneer: ',app.pioneer.pioneer)
          let response = await app.pioneer.JoinRoom({ roomId });
          console.log("Joined room ", response);

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'event',
            from: 'system',
            text: `Connected to support session ${roomId}`,
            timestamp: new Date(),
          }]);
        }

        app.events.on('message', (action: string, data: any) => {
          try {
            let dataObj = JSON.parse(action);
            let message = dataObj.sentences || data?.sentences || '';

            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              type: 'message',
              from: 'computer',
              text: message,
              timestamp: new Date(),
            }]);
            setIsTyping(false);
          } catch (e) {
            console.error(e);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    onStart();
  }, [app, app?.events, app?.pioneer]);

  const handleSendMessage = async () => {
    let tag = TAG + " | handleSendMessage | "
    try {
      if (!inputMessage.trim()) return;
      console.log('Sending Message: ', inputMessage);
      const newMessage = {
        id: Date.now().toString(),
        type: 'message' as const,
        from: 'user' as const,
        text: inputMessage,
        timestamp: new Date(),
      };
      console.log('newMessage: ', newMessage);
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      setIsTyping(true);

      const roomId = localStorage.getItem('myRoomId');
      if (app?.pioneer && roomId) {
        await app.pioneer.Support({
          roomId,
          message: inputMessage,
        });
      } else {
        console.error(tag,'Missing Pioneer: ', app)
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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
        <Text fontSize="lg" fontWeight="bold">KeepKey Support</Text>
      </Box>

      <Box flex="1" overflowY="auto">
        <Messages messages={messages} />
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
            icon={<HiOutlinePaperAirplane className="rotate-90 transform translate-x-0.5 -translate-y-0.5" />}
            onClick={handleSendMessage}
            colorScheme="blue"
            size="lg"
            isDisabled={!inputMessage.trim()}
            _hover={{
              bg: 'blue.600'
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
});

Chat.displayName = 'Chat'; 
