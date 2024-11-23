'use client';

import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useOnStartApp } from './utils/onStart';
import { usePioneer } from '@coinmasters/pioneer-react';
import PortfolioPage from './portfolio';
import { Header } from '@/components/keepkey/Header';

export default function Home() {
  const onStartApp = useOnStartApp();
  const [currentNav, setCurrentNav] = useState<'portfolio' | 'wallet' | 'swap'>('portfolio');

  const searchParams = useSearchParams();

  useEffect(() => {
    // Define an async function inside useEffect
    const initializeApp = async () => {
      onStartApp();

      // Parse query parameters and apply logic
      const type = searchParams.get('type'); // e.g., 'tx' or 'swap'
      // Update navigation state and call async functions based on 'type'
      if (type === 'swap') {
        setCurrentNav('swap');
      } else if (type === 'wallet') {
        setCurrentNav('wallet');
      } else {
        setCurrentNav('portfolio'); // Default
      }

      // Additional logic based on caip/networkId can be handled here
    };

    // Invoke the async function
    initializeApp().catch((error) => console.error('Error during initialization:', error));
  }, [searchParams]);

  return (
    <Box bg="black" minH="100vh" color="white">
      <Header currentNav={currentNav} setCurrentNav={setCurrentNav} />
      <PortfolioPage
        searchParams={searchParams}
        usePioneer={usePioneer}
        currentNav={currentNav}
        setCurrentNav={setCurrentNav}
      />
      {/* <Footer /> */}
    </Box>
  );
}
