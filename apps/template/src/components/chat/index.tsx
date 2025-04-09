'use client';

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (state?.app?.events) {
      console.log("🎯 Setting up Pioneer event listeners...");
      
      // Listen for all messages
      state.app.events.on('message', (message: any) => {
        console.log('📨 Received message event:', message);
        setMessages(prev => [...prev, message]);
      });

      // Listen for support messages
      state.app.events.on('keepkey-support', (message: any) => {
        console.log('📨 Received support message:', message);
        setMessages(prev => [...prev, message]);
      });

      // Listen for pioneer events
      state.app.events.on('pioneer-events', (message: any) => {
        console.log('📨 Received pioneer event:', message);
        setMessages(prev => [...prev, message]);
      });

      return () => {
        // Cleanup listeners on unmount
        if (state?.app?.pioneer?.events) {
          state.app.events.removeAllListeners('message');
          state.app.events.removeAllListeners('keepkey-support');
          state.app.events.removeAllListeners('pioneer-events');
        }
      };
    } else {
      console.log('events not found!')
      console.log('state?.app?.pioneer: ',state?.app?.events)
    }
  }, [state?.app?.pioneer?.events]);

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
