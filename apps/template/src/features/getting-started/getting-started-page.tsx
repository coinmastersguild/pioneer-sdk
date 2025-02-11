'use client'

import * as React from 'react'

import {
  Center,
  Container,
  defineSlotRecipe,
  useStepsContext,
} from '@chakra-ui/react'
import { LoadingOverlay, Steps } from '@saas-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { getCurrentUser } from '#api'

import {
  CreateTicketStep,
  InviteTeamMembersStep,
  OnboardingPage,
} from './components'
import { AppearanceStep } from './components/appearance'
import { SubscribeStep } from './components/subscribe'
import { ConnectWalletStep } from '#features/getting-started/components/connect-wallet-step.tsx';

const recipe = defineSlotRecipe({
  className: 'steps',
  slots: ['root', 'list', 'item', 'indicator', 'title'],
  variants: {
    variant: {
      dots: {
        list: {
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
        },
        indicator: {
          boxSize: 2,
          overflow: 'hidden',
          bg: 'colorPalette.subtle',
          rounded: 'full',
          _current: {
            bg: 'colorPalette.solid',
          },
          '& *': {
            display: 'none',
          },
        },
        title: {
          display: 'none',
        },
      },
    },
  },
})

export const GettingStartedPage: React.FC = () => {
  const { isLoading } = useQuery({
    queryKey: ['CurrentUser'],
    queryFn: () => getCurrentUser(),
  })

  return (
    <OnboardingPage isLoading={isLoading}>
      <Container maxW="6xl">
        <Center minH="calc(100dvh - 100px)">
          <Steps.Root
            variant={'dots' as any}
            recipe={recipe}
            defaultStep={0}
            count={4}
            width="full"
          >
            <OnboardingSteps />

            <Steps.List>
              <Steps.Item index={0} title="Create Support Ticket" />
              <Steps.Item index={1} title="Choose your style" />
              <Steps.Item index={2} title="Invite team members" />
              <Steps.Item index={3} title="Subscribe to updates" />
            </Steps.List>
          </Steps.Root>
        </Center>
      </Container>
    </OnboardingPage>
  )
}

function OnboardingSteps() {
  const stepper = useStepsContext()

  return (
    <>
      {/*<Steps.Content index={0} title="Choose your style">*/}
      {/*  {stepper.value === 0 && <AppearanceStep />}*/}
      {/*</Steps.Content>*/}
      <Steps.Content index={0} title="Troubleshoot Connection">
        {stepper.value === 0 && <ConnectWalletStep />}
      </Steps.Content>
      <Steps.Content index={1} title="Create Support Ticket">
        {stepper.value === 1 && <CreateTicketStep />}
      </Steps.Content>
      <Steps.Content index={2} title="Share Settings">
        {stepper.value === 2 && <SubscribeStep />}
      </Steps.Content>

      <Steps.CompletedContent>
        {stepper.percent === 100 && <OnboardingCompleted />}
      </Steps.CompletedContent>
    </>
  )
}

const OnboardingCompleted = () => {
  const router = useRouter()

  return (
    <LoadingOverlay.Root
      bg="bg"
      ref={() => {
        router.push('/')
      }}
    >
      <LoadingOverlay.Spinner />
    </LoadingOverlay.Root>
  )
}
