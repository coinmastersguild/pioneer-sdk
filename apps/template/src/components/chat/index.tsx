'use client';

import React, { useState, useEffect, useRef } from "react";
import { usePioneer } from "@coinmasters/pioneer-react";
import { Center, Spinner, Text, Flex, Input, Button, Box } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

interface MessageUser {
  username: string;
}

interface Message {
  id: string;
  type: 'message' | 'event' | 'system' | 'view' | 'join';
  message?: string;
  room: string;
  user: MessageUser;
  timestamp: string;
  from?: 'user' | 'system' | 'support';
  text?: string;
}

export const Chat = ({ chatId = 'general', ...rest }: { chatId?: string; [key: string]: any }) => {
  const { state }: any = usePioneer();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (state?.app?.events) {
      console.log("🎯 Setting up Pioneer event listeners...");
      
      // Listen for all messages
      state.app.events.on('message', (message: Message) => {
        console.log('📨 Received message event:', message);
        setMessages(prev => [...prev, message]);
      });

      // Listen for support messages
      state.app.events.on('keepkey-support', (message: Message) => {
        console.log('📨 Received support message:', message);
        setMessages(prev => [...prev, message]);
      });

      // Listen for pioneer events
      state.app.events.on('pioneer-events', (message: Message) => {
        console.log('📨 Received pioneer event:', message);
        setMessages(prev => [...prev, message]);
      });

      return () => {
        // Cleanup listeners on unmount
        if (state?.app?.events) {
          state.app.events.removeAllListeners('message');
          state.app.events.removeAllListeners('keepkey-support');
          state.app.events.removeAllListeners('pioneer-events');
        }
      };
    } else {
      console.log('events not found!')
      console.log('state?.app?.events: ', state?.app?.events)
    }
  }, [state?.app?.events]);

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
      setIsSending(true);
      
      const message: Message = {
        id: Date.now().toString(),
        type: 'message',
        message: inputMessage.trim(),
        room: chatId || 'general',
        user: {
          username: state.app.username || 'guest'
        },
        timestamp: new Date().toISOString(),
        from: 'user'
      };

      // Add message to local state first
      setMessages(prev => [...prev, message]);
      setInputMessage('');

      // Send through Pioneer SDK support method if available
      if (state?.app?.pioneer?.Support) {
        await state.app.pioneer.Support(message);
      } else if (state?.app?.pioneer?.sendMessage) {
        // Fallback to sendMessage if Support is not available
        await state.app.pioneer.sendMessage(inputMessage, chatId || 'general');
      } else {
        throw new Error("No message sending capability available");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      toaster.create({
        type: "error",
        title: "Error",
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Flex direction="column" h="100vh" {...rest}>
      <Flex p={4} borderBottom="1px" alignItems="center">
        <br />
        <Text fontWeight="bold" color="white">
          Chat: {chatId}
        </Text>

        <br />
        <Text fontWeight="bold" color="white">
          Username: {state?.app?.username}
        </Text>
        <br />
        <Text fontWeight="bold" color="white">
          Username: {state?.app?.queryKey}
        </Text>
        <br />
      </Flex>
      <Flex flex="1" overflowY="auto" direction="column" p={4} gap={2}>
        {messages.map((msg) => (
          <Flex
            key={msg.id}
            alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
            bg={msg.from === 'user' ? 'blue.500' : 'gray.200'}
            color={msg.from === 'user' ? 'white' : 'black'}
            p={3}
            borderRadius="lg"
            maxWidth="80%"
            wordBreak="break-word"
            flexDirection="column">
            <Text>{msg.message || msg.text || ''}</Text>
            <Text
              fontSize="xs"
              opacity={0.8}
              alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
              mt={1}>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Flex>
        ))}
        {isSending && (
          <Flex alignSelf="flex-start" bg="gray.100" p={3} borderRadius="lg" mt={2}>
            <Text fontSize="sm" color="gray.500">
              Typing...
            </Text>
          </Flex>
        )}
        <div ref={messagesEndRef} />
      </Flex>
      <Flex p={4} borderTop="1px" borderColor="gray.200">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          mr={2}
        />
        <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isSending}>
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </Flex>
    </Flex>
  );
};
