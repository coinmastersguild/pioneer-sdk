'use client'

import { useEffect } from 'react'
import Image from "next/image";
import { 
  Button, 
  HStack, 
  Stack,
  Text, 
  Heading, 
  Box, 
  Grid,
  Flex
} from "@chakra-ui/react"
import { usePioneerContext } from '@/components/providers/pioneer'
import Chat from '@/components/chat'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'

export default function Home() {
  const pioneer = usePioneerContext()
  
  // Handle blockchains data - could be an array or a string
  const getBlockchainList = () => {
    if (!pioneer?.state?.app?.blockchains) return [];
    
    // If it's already an array, use it as is
    if (Array.isArray(pioneer.state.app.blockchains)) {
      return pioneer.state.app.blockchains;
    }
    
    // If it's a string, split it
    if (typeof pioneer.state.app.blockchains === 'string') {
      return pioneer.state.app.blockchains.split(',');
    }
    
    // Fallback - return empty array
    console.warn('Unexpected blockchains format:', pioneer.state.app.blockchains);
    return [];
  }
  
  const blockchainList = getBlockchainList();

  useEffect(() => {
    if (pioneer?.state?.app) {
      console.log('pioneer initialized state', pioneer.state.app)
    }
  }, [pioneer?.state?.app]);

  return (
    <Flex
      direction="column"
      minHeight="100vh"
      alignItems="center"
      justifyContent="space-between"
      padding={{ base: "20px", md: "80px" }}
      gap="64px"
    >
      <Box flexGrow={1} width="100%" maxWidth="1200px" marginX="auto">
        <Stack direction="column" gap={6} alignItems="center" marginBottom={8}>
          <Box position="relative" width={300} height={200}>
            <Image
              src="/gif/kk.gif"
              alt="KeepKey device"
              fill
              style={{ objectFit: 'contain' }}
              priority
              sizes="100vw"
            />
          </Box>
          <Heading as="h1" size="xl">KeepKey Template</Heading>
          <Text fontSize="lg" textAlign="center" maxWidth="600px">
            A starter template for building secure applications with KeepKey hardware wallets.
          </Text>
        </Stack>

        <Box marginBottom={8}>
          <Heading as="h2" size="md" marginBottom={4}>Ask a Question</Heading>
          <Stack direction="column" gap={4} alignItems="flex-start">
            <Chat usePioneer={pioneer}></Chat>
          </Stack>
        </Box>
      </Box>

      <Flex 
        as="footer"
        width="100%"
        justifyContent="center"
        paddingY={4}
      >
          <Flex
              direction={{base: "column", md: "row"}}
              gap={4}
              alignItems="center"
          >
              <a
                  href="https://docs.keepkey.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{textDecoration: 'none'}}
              >
                  <Button variant="outline">
                      View Documentation
                  </Button>
              </a>
              <Text fontSize="sm">Built with KeepKey SDK</Text>
              <Text fontSize="sm">•</Text>
              <a href="https://keepkey.com" target="_blank" rel="noopener noreferrer">
                  <Text fontSize="sm" _hover={{textDecoration: "underline"}}>KeepKey Website</Text>
              </a>
              <Text fontSize="sm">•</Text>
              <a href="https://github.com/keepkey" target="_blank" rel="noopener noreferrer">
                  <Text fontSize="sm" _hover={{textDecoration: "underline"}}>GitHub</Text>
              </a>
          </Flex>
      </Flex>
    </Flex>
  );
}
