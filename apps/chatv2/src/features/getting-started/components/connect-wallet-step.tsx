'use client'

import React from 'react'
import { Box, Stack, Text, useStepsContext } from '@chakra-ui/react'
import { usePioneerApp } from '#components/pioneer/pioneer-provider'
import { useEffect, useState } from 'react'
import { OnboardingStep } from './onboarding-step'
import { FaCheckCircle } from 'react-icons/fa'
import { z } from 'zod'
import { type FieldValues } from '@saas-ui/forms'
import {Button} from '#components/ui/button'

export const ConnectWalletStep = () => {
  const stepper = useStepsContext()
  const { state, connectWallet } = usePioneerApp()
  const { app } = state
  const [isDesktopRunning, setIsDesktopRunning] = useState(false);


  const isWalletConnected = false

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:1646/docs');
        if (response.status === 200) {
          clearInterval(interval);
          setIsDesktopRunning(true)

        }
      } catch (error) {
        console.log('KeepKey endpoint not found, retrying...');
      }
    }, 5000); // Check every 5 seconds

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

  const schema = z.object({})

  const launchKeepKey = () => {
    try {
      console.log('window: ', window);
      console.log('window.location: ', window.location);
      if (window) {
        setTimeout(() => {
          window.location.assign('keepkey://launch');
          // window.open('https://keepkey.com/launch', '_blank');
        }, 100); // Adding a slight delay before launching the URL
      }
    } catch (error) {
      console.error('Failed to launch KeepKey:', error);
    }
  };

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
      <div className="p-8 bg-opacity-10 bg-white rounded-lg border border-opacity-20 border-white">
        <div className="flex flex-col items-center space-y-6">
          {isDesktopRunning ? (
            <div className="text-center">
              <div className="text-4xl text-green-400 mb-4">
                <FaCheckCircle size={80} />
              </div>
              <div className="text-xl font-medium text-green-400">
                Wallet Connected Successfully!
              </div>
            </div>
          ) : (
            <>
              <Button onClick={launchKeepKey}></Button>
            </>
          )}
        </div>
      </div>
    </OnboardingStep>
  )
} 
