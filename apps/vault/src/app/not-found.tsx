'use client'

import { useEffect } from 'react'
import { Box, Heading, Text, Button, VStack, Image, Flex } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

// Theme colors - matching dashboard theme
const theme = {
  bg: '#000000',
  cardBg: '#111111',
  gold: '#FFD700',
  goldHover: '#FFE135',
  border: '#222222',
};

export default function NotFound() {
  const router = useRouter()
  
  // Add debug logging
  useEffect(() => {
    console.log('⚠️ [NotFound] 404 page rendered');
  }, []);

  return (
    <Box height="100vh" width="100%" bg={theme.bg} display="flex" alignItems="center" justifyContent="center">
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        width="90%" 
        maxWidth="375px"
        bg={theme.cardBg}
        p={8}
        borderRadius="2xl"
        boxShadow="0 4px 30px rgba(0, 0, 0, 0.4)"
        border="1px solid"
        borderColor={theme.border}
      >
        <Image 
          src="/images/kk-icon-gold.png" 
          alt="KeepKey" 
          width="80px" 
          height="80px"
          mb={6}
        />
        
        <Heading 
          as="h1" 
          size="xl" 
          color={theme.gold}
          textAlign="center"
          mb={2}
        >
          404 - Page Not Found
        </Heading>
        
        <Text 
          color="gray.300" 
          textAlign="center"
          mb={6}
        >
          The page you're looking for doesn't exist or has been moved.
        </Text>
        
        <Button
          onClick={() => router.push('/')}
          bg={theme.gold}
          color="black"
          _hover={{ bg: theme.goldHover }}
          fontWeight="bold"
          borderRadius="xl"
          size="lg"
          width="100%"
        >
          Return to Home
        </Button>
      </Flex>
    </Box>
  )
} 