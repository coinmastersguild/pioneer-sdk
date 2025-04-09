'use client';

import React, { useState } from "react";
import { usePioneer } from "@coinmasters/pioneer-react";
import { Center, Spinner, Text, Flex, Input, Button } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

interface Message {
  id: string;
  type: string;
  message: string;
  room: string;
  user: {
    username: string;
  };
  timestamp: string;
}

export const Chat = ({ chatId = 'general', ...rest }: { chatId?: string; [key: string]: any }) => {
  const { state }: any = usePioneer();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  if (!state?.app?.pioneer) {
    return (
      <Center h="100vh">
        <Spinner />
        <Text ml={4}>Initializing Pioneer SDK...</Text>
      </Center>
    );
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    try {
      if (!state?.app?.pioneer?.Support) {
        throw new Error("Pioneer SDK Support not available");
      }

      const message: Message = {
        id: Date.now().toString(),
        type: 'message',
        message: inputMessage.trim(),
        room: chatId,
        user: {
          username: state.app.username || 'guest'
        },
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, message]);
      setInputMessage('');
      await state.app.pioneer.Support(message);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      toaster.create({
        type: "error",
        title: "Error",
        description: errorMessage,
        duration: 5000
      });
    }
  };

  return (
    <Flex direction="column" h="100vh" {...rest}>
      <Flex flex="1" overflowY="auto" direction="column" p={4}>
        {messages.map(msg => (
          <Text key={msg.id}>{msg.message}</Text>
        ))}
      </Flex>
      <Flex p={4}>
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          mr={2}
        />
        <Button onClick={handleSendMessage}>Send</Button>
      </Flex>
    </Flex>
  );
};
