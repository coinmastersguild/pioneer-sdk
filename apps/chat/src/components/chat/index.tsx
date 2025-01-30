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

  const [messages, setMessages] = useState<any>([
    // {
    //   type: 'view',
    //   view:{
    //     type:'inquiry',
    //     payload:{
    //       id: 1,
    //       inquiry: 'Have you installed KeepKey Desktop?',
    //       topics: [],
    //       importance: 5,
    //       isDone: false,
    //       isSkipped: false,
    //       options: [
    //         'Yes I have',
    //         'Give me more information on KeepKey Desktop',
    //         'Im not a keepkey customer'
    //       ],
    //       createdAt: 1737265353814
    //     }
    //   }
    // }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);

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
      <Flex flex="1" flexDir="column" p={4} overflowY="auto">
        {messages.map((msg, index) => {
          switch (msg.type) {
            case 'event':
              return renderEventMessage(msg, index);
            case 'message':
              return renderStandardMessage(msg, index, AVATARS);
            case 'view':
              return renderViewMessage(msg, index);
            default:
              // If a message has no 'type', or an unknown type, show this fallback:
              return (
                <Box key={index} mb={2}>
                  <Text>Unknown message type</Text>
                </Box>
              );
          }
        })}
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
      if(app && app.events){
        // First handle room connection
        const existingRoomId = localStorage.getItem('myRoomId');
        if (existingRoomId) {
          console.log(tag, 'Found existing roomId:', existingRoomId);
          setRoomId(existingRoomId);
          // Set join message first
          setMessages((prevMessages: Array<any>) => [...prevMessages, {
            type: 'event',
            message: app?.username+' has joined the room '
          }]);
          //get room info
          let response = await app.pioneer.JoinRoom({roomId:existingRoomId})
          console.log("Joined room ", response)
        } else {
          // If no existing roomId, create one
          let response = await app.pioneer.CreateRoom({
            username:app?.username,
          })
          let roomId = response.data.roomId
          setRoomId(roomId);
          localStorage.setItem('myRoomId', roomId);
          // Set join message first
          setMessages((prevMessages: Array<any>) => [...prevMessages, {
            type: 'event',
            message: app?.username+' has joined the room '
          }]);
          console.log(tag, 'No roomId found, created new:', roomId);
        }

        // Then check user info and handle email setup if needed
        let userinfo = await app.pioneer.User()
        console.log("userinfo: ", userinfo.data)

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
        <Box bg="gray.900" color="white" minH="120vh" position="relative">
          <Box 
            position="fixed" 
            top="0" 
            left="0" 
            right="0" 
            bottom={showInput ? "80px" : "0"}
            overflowY="auto"
            bg="gray.900"
          >
            <br />
            <Messages messages={messages} />
            <br />
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
            >
              <Input
                flex="1"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                mr={2}
              />
              <Button colorPalette={'green'} variant="surface" onClick={handleSendMessage}>
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
