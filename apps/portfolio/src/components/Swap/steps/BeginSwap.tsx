'use client';
import { Box } from '@chakra-ui/react';
// @ts-ignore
import React, { useEffect, useState } from 'react';

import CalculatingComponent from '../components/CalculatingComponent';


const BeginSwap = ({ usePioneer, quote}: any) => {

  const [showGif, setShowGif] = useState(true);

  // wait for routes
  useEffect(() => {
    if (quote && quote.quote) {
      setShowGif(false);
    }
  }, [quote]);

  return (
    <Box>
      <CalculatingComponent />
    </Box>
  );
};

export default BeginSwap;
