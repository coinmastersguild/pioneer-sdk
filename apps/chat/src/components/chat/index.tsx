'use client';

import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, Input, Button } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
const TAG = " | Chat | "


const Messages = ({ messages }: { messages: { from: string; text: string }[] }) => (
  <Flex flex="1" flexDir="column" p={4} bg="gray.100" overflowY="auto">
    {messages.map((message, index) => (
      <Box
        key={index}
        alignSelf={message.from === 'me' ? 'flex-end' : 'flex-start'}
        bg={message.from === 'me' ? 'blue.200' : 'gray.300'}
        color="black"
        px={4}
        py={2}
        borderRadius="md"
        mb={2}
        maxW="70%"
      >
        {message.text}
      </Box>
    ))}
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
          console.log('**** Event: ',action, data);
          try{
            let payload = JSON.parse(action);
            console.log('**** Event: ',payload.content);
            setMessages((prev) => [...prev, { from: 'computer', text: payload.content || '' }]);
          }catch(e){
            console.error(e)
          }
          // let payload = JSON.parse(action);
          // console.log('**** Event: ',payload.message);

          // setMessages((prev) => [...prev, { from: 'computer', text: payload.message }]);
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
