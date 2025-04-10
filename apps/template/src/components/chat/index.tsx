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
      
      // Process incoming message to ensure valid data
      const processMessage = (message: any): Message => {
        console.log('Processing message:', message);
        
        // If message is a string, try to parse it
        if (typeof message === 'string') {
          try {
            message = JSON.parse(message);
          } catch (e) {
            console.error('Failed to parse message string:', e);
          }
        }
        
        // Handle case where the message comes in the format from the user's example
        // {"type":"message","ticketId":"ticket_1744316629474_ulmnjzfbi","room":"ticket_1744316629474_ulmnjzfbi","message":"hey","user":"admin","isAdmin":true,"timestamp":"2025-04-10T22:24:56.117Z","id":"1041dd76-6b4c-4acf-8164-d3a97165c722","_alreadyBroadcast":true}
        if (message.type === 'message' && message.user && typeof message.user === 'string') {
          message.user = { 
            username: message.user 
          };
        }
        
        // Ensure message has a valid ID
        if (!message.id) {
          message.id = Date.now().toString() + Math.random().toString(36).substring(2);
        }
        
        // Make sure we have a timestamp
        if (!message.timestamp) {
          message.timestamp = new Date().toISOString();
        }
        
        // Ensure message content exists
        if (!message.message && !message.text) {
          message.message = message.content || '';
        }
        
        // Determine message type if not specified
        if (!message.type) {
          message.type = 'message';
        }
        
        // Ensure user details
        if (!message.user) {
          message.user = {
            username: message.username || message.from || 'unknown'
          };
        }
        
        // Fallback room
        if (!message.room) {
          message.room = chatId || 'general';
        }
        
        console.log('Processed message:', message);
        return message as Message;
      };
      
      // Listen for all messages
      state.app.events.on('message', (message: any) => {
        console.log('📨 Received message event:', message);
        setMessages(prev => [...prev, processMessage(message)]);
      });

      // Listen for support messages
      state.app.events.on('keepkey-support', (message: any) => {
        console.log('📨 Received support message:', message);
        setMessages(prev => [...prev, processMessage(message)]);
      });

      // Listen for pioneer events
      state.app.events.on('pioneer-events', (message: any) => {
        console.log('📨 Received pioneer event:', message);
        setMessages(prev => [...prev, processMessage(message)]);
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
  }, [state?.app?.events, chatId]);

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
        {messages.map((msg) => {
          // Ensure we have a valid message content
          const messageContent = msg.message || msg.text || '';
          
          // Get username from message
          const username = msg.user?.username || 
            (typeof msg.user === 'string' ? msg.user : 'Unknown');
          
          // Handle timestamp parsing safely
          let formattedTime = 'Unknown time';
          try {
            if (msg.timestamp) {
              const date = new Date(msg.timestamp);
              if (!isNaN(date.getTime())) {
                formattedTime = date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              }
            }
          } catch (e) {
            console.error('Error formatting timestamp:', e);
          }
          
          return (
            <Flex
              key={msg.id || Date.now().toString() + Math.random()}
              alignSelf={msg.from === 'user' ? 'flex-end' : 'flex-start'}
              bg={msg.from === 'user' ? 'blue.500' : 'gray.200'}
              color={msg.from === 'user' ? 'white' : 'black'}
              p={3}
              borderRadius="lg"
              maxWidth="80%"
              wordBreak="break-word"
              flexDirection="column">
              <Flex justifyContent="space-between" mb={1}>
                <Text fontSize="xs" fontWeight="bold">
                  {username}
                </Text>
                <Text fontSize="xs">{formattedTime}</Text>
              </Flex>
              <Text>{messageContent}</Text>
            </Flex>
          );
        })}
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
