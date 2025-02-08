import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { MessagesProps } from './types';
import { AVATARS } from './constants';
import { renderEventMessage, renderStandardMessage, renderViewMessage } from './views';

export const MessageList: React.FC<MessagesProps & { app: any }> = ({ messages, app }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  return (
    <Flex 
      flex="1" 
      flexDir="column" 
      p={4} 
      overflowY="auto" 
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
          background: 'gray.800',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'gray.600',
          borderRadius: '24px',
        },
      }}
    >
      {messages.map((msg, index) => {
        switch (msg.type) {
          case 'event':
            return renderEventMessage(msg, index);
          case 'message':
            return renderStandardMessage(msg, index, AVATARS);
          case 'view':
            return renderViewMessage(msg, index, app);
          default:
            return (
              <Box key={index} mb={2}>
                <Text>Unknown message type</Text>
              </Box>
            );
        }
      })}
      {/* Extra padding at bottom */}
      <Box h="120px" />
      {/* Invisible element for scrolling */}
      <div ref={messagesEndRef} />
    </Flex>
  );
}; 