'use client'

import React from 'react'
import { useStepsContext } from '@chakra-ui/react'
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
      <div className="p-8 bg-opacity-10 bg-white rounded-lg border border-opacity-20 border-white">
        <div className="flex flex-col items-center justify-center space-y-6 min-h-[300px]">
          {!hasCheckedEndpoint && (
            <div className="flex flex-col items-center justify-center">
              <img 
                src="/gif/kk.gif" 
                alt="KeepKey Animation" 
                className="w-64 h-64"
              />
            </div>
          )}
          {hasCheckedEndpoint && !isDesktopRunning && (
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-center">
                  <img 
                    src="/images/desktop/pin.png" 
                    alt="KeepKey Desktop" 
                    className="w-[200px] h-[200px] object-contain"
                  />
                </div>
                <h2 className="text-xl font-semibold text-center">KeepKey Desktop Required</h2>
                <p className="text-center text-gray-600">
                  To set up and configure your KeepKey device, you'll need to install and run KeepKey Desktop. This application provides essential security features and device management capabilities.
                </p>
                <div className="flex justify-center space-x-3 pt-4">
                  <Button 
                    onClick={openInstallPage}
                    variant="outline"
                    className="bg-transparent border-blue-500 text-blue-500 hover:bg-blue-50"
                  >
                    Install KeepKey Desktop
                  </Button>
                  <Button 
                    onClick={launchKeepKey}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Launch KeepKey Desktop
                  </Button>
                </div>
              </div>
            </div>
          )}
          {isDesktopRunning && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <FaCheckCircle className="text-green-400" size={80} />
              </div>
              <div className="text-xl font-medium text-green-400">
                Wallet Connected Successfully!
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingStep>
  )
} 
