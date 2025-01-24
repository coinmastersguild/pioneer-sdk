import { Box, Flex, HStack, Icon, Link, Text } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import React from 'react';


export function renderEventMessage(eventMessage: any, index: number) {
  return (
    <Text
      key={index}
      fontSize="xs"
      display="flex"
      justifyContent="center"
      alignItems="center"
      mb={2}
    >
      {eventMessage.message}
    </Text>
  );
}

export function renderStandardMessage(msg: any, index: number, AVATARS: Record<string, any>) {
  const avatar = msg.icon || AVATARS[msg.from] || '';
  return (
    <Flex
      key={index}
      alignSelf={msg.from === 'me' ? 'flex-end' : 'flex-start'}
      mb={2}
      maxW="70%"
    >
      {msg.from !== 'me' && (
        <Box mr={2}>
          {typeof avatar === 'string' ? (
            <Avatar src={avatar} name={`${msg.from}-avatar`} />
          ) : (
            <Avatar>
              <Icon as={avatar} />
            </Avatar>
          )}
        </Box>
      )}
      <Box
        bg={msg.from === 'me' ? 'blue.700' : 'gray.700'}
        color="white"
        px={4}
        py={2}
        borderRadius="md"
      >
        {msg.text}
      </Box>
      {msg.from === 'me' && (
        <Box ml={2}>
          {typeof avatar === 'string' ? (
            <Avatar src={avatar} name={`${msg.from}-avatar`} />
          ) : (
            <Avatar>
              <Icon as={avatar} />
            </Avatar>
          )}
        </Box>
      )}
    </Flex>
  );
}

export function renderViewMessage(viewMessage: any, index: number) {
  let tag = TAG + " | renderViewMessage | "
  const { view } = viewMessage;
  console.log(tag,'view: ',view)
  console.log(tag,'view: ',view.type)
  switch (view?.type) {
    case 'inquiry':
      return (
        <Box
          key={index}
          mb={2}
          bg="gray.700"
          color="white"
          px={4}
          py={2}
          borderRadius="md"
        >
          <Text fontWeight="bold">Inquiry:</Text>
          <Text>{view.payload.inquiry}</Text>
          {view.payload.options && view.payload.options.length > 0 && (
            <HStack mt={2}>
              {view.payload.options.map((option: string, i: number) => (
                <Button colorPalette="green" key={i} variant="surface" onClick={() => handleInquiryOptionClick(option)}>
                  {option}
                </Button>
              ))}
            </HStack>
          )}
        </Box>
      );
    case 'article':
      return (
        <Box
          key={index}
          mb={2}
          bg="gray.700"
          color="white"
          px={4}
          py={2}
          borderRadius="md"
        >
          <Text fontWeight="bold">Article Link:</Text>
          <Link
            href={view.payload.link}
            color="blue.300"
            textDecoration="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {view.payload.link}
          </Link>
        </Box>
      );
    default:
      return (
        <Box key={index} mb={2}>
          <Text>Unhandled view type: {view?.type} {JSON.stringify(view)}</Text>
        </Box>
      );
  }
}
