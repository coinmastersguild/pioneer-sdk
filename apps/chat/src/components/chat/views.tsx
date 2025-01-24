import { Box, Flex, HStack, Icon, Link, Text, VStack, Card } from '@chakra-ui/react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import React from 'react';
const TAG = " | views | "

// This function will handle what happens when a user clicks an inquiry option.
const handleInquiryOptionClick = (option: string) => {
  console.log("Inquiry option clicked: ", option);
  // TODO: Trigger your next steps or calls here.
  //
};

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
    case 'question':
      const question = view.question;
      return (
        <Box
          bg="gray.800"
          color="white"
          p={6}
          borderRadius="lg"
          boxShadow="md"
          maxW="600px"
          mx="auto"
        >
          {/* Title */}
          <Text fontSize="xl" fontWeight="bold" color={question.color}>
            {question.title}
          </Text>

          {/* Description */}
          <Text mt={4} color="gray.300">
            {question.description}
          </Text>

          <br />

          {/* Fields */}
          <VStack align="start" >
            {question.fields.map((field:any, index:any) => (
              <Box key={index}>
                <Text fontWeight="bold">{field.name}</Text>
                <Text>{field.value}</Text>
              </Box>
            ))}
          </VStack>

          <br />

          {/* Options */}
          <HStack justify="center" mt={4}>
            {question.options.map((option:any, index:any) => (
              <Button
                key={index}
                colorScheme={option.style === 3 ? "green" : "red"}
                onClick={() => handleInquiryOptionClick(option.customId)}
              >
                {option.label}
              </Button>
            ))}
          </HStack>

          {/* Footer */}
          <HStack justify="space-between" mt={6}>
            <Text fontSize="sm" color="gray.400">
              {question.footer.text}
            </Text>
            <Avatar size="sm" src={question.footer.iconURL} />
          </HStack>
        </Box>
      );
    case 'article':
      return (
        <HStack justify="center" mt={4}>
        <Card.Root
          key={index}
          width="320px"
          variant="outline"
          mb={4}
          borderRadius="md"
          boxShadow="md"
        >
          <Card.Body gap="2">
            {/* Title */}
            <Card.Title fontSize="lg" mb="2">
              {view.article.title}
            </Card.Title>

            {/* Description */}
            <Card.Description mb="4">
              {view.article.description}
            </Card.Description>

            {/* Fields (Links) */}
            {view.article.fields.map((field, fieldIndex) => (
              <Box key={fieldIndex} mb={2}>
                <Text fontWeight="semibold" as="span">
                  {field.name}
                </Text>
                <Link
                  href={field.value}
                  ml={1}
                  color="blue.200"
                  textDecoration="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {field.value}
                </Link>
              </Box>
            ))}
          </Card.Body>

          {/* Footer */}
          {view.article.footer && (
            <Card.Footer justifyContent="space-between" alignItems="center">
              <Text fontWeight="medium">{view.article.footer.text}</Text>
              {view.article.footer.iconURL && (
                <Box as="img"
                     src={view.article.footer.iconURL}
                     alt="icon"
                     width="24px"
                     height="24px"
                />
              )}
            </Card.Footer>
          )}
        </Card.Root>
        </HStack>
      );
    default:
      return (
        <Box key={index} mb={2}>
          <Text>Unhandled view type: {view?.type} {JSON.stringify(view)}</Text>
        </Box>
      );
  }
}
