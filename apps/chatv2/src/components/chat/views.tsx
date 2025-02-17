import { Box, Flex, HStack, Icon, Link, Text, VStack, Card, Input, Stack } from '@chakra-ui/react';
import { Button } from "#components/ui/button";
import { Field } from "#components/ui/field";
import { Avatar } from "#components/ui/avatar";
import Markdown from 'react-markdown';
import React, { useState } from 'react';

const TAG = " | views | ";

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
        <Box
          bg={msg.from === 'me' ? 'blue.700' : 'gray.700'}
          color="white"
          px={4}
          py={2}
          borderRadius="md"
        >
          <Markdown
            components={{
              // Force Chakra's <Link> with a visible color
              a: ({ node, children, ...props }) => (
                <Link color="blue.300" textDecoration="underline" target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </Link>
              ),
            }}
          >
            {msg.text.toString()}
          </Markdown>
        </Box>
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

export function renderViewMessage(viewMessage: any, index: number, app: any) {
  let tag = TAG + " | renderViewMessage | "

  const { view } = viewMessage;
  let username = app?.username || 'anonymous'
  console.log(tag,'view: ',view)
  console.log(tag,'view: ',view?.type)
  
  // If view is missing or malformed, show as JSON
  if (!view || !view.type) {
    return (
      <Box key={index} mb={2} p={4} bg="gray.800" borderRadius="md">
        <Text color="yellow.300" mb={2}>Unformatted View Message:</Text>
        <Text fontFamily="mono" fontSize="sm" whiteSpace="pre-wrap">
          {JSON.stringify(viewMessage, null, 2)}
        </Text>
      </Box>
    );
  }

  switch (view.type) {
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
          <Stack gap={4}>
            {question.fields.map((field:any, index:any) => (
              <Box key={index} width="100%">
                {field.type === 'email' ? (
                  <Field 
                    invalid={field.invalid} 
                    label={field.name}
                    errorText={field.errorText}
                  >
                    <Input
                      type="email"
                      placeholder={field.placeholder || 'Enter your email'}
                      required={field.required}
                      bg="gray.700"
                      border="1px"
                      borderColor={field.invalid ? "red.500" : "gray.600"}
                      _hover={{ borderColor: field.invalid ? "red.400" : "gray.500" }}
                      _focus={{ 
                        borderColor: field.invalid ? "red.400" : "blue.400", 
                        boxShadow: 'none',
                        "--focus-color": field.invalid ? "red" : "blue" 
                      }}
                      css={{ 
                        "--error-color": "red",
                        "--focus-color": field.invalid ? "red" : "blue"
                      }}
                    />
                  </Field>
                ) : (
                  <Text>{field.value}</Text>
                )}
              </Box>
            ))}
          </Stack>

          <br />

          {/* Options */}
          <HStack justify="center" mt={4}>
            {question.options.map((option:any, index:any) => (
              <Button
                key={index}
                colorScheme={option.style === 3 ? "green" : "red"}
                onClick={() => question.app.handleInquiryOptionClick(option.customId)}
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
      const article = view.article;
      if (!article) {
        return (
          <Box key={index} mb={2} p={4} bg="gray.800" borderRadius="md">
            <Text color="red.300">Invalid article view format</Text>
            <Text fontFamily="mono" fontSize="sm" whiteSpace="pre-wrap">
              {JSON.stringify(view, null, 2)}
            </Text>
          </Box>
        );
      }

      return (
        <HStack justify="center" mt={4}>
          <Card.Root
            key={index}
            width="320px"
            variant="outline"
            mb={4}
            borderRadius="md"
            boxShadow="md"
            bg="gray.800"
            borderColor="gray.600"
          >
            <Card.Body gap="2">
              {/* Title */}
              <Card.Title fontSize="lg" mb="2" color={article.color || "white"}>
                {article.title}
              </Card.Title>

              {/* Description */}
              <Card.Description mb="4" color="gray.300">
                {article.description}
              </Card.Description>

              {/* Fields (Links) */}
              {article.fields?.map((field:any, fieldIndex:any) => (
                <Box key={fieldIndex} mb={2}>
                  <Text fontWeight="semibold" as="span" color="gray.300">
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
            {article.footer && (
              <Card.Footer 
                justifyContent="space-between" 
                alignItems="center"
                borderTopColor="gray.600"
              >
                <Text fontWeight="medium" color="gray.300">
                  {article.footer.text}
                </Text>
                {article.footer.iconURL && (
                  <Box 
                    as="img"
                    src={article.footer.iconURL}
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
        <Box key={index} mb={2} p={4} bg="gray.800" borderRadius="md">
          <Text color="yellow.300" mb={2}>Unknown View Type: {view.type}</Text>
          <Text fontFamily="mono" fontSize="sm" whiteSpace="pre-wrap">
            {JSON.stringify(view, null, 2)}
          </Text>
        </Box>
      );
  }
}
