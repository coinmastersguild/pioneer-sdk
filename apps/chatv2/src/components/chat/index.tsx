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

interface Message {
  id: string;
  type: 'message' | 'event' | 'system' | 'view';
  from: 'user' | 'computer';
  text: string;
  timestamp: Date;
  view?: any; // Add view property for view type messages
}

export interface ChatProps extends Omit<FlexProps, 'children'> {
  usePioneer: {
    state: {
      app: any;
    };
    connectWallet: () => Promise<void>;
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
      {isUser && app?.username && (
        <Text fontSize="xs" opacity={0.8} mb={1} color="whiteAlpha.800">
          {app.username}
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
        <React.Fragment key={message.id}>
          {message.type === 'view' && message.view ? (
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
  const { state, connectWallet } = usePioneer;
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
  const [isConnecting, setIsConnecting] = React.useState(false);

  const onStart = React.useCallback(async () => {
    let tag = TAG + " | onStart | ";
    try {
      // Check if we have a valid app state first
      if (!app) {
        console.log(tag, 'App not initialized yet');
        return;
      }

      // Only attempt to connect wallet if we have the function and pioneer is not available
      if (typeof connectWallet === 'function' && !app?.pioneer && !isConnecting) {
        console.log(tag, 'Attempting to connect wallet');
        setIsConnecting(true);
        try {
          await connectWallet();
        } catch (e) {
          console.error(tag, 'Failed to connect wallet:', e);
        } finally {
          setIsConnecting(false);
        }
        return; // Exit and let the useEffect trigger again with updated app state
      }

      // Verify we have the required components before proceeding
      if (!app.events || !app.pioneer) {
        console.log(tag, 'Required components not initialized:', { 
          events: !!app.events, 
          pioneer: !!app.pioneer 
        });
        return;
      }

      console.log(tag, 'Initializing chat with app:', app);
      
      // Get room ID and validate
      const roomId = localStorage.getItem('myRoomId');
      if (!roomId) {
        console.log(tag, 'No room ID found in localStorage');
        return;
      }

      // Remove any existing message listeners to prevent duplicates
      app.events.removeAllListeners('message');
      app.events.removeAllListeners('pioneer');

      // Set up event listeners first before joining room
      app.events.on('pioneer', (event: any) => {
        console.log(tag, 'Pioneer event received:', event);
      });

      app.events.on('message', (action: any) => {
        try {
          console.log(tag, 'Raw message event received:', action);
          
          // Handle both string and object formats
          let dataObj = typeof action === 'string' ? JSON.parse(action) : action;
          console.log(tag, 'Parsed message data:', dataObj);
          
          // Extract message from various possible locations
          let message = '';
          if (dataObj.text) message = dataObj.text;
          else if (dataObj.message) message = dataObj.message;
          else if (dataObj.sentences) message = Array.isArray(dataObj.sentences) ? dataObj.sentences.join(' ') : dataObj.sentences;
          else if (dataObj.responses?.sentences) message = Array.isArray(dataObj.responses.sentences) ? dataObj.responses.sentences.join(' ') : dataObj.responses.sentences;
          
          let views = dataObj.views || dataObj.responses?.views || [];
          
          if (message) {
            console.log(tag, 'Adding message to chat:', message);
            setMessages((prevMessages: Array<any>) => [...prevMessages, {
              id: Date.now().toString(),
              type: 'message',
              from: 'computer',
              text: message,
              timestamp: new Date(),
            }]);
          }

          // Handle views if present
          if (views && views.length > 0) {
            console.log(tag, 'Adding views to chat:', views);
            views.forEach((view: any, index: number) => {
              setMessages((prevMessages: Array<any>) => [...prevMessages, {
                id: `view-${Date.now()}-${index}`,
                type: 'view',
                view,
                timestamp: new Date(),
              }]);
            });
          }
        } catch (e) {
          console.error(tag, 'Error handling message:', e);
        }
      });

      try {
        // Join room with required parameters
        console.log(tag, 'Attempting to join room:', roomId);
        let response = await app.pioneer.JoinRoom({ 
          roomId,
          username: app.username || '',
          isSupport: true
        });
        console.log(tag, "Room join response:", response);

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'message',
          from: 'computer',
          text: `Connected to support session ${roomId}`,
          timestamp: new Date(),
        }]);

        console.log(tag, 'Chat initialization complete');
      } catch (e) {
        console.error(tag, 'Error joining room:', e);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          from: 'computer',
          text: 'Failed to connect to support session. Please try again.',
          timestamp: new Date(),
        }]);
      }
    } catch (e) {
      console.error(tag, 'Error in onStart:', e);
    }
  }, [app, connectWallet, isConnecting]);

  // Separate useEffect for event listener cleanup
  React.useEffect(() => {
    return () => {
      if (app?.events) {
        console.log(TAG, 'Cleaning up event listeners');
        app.events.removeAllListeners('message');
        app.events.removeAllListeners('pioneer');
      }
    };
  }, [app?.events]);

  // Separate useEffect for initialization
  React.useEffect(() => {
    console.log(TAG, 'Initialization useEffect triggered');
    onStart();
  }, [onStart]);

  const handleSendMessage = async () => {
    let tag = TAG + " | handleSendMessage | ";
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
      console.log(tag,'roomId: ', roomId);
      if (app?.pioneer) {
        let result = await app.pioneer.Support({
          roomId,
          message: inputMessage,
        });
        console.log(tag,'result: ',result)
      } else {
        console.error(tag,'Missing Pioneer: ', app)
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  // This function will handle what happens when a user clicks an inquiry option.
  const handleInquiryOptionClick = async (option: string) => {
    console.log("Inquiry option clicked: ", option);
    let username = app.username
    console.log("username: ", username);

    switch(option) {
      case 'setup_email':
        // Create an email input view
        const emailInputView = {
          type: 'question',
          question: {
            title: 'Enter Email Address',
            description: 'Please enter your email address for support communications.',
            color: 'blue.400',
            fields: [
              {
                name: 'Email',
                type: 'email',
                placeholder: 'your@email.com',
                required: true
              }
            ],
            options: [
              {
                label: 'Submit',
                customId: 'submit_email',
                style: 3
              },
              {
                label: 'Cancel',
                customId: 'cancel_email',
                style: 1
              }
            ],
            footer: {
              text: 'Your email will be used only for support purposes',
              iconURL: 'https://pioneers.dev/coins/keepkey.png'
            },
            app: {
              ...app,
              pioneer: app.pioneer,
              setMessages,
              handleInquiryOptionClick
            }
          }
        };

        try {
          // Remove the previous email setup view and add the new input view
          setMessages((prevMessages: Array<any>) => {
            const filteredMessages = prevMessages.filter(msg =>
              !(msg.type === 'view' && msg.view?.question?.title === 'Email Support Setup')
            );
            return [...filteredMessages,
              {
                type: 'message',
                from: 'computer',
                text: 'Please enter your email address below:'
              },
              { type: 'view', view: emailInputView }
            ];
          });
        } catch (e) {
          console.error("Failed to set email input view:", e);
        }
        break;

      case 'skip_email':
        try {
          // Remove the email setup view and add the skip message
          setMessages((prevMessages: Array<any>) => {
            const filteredMessages = prevMessages.filter(msg =>
              !(msg.type === 'view' && msg.view?.question?.title === 'Email Support Setup')
            );
            return [...filteredMessages,
              {
                type: 'message',
                from: 'computer',
                text: 'No problem! You can always set up email support later if you change your mind.'
              }
            ];
          });
        } catch (e) {
          console.error("Failed to set skip message:", e);
        }
        break;

      case 'submit_email':
        // Handle email submission
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        console.log("Submit email clicked, app context:", app);
        if (emailInput) {
          const email = emailInput.value.trim();
          console.log("Email value:", email);
          if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            try {
              if(!username) throw new Error("Username is required");
              const ticketNumber = localStorage.getItem('myRoomId');

              console.log("Username:", username);
              console.log("TicketNumber (from localStorage):", ticketNumber);

              if (!ticketNumber) {
                throw new Error("TicketNumber missing");
              }

              console.log("Creating email with:", {
                username,
                email,
                ticketNumber
              });

              // Call the API to create email
              const response = await app.pioneer.CreateEmail({
                username,
                email,
                ticketNumber
              });
              console.log("Email creation response:", response);

              if (response?.data?.success) {
                // Remove the email input view and add success message
                setMessages((prevMessages: Array<any>) => {
                  const filteredMessages = prevMessages.filter(msg =>
                    !(msg.type === 'view' && msg.view?.question?.title === 'Enter Email Address')
                  );
                  return [...filteredMessages,
                    {
                      type: 'message',
                      from: 'computer',
                      text: `Great! Your email ${email} has been set up successfully. You'll receive support updates at this address.`
                    }
                  ];
                });
              } else {
                // Show error but keep the view
                setMessages((prevMessages: Array<any>) => [...prevMessages,
                  {
                    type: 'message',
                    from: 'computer',
                    text: 'There was an error registering your email. Please try again or contact support.'
                  }
                ]);
              }
            } catch (e: any) {
              console.error("Failed to create email:", e);
              // Show more specific error message
              const errorMessage = e.message === "Username or ticketNumber missing"
                ? "Sorry, we couldn't verify your account details. Please try again later."
                : "Sorry, there was an error setting up your email. Please try again later.";

              setMessages((prevMessages: Array<any>) => [...prevMessages,
                {
                  type: 'message',
                  from: 'computer',
                  text: errorMessage
                }
              ]);
            }
          } else {
            // Invalid email format - update the view to show error
            const emailView = {
              type: 'question',
              question: {
                title: 'Enter Email Address',
                description: 'Please enter your email address for support communications.',
                color: 'blue.400',
                fields: [
                  {
                    name: 'Email',
                    type: 'email',
                    placeholder: 'your@email.com',
                    required: true,
                    invalid: true,
                    errorText: 'Please enter a valid email address'
                  }
                ],
                options: [
                  {
                    label: 'Submit',
                    customId: 'submit_email',
                    style: 3
                  },
                  {
                    label: 'Cancel',
                    customId: 'cancel_email',
                    style: 1
                  }
                ],
                footer: {
                  text: 'Your email will be used only for support purposes',
                  iconURL: 'https://pioneers.dev/coins/keepkey.png'
                },
                app: {
                  ...app,
                  pioneer: app.pioneer,
                  setMessages,
                  handleInquiryOptionClick
                }
              }
            };

            setMessages((prevMessages: Array<any>) => {
              const filteredMessages = prevMessages.filter(msg =>
                !(msg.type === 'view' && msg.view?.question?.title === 'Enter Email Address')
              );
              return [...filteredMessages, { type: 'view', view: emailView }];
            });
          }
        } else {
          console.error("Email input field not found or app context missing");
        }
        break;

      case 'cancel_email':
        if (app?.pioneer) {
          // Remove the email input view and add cancel message
          setMessages((prevMessages: Array<any>) => {
            const filteredMessages = prevMessages.filter(msg =>
              !(msg.type === 'view' && msg.view?.question?.title === 'Enter Email Address')
            );
            return [...filteredMessages,
              {
                type: 'message',
                from: 'computer',
                text: 'Email setup cancelled. You can always set up email support later if you change your mind.'
              }
            ];
          });
        }
        break;
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
        <Messages messages={messages} app={app} />
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
            icon={<HiHeart className="rotate-90 transform translate-x-0.5 -translate-y-0.5" />}
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
