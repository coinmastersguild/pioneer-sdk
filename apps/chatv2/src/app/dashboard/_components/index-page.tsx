'use client'

import { useAuth } from '@saas-ui/auth-provider'
import { LoadingOverlay } from '@saas-ui/react/loading-overlay'
import { Box, Spinner, SpinnerProps } from '@chakra-ui/react'
import { usePioneer } from '@coinmasters/pioneer-react'
import { useOnStartApp } from '../../utils/onStart'
import { HomePage } from '#features/organizations/pages/home-page'
import { useEffect } from 'react'

export const IndexPage = () => {
  console.log('🚀 IndexPage Component Mounting');
  
  const onStartApp = useOnStartApp();
  const { isAuthenticated, isLoggingIn } = useAuth()
  const pioneer = usePioneer();
  
  console.log('🔑 Auth State:', { isAuthenticated, isLoggingIn });
  console.log('🛠 Pioneer Instance:', pioneer ? 'Loaded' : 'Not Loaded');

  useEffect(() => {
    if (!pioneer?.pioneer) {
      onStartApp();
    }
  }, [pioneer, onStartApp]);

  if (isLoggingIn) {
    return (
      <LoadingOverlay>
        <Spinner />
      </LoadingOverlay>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <HomePage pioneer={pioneer} />;
} 