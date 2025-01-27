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

const TAG = " | Chat | "
const Chat = ({ usePioneer }: any) => {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
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


  let onStart = async function(){
    let tag = TAG + " | onStart | "
    try{
      // Check localStorage for existing roomId:
      const existingRoomId = localStorage.getItem('myRoomId');
      if (existingRoomId) {
        console.log(tag, 'Found existing roomId:', existingRoomId);
        setRoomId(existingRoomId);
        setMessages([...messages, {
          type: 'event',
          message: app?.username+' has joined the room '+existingRoomId
        }]);
      } else {
        // If no existing roomId, create one. Replace with real logic as needed.
        let response = await app.pioneer.CreateRoom({
          username:app?.username,
          auth: app.queryKey,
        })
        let roomId = response.data.roomId
        setRoomId(roomId);
        localStorage.setItem('myRoomId', roomId);
        setMessages([...messages, {
          type: 'event',
          message: app?.username+' has joined the room '+roomId
        }]);

        console.log(tag, 'No roomId found, created new:', roomId);
      }

      //
      if(app && app.events){
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
            messages.push(messageNew)
            setMessages(messages);
            console.log('**** Event views:', views);

            // 3) If there are views, handle them
            if (views && views.length > 0) {
              for (let i = 0; i < views.length; i++) {
                let view = views[i];
                console.log(tag,'view:', view);
                console.log(tag,'view:', view.type);
                messages.push({type:'view',view})
                setMessages(messages);
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
      setMessages([...messages, { type: 'message', from: 'me', text: data }]);

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
        <Box bg="gray.900" color="white" minH="120vh">
          <br />
          <Messages messages={messages} />
          <br />
          {showInput && (
            <Flex p={4} alignItems="center" bg="gray.800">
              <Input
                flex="1"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
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
