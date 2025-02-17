'use client';

import * as React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Input, 
  HStack,
  VStack,
  IconButton,
  type FlexProps,
  type BoxProps,
  type TextProps,
  type StackProps,
} from '@chakra-ui/react';
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

// Add deduplication function
const removeDuplicateMessages = (messages: Message[]): Message[] => {
  const seen = new Set();
  return messages.filter((message) => {
    // Create a unique key based on text, timestamp, and type
    const key = `${message.text}-${message.timestamp}-${message.type}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

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
  if(!messages) messages = []
  
  // Apply deduplication
  const uniqueMessages = React.useMemo(() => removeDuplicateMessages(messages), [messages]);
  
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uniqueMessages]);

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
      {uniqueMessages.map((message, index) => (
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

// Add GuestSignIn component
const GuestSignIn: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  return (
    <Box
      as="button"
      onClick={onSignIn}
      p={6}
      bg="gray.700"
      borderRadius="xl"
      boxShadow="lg"
      _hover={{ bg: 'gray.600' }}
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
        
        // Use React state update instead of direct window location change
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

      //sub to events
      if(app.state.app.events){
        console.log('Subbing to events!')
        app.state.app.events.on('message', (event: any) => {
          console.log(tag,'event: ', event)
          event = JSON.parse(event)
          console.log(tag,'event: ', typeof(event))
          console.log(tag,'event.type: ', event.type)
          console.log(tag,'event.content: ', event.content)
          /*

          { "type":"join","room":"954a5839-aade-4010-bc7e-a47343655811","ticketId":"954a5839-aade-4010-bc7e-a47343655811","user":"user:c4659350","content":"user:c4659350 has joined the room"}

           */
          //push to messages
          const newMessage: Message = {
            id: event.id || Math.random().toString(36).substr(2, 9),
            type: event.type || 'message',
            from: event.from || (event.user?.username === app.state.app.username ? 'user' : 'computer'),
            text: event.message || event.text || event.content || '',  // prioritize message field
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            content: event.content,
            view: event.view
          };

          console.log("Creating new message from event:", newMessage);

          setLocalMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            console.log("Adding new message to local state:", newMessage);
            return [...prev, newMessage];
          });
        })
      }

      // Cleanup event listener on unmount
      return () => {
        if(app?.state?.app?.events) {
          app.state.app.events.off('message');
        }
      };

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
      let results = await app.state.app.pioneer.Support({
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

      console.log('Message sent to server:', results);

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
        minH="100vh"
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
          _hover={{ bg: 'blue.500' }}
        >
          <Text color="white">Connect with KeepKey</Text>
        </Box>
      </Flex>
    );
  }

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
