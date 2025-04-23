'use client';

import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Image,
  Link,
  HStack,
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaDownload, FaRedo, FaExternalLinkAlt } from 'react-icons/fa';

// Theme colors - matching our dashboard theme
const theme = {
  bg: '#000000',
  cardBg: '#111111',
  gold: '#FFD700',
  goldHover: '#FFE135',
  border: '#222222',
};

interface ConnectionErrorProps {
  onRetry?: () => void;
}

function ConnectionError({ onRetry }: ConnectionErrorProps) {
  // Function to launch KeepKey Desktop using the custom URI scheme
  const launchKeepKeyDesktop = () => {
    try {
      // This uses the custom URI protocol that KeepKey Desktop should register
      window.location.href = 'keepkey://launch';
      
      // As a fallback, try a common install path for macOS
      setTimeout(() => {
        onRetry?.(); // Try to reconnect after a brief delay
      }, 3000);
    } catch (error) {
      console.error('Failed to launch KeepKey Desktop:', error);
    }
  };

  // Function to perform a full page reload
  const handleFullReload = () => {
    console.log('🔄 Performing full page reload');
    window.location.reload();
  };

  return (
    <Box 
      height="100vh" 
      width="100%" 
      bg={theme.bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <VStack 
        gap={6} 
        width="400px"
        maxW="90%"
        bg={theme.cardBg}
        p={8}
        pt={6}
        pb={10}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={theme.border}
        position="relative"
        boxShadow="0 4px 20px rgba(0,0,0,0.4)"
        _after={{
          content: '""',
          position: "absolute",
          bottom: "-1px",
          left: "0",
          right: "0",
          height: "1px",
          background: `linear-gradient(90deg, transparent 0%, ${theme.gold}40 50%, transparent 100%)`,
        }}
        _before={{
          content: '""',
          position: "absolute",
          top: "-1px",
          left: "0",
          right: "0",
          height: "1px",
          background: `linear-gradient(90deg, transparent 0%, ${theme.gold}40 50%, transparent 100%)`,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
          bg="rgba(255, 215, 0, 0.05)"
          p={5}
          boxSize="80px"
          mx="auto"
        >
          <FaExclamationTriangle size="50px" color={theme.gold} />
        </Box>

        <Heading size="lg" color={theme.gold} textAlign="center" letterSpacing="wide">
          Connection Error
        </Heading>

        <Box textAlign="center" width="100%">
          <Image
            src="/images/kk-icon-gold.png"
            alt="KeepKey"
            height="60px"
            my={2}
            mx="auto"
          />
        </Box>

        <Text fontSize="md" color="gray.300" textAlign="center" maxW="320px" mx="auto">
          Unable to connect to KeepKey Desktop. Please ensure the application is running on your computer.
        </Text>

        <VStack gap={3} width="100%" px={4}>
          <Button
            width="100%"
            height="48px"
            variant="solid"
            color="black"
            bg={theme.gold}
            _hover={{ bg: theme.goldHover }}
            onClick={launchKeepKeyDesktop}
            boxShadow="0 2px 10px rgba(255, 215, 0, 0.2)"
          >
            <HStack gap={2}>
              <FaExternalLinkAlt />
              <Text>Launch KeepKey Desktop</Text>
            </HStack>
          </Button>
          
          <Button
            width="100%"
            height="48px"
            variant="outline"
            color={theme.gold}
            borderColor={theme.gold}
            _hover={{ bg: 'rgba(255, 215, 0, 0.1)' }}
            onClick={handleFullReload}
          >
            <HStack gap={2}>
              <FaRedo />
              <Text>Try Again</Text>
            </HStack>
          </Button>

          {/* Divider */}
          <Box 
            width="80%" 
            height="1px" 
            bg={`${theme.border}`} 
            opacity={0.3} 
            my={1} 
            mx="auto"
          />
          
          <Button
            width="100%"
            height="40px"
            variant="ghost"
            color="gray.400"
            _hover={{ bg: 'rgba(255, 255, 255, 0.05)' }}
            onClick={() => window.open('https://www.keepkey.com/get-started', '_blank')}
          >
            <HStack gap={2}>
              <FaDownload />
              <Text>Download KeepKey Desktop</Text>
            </HStack>
          </Button>
        </VStack>

        <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
          Need help? Visit our{' '}
          <Link
            color={theme.gold}
            href="https://docs.keepkey.info"
            target="_blank"
            _hover={{ textDecoration: 'underline' }}
          >
            support documentation
          </Link>
        </Text>
      </VStack>
    </Box>
  );
};

export default ConnectionError;