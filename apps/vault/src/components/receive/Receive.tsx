'use client'

import React from 'react'
import { Box, Button, Text } from '@chakra-ui/react'

interface ReceiveProps {
  onBackClick: () => void;
}

// Using function declaration instead of FC type
export default function Receive({ onBackClick }: ReceiveProps): JSX.Element {
  return (
    <Box>
      <Button onClick={onBackClick}>Back</Button>
      <Text>Receive component placeholder</Text>
    </Box>
  );
} 