import React from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { renderEventMessage, renderStandardMessage, renderViewMessage } from './views';
import { Message } from './types';

// Default avatars for different senders
export const AVATARS = {
  user: 'https://pioneers.dev/coins/default-user.png',
  computer: 'https://pioneers.dev/coins/keepkey.png',
};

interface MessageListProps {
  messages: Message[];
  app: any;
}

const MessageList: React.FC<MessageListProps> = ({ messages, app }) => {
  // Create ref for auto-scrolling to bottom
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Apply deduplication to avoid duplicate messages
  const removeDuplicateMessages = (messages: Message[]): Message[] => {
    const seen = new Set();
    return messages.filter((message) => {
      // Create a unique key based on text, timestamp, and type
      const key = `${message.text || ''}-${message.timestamp}-${message.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const uniqueMessages = React.useMemo(() => 
    removeDuplicateMessages(messages), [messages]);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uniqueMessages]);

  return (
    <VStack 
      spacing={4}
      align="stretch"
      flex="1" 
      p={4} 
      overflowY="auto" 
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'gray.600',
          borderRadius: '24px',
        },
      }}
    >
      {uniqueMessages.map((message, index) => (
        <React.Fragment key={message.id || index}>
          {message.type === 'event' || message.type === 'system' ? (
            renderEventMessage(message, index)
          ) : message.type === 'view' && message.view ? (
            <Box key={`view-${message.id}`}>
              {renderViewMessage({ view: message.view }, index, app)}
            </Box>
          ) : (
            renderStandardMessage(message, index, AVATARS)
          )}
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />
    </VStack>
  );
};

export default MessageList; 