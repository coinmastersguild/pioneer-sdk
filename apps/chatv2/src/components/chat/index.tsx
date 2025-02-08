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
            <MessageBubble key={`msg-${message.id}`} message={message} />
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

  const onStart = async () => {
    let tag = TAG + " | onStart | ";
    try {
      // If pioneer is not available, try to connect wallet
      if (!app?.pioneer && !isConnecting) {
        console.log(tag, 'Pioneer not available, attempting to connect wallet');
        setIsConnecting(true);
        try {
          await connectWallet();
        } catch (e) {
          console.error(tag, 'Failed to connect wallet:', e);
        }
        setIsConnecting(false);
        return; // Exit and let the useEffect trigger again with updated app state
      }

      if (app && app.events && app.pioneer) {
        const roomId = localStorage.getItem('myRoomId');
        if (roomId) {
          console.log(tag,'app.pioneer: ',app.pioneer)
          console.log(tag,'app.pioneer: ',app.pioneer.pioneer)
          let response = await app.pioneer.JoinRoom({ roomId });
          console.log("Joined room ", response);

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'message',
            from: 'computer',
            text: `Connected to support session ${roomId}`,
            timestamp: new Date(),
          }]);
        }

        // Remove any existing message listener to prevent duplicates
        app.events.removeAllListeners('message');

        app.events.on('message', (action: string, data: any) => {
          try {
            // 1) If action is a JSON string, parse it; if object, use it directly.
            let dataObj = JSON.parse(action);

            // 2) Pull message/views from dataObj or fallback to data if needed.
            let message = dataObj.sentences || data?.sentences || '';
            let views   = dataObj.views   || data?.views   || [];

            console.log('**** Event message:', message);
            let messageNew = {
              id: Date.now().toString(),
              type: 'message',
              from: 'computer',
              text: message,
              timestamp: new Date(),
            }
            setMessages((prevMessages: Array<any>) => [...prevMessages, messageNew]);
            console.log('**** Event views:', views);

            // 3) If there are views, handle them
            if (views && views.length > 0) {
              for (let i = 0; i < views.length; i++) {
                let view = views[i];
                console.log(tag,'view:', view);
                console.log(tag,'view:', view.type);
                setMessages((prevMessages: Array<any>) => [...prevMessages, {
                  id: `view-${Date.now()}-${i}`,
                  type: 'view',
                  view,
                  timestamp: new Date(),
                }]);
              }
            }
          } catch (e) {
            console.error(e);
          }
        });
      } else {
        console.log(tag, 'App not fully initialized yet:', { app, events: app?.events, pioneer: app?.pioneer });
      }
    } catch (e) {
      console.error(tag, 'Error in onStart:', e);
    }
  };

  React.useEffect(() => {
    onStart();
  }, [app]);

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
