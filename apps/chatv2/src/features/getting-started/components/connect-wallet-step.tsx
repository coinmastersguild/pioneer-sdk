'use client'

import React from 'react'
import { 
  useStepsContext,
  Box,
  Flex,
  Stack,
  Image,
  Heading,
  Text,
  ButtonGroup,
  Spinner
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { OnboardingStep } from './onboarding-step'
import { FaCheckCircle, FaWallet } from 'react-icons/fa'
import { z } from 'zod'
import { type FieldValues } from '@saas-ui/forms'
import { Button } from '#components/ui/button'
import { Skeleton } from '#components/ui/skeleton'
import { toaster } from '#components/ui/toaster'
import { usePioneerContext } from '#features/common/providers/app'

export const ConnectWalletStep = () => {
  const stepper = useStepsContext()
  const pioneer = usePioneerContext()
  const [isDesktopRunning, setIsDesktopRunning] = useState(false);
  const [hasCheckedEndpoint, setHasCheckedEndpoint] = useState(false);
  const [isAttemptingConnection, setIsAttemptingConnection] = useState(false);

  // Check if wallet is already connected
  useEffect(() => {
    if (pioneer.state.app?.queryKey) {
      //console.log('Wallet already connected from login, advancing step...');
      stepper.setStep(stepper.value + 1);
      return;
    }
  }, [pioneer.state.app?.queryKey, stepper]);

  // Check if KeepKey Desktop is running
  useEffect(() => {
    const checkEndpoint = async () => {
      try {
        const response = await fetch('http://localhost:1646/docs');
        if (response.status === 200) {
          setIsDesktopRunning(true);
        }
      } catch (error) {
        //console.log('KeepKey endpoint not found');
      } finally {
        setHasCheckedEndpoint(true);
      }
    };

    checkEndpoint();
    // Only poll if not running
    if (!isDesktopRunning) {
      const interval = setInterval(checkEndpoint, 5000);
      return () => clearInterval(interval);
    }
  }, [isDesktopRunning]);

  // Attempt wallet connection only when desktop is running
  useEffect(() => {
    const attemptConnection = async () => {
      if (isDesktopRunning && !pioneer.state.app?.pioneer && !isAttemptingConnection) {
        try {
          setIsAttemptingConnection(true);
          await pioneer.connectWallet();
          // Only advance step if connection was successful
          stepper.setStep(stepper.value + 1);
        } catch (error) {
          console.error('Connection failed:', error);
          toaster.create({
            description: error instanceof Error ? error.message : 'Failed to connect wallet. Please try again.',
            type: 'error',
          });
        } finally {
          setIsAttemptingConnection(false);
        }
      }
    };

    attemptConnection();
  }, [isDesktopRunning, pioneer.state.app?.pioneer, pioneer.connectWallet, stepper, isAttemptingConnection]);

  const launchKeepKey = () => {
    try {
      if (window) {
        setTimeout(() => {
          window.location.assign('keepkey://launch');
        }, 100);
      }
    } catch (error) {
      console.error('Failed to launch KeepKey:', error);
    }
  };

  const openInstallPage = () => {
    window.open('https://keepkey.com/get-started', '_blank');
  };

  const schema = z.object({})

  return (
    <OnboardingStep<FieldValues>
      title="Connect Your Wallet"
      description="First, let's connect your wallet to get started."
      maxW={{ base: '100%', md: 'lg' }}
      schema={schema}
      defaultValues={{}}
      onSubmit={() => {}}
      submitLabel=""
      hideSubmit={true}
    >
      <Stack spacing={6} minH="300px" justify="center">
        {!hasCheckedEndpoint ? (
          <Flex justify="center">
            <Image 
              src="/gif/kk.gif" 
              alt="KeepKey Animation" 
              width="auto"
              height="auto"
              maxWidth="100%"
              objectFit="contain"
            />
          </Flex>
        ) : !isDesktopRunning ? (
          <Stack spacing={6}>
            <Flex 
              w="200px" 
              h="200px" 
              align="center" 
              justify="center" 
              mx="auto"
              position="relative"
            >
              <Image 
                src="/images/desktop/pin.png" 
                alt="KeepKey Desktop" 
                objectFit="contain"
                w="full"
                h="full"
                loading="lazy"
                fallback={
                  <Skeleton
                    w="full"
                    h="full"
                    borderRadius="md"
                  />
                }
              />
            </Flex>
            <Stack spacing={4}>
              <Text textAlign="center" fontSize="lg" fontWeight="medium">
                KeepKey Desktop Not Running
              </Text>
              <Text textAlign="center" color="gray.500">
                Please install and run KeepKey Desktop to continue
              </Text>
              <ButtonGroup spacing={4} justifyContent="center">
                <Button
                  leftIcon={<FaWallet />}
                  onClick={launchKeepKey}
                  colorScheme="blue"
                >
                  Launch KeepKey Desktop
                </Button>
                <Button
                  variant="outline"
                  onClick={openInstallPage}
                >
                  Install KeepKey Desktop
                </Button>
              </ButtonGroup>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={6} align="center">
            <Spinner size="xl" color="blue.500" />
            <Text fontSize="lg" fontWeight="medium">
              {isAttemptingConnection ? 'Connecting to Wallet...' : 'Waiting for Wallet...'}
            </Text>
          </Stack>
        )}
      </Stack>
    </OnboardingStep>
  )
}
