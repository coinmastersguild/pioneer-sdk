'use client';

import React, { useState, useEffect } from 'react';
import { Button as ChakraButton, Box, Flex, Text, Input, Icon, Badge, HStack, Image, Link } from '@chakra-ui/react';
import { Button } from "@/components/ui/button"

import { toaster } from '@/components/ui/toaster';
import { Avatar } from "@/components/ui/avatar"
import { HiHeart } from "react-icons/hi"
import {renderEventMessage,renderStandardMessage,renderViewMessage} from './views'

const AVATARS: Record<string, typeof HiHeart | string> = {
  user: HiHeart,
  computer: 'https://pioneers.dev/coins/keepkey.png'
}
import axios from 'axios';

const TAG = " | Chat | "
const Chat = ({ usePioneer }: any) => {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
  const [isDesktopRunning, setIsDesktopRunning] = useState(false);
  const [isBrowserExtensionInstalled, setIsBrowserExtensionInstalled] = useState(false);
  const [messages, setMessages] = useState<any>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const Messages = ({
    messages,
  }: {
    messages: Array<{
      type?: string;
      message?: string;
      from?: string;
      text?: string;
      icon?: any;
      view?: any;
    }>;
  }) => {
    return (
      <Flex 
        flex="1" 
        flexDir="column" 
        p={4} 
        overflowY="auto" 
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
            background: 'gray.800',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.600',
            borderRadius: '24px',
          },
        }}
      >
        {messages.map((msg, index) => {
          switch (msg.type) {
            case 'event':
              return renderEventMessage(msg, index);
            case 'message':
              return renderStandardMessage(msg, index, AVATARS);
            case 'view':
              return renderViewMessage(msg, index, app);
            default:
              return (
                <Box key={index} mb={2}>
                  <Text>Unknown message type</Text>
                </Box>
              );
          }
        })}
        {/* Extra padding at bottom */}
        <Box h="120px" />
        {/* Invisible element for scrolling */}
        <div ref={messagesEndRef} />
      </Flex>
    );
  };

  useEffect(() => {
    // Check if KeepKey Desktop is running
    const interval = setInterval(async () => {
      try {
        const response = await axios.get('http://localhost:1646/docs');
        if (response.status === 200) {
          clearInterval(interval);
          setIsDesktopRunning(true);
        }
      } catch (error) {
        console.log('KeepKey endpoint not found, retrying...');
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);


  let onStart = async function(){
    let tag = TAG + " | onStart | "
    try{
      if(app && app.events && app.username){
        setUsername(app.username);
        // Get user info first to set username
        let userinfo = await app.pioneer.User()
        console.log("userinfo: ", userinfo.data)
        if(userinfo?.data?.email) {
        }

        // First handle room connection
        const existingRoomId = localStorage.getItem('myRoomId');
        if (existingRoomId) {
          console.log(tag, 'Found existing roomId:', existingRoomId);
          setRoomId(existingRoomId);
          // Set join message first
          setMessages((prevMessages: Array<any>) => [...prevMessages, {
            type: 'event',
            message: app.username+' has joined the room '
          }]);
          //get room info
          let response = await app.pioneer.JoinRoom({roomId:existingRoomId})
          console.log("Joined room ", response)
        } else {
          // If no existing roomId, create one
          let response = await app.pioneer.CreateRoom({
            username: app.username,
          })
          let roomId = response.data.roomId
          setRoomId(roomId);
          localStorage.setItem('myRoomId', roomId);
          // Set join message first
          setMessages((prevMessages: Array<any>) => [...prevMessages, {
            type: 'event',
            message: app.username+' has joined the room '
          }]);
          console.log(tag, 'No roomId found, created new:', roomId);
        }

        if(!userinfo.data.email){
          console.log(tag,"user has no email configured!")
          const emailView = {
            type: 'question',
            question: {
              title: 'Email Support Setup',
              description: 'Would you like to set up email support? This allows us to keep you updated on important information and support requests.',
              color: 'green.400',
              fields: [
                {
                  name: 'Current Status',
                  value: 'No email address registered'
                }
              ],
              options: [
                {
                  label: 'Yes, set up email',
                  customId: 'setup_email',
                  style: 3
                },
                {
                  label: 'Skip for now',
                  customId: 'skip_email',
                  style: 1
                }
              ],
              footer: {
                text: 'Your privacy is important to us',
                iconURL: 'https://pioneers.dev/coins/keepkey.png'
              },
              app: {
                ...state,
                pioneer: app.pioneer,
                setMessages,
                handleInquiryOptionClick
              }
            }
          };
          console.log(tag,"Adding email view to messages:", emailView);
          // Add email setup message and view
          setMessages((prevMessages: Array<any>) => [...prevMessages, 
            {
              type: 'message',
              from: 'computer',
              text: 'I notice you haven\'t set up email support yet. Let me help you with that.'
            },
            { type: 'view', view: emailView }
          ]);
        }

        console.log(tag,'Starting chat');
        app.events.on('message', (action: string, data: any) => {
          console.log('**** Event:', action, data);
          try {
            // 1) If action is a JSON string, parse it; if object, use it directly.
            let dataObj = JSON.parse(action);

            // 2) Pull message/views from dataObj or fallback to data if needed.
            let message = dataObj.sentences || data?.sentences || '';
            let views   = dataObj.views   || data?.views   || [];

            console.log('**** Event message:', message);
            let messageNew = {
              type: 'message',
              from: 'computer',
              text: message,
            }
            setMessages((prevMessages: Array<any>) => [...prevMessages, messageNew]);
            console.log('**** Event views:', views);

            // 3) If there are views, handle them
            if (views && views.length > 0) {
              for (let i = 0; i < views.length; i++) {
                let view = views[i];
                console.log(tag,'view:', view);
                console.log(tag,'view:', view.type);
                setMessages((prevMessages: Array<any>) => [...prevMessages, {type:'view', view}]);
              }
            }
          } catch (e) {
            console.error(e);
          }
        });
      } else {
        console.log('Unable to start chat');
      }
    }catch(e){
      console.error(e);
    }
  }
  useEffect(() => {
    onStart();
  }, [app, app?.events]);


  const handleSendMessage = async function(){
    let tag = TAG + " | handleSendMessage | "
    try{
      const data = inputMessage;
      console.log(tag,'data: ',data)
      setMessages((prevMessages: Array<any>) => [...prevMessages, { type: 'message', from: 'me', text: data }]);

      setInputMessage('');

      console.log(tag,'app: ',app)
      if(app && app.pioneer){
        console.log(tag,'app: ',app.pioneer)
        let result = await app.pioneer.Support({state:{},message:data})
        console.log("result", result)
      }
    }catch(e){
      console.error(e)
    }
    if (!inputMessage.trim().length) {
      return;
    }
  }

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
    <>
      {!app ? (
        <Flex
          justifyContent="center"
          alignItems="center"
          bg="gray.900"
          color="white"
          minH="100vh"
          flexDir="column"
        >
          <Avatar
            src="/gif/kk.gif"
            name="Loading Avatar"
            size="xl"
          />
          <Text mt={4} fontSize="xl" color="white">
            Loading...
          </Text>
        </Flex>
      ) : (
        <Box 
          bg="gray.900" 
          color="white" 
          height="100vh" 
          position="relative" 
          display="flex" 
          flexDirection="column"
        >
          <Box 
            flex="1"
            overflowY="auto"
            position="relative"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
                background: 'gray.800',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.600',
                borderRadius: '24px',
              },
            }}
          >
            <Messages messages={messages} />
          </Box>
          {showInput && (
            <Flex 
              position="fixed" 
              bottom="0" 
              left="0" 
              right="0"
              p={4} 
              alignItems="center" 
              bg="gray.800"
              borderTop="1px"
              borderColor="gray.700"
              height="80px"
              backdropFilter="blur(10px)"
            >
              <Input
                flex="1"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                mr={2}
                bg="gray.700"
                border="1px"
                borderColor="gray.600"
                _hover={{ borderColor: 'gray.500' }}
                _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
              />
              <Button colorScheme="green" variant="solid" onClick={handleSendMessage}>
                Send
              </Button>
            </Flex>
          )}
        </Box>
      )}
    </>
  );
};

export default Chat;
