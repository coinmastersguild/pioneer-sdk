'use client';

import React from 'react';
import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import { usePioneerContext } from '@/components/providers/pioneer';
import { Chat } from '@/components/chat';

export default function ChatPage() {
  const pioneer = usePioneerContext();
  
  // Create initial demo state if no messages exist
  React.useEffect(() => {
    if (!pioneer.state.messages || pioneer.state.messages.length === 0) {
      // Add a welcome message
      const welcomeMessage = {
        id: 'welcome-1',
        type: 'system',
        from: 'computer',
        text: 'Welcome to the KeepKey Support Chat! How can I help you today?',
        timestamp: new Date(),
      };
      
      // Update the pioneer state with initial message
      if (pioneer.state) {
        pioneer.state.messages = [welcomeMessage];
      }
    }
  }, [pioneer.state]);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">KeepKey Support Chat</Heading>
        
        <Box 
          height="600px" 
          border="1px" 
          borderColor="gray.700" 
          borderRadius="xl" 
          overflow="hidden"
        >
          <Chat usePioneer={pioneer} />
        </Box>
      </VStack>
    </Container>
  );
} 