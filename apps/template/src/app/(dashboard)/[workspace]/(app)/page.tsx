'use client'

import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'

export default function Page() {
  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={6} align="center">
        <Heading size="2xl">Welcome to Pioneer</Heading>
        <Text fontSize="xl" textAlign="center">
          Your Web3 journey starts here
        </Text>
      </VStack>
    </Container>
  )
}
