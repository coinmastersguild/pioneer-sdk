'use client'

import React from 'react'
import { Box, Stack, Text, useStepsContext } from '@chakra-ui/react'
import { usePioneerApp } from '#components/pioneer/pioneer-provider'
import { useEffect } from 'react'
import { OnboardingStep } from './onboarding-step'
import { FaCheckCircle } from 'react-icons/fa'
import { z } from 'zod'
import { type FieldValues } from '@saas-ui/forms'

export const ConnectWalletStep = () => {
  const stepper = useStepsContext()
  const { state, connectWallet } = usePioneerApp()
  const { app } = state

  const isWalletConnected = !!app?.username

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
          {isWalletConnected ? (
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
              <div className="text-lg font-medium">
                Connecting Your Wallet
              </div>
              <div className="text-gray-500">
                Please approve the connection request in your wallet
              </div>
              <div>
                <img src="/keepkey-icon.svg" alt="KeepKey" className="w-20 h-20" />
              </div>
            </>
          )}
        </div>
      </div>
    </OnboardingStep>
  )
} 