'use client';

import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Input, Icon, Badge, HStack, Image, Link } from '@chakra-ui/react';
import { Button } from "@/components/ui/button"

import { toaster } from '@/components/ui/toaster';
import { Avatar } from "@/components/ui/avatar"
import { HiHeart } from "react-icons/hi"


const AVATARS: Record<string, typeof HiHeart | string> = {
  user: HiHeart,
  computer: 'https://pioneers.dev/coins/keepkey.png'
}

const TAG = " | Chat | "
const Chat = ({ usePioneer }: any) => {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
  const [messages, setMessages] = useState<any>([]);

  const [inputMessage, setInputMessage] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);

  // This function will handle what happens when a user clicks an inquiry option.
  const handleInquiryOptionClick = (option: string) => {
    console.log("Inquiry option clicked: ", option);
    setShowInput(true);
    // TODO: Trigger your next steps or calls here.
  };

  function renderEventMessage(eventMessage: any, index: number) {
    return (
      <Text
        key={index}
        fontSize="sm"
        color="gray.300"
        mb={2}
      >
        {eventMessage.message}
      </Text>
    );
  }

  function renderStandardMessage(msg: any, index: number, AVATARS: Record<string, any>) {
    const avatar = msg.icon || AVATARS[msg.from] || '';
    return (
      <Flex
        key={index}
        alignSelf={msg.from === 'me' ? 'flex-end' : 'flex-start'}
        mb={2}
        maxW="70%"
      >
        {msg.from !== 'me' && (
          <Box mr={2}>
            {typeof avatar === 'string' ? (
              <Avatar src={avatar} name={`${msg.from}-avatar`} />
            ) : (
              <Avatar>
                <Icon as={avatar} />
              </Avatar>
            )}
          </Box>
        )}
        <Box
          bg={msg.from === 'me' ? 'blue.700' : 'gray.700'}
          color="white"
          px={4}
          py={2}
          borderRadius="md"
        >
          {msg.text}
        </Box>
        {msg.from === 'me' && (
          <Box ml={2}>
            {typeof avatar === 'string' ? (
              <Avatar src={avatar} name={`${msg.from}-avatar`} />
            ) : (
              <Avatar>
                <Icon as={avatar} />
              </Avatar>
            )}
          </Box>
        )}
      </Flex>
    );
  }

  function renderViewMessage(viewMessage: any, index: number) {
    let tag = TAG + " | renderViewMessage | "
    const { view } = viewMessage;
    console.log(tag,'view: ',view)
    console.log(tag,'view: ',view.type)
    switch (view?.type) {
      case 'inquiry':
        return (
          <Box
            key={index}
            mb={2}
            bg="gray.700"
            color="white"
            px={4}
            py={2}
            borderRadius="md"
          >
            <Text fontWeight="bold">Inquiry:</Text>
            <Text>{view.payload.inquiry}</Text>
            {view.payload.options && view.payload.options.length > 0 && (
              <HStack spacing={2} mt={2}>
                {view.payload.options.map((option: string, i: number) => (
                  <Button colorPalette="green" key={i} variant="surface" onClick={() => handleInquiryOptionClick(option)}>
                   {option}
                  </Button>
                ))}
              </HStack>
            )}
          </Box>
        );
      case 'article':
        return (
          <Box
            key={index}
            mb={2}
            bg="gray.700"
            color="white"
            px={4}
            py={2}
            borderRadius="md"
          >
            <Text fontWeight="bold">Article Link:</Text>
            <Link
              href={view.payload.link}
              color="blue.300"
              textDecoration="underline"
              isExternal
              target="_blank"
              rel="noopener noreferrer"
            >
              {view.payload.link}
            </Link>
          </Box>
        );
      default:
        return (
          <Box key={index} mb={2}>
            <Text>Unhandled view type: {view?.type} {JSON.stringify(view)}</Text>
          </Box>
        );
    }
  }

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
          message: app.username+' has joined the room '+existingRoomId
        }]);
      } else {
        // If no existing roomId, create one. Replace with real logic as needed.
        let response = await app.pioneer.CreateRoom({
          username:app.username,
          auth: app.queryKey,
        })
        let roomId = response.data.roomId
        setRoomId(roomId);
        localStorage.setItem('myRoomId', roomId);
        setMessages([...messages, {
          type: 'event',
          message: app.username+' has joined the room '+roomId
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
            let message = dataObj.message || data?.message || '';
            let views   = dataObj.views   || data?.views   || [];

            console.log('**** Event message:', message);
            console.log('**** Event views:', views);

            // 3) If there are views, handle them
            if (views && views.length > 0) {
              for (let i = 0; i < views.length; i++) {
                let view = views[i];
                console.log(tag,'view:', view);
                console.log(tag,'view:', view.type);
                setMessages([...messages, view]);
              }
            }

            // Always push the main message at the end
            // setMessages((prev) => [
            //   ...prev,
            //   { from: 'computer', text: message }
            // ]);
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



      //
      // setTimeout(() => {
      //   setMessages((prev) => [...prev, { from: 'computer', text: data }]);
      // }, 1000);
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
        <Box bg="gray.900" color="white" minH="100vh">
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
                mr={2}
                bg="gray.800"
                color="white"
                _placeholder={{ color: 'gray.400' }}
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
