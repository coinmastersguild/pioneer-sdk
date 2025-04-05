import { Box, Flex, HStack, Icon, Link, Text, VStack, Card, Input, Stack } from '@chakra-ui/react';
import { Button } from "@chakra-ui/react";
import { Avatar } from "../ui/avatar";
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
      {eventMessage.message || eventMessage.text}
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
          {msg.text && (
            <Text whiteSpace="pre-wrap">{msg.text.toString()}</Text>
          )}
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
      if (!question) {
        return (
          <Box key={index} mb={2} p={4} bg="gray.800" borderRadius="md">
            <Text color="red.300">Invalid question view format</Text>
          </Box>
        );
      }
      
      return (
        <Box
          bg="gray.800"
          color="white"
          p={6}
          borderRadius="lg"
          boxShadow="md"
          maxW="600px"
          mx="auto"
          mb={4}
        >
          {/* Title */}
          <Text fontSize="xl" fontWeight="bold" color={question.color || "blue.400"}>
            {question.title}
          </Text>

          {/* Description */}
          <Text mt={4} color="gray.300">
            {question.description}
          </Text>

          <br />

          {/* Fields */}
          <Stack gap={4}>
            {question.fields?.map((field: any, fieldIndex: number) => (
              <Box key={fieldIndex} width="100%">
                {field.type === 'email' ? (
                  <Box>
                    <Text mb={2}>{field.name}</Text>
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
                        boxShadow: 'none'
                      }}
                    />
                    {field.invalid && (
                      <Text color="red.400" fontSize="sm" mt={1}>
                        {field.errorText}
                      </Text>
                    )}
                  </Box>
                ) : (
                  <Text>{field.value}</Text>
                )}
              </Box>
            ))}
          </Stack>

          <br />

          {/* Options */}
          <HStack justify="center" mt={4}>
            {question.options?.map((option: any, optionIndex: number) => (
              <Button
                key={optionIndex}
                colorScheme={option.style === 3 ? "green" : "red"}
                onClick={() => {
                  if (question.app?.handleInquiryOptionClick) {
                    question.app.handleInquiryOptionClick(option.customId);
                  }
                }}
              >
                {option.label}
              </Button>
            ))}
          </HStack>

          {/* Footer */}
          {question.footer && (
            <HStack justify="space-between" mt={6}>
              <Text fontSize="sm" color="gray.400">
                {question.footer.text}
              </Text>
              {question.footer.iconURL && (
                <Avatar size="sm" src={question.footer.iconURL} />
              )}
            </HStack>
          )}
        </Box>
      );
    case 'article':
      const article = view.article;
      if (!article) {
        return (
          <Box key={index} mb={2} p={4} bg="gray.800" borderRadius="md">
            <Text color="red.300">Invalid article view format</Text>
          </Box>
        );
      }
      
      return (
        <Box
          bg="gray.800"
          color="white"
          p={6}
          borderRadius="lg"
          boxShadow="md"
          maxW="600px"
          mx="auto"
          mb={4}
        >
          <Text fontSize="xl" fontWeight="bold" color={article.color || "blue.400"}>
            {article.title}
          </Text>
          
          <Text mt={4} color="gray.300">
            {article.description}
          </Text>
          
          {article.fields && article.fields.length > 0 && (
            <VStack align="start" spacing={3} mt={6}>
              {article.fields.map((field: any, fieldIndex: number) => (
                <Box key={fieldIndex}>
                  <Text fontWeight="bold">{field.name}</Text>
                  <Text color="gray.300">{field.value}</Text>
                </Box>
              ))}
            </VStack>
          )}
          
          {article.footer && (
            <HStack justify="space-between" mt={6}>
              <Text fontSize="sm" color="gray.400">
                {article.footer.text}
              </Text>
              {article.footer.iconURL && (
                <Avatar size="sm" src={article.footer.iconURL} />
              )}
            </HStack>
          )}
        </Box>
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