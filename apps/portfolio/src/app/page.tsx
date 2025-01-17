'use client';

import { useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useOnStartApp } from './utils/onStart';
import { usePioneer } from '@coinmasters/pioneer-react';
import PortfolioPage from './portfolio';
import { Header } from '@/components/keepkey/Header';
import Launch from '@/components/keepkey/Launch';

export default function Home() {
  const onStartApp = useOnStartApp();
  const [currentNav, setCurrentNav] = useState<'portfolio' | 'wallet' | 'swap' | 'explore' >('explore');
  const [isError, setIsError] = useState<string | null>(null);

  const initializeApp = async () => {
    try {
      await onStartApp(); // Ensure the function resolves or rejects correctly
      const searchParams = useSearchParams();
      const type = searchParams.get('type');

      // Update navigation state
      if (type === 'swap') {
        setCurrentNav('swap');
      } if (type === 'explore') {
        setCurrentNav('explore');
      } else if (type === 'wallet') {
        setCurrentNav('wallet');
      } else {
        setCurrentNav('explore');
      }
    } catch (e) {
      console.error('Initialization error:', e);
      //@ts-ignore
      setIsError(e.message || 'An unexpected error occurred');
    }
  };

  useEffect(() => {
    initializeApp().catch((error) => console.error('Error during initialization:', error));
  }, []);

  // if (isError) {
  //   return (
  //     <Launch />
  //   );
  // }

  return (
    <Box bg="black" minH="100vh" color="white">
      <Header currentNav={currentNav} setCurrentNav={setCurrentNav} />
      <PortfolioPage
        usePioneer={usePioneer}
        currentNav={currentNav}
        setCurrentNav={setCurrentNav}
      />
      {/* <Footer /> */}
    </Box>
  );
}
