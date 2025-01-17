'use client';

import React, { useState } from 'react';
import { Box, Flex, Text, Input, Button } from '@chakra-ui/react';

// Mock components for Header, Messages, and Footer
const Header = () => (
  <Flex p={4} bg="blue.500" color="white" justifyContent="center">
    <Text fontSize="lg" fontWeight="bold">
      HoneyChat
    </Text>
  </Flex>
);

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
  <Flex p={4} bg="white" alignItems="center">
    <Input
      flex="1"
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      placeholder="Type your message..."
      mr={2}
    />
    <Button onClick={handleSendMessage} colorScheme="blue">
      Send
    </Button>
  </Flex>
);

const Chat = ({ usePioneer }: any) => {
  const { state, connectWallet } = usePioneer();
  const { app } = state;
  const [messages, setMessages] = useState([
    { from: 'computer', text: 'Hi, My Name is HoneyChat' },
    { from: 'me', text: 'Hey there' },
    { from: 'me', text: 'Myself Ferin Patel' },
    {
      from: 'computer',
      text: "Nice to meet you. You can send me a message and I'll reply to you with the same message.",
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim().length) {
      return;
    }

    const data = inputMessage;
    setMessages((prev) => [...prev, { from: 'me', text: data }]);
    setInputMessage('');

    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'computer', text: data }]);
    }, 1000);
  };

  return (
    <Flex w="100%" h="100vh" justify="center" align="center" bg="gray.200">
      <Flex w="40%" h="90%" flexDir="column" boxShadow="lg" bg="white" borderRadius="md">
        <Header />
        <br />
        <Messages messages={messages} />
        <br />
        <Footer
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
        />
      </Flex>
    </Flex>
  );
};

export default Chat;
