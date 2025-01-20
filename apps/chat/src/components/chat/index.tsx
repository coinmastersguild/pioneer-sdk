'use client';

import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Input, Button, Icon, Badge, HStack, Image } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { Avatar } from "@/components/ui/avatar"
import { HiHeart } from "react-icons/hi"


const TAG = " | Chat | "

const AVATARS: Record<string, typeof HiHeart | string> = {
  user: HiHeart,
  computer: 'https://pioneers.dev/coins/keepkey.png'
}

let messages = [
  {
    type: 'event',
    message: 'user has joined the chat',
  },
  {
    type: 'message',
    icon: AVATARS['computer'],
    from: 'computer',
    text: 'Welcome to the keepkey support!',
  },
  {
    type: 'message',
    from: 'computer',
    text: 'Welcome to the Chat!',
  },
  {
    type: 'view',
    view:{
      type:'inquiry',
      payload:{
        id: 1,
        inquiry: 'Have you installed KeepKey Desktop?',
        topics: [],
        importance: 5,
        isDone: false,
        isSkipped: false,
        options: [
          'Yes I have',
          'Give me more information on KeepKey Desktop',
          'Im not a keepkey customer'
        ],
        createdAt: 1737265353814
      }
    }
  },
  {
    type: 'view',
    view:{
      type:'article',
      payload:{
        id: 1,
        link: 'https://keepkey.com',
        topics: ['keepkey'],
        importance: 5,
        summary: '',
        icon:''
      }
    }
  },
]


const Messages = ({ messages }: { messages: { from: string; text: string }[] }) => (
  <Flex flex="1" flexDir="column" p={4} bg="gray.100" overflowY="auto">
    <Text fontSize="sm" color="black" mb={2}>
      User has joined the chat
    </Text>
    <Text fontSize="sm" color="black" mb={4}>
      KeepKey support has entered the chat
    </Text>

    {messages.map((message, index) => {
      const avatar = AVATARS[message.from] || '';
      return (
        <Flex
          key={index}
          alignSelf={message.from === 'me' ? 'flex-end' : 'flex-start'}
          mb={2}
          maxW="70%"
        >
          {message.from !== 'me' && (
            <Box mr={2}>
              {typeof avatar === 'string' ? (
                <Avatar src={avatar} name={`${message.from}-avatar`} />
              ) : (
                <Avatar>
                  <Icon as={avatar} />
                </Avatar>
              )}
            </Box>
          )}
          <Box
            bg={message.from === 'me' ? 'blue.200' : 'gray.300'}
            color="black"
            px={4}
            py={2}
            borderRadius="md"
          >
            {message.text}
          </Box>
          {message.from === 'me' && (
            <Box ml={2}>
              {typeof avatar === 'string' ? (
                <Avatar src={avatar} name={`${message.from}-avatar`} />
              ) : (
                <Avatar>
                  <Icon as={avatar} />
                </Avatar>
              )}
            </Box>
          )}
        </Flex>
      );
    })}
  </Flex>
);

const Footer = ({
                  inputMessage,
                  setInputMessage,
                  handleSendMessage,
                }: {
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
}) => (
  <Flex p={4} alignItems="center">
    <Input
      flex="1"
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      placeholder="Type your message..."
      mr={2}
    />
    <Button onClick={handleSendMessage} >
      Send
    </Button>
  </Flex>
);

const Chat = ({ usePioneer }: any) => {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
  const [messages, setMessages] = useState([
    { from: 'computer', text: 'Hi, I am KeepKey support' },
    {
      from: 'computer',
      text: "lets Review your situation",
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');

  let onStart = async function(){
    let tag = TAG + " | onStart | "
    try{
      //
      if(app && app.events){
        console.log(tag,'Starting chat');
        app.events.on('message', (action: string, data: any) => {
          console.log('**** Event:', action, data);
          try {
            // 1) If action is a JSON string, parse it; if object, use it directly.
            let dataObj: any;
            if (typeof action === 'string') {
              dataObj = JSON.parse(action);
            } else if (typeof action === 'object') {
              dataObj = action;
            } else {
              dataObj = {};
            }

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
                switch (view.type) {
                  case 'inquiry':
                    setMessages((prev) => [
                      ...prev,
                      { from: 'computer', text: view.payload.inquiry }
                    ]);
                    break;

                  case 'articlePreview':
                    // Future handling for an articlePreview type
                    break;
                  default:
                    console.log('Unhandled view type:', view.type);
                }
              }
            }

            // Always push the main message at the end
            setMessages((prev) => [
              ...prev,
              { from: 'computer', text: message }
            ]);
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
      setMessages((prev) => [...prev, { from: 'me', text: data }]);
      setInputMessage('');

      console.log(tag,'app: ',app)
      if(app && app.pioneer){
        console.log(tag,'app: ',app.pioneer)
        let result = await app.pioneer.Support({state:{},messages})
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
    <div>
      <br />
      <Messages messages={messages} />
      <br />
      <Footer
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default Chat;
