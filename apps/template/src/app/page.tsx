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
import { Chat } from '@/components/chat'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'

export default function Home() {
  const { app } = usePioneerContext()
  
  // Handle blockchains data - could be an array or a string
  const getBlockchainList = () => {
    if (!app?.blockchains) return [];
    
    // If it's already an array, use it as is
    if (Array.isArray(app.blockchains)) {
      return app.blockchains;
    }
    
    // If it's a string, split it
    if (typeof app.blockchains === 'string') {
      return app.blockchains.split(',');
    }
    
    // Fallback - return empty array
    console.warn('Unexpected blockchains format:', app.blockchains);
    return [];
  }
  
  const blockchainList = getBlockchainList();

  useEffect(() => {
    if (app) {
      console.log('pioneer initialized state', app)
    }
  }, [app]);

  return (
    <Box height="100vh" bg="black">
      <Chat />
    </Box>
  );
}
