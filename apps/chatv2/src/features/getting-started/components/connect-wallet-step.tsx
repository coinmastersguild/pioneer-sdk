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
  ButtonGroup
} from '@chakra-ui/react'
import { usePioneerApp } from '#components/pioneer/pioneer-provider'
import { useEffect, useState } from 'react'
import { OnboardingStep } from './onboarding-step'
import { FaCheckCircle } from 'react-icons/fa'
import { z } from 'zod'
import { type FieldValues } from '@saas-ui/forms'
import { Button } from '#components/ui/button'

export const ConnectWalletStep = () => {
  const stepper = useStepsContext()
  const { state, connectWallet } = usePioneerApp()
  const { app } = state
  const [isDesktopRunning, setIsDesktopRunning] = useState(false);
  const [hasCheckedEndpoint, setHasCheckedEndpoint] = useState(false);

  const isWalletConnected = false

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:1646/docs');
        if (response.status === 200) {
          clearInterval(interval);
          setIsDesktopRunning(true)
        }
        setHasCheckedEndpoint(true)
      } catch (error) {
        console.log('KeepKey endpoint not found, retrying...');
        setHasCheckedEndpoint(true)
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const attemptConnection = async () => {
      if (!isWalletConnected) {
        try {
          await connectWallet()
        } catch (error) {
          console.error('Connection failed:', error)
        }
      }
    }

    attemptConnection()
  }, [isWalletConnected, connectWallet])

  useEffect(() => {
    if (isWalletConnected) {
      const timer = setTimeout(() => {
        stepper.setStep(stepper.value + 1)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isWalletConnected, stepper])

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
    >
        <Stack spacing={6} minH="300px" justify="center">
          {!hasCheckedEndpoint && (
            <Flex justify="center">
              <Image 
                src="/gif/kk.gif" 
                alt="KeepKey Animation" 
                boxSize="256px"
              />
            </Flex>
          )}
          {hasCheckedEndpoint && !isDesktopRunning && (
            <Stack spacing={6}>
              <Flex w="200px" h="200px" align="center" justify="center" mx="auto">
                <Image 
                  src="/images/desktop/pin.png" 
                  alt="KeepKey Desktop" 
                  objectFit="contain"
                  w="full"
                  h="full"
                />
              </Flex>
              <Stack spacing={4} textAlign="center">
                <Heading size="md">KeepKey Desktop Required</Heading>
                <Text color="gray.500">
                  To set up and configure your KeepKey device, youll need to install and run KeepKey Desktop. This application provides essential security features and device management capabilities.
                </Text>
                <ButtonGroup spacing={3} pt={4} justifyContent="center">
                  <Button
                    onClick={openInstallPage}
                    variant="outline"
                    colorScheme="blue"
                  >
                    Install KeepKey Desktop
                  </Button>
                  <Button
                    onClick={launchKeepKey}
                    colorScheme="blue"
                  >
                    Launch KeepKey Desktop
                  </Button>
                </ButtonGroup>
              </Stack>
            </Stack>
          )}
          {isDesktopRunning && (
            <Stack spacing={4} textAlign="center">
              <Flex justify="center" color="green.400">
                <FaCheckCircle size={80} />
              </Flex>
              <Heading size="md" color="green.400">
                Wallet Connected Successfully!
              </Heading>
            </Stack>
          )}
        </Stack>
    </OnboardingStep>
  )
}
