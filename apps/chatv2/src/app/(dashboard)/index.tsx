'use client'

import { useAuth } from '@saas-ui/auth-provider'
import { LoadingOverlay } from '@saas-ui/react/loading-overlay'
import { Box, Spinner, SpinnerProps } from '@chakra-ui/react'
import { usePioneer } from '@coinmasters/pioneer-react'
import { useOnStartApp } from '../utils/onStart'
import { HomePage } from '#features/organizations/pages/home-page'
import { useEffect } from 'react'

export const IndexPage = () => {
  console.log('🚀 IndexPage Component Mounting');
  
  const onStartApp = useOnStartApp();
  const { isAuthenticated, isLoggingIn } = useAuth()
  const pioneer = usePioneer();
  
  console.log('🔑 Auth State:', { isAuthenticated, isLoggingIn });
  console.log('🛠 Pioneer Instance:', pioneer ? 'Loaded' : 'Not Loaded');

  const initializeApp = async () => {
    console.log('📥 initializeApp called');
    try {
      console.log('🎬 About to call onStartApp');
      await onStartApp();
      console.log('✅ onStartApp completed successfully');
    } catch (e) {
      console.error('❌ Initialization error:', e);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    // Always initialize the app, regardless of auth state
    initializeApp().catch((error) => console.error('❌ Error during initialization:', error));
    
    return () => {
      console.log('🧹 Cleanup: Component unmounting');
    };
  }, []); // Run once on component mount

  if (isLoggingIn) {
    console.log('⏳ Rendering loading state');
    return (
      <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="black" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="white" thickness="4px" />
      </Box>
    )
  }

  if (!isAuthenticated) {
    console.log('🔒 Rendering non-authenticated state');
    return (
      <Box p={8} textAlign="center">
        {/* Add your non-authenticated content here */}
        Please log in to access the full features
      </Box>
    );
  }

  console.log('✨ Rendering authenticated HomePage');
  return <HomePage pioneer={pioneer} />
}
